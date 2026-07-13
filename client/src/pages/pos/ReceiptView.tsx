import { useTranslation } from "react-i18next";
import type { Sale } from "../../types/sale";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/card";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";

interface ReceiptViewProps {
  sale: Sale;
  onNewSale: () => void;
}

const PAYMENT_METHOD_KEY: Record<string, string> = {
  CASH: "pos.paymentCash",
  CARD: "pos.paymentCard",
  MOBILE_MONEY: "pos.paymentMobileMoney",
  OTHER: "pos.paymentOther",
};

export function ReceiptView({ sale, onNewSale }: ReceiptViewProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  return (
    <Card className="mx-auto max-w-sm gap-0 rounded-3xl glass-surface p-7 shadow-resting ring-0 print:rounded-none print:bg-white print:p-0 print:text-black print:shadow-none print:backdrop-blur-none">
      <h2 className="text-center text-lg font-bold text-ink">La Aura POS</h2>
      <p className="text-center text-xs text-ink/40">{sale.reference}</p>
      <p className="mb-4 text-center text-xs text-ink/40">{new Date(sale.date).toLocaleString()}</p>

      <div className="divide-y divide-dashed divide-ink/10 border-y border-dashed border-ink/15 py-2 text-sm">
        {sale.items.map((item) => (
          <div key={item.id} className="py-1">
            <div className="flex justify-between">
              <span>
                {localizedName(item.product, language)}
                {item.variantName && (
                  <span className="text-ink/55">
                    {" "}
                    ({item.variant ? localizedName(item.variant, language) : item.variantName})
                  </span>
                )}{" "}
                × {item.quantity}
              </span>
              <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
            {item.extras.length > 0 && (
              <p className="text-xs text-ink/45">
                + {item.extras.map((e) => (e.extra ? localizedName(e.extra, language) : e.name)).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between text-ink/70">
          <span>{t("pos.subtotal")}</span>
          <span>${Number(sale.subtotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-ink/70">
          <span>{t("pos.discount")}</span>
          <span>-${Number(sale.discount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-ink/70">
          <span>{t("pos.tax")}</span>
          <span>${Number(sale.tax).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-gold-soft/25 px-4 py-3">
        <span className="text-base font-bold text-ink">{t("pos.total")}</span>
        <span className="text-lg font-bold text-ink">${Number(sale.grandTotal).toFixed(2)}</span>
      </div>
      <div className="mt-2 text-center text-xs text-ink/40">
        {t("pos.paidVia", { method: t(PAYMENT_METHOD_KEY[sale.paymentMethod] ?? "pos.paymentOther") })}
      </div>

      <Button className="mt-6 w-full print:hidden" onClick={onNewSale}>
        {t("pos.newSale")}
      </Button>
    </Card>
  );
}
