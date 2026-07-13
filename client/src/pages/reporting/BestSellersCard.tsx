import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { formatCurrency } from "../../lib/format";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { BestSellerItem } from "../../types/reporting";

export function BestSellersCard({ items }: { items: BestSellerItem[] }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const chartData = items.map((item) => ({ ...item, name: localizedName(item, language) }));
  return (
    <Card className="gap-0 rounded-3xl glass-surface p-6 shadow-resting ring-0 transition-shadow duration-200 hover:shadow-raised">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft/40">
          <TrendingUp className="h-4 w-4 text-gold" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-ink">{t("reporting.bestSellers")}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-ink/55">{t("reporting.noSalesPeriod")}</p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11, fill: "var(--foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="revenue" fill="var(--gold)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
