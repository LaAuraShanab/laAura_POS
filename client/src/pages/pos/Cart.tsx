import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product, ProductExtra, ProductVariant } from "../../types/product";
import { Button } from "../../components/ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";

export interface CartLine {
  product: Product;
  variant?: ProductVariant;
  extras: ProductExtra[];
  quantity: number;
}

export function cartLineKey(productId: string, variantId?: string, extraIds: string[] = []): string {
  const sortedExtras = [...extraIds].sort().join(",");
  return `${productId}:${variantId ?? "base"}:${sortedExtras}`;
}

export function lineUnitPrice(line: CartLine): number {
  const base = Number(line.variant?.price ?? line.product.price);
  const extrasTotal = line.extras.reduce((sum, extra) => sum + Number(extra.price), 0);
  return base + extrasTotal;
}

interface CartProps {
  lines: CartLine[];
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
}

export function Cart({ lines, onIncrement, onDecrement, onRemove }: CartProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  if (lines.length === 0) {
    return <p className="py-8 text-center text-ink/40">{t("pos.cartEmpty")}</p>;
  }

  return (
    <div className="space-y-1">
      {lines.map((line) => {
        const key = cartLineKey(
          line.product.id,
          line.variant?.id,
          line.extras.map((e) => e.id)
        );
        const unitPrice = lineUnitPrice(line);
        return (
          <div key={key} className="flex items-center justify-between rounded-xl px-2 py-2 -mx-2 hover:bg-sage/6">
            <div>
              <p className="text-sm font-medium text-ink">
                {localizedName(line.product, language)}
                {line.variant && <span className="text-ink/55"> ({localizedName(line.variant, language)})</span>}
              </p>
              {line.extras.length > 0 && (
                <p className="text-xs text-ink/50">
                  + {line.extras.map((e) => localizedName(e, language)).join(", ")}
                </p>
              )}
              <p className="text-xs text-ink/55">
                ${unitPrice.toFixed(2)} {t("pos.each")}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="icon-sm"
                className="rounded-full"
                onClick={() => onDecrement(key)}
                aria-label={t("pos.decreaseQty", { name: localizedName(line.product, language) })}
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <span className="w-6 text-center text-sm">{line.quantity}</span>
              <Button
                variant="secondary"
                size="icon-sm"
                className="rounded-full"
                onClick={() => onIncrement(key)}
                aria-label={t("pos.increaseQty", { name: localizedName(line.product, language) })}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <span className="w-16 text-end text-sm font-medium text-ink">
                ${(unitPrice * line.quantity).toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(key)}
                aria-label={t("pos.removeFromCart", { name: localizedName(line.product, language) })}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
