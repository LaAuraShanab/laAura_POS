import { TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { WorstSellerItem } from "../../types/reporting";

export function WorstSellersCard({ items }: { items: WorstSellerItem[] }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  return (
    <Card className="gap-0 rounded-3xl glass-surface p-5 shadow-resting ring-0 transition-shadow duration-200 hover:shadow-raised">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest/15">
          <TrendingDown className="h-4 w-4 text-forest" aria-hidden="true" />
        </div>
        <span className="text-sm font-medium text-ink">{t("reporting.slowMovers")}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-ink/55">{t("reporting.notEnoughData")}</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs text-ink">{localizedName(item, language)}</p>
                <p className="text-[10.5px] text-ink/50">{item.sku}</p>
              </div>
              <div className="text-end">
                <p className="text-xs font-medium text-ink">{t("reporting.unitsSold", { count: item.units })}</p>
                <p className="text-[10.5px] text-ink/50">{t("reporting.inStock", { count: item.stock })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
