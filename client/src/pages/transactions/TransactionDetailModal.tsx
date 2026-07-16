import { useState } from "react";
import { Ban, RotateCcw, User, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useVoidSale } from "../../hooks/useSales";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { PaymentMethodBadge } from "./paymentMethodMeta";
import { StatusBadge } from "./saleStatusMeta";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import { ApiError } from "../../types/api";
import type { Sale } from "../../types/sale";

type PendingAction = "VOIDED" | "REFUNDED" | null;

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TransactionDetailModal({ sale: initialSale, onClose }: { sale: Sale; onClose: () => void }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [sale, setSale] = useState(initialSale);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const voidSale = useVoidSale();

  const canReverse = !!user && ["ADMIN", "MANAGER"].includes(user.role) && sale.status === "COMPLETED";

  function startAction(action: Exclude<PendingAction, null>) {
    setPendingAction(action);
    setReason("");
    setError(null);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setError(null);
    try {
      const updated = await voidSale.mutateAsync({ id: sale.id, status: pendingAction, reason: reason.trim() || undefined });
      setSale(updated);
      setPendingAction(null);
      toast.success(t(pendingAction === "VOIDED" ? "toast.saleVoided" : "toast.saleRefunded"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("transactions.couldNotUpdate"));
    }
  }

  return (
    <Modal title={t("transactions.transactionTitle", { reference: sale.reference })} onClose={onClose}>
      <div className="space-y-5">
        {sale.status !== "COMPLETED" && (
          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-sage/6 p-3.5">
            <StatusBadge status={sale.status} />
            <div className="min-w-0 flex-1 text-xs text-ink/60">
              <p>
                {t(sale.status === "VOIDED" ? "transactions.voidedBy" : "transactions.refundedBy", {
                  name: sale.voidedBy?.name ?? t("common.unknown"),
                })}
                {sale.voidedAt && ` ${t("transactions.onDate", { date: formatDateTime(sale.voidedAt) })}`}.{" "}
                {t("transactions.stockReturned")}
              </p>
              {sale.voidReason && (
                <p className="mt-1 text-ink/70">{t("transactions.reasonPrefix", { reason: sale.voidReason })}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 rounded-2xl bg-sage/6 p-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft/40 text-[11px] font-medium text-gold">
              {initialsOf(sale.cashier.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-ink/50">{t("transactions.soldBy")}</p>
              <p className="truncate text-sm font-medium text-ink">{sale.cashier.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-sage/6 p-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-forest/15 text-forest">
              {sale.customer ? <User className="h-4 w-4" aria-hidden="true" /> : <UserCircle className="h-4 w-4" aria-hidden="true" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-ink/50">{t("transactions.colCustomer")}</p>
              <p className="truncate text-sm font-medium text-ink">
                {sale.customer?.name ?? t("pos.walkInCustomer")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-ink/60">{formatDateTime(sale.date)}</span>
          <PaymentMethodBadge method={sale.paymentMethod} />
        </div>

        {sale.note && (
          <div className="rounded-2xl bg-sage/6 p-3 text-sm">
            <p className="text-[11px] font-medium tracking-wide text-ink/50 uppercase">{t("pos.note")}</p>
            <p className="mt-1 whitespace-pre-wrap text-ink/80">{sale.note}</p>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-ink/50 uppercase">
            {t("transactions.itemsCount", { count: sale.items.length })}
          </p>
          <div className="overflow-hidden rounded-2xl border border-ink/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sage/6 text-start text-xs font-medium text-ink/55">
                  <th className="px-3 py-2 font-medium">{t("transactions.colItem")}</th>
                  <th className="px-3 py-2 text-end font-medium">{t("transactions.colQty")}</th>
                  <th className="px-3 py-2 text-end font-medium">{t("common.price")}</th>
                  <th className="px-3 py-2 text-end font-medium">{t("transactions.colItemTotal")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {sale.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-ink">
                      {localizedName(item.product, language)}
                      {item.variantName && (
                        <span className="text-ink/50">
                          {" "}
                          · {item.variant ? localizedName(item.variant, language) : item.variantName}
                        </span>
                      )}
                      {item.extras.length > 0 && (
                        <p className="text-xs text-ink/45">
                          + {item.extras.map((e) => (e.extra ? localizedName(e.extra, language) : e.name)).join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-end text-ink/70 tabular-nums">{item.quantity}</td>
                    <td className="px-3 py-2 text-end text-ink/70 tabular-nums">
                      {formatCurrency(Number(item.price))}
                    </td>
                    <td className="px-3 py-2 text-end text-ink tabular-nums">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-1.5 rounded-2xl bg-sage/6 p-4 text-sm">
          <div className="flex justify-between text-ink/70">
            <span>{t("pos.subtotal")}</span>
            <span className="tabular-nums">{formatCurrency(Number(sale.subtotal))}</span>
          </div>
          <div className="flex justify-between text-ink/70">
            <span>{t("pos.discount")}</span>
            <span className="tabular-nums">-{formatCurrency(Number(sale.discount))}</span>
          </div>
          <div className="flex justify-between text-ink/70">
            <span>{t("pos.tax")}</span>
            <span className="tabular-nums">{formatCurrency(Number(sale.tax))}</span>
          </div>
          <div
            className={`mt-1 flex justify-between border-t border-ink/10 pt-2 text-base font-bold ${
              sale.status === "COMPLETED" ? "text-ink" : "text-ink/50 line-through decoration-ink/30"
            }`}
          >
            <span>{t("transactions.grandTotal")}</span>
            <span className="tabular-nums">{formatCurrency(Number(sale.grandTotal))}</span>
          </div>
        </div>

        {canReverse && pendingAction === null && (
          <div className="flex justify-end gap-2 border-t border-ink/10 pt-4">
            <Button variant="secondary" size="sm" onClick={() => startAction("REFUNDED")}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t("transactions.refundBtn")}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => startAction("VOIDED")}>
              <Ban className="h-3.5 w-3.5" aria-hidden="true" />
              {t("transactions.voidBtn")}
            </Button>
          </div>
        )}

        {pendingAction !== null && (
          <div className="space-y-2.5 border-t border-ink/10 pt-4">
            <label htmlFor="void-reason" className="text-xs font-medium text-ink/60">
              {pendingAction === "VOIDED" ? t("transactions.whyVoided") : t("transactions.whyRefunded")}{" "}
              <span className="font-normal text-ink/40">{t("transactions.optional")}</span>
            </label>
            <textarea
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t("transactions.reasonPlaceholder")}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPendingAction(null)} disabled={voidSale.isPending}>
                {t("common.cancel")}
              </Button>
              <Button variant="danger" size="sm" onClick={confirmAction} disabled={voidSale.isPending}>
                {voidSale.isPending
                  ? t("common.processing")
                  : pendingAction === "VOIDED"
                    ? t("transactions.confirmVoid")
                    : t("transactions.confirmRefund")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
