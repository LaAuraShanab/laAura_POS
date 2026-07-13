import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../../hooks/useDashboard";
import { useReportingAnalytics } from "../../hooks/useReportingAnalytics";
import { Skeleton } from "../../components/ui/Skeleton";
import { RangeToggle } from "../home/RangeToggle";
import { TrendChartCard } from "../home/TrendChartCard";
import { BestSellersCard } from "./BestSellersCard";
import { WorstSellersCard } from "./WorstSellersCard";
import { CashierPerformanceCard } from "./CashierPerformanceCard";
import { InsightsCard } from "./InsightsCard";
import { ExportPdfButton } from "./ExportPdfButton";
import type { DashboardRange } from "../../types/dashboard";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

export function ReportingPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<DashboardRange>("month");
  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = useDashboard(range);
  const { data: analytics, isLoading: isAnalyticsLoading, isError: isAnalyticsError } = useReportingAnalytics(range);
  const reduceMotion = useReducedMotion();

  const isLoading = isSummaryLoading || isAnalyticsLoading;
  const isError = isSummaryError || isAnalyticsError;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-medium text-ink">{t("reporting.title")}</h1>
          <p className="mt-1 text-sm text-ink/60">{t("reporting.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <RangeToggle value={range} onChange={setRange} />
          <ExportPdfButton range={range} />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 rounded-3xl glass-surface p-6 shadow-resting lg:col-span-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-36 w-full" />
            </div>
            <div className="space-y-2 rounded-3xl glass-surface p-5 shadow-resting">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      )}

      {isError && (
        <p className="rounded-2xl glass-surface p-4 text-sm text-destructive shadow-resting">
          {t("reporting.loadError")}
        </p>
      )}

      {summary && analytics && (
        <motion.div
          key={range}
          className="space-y-4"
          variants={reduceMotion ? undefined : containerVariants}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "visible"}
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div variants={reduceMotion ? undefined : itemVariants} className="lg:col-span-2">
              <TrendChartCard summary={summary} />
            </motion.div>
            <motion.div variants={reduceMotion ? undefined : itemVariants}>
              <WorstSellersCard items={analytics.worstSellers} />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div variants={reduceMotion ? undefined : itemVariants} className="lg:col-span-2">
              <BestSellersCard items={analytics.bestSellers} />
            </motion.div>
            <motion.div variants={reduceMotion ? undefined : itemVariants}>
              <CashierPerformanceCard items={analytics.cashierPerformance} />
            </motion.div>
          </div>

          <motion.div variants={reduceMotion ? undefined : itemVariants}>
            <InsightsCard insights={analytics.insights} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
