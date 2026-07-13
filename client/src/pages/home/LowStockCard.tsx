import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { DashboardLowStockItem } from "../../types/dashboard";

export function LowStockCard({ items }: { items: DashboardLowStockItem[] }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  return (
    <Card className="gap-0 rounded-3xl glass-surface p-7 shadow-resting ring-0 transition-shadow duration-200 hover:shadow-raised">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft/40">
          <AlertTriangle className="h-4 w-4 text-gold" aria-hidden="true" />
        </div>
        <span className="text-xs font-medium tracking-[0.08em] text-ink/50 uppercase">{t("dashboard.lowStock")}</span>
      </div>

      {items.length === 0 ? (
        <p className="mb-2 text-xs text-ink/55">{t("dashboard.noLowStock")}</p>
      ) : (
        <>
          <p className="mb-4 text-xs text-ink/55">{t("dashboard.lowStockCount", { count: items.length })}</p>
          <div className="mb-4 space-y-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border-s-2 border-gold bg-gold-soft/15 px-4 py-3"
              >
                <span className="text-sm text-ink">{localizedName(item, language)}</span>
                <span className="text-xs font-medium text-gold">{t("dashboard.stockLeft", { count: item.stock })}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Link to="/products" className="text-xs font-medium text-gold hover:underline">
        {t("dashboard.viewInventory")}
      </Link>
    </Card>
  );
}
