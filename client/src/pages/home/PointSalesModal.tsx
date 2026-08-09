import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { useSalesQuery } from "../../hooks/useSales";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { TransactionDetailModal } from "../transactions/TransactionDetailModal";
import type { BucketUnit, DashboardSeriesPoint } from "../../types/dashboard";
import type { Sale } from "../../types/sale";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Drill-in for a clicked chart point: lists the completed sales in that bucket's
// time window (matching the point's count), and opens a read-only detail on click.
export function PointSalesModal({
  point,
  bucketUnit,
  onClose,
}: {
  point: DashboardSeriesPoint;
  bucketUnit: BucketUnit;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const from = point.start;
  const to = new Date(new Date(point.start).getTime() + (bucketUnit === "hour" ? HOUR_MS : DAY_MS) - 1).toISOString();
  const { data, isLoading } = useSalesQuery({ from, to, status: "COMPLETED", pageSize: 100 });
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const sales = data?.sales ?? [];

  return (
    <>
      <Modal
        title={t("chart.transactionsOn", { label: point.label })}
        onClose={onClose}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : sales.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/40">{t("chart.noTransactions")}</p>
        ) : (
          <div className="space-y-1.5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink/60">{t("chart.transactionsCount", { count: sales.length })}</span>
              <span className="font-semibold text-gold">{formatCurrency(point.value)}</span>
            </div>
            {sales.map((sale) => (
              <button
                key={sale.id}
                onClick={() => setDetailSale(sale)}
                className="flex w-full items-center justify-between gap-3 rounded-xl bg-sage/5 px-3 py-2.5 text-start transition-colors hover:bg-sage/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{sale.reference}</p>
                  <p className="text-xs text-ink/50">
                    {formatDateTime(sale.date)} ·{" "}
                    {t("pos.itemCount", { count: sale.items.reduce((s, i) => s + i.quantity, 0) })}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm font-semibold text-ink tabular-nums">
                  {formatCurrency(Number(sale.grandTotal))}
                </span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {detailSale && <TransactionDetailModal sale={detailSale} onClose={() => setDetailSale(null)} readOnly />}
    </>
  );
}
