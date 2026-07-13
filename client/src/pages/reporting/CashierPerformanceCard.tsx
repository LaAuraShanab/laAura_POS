import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { formatCurrency } from "../../lib/format";
import type { CashierPerformanceItem } from "../../types/reporting";

export function CashierPerformanceCard({ items }: { items: CashierPerformanceItem[] }) {
  const { t } = useTranslation();
  return (
    <Card className="gap-0 rounded-3xl glass-surface p-5 shadow-resting ring-0 transition-shadow duration-200 hover:shadow-raised">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft/40">
          <Users className="h-4 w-4 text-gold" aria-hidden="true" />
        </div>
        <span className="text-sm font-medium text-ink">{t("reporting.cashierPerformance")}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-ink/55">{t("reporting.noSalesPeriod")}</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.cashierId} className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs text-ink">{item.name}</p>
                <p className="text-[10.5px] text-ink/50">{t("reporting.salesCount", { count: item.salesCount })}</p>
              </div>
              <span className="text-xs font-medium text-ink">{formatCurrency(item.revenue)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
