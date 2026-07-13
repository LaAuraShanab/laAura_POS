import { Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { useLanguage } from "../../context/LanguageContext";
import type { DashboardRecentSale } from "../../types/dashboard";

function firstItemLabel(sale: DashboardRecentSale, language: string): string | null {
  if (language === "ar" && sale.firstItemNameAr) return sale.firstItemNameAr;
  return sale.firstItemName;
}

export function RecentSalesCard({ sales }: { sales: DashboardRecentSale[] }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  return (
    <Card className="gap-0 rounded-3xl glass-surface p-7 shadow-resting ring-0 transition-shadow duration-200 hover:shadow-raised">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft/40">
          <Receipt className="h-4 w-4 text-gold" aria-hidden="true" />
        </div>
        <span className="text-xs font-medium tracking-[0.08em] text-ink/50 uppercase">{t("dashboard.recentSales")}</span>
      </div>

      {sales.length === 0 ? (
        <p className="text-xs text-ink/55">{t("dashboard.noSales")}</p>
      ) : (
        <div className="space-y-1">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="-mx-2.5 flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-sage/6"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-forest/8 font-heading text-sm font-medium text-forest">
                {(firstItemLabel(sale, language) ?? "S").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">
                  {firstItemLabel(sale, language) ?? t("dashboard.saleFallback")}
                  {sale.itemCount > 1 ? ` ${t("dashboard.moreItems", { count: sale.itemCount - 1 })}` : ""}
                </p>
                <p className="text-[10.5px] text-ink/45">{formatDateTime(sale.date)}</p>
              </div>
              <span className="font-heading text-sm font-medium text-ink">{formatCurrency(sale.grandTotal)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
