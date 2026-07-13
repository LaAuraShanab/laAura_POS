import { ImageIcon, Tag, Hash, Barcode, Layers, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { StockBadge } from "../../components/ui/StockBadge";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { Product } from "../../types/product";

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}

export function ProductDetailModal({ product, onClose, onEdit }: ProductDetailModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  return (
    <Modal title={t("products.productDetails")} onClose={onClose}>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sage/10">
          {product.image ? (
            <img
              src={product.image}
              alt={localizedName(product, language)}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-ink/30" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="font-heading text-xl font-medium text-ink">{localizedName(product, language)}</p>
          <div className="mt-1">
            <StockBadge stock={product.stock} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink/10 pt-5 text-sm">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] tracking-[0.05em] text-ink/50 uppercase">
            <Hash className="h-3 w-3" aria-hidden="true" /> {t("products.sku")}
          </p>
          <p className="text-ink">{product.sku}</p>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] tracking-[0.05em] text-ink/50 uppercase">
            <Barcode className="h-3 w-3" aria-hidden="true" /> {t("products.barcode")}
          </p>
          <p className="text-ink">{product.barcode ?? "—"}</p>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] tracking-[0.05em] text-ink/50 uppercase">
            <Layers className="h-3 w-3" aria-hidden="true" /> {t("products.category")}
          </p>
          <p className="text-ink">{product.category ? localizedName(product.category, language) : "—"}</p>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] tracking-[0.05em] text-ink/50 uppercase">
            <Tag className="h-3 w-3" aria-hidden="true" /> {t("common.price")}
          </p>
          <p className="text-ink">{formatCurrency(Number(product.price))}</p>
        </div>
      </div>

      {product.variants.length > 0 && (
        <div className="mt-5 border-t border-ink/10 pt-5">
          <p className="mb-2 text-[11px] tracking-[0.05em] text-ink/50 uppercase">{t("products.sizesTitle")}</p>
          <div className="space-y-1.5">
            {product.variants.map((variant) => (
              <div key={variant.id} className="flex items-center justify-between rounded-xl bg-sage/6 px-3 py-2 text-sm">
                <span className="text-ink">{localizedName(variant, language)}</span>
                <span className="font-medium text-ink">{formatCurrency(Number(variant.price))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.extras.length > 0 && (
        <div className="mt-5 border-t border-ink/10 pt-5">
          <p className="mb-2 text-[11px] tracking-[0.05em] text-ink/50 uppercase">{t("products.extrasTitle")}</p>
          <div className="space-y-1.5">
            {product.extras.map((extra) => (
              <div key={extra.id} className="flex items-center justify-between rounded-xl bg-sage/6 px-3 py-2 text-sm">
                <span className="text-ink">{localizedName(extra, language)}</span>
                <span className="font-medium text-ink">{formatCurrency(Number(extra.price))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 border-t border-ink/10 pt-4 text-xs text-ink/45">
        {t("products.addedUpdated", {
          added: formatDateTime(product.createdAt),
          updated: formatDateTime(product.updatedAt),
        })}
      </p>

      <div className="-mx-6 -mb-5 mt-5 flex justify-end gap-2 border-t border-ink/10 px-6 py-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("common.close")}
        </Button>
        <Button type="button" onClick={onEdit}>
          <Pencil className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t("products.editProductBtn")}
        </Button>
      </div>
    </Modal>
  );
}
