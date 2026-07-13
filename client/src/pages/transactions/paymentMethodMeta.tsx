import { Banknote, CreditCard, Smartphone, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PaymentMethod } from "../../types/sale";

export const PAYMENT_METHOD_META: Record<PaymentMethod, { labelKey: string; icon: typeof Banknote }> = {
  CASH: { labelKey: "pos.paymentCash", icon: Banknote },
  CARD: { labelKey: "pos.paymentCard", icon: CreditCard },
  MOBILE_MONEY: { labelKey: "pos.paymentMobileMoney", icon: Smartphone },
  OTHER: { labelKey: "pos.paymentOther", icon: Wallet },
};

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const { t } = useTranslation();
  const { labelKey, icon: Icon } = PAYMENT_METHOD_META[method];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-1 text-xs font-medium text-forest">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(labelKey)}
    </span>
  );
}
