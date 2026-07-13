import { LineChart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TrendChart } from "../../components/dashboard/TrendChart";
import { Card } from "../../components/ui/card";
import { formatCurrency } from "../../lib/format";
import type { DashboardSummary } from "../../types/dashboard";

export function TrendChartCard({ summary }: { summary: DashboardSummary }) {
  const { t } = useTranslation();
  const { activity, averages } = summary;

  return (
    <Card className="gap-0 rounded-3xl glass-surface p-7 shadow-resting ring-0 transition-shadow duration-200 hover:shadow-raised">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft/40">
          <LineChart className="h-4 w-4 text-gold" aria-hidden="true" />
        </div>
        <p className="text-xs font-medium tracking-[0.08em] text-ink/50 uppercase">{t("dashboard.salesTrend")}</p>
      </div>

      <TrendChart data={summary.series} />

      <div className="mt-6 grid grid-cols-3 gap-6 border-t border-ink/8 pt-5">
        <div>
          <p className="mb-1 text-[11px] tracking-[0.05em] text-ink/50 uppercase">{t("dashboard.transactions")}</p>
          <p className="font-heading text-xl font-medium text-ink">{activity.totalTransactions}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] tracking-[0.05em] text-ink/50 uppercase">{t("dashboard.itemsSold")}</p>
          <p className="font-heading text-xl font-medium text-ink">{activity.itemsSold}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] tracking-[0.05em] text-ink/50 uppercase">{t("dashboard.averageSale")}</p>
          <p className="font-heading text-xl font-medium text-ink">{formatCurrency(averages.avgSaleValue)}</p>
        </div>
      </div>
    </Card>
  );
}
