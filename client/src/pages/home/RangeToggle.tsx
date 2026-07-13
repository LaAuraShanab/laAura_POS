import { useTranslation } from "react-i18next";
import type { DashboardRange } from "../../types/dashboard";

const OPTIONS: { value: DashboardRange; labelKey: string }[] = [
  { value: "today", labelKey: "dashboard.rangeToday" },
  { value: "week", labelKey: "dashboard.rangeWeek" },
  { value: "month", labelKey: "dashboard.rangeMonth" },
];

interface RangeToggleProps {
  value: DashboardRange;
  onChange: (range: DashboardRange) => void;
}

export function RangeToggle({ value, onChange }: RangeToggleProps) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-1 rounded-full bg-sage/8 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            value === option.value ? "bg-gold text-forest-deep" : "text-ink/60 hover:text-ink"
          }`}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}
