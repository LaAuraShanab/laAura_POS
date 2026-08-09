import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardSeriesPoint } from "../../types/dashboard";
import { CURRENCY_SYMBOL, formatCurrency } from "../../lib/format";

interface TrendChartProps {
  data: DashboardSeriesPoint[];
  height?: number;
  /** Called when a point is clicked — lets the parent drill into that bucket's sales. */
  onPointClick?: (point: DashboardSeriesPoint) => void;
}

function compactCurrency(value: number): string {
  if (value >= 1000) return `${CURRENCY_SYMBOL}${(value / 1000).toFixed(1)}k`;
  return `${CURRENCY_SYMBOL}${Math.round(value)}`;
}

interface TooltipEntry {
  payload: DashboardSeriesPoint;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
}) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-raised ring-1 ring-foreground/5">
      <p className="mb-1 font-medium text-ink">{point.label}</p>
      <p className="font-heading text-sm font-semibold text-gold">{formatCurrency(point.value)}</p>
      <p className="mt-0.5 text-ink/60">{t("chart.transactionsCount", { count: point.count })}</p>
      {point.count > 0 && <p className="mt-1 text-[10px] text-ink/40">{t("chart.clickToView")}</p>}
    </div>
  );
}

export function TrendChart({ data, height = 200, onPointClick }: TrendChartProps) {
  const { t } = useTranslation();
  const gradientId = useId();

  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-ink/40">
        {t("chart.noDataYet")}
      </div>
    );
  }

  // Each point renders an explicit dot with a large transparent hit area so it is
  // reliably clickable (recharts' chart-level onClick only fires while a tooltip
  // is active, which is easy to miss). The whole <g> is the click target.
  const renderDot = (props: { cx?: number; cy?: number; index?: number; payload?: DashboardSeriesPoint }) => {
    const { cx, cy, index, payload } = props;
    if (cx == null || cy == null || !payload) return <g key={`empty-${index}`} />;
    return (
      <g
        key={index}
        style={{ cursor: onPointClick ? "pointer" : "default" }}
        onClick={() => onPointClick?.(payload)}
      >
        <circle cx={cx} cy={cy} r={12} fill="transparent" />
        <circle cx={cx} cy={cy} r={3} fill="var(--gold)" stroke="var(--card)" strokeWidth={2} />
      </g>
    );
  };

  // Keep the time axis reading left→right even under RTL (standard for dashboards).
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          onClick={(state) => {
            const point = (state as unknown as { activePayload?: TooltipEntry[] })?.activePayload?.[0]?.payload;
            if (point && onPointClick) onPointClick(point);
          }}
          style={{ cursor: onPointClick ? "pointer" : "default" }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={compactCurrency}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--gold)", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--gold)"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={renderDot}
            activeDot={{
              r: 5,
              fill: "var(--gold)",
              stroke: "var(--card)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
