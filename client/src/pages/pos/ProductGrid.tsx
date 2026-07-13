import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCategoriesQuery } from "../../hooks/useCategories";
import { useProductsQuery } from "../../hooks/useProducts";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ProductOptionsModal } from "./ProductOptionsModal";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { Product, ProductVariant } from "../../types/product";

interface ProductGridProps {
  onSelect: (product: Product, variant?: ProductVariant, extraIds?: string[]) => void;
}

export function ProductGrid({ onSelect }: ProductGridProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [optionsProduct, setOptionsProduct] = useState<Product | null>(null);
  const { data: categories } = useCategoriesQuery();
  const { data: products, isLoading } = useProductsQuery({ search: search || undefined, categoryId });

  function handleTileClick(product: Product) {
    if (product.variants.length > 0 || product.extras.length > 0) {
      setOptionsProduct(product);
    } else {
      onSelect(product);
    }
  }

  return (
    <div>
      <Input
        placeholder={t("pos.searchProducts")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryId(undefined)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            !categoryId ? "bg-gold text-forest-deep" : "bg-sage/8 text-ink/70 hover:bg-sage/15"
          }`}
        >
          {t("pos.all")}
        </button>
        {categories?.map((category) => (
          <button
            key={category.id}
            onClick={() => setCategoryId(category.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              categoryId === category.id ? "bg-gold text-forest-deep" : "bg-sage/8 text-ink/70 hover:bg-sage/15"
            }`}
          >
            {localizedName(category, language)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-2xl glass-surface p-3 shadow-resting">
              <Skeleton className="mb-2 aspect-square w-full" />
              <Skeleton className="mb-1.5 h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products?.map((product) => (
            <button
              key={product.id}
              onClick={() => handleTileClick(product)}
              disabled={product.stock <= 0}
              className="rounded-2xl glass-surface p-3 text-start shadow-resting transition-[box-shadow,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:shadow-raised disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-resting"
            >
              <div className="mb-2 aspect-square w-full overflow-hidden rounded-xl bg-sage/8">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={localizedName(product, language)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink/30">
                    <ImageIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}
              </div>
              <p className="font-medium text-ink">{localizedName(product, language)}</p>
              <p className="text-xs text-ink/55">{product.sku}</p>
              <p className="mt-1 text-sm font-semibold text-gold">
                {product.variants.length > 0
                  ? t("pos.fromPrice", { price: `$${Math.min(...product.variants.map((v) => Number(v.price))).toFixed(2)}` })
                  : `$${Number(product.price).toFixed(2)}`}
              </p>
              <p className="text-xs text-ink/40">{t("pos.stock", { count: product.stock })}</p>
            </button>
          ))}
        </div>
      )}

      {optionsProduct && (
        <ProductOptionsModal
          product={optionsProduct}
          onConfirm={(variant, extraIds) => {
            onSelect(optionsProduct, variant, extraIds);
            setOptionsProduct(null);
          }}
          onClose={() => setOptionsProduct(null)}
        />
      )}
    </div>
  );
}
