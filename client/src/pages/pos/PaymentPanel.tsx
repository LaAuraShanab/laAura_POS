import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { formatCurrency } from "../../lib/format";
import type { PaymentMethod } from "../../types/sale";

interface PaymentPanelProps {
  subtotal: number;
  discount: number;
  tax: number;
  onDiscountChange: (value: number) => void;
  onTaxChange: (value: number) => void;
  note: string;
  onNoteChange: (value: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  isCredit: boolean;
  onIsCreditChange: (value: boolean) => void;
  creditAvailable: boolean;
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
  note,
  onNoteChange,
  paymentMethod,
  onPaymentMethodChange,
  isCredit,
  onIsCreditChange,
  creditAvailable,
  onSubmit,
  disabled,
  isSubmitting,
}: PaymentPanelProps) {
  const { t } = useTranslation();
  const grandTotal = Math.max(0, subtotal - discount + tax);

  // Cash-received / change-due calculator — a cashier aid, local UI state only
  // (not sent to the server). Only meaningful for cash, non-credit sales.
  const [cashReceived, setCashReceived] = useState("");
  const showCashCalc = paymentMethod === "CASH" && !isCredit;
  const receivedNum = Number(cashReceived) || 0;
  const changeDue = receivedNum - grandTotal;

  // Clear the received amount when the cart empties (after a sale completes/holds).
  useEffect(() => {
    if (disabled) setCashReceived("");
  }, [disabled]);

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

      <div>
        <Label htmlFor="payment-note" className="text-xs text-ink/55">
          {t("pos.note")}{" "}
          <span className="font-normal text-ink/40">{t("pos.noteOptional")}</span>
        </Label>
        <textarea
          id="payment-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={t("pos.notePlaceholder")}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <label
        className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
          isCredit ? "border-gold/40 bg-gold-soft/15" : "border-ink/10 bg-sage/6"
        } ${creditAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
      >
        <Checkbox
          checked={isCredit}
          onCheckedChange={(v) => onIsCreditChange(v === true)}
          disabled={!creditAvailable}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium text-ink">{t("pos.payLater")}</span>
          <span className="mt-0.5 block text-xs text-ink/50">
            {creditAvailable ? t("pos.payLaterHint") : t("pos.payLaterNeedsCustomer")}
          </span>
        </span>
      </label>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-ink/70">
          <span>{t("pos.subtotal")}</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink/70">
          <span>{t("pos.discount")}</span>
          <span>-{formatCurrency(discount)}</span>
        </div>
        <div className="flex justify-between text-ink/70">
          <span>{t("pos.tax")}</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-ink">
          <span>{t("pos.total")}</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {showCashCalc && (
        <div className="space-y-2 rounded-xl bg-sage/6 p-3">
          <div>
            <Label htmlFor="cash-received" className="text-xs text-ink/55">
              {t("pos.cashReceived")}
            </Label>
            <Input
              id="cash-received"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {cashReceived !== "" && (
            <div className="flex justify-between text-sm font-medium">
              {changeDue >= 0 ? (
                <>
                  <span className="text-ink/70">{t("pos.changeDue")}</span>
                  <span className="font-bold text-forest">{formatCurrency(changeDue)}</span>
                </>
              ) : (
                <>
                  <span className="text-ink/70">{t("pos.shortBy")}</span>
                  <span className="font-bold text-destructive">{formatCurrency(Math.abs(changeDue))}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <Button
        className="h-12 w-full rounded-2xl text-base font-semibold"
        onClick={onSubmit}
        disabled={disabled || isSubmitting}
      >
        {isSubmitting ? (
          t("common.processing")
        ) : (
          <>
            {isCredit ? t("pos.completeOnAccount") : t("pos.completeSale")}
            <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </>
        )}
      </Button>
    </div>
  );
}
