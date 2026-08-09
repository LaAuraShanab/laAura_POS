import { Ban, CircleAlert, CircleDollarSign, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SalePaymentStatus, SaleStatus } from "../../types/sale";

export function StatusBadge({ status }: { status: SaleStatus }) {
  const { t } = useTranslation();
  if (status === "VOIDED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
        <Ban className="h-3.5 w-3.5" aria-hidden="true" />
        {t("transactions.statusVoided")}
      </span>
    );
  }
  if (status === "REFUNDED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft/25 px-2.5 py-1 text-xs font-medium text-gold">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        {t("transactions.statusRefunded")}
      </span>
    );
  }
  return <span className="text-xs text-ink/40">{t("transactions.statusCompleted")}</span>;
}

// Payment status is independent of the transaction status: a COMPLETED sale can still
// be UNPAID (on account) or PARTIALLY_PAID. PAID renders nothing to keep the common
// case uncluttered.
export function PaymentStatusBadge({ status }: { status: SalePaymentStatus }) {
  const { t } = useTranslation();
  if (status === "UNPAID") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        {t("transactions.paymentUnpaid")}
      </span>
    );
  }
  if (status === "PARTIALLY_PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
        {t("transactions.paymentPartial")}
      </span>
    );
  }
  return null;
}
