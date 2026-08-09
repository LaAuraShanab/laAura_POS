import { useMemo, useState } from "react";
import { Clock, Receipt, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { useCustomerAccount, useRecordPayment } from "../../hooks/useCustomers";
import { useSaleQuery } from "../../hooks/useSales";
import { TransactionDetailModal } from "../transactions/TransactionDetailModal";
import { ApiError } from "../../types/api";
import type { Customer, PaymentAllocation } from "../../types/customer";
import type { PaymentMethod } from "../../types/sale";

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "MOBILE_MONEY", "OTHER"];
const PAYMENT_METHOD_KEY: Record<PaymentMethod, string> = {
  CASH: "pos.paymentCash",
  CARD: "pos.paymentCard",
  MOBILE_MONEY: "pos.paymentMobileMoney",
  OTHER: "pos.paymentOther",
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function CustomerAccountModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: account, isLoading } = useCustomerAccount(customer.id);
  const recordPayment = useRecordPayment();

  // Per-invoice allocation amounts, keyed by saleId (raw string inputs).
  const [alloc, setAlloc] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Invoice drill-down: clicking a reference fetches the full sale and opens the
  // shared transaction detail view on top of this modal.
  const [detailSaleId, setDetailSaleId] = useState<string | null>(null);
  const { data: detailSale } = useSaleQuery(detailSaleId);

  const totalAllocated = useMemo(
    () => round2(Object.values(alloc).reduce((sum, v) => sum + (Number(v) || 0), 0)),
    [alloc]
  );

  function setInvoiceAmount(saleId: string, remaining: number, raw: string) {
    const n = Number(raw);
    // Clamp to the invoice's remaining balance.
    const clamped = raw === "" ? "" : String(Math.min(Math.max(0, n), remaining));
    setAlloc((prev) => ({ ...prev, [saleId]: clamped }));
  }

  function payInvoiceInFull(saleId: string, remaining: number) {
    setAlloc((prev) => ({ ...prev, [saleId]: String(remaining) }));
  }

  async function submit() {
    setError(null);
    const allocations = Object.entries(alloc)
      .map(([saleId, v]) => ({ saleId, amount: Number(v) || 0 }))
      .filter((a) => a.amount > 0);
    if (allocations.length === 0) return;

    try {
      await recordPayment.mutateAsync({
        id: customer.id,
        input: { amount: totalAllocated, method, note: note.trim() || undefined, allocations },
      });
      toast.success(t("customers.paymentRecorded", { amount: formatCurrency(totalAllocated) }));
      setAlloc({});
      setNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("customers.couldNotRecordPayment"));
    }
  }

  function allocationsForPayment(allocations: PaymentAllocation[]): string {
    return t("customers.invoicesSettled", { count: allocations.length });
  }

  return (
    <>
    <Modal
      title={t("customers.accountTitle", { name: customer.name })}
      onClose={onClose}
      onInteractOutside={(e) => {
        // Never let an outside interaction (incl. dismissing the stacked invoice
        // detail modal) close the account modal — it closes only via its own X.
        e.preventDefault();
      }}
    >
      {isLoading || !account ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Balance + total spent summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gold-soft/20 p-4">
              <p className="text-[11px] tracking-wide text-ink/50 uppercase">{t("customers.balanceOwed")}</p>
              <p className="mt-1 text-2xl font-bold text-ink">{formatCurrency(account.balance)}</p>
            </div>
            <div className="rounded-2xl bg-sage/8 p-4">
              <p className="text-[11px] tracking-wide text-ink/50 uppercase">{t("customers.totalSpent")}</p>
              <p className="mt-1 text-2xl font-bold text-ink">{formatCurrency(account.totalSpent)}</p>
            </div>
          </div>

          {/* Unpaid invoices + payment entry */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink/50 uppercase">
              <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
              {t("customers.unpaidInvoices")}
            </p>
            {account.unpaidSales.length === 0 ? (
              <p className="rounded-2xl bg-sage/6 px-4 py-6 text-center text-sm text-ink/50">
                {t("customers.noOutstanding")}
              </p>
            ) : (
              <div className="space-y-2">
                {account.unpaidSales.map((sale) => (
                  <div key={sale.id} className="flex items-center gap-3 rounded-xl bg-sage/6 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setDetailSaleId(sale.id)}
                        className="truncate text-sm font-medium text-forest hover:underline"
                        title={t("customers.viewInvoice")}
                      >
                        {sale.reference}
                      </button>
                      <p className="text-xs text-ink/50">
                        {formatDateTime(sale.date)} · {t("customers.remaining")} {formatCurrency(sale.remaining)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={sale.remaining}
                        step="0.01"
                        value={alloc[sale.id] ?? ""}
                        onChange={(e) => setInvoiceAmount(sale.id, sale.remaining, e.target.value)}
                        placeholder="0.00"
                        className="w-24 text-end"
                      />
                      <button
                        type="button"
                        onClick={() => payInvoiceInFull(sale.id, sale.remaining)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-forest hover:bg-sage/15"
                      >
                        {t("customers.payFull")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Record-payment controls */}
          {account.unpaidSales.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-ink/10 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-ink/55">{t("customers.paymentMethod")}</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {t(PAYMENT_METHOD_KEY[m])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-note" className="text-xs text-ink/55">
                    {t("pos.note")} <span className="font-normal text-ink/40">{t("pos.noteOptional")}</span>
                  </Label>
                  <Input
                    id="payment-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    placeholder={t("customers.paymentNotePlaceholder")}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/70">
                  {t("customers.totalPayment")}{" "}
                  <span className="font-bold text-ink">{formatCurrency(totalAllocated)}</span>
                </span>
                <Button onClick={submit} disabled={totalAllocated <= 0 || recordPayment.isPending}>
                  <Wallet className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  {recordPayment.isPending ? t("common.processing") : t("customers.recordPayment")}
                </Button>
              </div>
            </div>
          )}

          {/* Payment history */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink/50 uppercase">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t("customers.paymentHistory")}
            </p>
            {account.payments.length === 0 ? (
              <p className="rounded-2xl bg-sage/6 px-4 py-6 text-center text-sm text-ink/50">
                {t("customers.noPayments")}
              </p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {account.payments.map((payment) => (
                  <div key={payment.id} className="flex items-start justify-between gap-3 rounded-xl bg-sage/6 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{formatCurrency(Number(payment.amount))}</p>
                      <p className="text-xs text-ink/50">
                        {formatDateTime(payment.receivedAt)} · {t(PAYMENT_METHOD_KEY[payment.method])} ·{" "}
                        {allocationsForPayment(payment.allocations)}
                      </p>
                      {payment.note && <p className="mt-0.5 text-xs text-ink/45">{payment.note}</p>}
                    </div>
                    <span className="flex-shrink-0 text-[11px] text-ink/40">{payment.recordedBy.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>

    {detailSale && (
      <TransactionDetailModal sale={detailSale} onClose={() => setDetailSaleId(null)} readOnly />
    )}
    </>
  );
}
