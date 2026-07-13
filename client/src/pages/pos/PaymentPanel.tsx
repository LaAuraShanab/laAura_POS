import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import type { PaymentMethod } from "../../types/sale";

interface PaymentPanelProps {
  subtotal: number;
  discount: number;
  tax: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onSubmit: () => void;
  disabled: boolean;
  isSubmitting: boolean;
}

const paymentMethods: PaymentMethod[] = ["CASH", "CARD", "MOBILE_MONEY", "OTHER"];
const PAYMENT_METHOD_KEY: Record<PaymentMethod, string> = {
  CASH: "pos.paymentCash",
  CARD: "pos.paymentCard",
  MOBILE_MONEY: "pos.paymentMobileMoney",
  OTHER: "pos.paymentOther",
};

export function PaymentPanel({
  subtotal,
  discount,
  tax,
  onDiscountChange,
  onTaxChange,
  paymentMethod,
  onPaymentMethodChange,
  onSubmit,
  disabled,
  isSubmitting,
}: PaymentPanelProps) {
  const { t } = useTranslation();
  const grandTotal = Math.max(0, subtotal - discount + tax);

  return (
    <div className="space-y-3 border-t border-ink/10 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="payment-discount" className="text-xs text-ink/55">
            {t("pos.discount")}
          </Label>
          <Input
            id="payment-discount"
            type="number"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="payment-tax" className="text-xs text-ink/55">
            {t("pos.tax")}
          </Label>
          <Input
            id="payment-tax"
            type="number"
            min={0}
            step="0.01"
            value={tax}
            onChange={(e) => onTaxChange(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <Select value={paymentMethod} onValueChange={(value) => onPaymentMethodChange(value as PaymentMethod)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {paymentMethods.map((method) => (
            <SelectItem key={method} value={method}>
              {t(PAYMENT_METHOD_KEY[method])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-ink/70">
          <span>{t("pos.subtotal")}</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-ink/70">
          <span>{t("pos.discount")}</span>
          <span>-${discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-ink/70">
          <span>{t("pos.tax")}</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-ink">
          <span>{t("pos.total")}</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={disabled || isSubmitting}>
        {isSubmitting ? t("common.processing") : t("pos.completeSale")}
      </Button>
    </div>
  );
}
