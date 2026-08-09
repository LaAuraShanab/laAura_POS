import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product, ProductExtra, ProductVariant } from "../../types/product";
import { Button } from "../../components/ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import { formatCurrency } from "../../lib/format";

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

// Initials for the branded no-photo thumbnail (mirrors ProductGrid).
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Cart({ lines, onIncrement, onDecrement, onRemove }: CartProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  if (lines.length === 0) {
    return <p className="py-8 text-center text-ink/40">{t("pos.cartEmpty")}</p>;
  }

  return (
    <div className="space-y-2">
      {lines.map((line) => {
        const key = cartLineKey(
          line.product.id,
          line.variant?.id,
          line.extras.map((e) => e.id)
        );
        const unitPrice = lineUnitPrice(line);
        const name = localizedName(line.product, language);
        return (
          <div key={key} className="rounded-xl bg-sage/5 p-2.5">
            <div className="flex gap-2.5">
              <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-sage/8">
                {line.product.image ? (
                  <img src={line.product.image} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2f4632] to-[#54764e]">
                    <span className="font-serif text-xs italic text-[#e2c98a]">{initialsOf(name)}</span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {name}
                      {line.variant && (
                        <span className="text-ink/55"> ({localizedName(line.variant, language)})</span>
                      )}
                    </p>
                    {line.extras.length > 0 && (
                      <p className="truncate text-xs text-ink/50">
                        + {line.extras.map((e) => localizedName(e, language)).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-ink/45">
                      {formatCurrency(unitPrice)} {t("pos.each")}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-semibold text-ink tabular-nums">
                    {formatCurrency(unitPrice * line.quantity)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="icon-xs"
                      className="rounded-full"
                      onClick={() => onDecrement(key)}
                      aria-label={t("pos.decreaseQty", { name })}
                    >
                      <Minus className="h-3 w-3" aria-hidden="true" />
                    </Button>
                    <span className="w-5 text-center text-sm tabular-nums">{line.quantity}</span>
                    <Button
                      variant="secondary"
                      size="icon-xs"
                      className="rounded-full"
                      onClick={() => onIncrement(key)}
                      aria-label={t("pos.increaseQty", { name })}
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-full text-destructive hover:bg-destructive/10"
                    onClick={() => onRemove(key)}
                    aria-label={t("pos.removeFromCart", { name })}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
