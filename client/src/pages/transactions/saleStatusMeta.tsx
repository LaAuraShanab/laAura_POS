import { Ban, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SaleStatus } from "../../types/sale";

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
