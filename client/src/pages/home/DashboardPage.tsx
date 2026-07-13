import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../../hooks/useDashboard";
import { Skeleton } from "../../components/ui/Skeleton";
import { RangeToggle } from "./RangeToggle";
import { SummaryCard } from "./SummaryCard";
import { TrendChartCard } from "./TrendChartCard";
import { LowStockCard } from "./LowStockCard";
import { RecentSalesCard } from "./RecentSalesCard";
import type { DashboardRange } from "../../types/dashboard";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

export function DashboardPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<DashboardRange>("month");
  const { data: summary, isLoading, isError } = useDashboard(range);
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="max-w-md text-3xl font-heading font-medium text-ink">{t("dashboard.greeting")}</h1>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 divide-y divide-ink/10 rounded-3xl glass-surface shadow-resting sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="space-y-2 p-6">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="space-y-2 p-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="space-y-4 p-6">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 rounded-3xl glass-surface p-6 shadow-resting lg:col-span-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-36 w-full" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2 rounded-3xl glass-surface p-5 shadow-resting">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <div className="space-y-2 rounded-3xl glass-surface p-5 shadow-resting">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {isError && (
        <p className="rounded-2xl glass-surface p-4 text-sm text-destructive shadow-resting">
          {t("dashboard.loadError")}
        </p>
      )}

      {summary && (
        <motion.div
          key={range}
          className="space-y-4"
          variants={reduceMotion ? undefined : containerVariants}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "visible"}
        >
          <motion.div variants={reduceMotion ? undefined : itemVariants}>
            <SummaryCard summary={summary} />
          </motion.div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div variants={reduceMotion ? undefined : itemVariants} className="lg:col-span-2">
              <TrendChartCard summary={summary} />
            </motion.div>
            <motion.div variants={reduceMotion ? undefined : itemVariants} className="space-y-4">
              <LowStockCard items={summary.lowStock} />
              <RecentSalesCard sales={summary.recentSales} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
