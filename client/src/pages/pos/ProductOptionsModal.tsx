import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/checkbox";
import { formatCurrency } from "../../lib/format";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { Product, ProductVariant } from "../../types/product";

interface ProductOptionsModalProps {
  product: Product;
  onConfirm: (variant: ProductVariant | undefined, extraIds: string[]) => void;
  onClose: () => void;
}

export function ProductOptionsModal({ product, onConfirm, onClose }: ProductOptionsModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const hasVariants = product.variants.length > 0;
  const [variantId, setVariantId] = useState<string | undefined>(product.variants[0]?.id);
  const [extraIds, setExtraIds] = useState<Set<string>>(new Set());

  const selectedVariant = product.variants.find((v) => v.id === variantId);
  const basePrice = Number(selectedVariant?.price ?? product.price);
  const extrasTotal = product.extras
    .filter((extra) => extraIds.has(extra.id))
    .reduce((sum, extra) => sum + Number(extra.price), 0);

  function toggleExtra(id: string) {
    setExtraIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal title={localizedName(product, language)} onClose={onClose}>
      <div className="space-y-5">
        {hasVariants && (
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-ink/50 uppercase">{t("pos.size")}</p>
            <div className="space-y-2">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-start transition-colors ${
                    variant.id === variantId
                      ? "bg-forest/15 text-ink ring-1 ring-forest/40"
                      : "bg-sage/8 text-ink hover:bg-sage/15"
                  }`}
                >
                  <span className="text-sm font-medium">{localizedName(variant, language)}</span>
                  <span className="text-sm font-semibold text-gold">{formatCurrency(Number(variant.price))}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {product.extras.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-ink/50 uppercase">{t("pos.extras")}</p>
            <div className="space-y-1">
              {product.extras.map((extra) => (
                <label
                  key={extra.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 hover:bg-sage/6"
                >
                  <span className="flex items-center gap-2.5">
                    <Checkbox
                      checked={extraIds.has(extra.id)}
                      onCheckedChange={() => toggleExtra(extra.id)}
                      aria-label={localizedName(extra, language)}
                    />
                    <span className="text-sm text-ink">{localizedName(extra, language)}</span>
                  </span>
                  <span className="text-sm text-ink/60">+{formatCurrency(Number(extra.price))}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-ink/10 pt-4">
          <span className="text-sm text-ink/60">{t("pos.total")}</span>
          <span className="text-lg font-semibold text-ink">{formatCurrency(basePrice + extrasTotal)}</span>
        </div>

        <Button className="w-full" onClick={() => onConfirm(selectedVariant, Array.from(extraIds))}>
          {t("pos.addToCart")}
        </Button>
      </div>
    </Modal>
  );
}
