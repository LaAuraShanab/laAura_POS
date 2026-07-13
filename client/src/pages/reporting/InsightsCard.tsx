import { Lightbulb, PackageX, AlertTriangle, Percent } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { ReportingAnalytics } from "../../types/reporting";

export function InsightsCard({ insights }: { insights: ReportingAnalytics["insights"] }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { deadStock, stockoutRisk, discount } = insights;

  return (
    <Card className="gap-0 rounded-3xl glass-surface p-6 shadow-resting ring-0 transition-shadow duration-200 hover:shadow-raised">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft/40">
          <Lightbulb className="h-4 w-4 text-gold" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-ink">{t("reporting.areasForImprovement")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-forest/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <PackageX className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">{t("reporting.deadStock")}</span>
          </div>
          {deadStock.length === 0 ? (
            <p className="text-[11px] text-ink/55">{t("reporting.noUnsoldStock")}</p>
          ) : (
            <ul className="space-y-1">
              {deadStock.map((item) => (
                <li key={item.productId} className="text-[11px] text-ink/70">
                  {localizedName(item, language)}{" "}
                  <span className="text-ink/45">· {t("reporting.inStock", { count: item.stock })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-gold-soft/15 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">{t("reporting.stockoutRisk")}</span>
          </div>
          {stockoutRisk.length === 0 ? (
            <p className="text-[11px] text-ink/55">{t("reporting.noPopularLow")}</p>
          ) : (
            <ul className="space-y-1">
              {stockoutRisk.map((item) => (
                <li key={item.productId} className="text-[11px] text-ink/70">
                  {localizedName(item, language)}{" "}
                  <span className="text-ink/45">
                    · {t("reporting.leftSold", { stock: item.stock, units: item.units })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-forest/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Percent className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
            <span className="text-xs font-medium text-ink">{t("reporting.discountUsage")}</span>
          </div>
          <p className="text-[11px] text-ink/70">
            {t("reporting.discountSummary", {
              count: discount.totalSales,
              withDiscount: discount.salesWithDiscount,
              total: discount.totalSales,
              rate: discount.discountRate,
            })}
          </p>
          {discount.avgDiscountPct > 0 && (
            <p className="mt-1 text-[11px] text-ink/45">
              {t("reporting.avgDiscount", { pct: discount.avgDiscountPct })}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
