import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { DashboardSeriesPoint } from "../../types/dashboard";

interface TrendChartProps {
  data: DashboardSeriesPoint[];
  height?: number;
}

export function TrendChart({ data, height = 150 }: TrendChartProps) {
  const { t } = useTranslation();
  const gradientId = useId();
  const width = 600;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * step : width / 2;
    const y = height - (d.value / max) * (height - 12) - 6;
    return `${x},${y}`;
  });

  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;
  const labelStep = Math.max(1, Math.ceil(data.length / 7));

  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-ink/40">
        {t("chart.noDataYet")}
      </div>
    );
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ height }} className="block w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#${gradientId})`} stroke="none" />
        <polyline
          points={points.join(" ")}
          fill="none"
          className="stroke-gold"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-1.5 flex justify-between text-[10px] tracking-wide text-ink/45 uppercase">
        {data.map((d, i) => (
          <span key={d.label + i} className={i % labelStep === 0 ? "" : "invisible"}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
