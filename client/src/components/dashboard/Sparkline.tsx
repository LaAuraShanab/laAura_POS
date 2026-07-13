import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { DashboardSeriesPoint } from "../../types/dashboard";

interface SparklineProps {
  data: DashboardSeriesPoint[];
  height?: number;
}

export function Sparkline({ data, height = 60 }: SparklineProps) {
  const { t } = useTranslation();
  const gradientId = useId();
  const width = 280;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * step : width / 2;
    const y = height - (d.value / max) * (height - 6) - 3;
    return `${x},${y}`;
  });

  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;

  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-ink/40">{t("chart.noData")}</div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ height }} className="block w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} stroke="none" />
      <polyline
        points={points.join(" ")}
        fill="none"
        className="stroke-gold"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
