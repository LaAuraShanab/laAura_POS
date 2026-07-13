import { useTranslation } from "react-i18next";

const LOW_STOCK_THRESHOLD = 10;

export function StockBadge({ stock }: { stock: number }) {
  const { t } = useTranslation();

  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-hidden="true" />
        {t("products.outOfStock")}
      </span>
    );
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft/20 px-2.5 py-1 text-xs font-medium text-gold">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
        {t("products.lowStockBadge", { count: stock })}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/15 px-2.5 py-1 text-xs font-medium text-forest">
      <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden="true" />
      {t("products.inStockBadge", { count: stock })}
    </span>
  );
}
