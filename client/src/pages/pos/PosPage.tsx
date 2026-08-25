import { useMemo, useState } from "react";
import { UserCircle, ChevronRight, PauseCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ProductGrid } from "./ProductGrid";
import { Cart, cartLineKey, lineUnitPrice } from "./Cart";
import type { CartLine } from "./Cart";
import { PaymentPanel } from "./PaymentPanel";
import { ReceiptView } from "./ReceiptView";
import { CustomerPickerModal } from "./CustomerPickerModal";
import { HeldSalesModal } from "./HeldSalesModal";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useCreateSale } from "../../hooks/useSales";
import { useHeldSales } from "../../hooks/useHeldSales";
import type { Product, ProductVariant } from "../../types/product";
import type { Customer } from "../../types/customer";
import type { PaymentMethod, Sale } from "../../types/sale";
import { ApiError } from "../../types/api";

function lineKey(line: CartLine): string {
  return cartLineKey(
    line.product.id,
    line.variant?.id,
    line.extras.map((e) => e.id)
  );
}

export function PosPage() {
  const { t } = useTranslation();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [isCredit, setIsCredit] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showHeldSales, setShowHeldSales] = useState(false);
  const [pendingDiscardId, setPendingDiscardId] = useState<string | null>(null);
  const createSale = useCreateSale();
  const { heldSales, holdSale, discardSale, takeSale } = useHeldSales();

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.quantity, 0),
    [lines]
  );
  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  function addProduct(product: Product, variant?: ProductVariant, extraIds: string[] = []) {
    const extras = product.extras.filter((extra) => extraIds.includes(extra.id));
    const key = cartLineKey(product.id, variant?.id, extraIds);
    setLines((prev) => {
      const existing = prev.find((line) => lineKey(line) === key);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((line) => (lineKey(line) === key ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...prev, { product, variant, extras, quantity: 1 }];
    });
  }

  function increment(key: string) {
    setLines((prev) =>
      prev.map((line) => (lineKey(line) === key && line.quantity < line.product.stock ? { ...line, quantity: line.quantity + 1 } : line))
    );
  }

  function decrement(key: string) {
    setLines((prev) =>
      prev.map((line) => (lineKey(line) === key ? { ...line, quantity: line.quantity - 1 } : line)).filter((line) => line.quantity > 0)
    );
  }

  function remove(key: string) {
    setLines((prev) => prev.filter((line) => lineKey(line) !== key));
  }

  function resetForNewSale() {
    setLines([]);
    setDiscount(0);
    setTax(0);
    setNote("");
    setPaymentMethod("CASH");
    setIsCredit(false);
    setCompletedSale(null);
    setError(null);
    setCustomer(null);
  }

  function handleHoldSale() {
    if (lines.length === 0) return;
    holdSale({ lines, discount, tax, note, paymentMethod, isCredit, customer });
    toast.success(t("toast.saleHeld"));
    resetForNewSale();
  }

  function handleResumeSale(id: string) {
    if (lines.length > 0) {
      toast.error(t("pos.finishCurrentSaleFirst"));
      return;
    }
    const sale = takeSale(id);
    if (!sale) return;
    setLines(sale.lines);
    setDiscount(sale.discount);
    setTax(sale.tax);
    setNote(sale.note);
    setPaymentMethod(sale.paymentMethod);
    setIsCredit(sale.isCredit);
    setCustomer(sale.customer);
    setError(null);
    setShowHeldSales(false);
    toast.success(t("toast.saleResumed"));
  }

  function confirmDiscardHeldSale() {
    if (!pendingDiscardId) return;
    discardSale(pendingDiscardId);
    setPendingDiscardId(null);
    toast.success(t("toast.saleDiscarded"));
  }

  async function handleCompleteSale() {
    setError(null);
    try {
      const sale = await createSale.mutateAsync({
        customerId: customer?.id,
        items: lines.map((line) => ({
          productId: line.product.id,
          variantId: line.variant?.id,
          extraIds: line.extras.map((e) => e.id),
          quantity: line.quantity,
        })),
        discount,
        tax,
        note: note.trim() || undefined,
        paymentMethod,
        isCredit: isCredit && !!customer,
      });
      setCompletedSale(sale);
      toast.success(
        isCredit && customer
          ? t("toast.saleOnAccount", { name: customer.name })
          : t("toast.saleCompleted", { reference: sale.reference })
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("pos.couldNotCompleteSale"));
    }
  }

  if (completedSale) {
    return <ReceiptView sale={completedSale} onNewSale={resetForNewSale} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ProductGrid onSelect={addProduct} />
      </div>
      <div className="flex flex-col overflow-y-auto rounded-3xl glass-surface p-6 shadow-resting lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <div className="mb-3 flex flex-shrink-0 items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif text-xl italic text-ink">{t("pos.cart")}</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-forest/12 px-2 py-0.5 text-[11px] font-medium text-forest">
                {t("pos.itemCount", { count: itemCount })}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowHeldSales(true)}
            className="flex items-center gap-1.5 rounded-full bg-sage/8 px-3 py-1 text-xs font-medium text-ink/70 transition-colors hover:bg-sage/15"
          >
            <PauseCircle className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
            {t("pos.heldSalesCount", { count: heldSales.length })}
          </button>
        </div>

        <button
          onClick={() => setShowCustomerPicker(true)}
          className="mb-3 flex w-full flex-shrink-0 items-center justify-between rounded-xl border border-ink/8 bg-sage/8 px-3 py-2.5 text-start transition-colors hover:bg-sage/15"
        >
          <span className="flex items-center gap-2 text-sm text-ink">
            <UserCircle className="h-4 w-4 text-forest" aria-hidden="true" />
            {customer?.name ?? t("pos.walkInCustomer")}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-ink/40 rtl:rotate-180" aria-hidden="true" />
        </button>

        {/* Only the item list scrolls; header, customer, totals and CTA stay put. */}
        <div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2 lg:min-h-[96px]">
          <Cart lines={lines} onIncrement={increment} onDecrement={decrement} onRemove={remove} />
        </div>

        {error && <p className="mt-2 flex-shrink-0 text-sm text-destructive">{error}</p>}
        <div className="flex-shrink-0">
          <PaymentPanel
            subtotal={subtotal}
            discount={discount}
            tax={tax}
            onDiscountChange={setDiscount}
            onTaxChange={setTax}
            note={note}
            onNoteChange={setNote}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            isCredit={isCredit}
            onIsCreditChange={setIsCredit}
            creditAvailable={!!customer}
            onSubmit={handleCompleteSale}
            disabled={lines.length === 0}
            isSubmitting={createSale.isPending}
          />
          {lines.length > 0 && (
            <Button variant="secondary" className="mt-2 w-full" onClick={handleHoldSale}>
              <PauseCircle className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t("pos.holdSale")}
            </Button>
          )}
        </div>
      </div>

      {showCustomerPicker && (
        <CustomerPickerModal
          onSelect={(selected) => {
            setCustomer(selected);
            setShowCustomerPicker(false);
          }}
          onClose={() => setShowCustomerPicker(false)}
        />
      )}

      {showHeldSales && (
        <HeldSalesModal
          heldSales={heldSales}
          onResume={handleResumeSale}
          onDiscard={(id) => setPendingDiscardId(id)}
          onClose={() => setShowHeldSales(false)}
        />
      )}

      {pendingDiscardId && (
        <ConfirmDialog
          title={t("pos.discardHeldConfirmTitle")}
          message={t("pos.discardHeldConfirmMessage")}
          confirmLabel={t("common.delete")}
          onConfirm={confirmDiscardHeldSale}
          onCancel={() => setPendingDiscardId(null)}
        />
      )}
    </div>
  );
}
