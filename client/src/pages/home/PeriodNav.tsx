import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import type { DashboardRange } from "../../types/dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

interface PeriodNavProps {
  range: DashboardRange;
  offset: number;
  onOffsetChange: (offset: number) => void;
  /** ISO start of the currently shown period (from the summary). */
  periodStart: string;
}

// Human label for the shown period, formatted in the active language. Dates are
// UTC-anchored on the server, so format in UTC to keep the calendar label stable.
function periodLabel(range: DashboardRange, offset: number, periodStart: string, locale: string, t: (k: string) => string): string {
  const start = new Date(periodStart);
  if (range === "month") {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(start);
  }
  if (range === "week") {
    const end = new Date(start.getTime() + 6 * DAY_MS);
    const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }
  // today
  if (offset === 0) return t("chart.today");
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(start);
}

export function PeriodNav({ range, offset, onOffsetChange, periodStart }: PeriodNavProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const locale = language === "ar" ? "ar" : "en";
  const label = periodLabel(range, offset, periodStart, locale, t);

  return (
    <div className="flex items-center gap-1 rounded-full bg-sage/8 p-1">
      <button
        onClick={() => onOffsetChange(offset + 1)}
        className="rounded-full p-1.5 text-ink/60 transition-colors hover:bg-sage/15 hover:text-ink"
        aria-label={t("chart.previousPeriod")}
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </button>
      <span className="min-w-28 text-center text-xs font-medium text-ink tabular-nums">{label}</span>
      <button
        onClick={() => onOffsetChange(Math.max(0, offset - 1))}
        disabled={offset === 0}
        className="rounded-full p-1.5 text-ink/60 transition-colors hover:bg-sage/15 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label={t("chart.nextPeriod")}
      >
        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </button>
    </div>
  );
}
