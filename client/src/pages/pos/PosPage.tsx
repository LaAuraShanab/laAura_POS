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
    setCompletedSale(null);
    setError(null);
    setCustomer(null);
  }

  function handleHoldSale() {
    if (lines.length === 0) return;
    holdSale({ lines, discount, tax, note, paymentMethod, customer });
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
      });
      setCompletedSale(sale);
      toast.success(t("toast.saleCompleted", { reference: sale.reference }));
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
      <div className="rounded-3xl glass-surface p-6 shadow-resting">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">{t("pos.cart")}</h2>
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
          className="mb-3 flex w-full items-center justify-between rounded-xl bg-sage/8 px-3 py-2.5 text-start transition-colors hover:bg-sage/15"
        >
          <span className="flex items-center gap-2 text-sm text-ink">
            <UserCircle className="h-4 w-4 text-forest" aria-hidden="true" />
            {customer?.name ?? t("pos.walkInCustomer")}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-ink/40 rtl:rotate-180" aria-hidden="true" />
        </button>

        <Cart lines={lines} onIncrement={increment} onDecrement={decrement} onRemove={remove} />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
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
