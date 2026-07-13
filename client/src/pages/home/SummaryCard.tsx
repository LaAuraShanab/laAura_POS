import { Wallet, Gauge, Layers, TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sparkline } from "../../components/dashboard/Sparkline";
import { Card } from "../../components/ui/card";
import { formatCurrency } from "../../lib/format";
import type { DashboardSummary } from "../../types/dashboard";

const RANGE_KEY: Record<DashboardSummary["range"], string> = {
  today: "dashboard.soldToday",
  week: "dashboard.soldThisWeek",
  month: "dashboard.soldThisMonth",
};

export function SummaryCard({ summary }: { summary: DashboardSummary }) {
  const { t } = useTranslation();
  const { totals, averages } = summary;
  const isPositive = (totals.deltaPct ?? 0) >= 0;

  return (
    <Card className="grid grid-cols-1 gap-4 rounded-3xl bg-transparent p-0 shadow-none ring-0 lg:grid-cols-5">
      <div className="relative overflow-hidden rounded-3xl glass-surface p-8 shadow-resting transition-shadow duration-200 hover:shadow-raised lg:col-span-3">
        <div
          className="pointer-events-none absolute -top-20 -end-16 h-64 w-64 rounded-full bg-gold/12 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft/40">
              <Wallet className="h-4.5 w-4.5 text-gold" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium tracking-[0.08em] text-ink/50 uppercase">{t(RANGE_KEY[summary.range])}</p>
          </div>

          <p className="mb-3 font-heading text-5xl font-medium tracking-tight text-ink">
            {formatCurrency(totals.periodTotal)}
          </p>

          {totals.deltaPct !== null ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
              )}
              {t("dashboard.deltaVsPrevious", { pct: Math.abs(totals.deltaPct) })}
            </span>
          ) : (
            <p className="text-[11px] text-ink/45">{t("dashboard.noPreviousData")}</p>
          )}
        </div>

        <div className="relative -mx-1 mt-7">
          <Sparkline data={summary.series} height={64} />
        </div>
      </div>

      <div className="flex flex-col divide-y divide-ink/8 rounded-3xl glass-surface p-2 shadow-resting transition-shadow duration-200 hover:shadow-raised lg:col-span-2">
        <div className="flex flex-1 items-center gap-3 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft/40">
            <Gauge className="h-4.5 w-4.5 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="mb-0.5 text-[11px] tracking-[0.06em] text-ink/50 uppercase">{t("dashboard.avgSaleValue")}</p>
            <p className="font-heading text-2xl font-medium text-ink">{formatCurrency(averages.avgSaleValue)}</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-forest/12">
            <Layers className="h-4.5 w-4.5 text-forest" aria-hidden="true" />
          </div>
          <div>
            <p className="mb-0.5 text-[11px] tracking-[0.06em] text-ink/50 uppercase">{t("dashboard.avgItemsPerSale")}</p>
            <p className="font-heading text-2xl font-medium text-ink">{averages.avgItemsPerSale}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
