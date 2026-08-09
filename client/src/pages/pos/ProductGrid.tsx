import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCategoriesQuery } from "../../hooks/useCategories";
import { useProductsQuery } from "../../hooks/useProducts";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ProductOptionsModal } from "./ProductOptionsModal";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import { formatCurrency } from "../../lib/format";
import type { Product, ProductVariant } from "../../types/product";

interface ProductGridProps {
  onSelect: (product: Product, variant?: ProductVariant, extraIds?: string[]) => void;
}

// Initials for the branded no-photo fallback tile (e.g. "Iced Latte" -> "IL").
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl glass-surface shadow-resting">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="p-2.5">
                <Skeleton className="mb-1.5 h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
          {products?.map((product) => {
            const name = localizedName(product, language);
            const lowStock = product.stock > 0 && product.stock <= 5;
            return (
              <button
                key={product.id}
                onClick={() => handleTileClick(product)}
                disabled={product.stock <= 0}
                className="group flex flex-col overflow-hidden rounded-2xl glass-surface text-start shadow-resting transition-[box-shadow,transform] duration-200 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:shadow-raised disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-resting"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-sage/8">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-standard)] group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2f4632] to-[#54764e]">
                      <span className="font-serif text-2xl italic text-[#e2c98a]">{initialsOf(name)}</span>
                    </div>
                  )}
                  <span
                    className={`absolute end-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${
                      lowStock ? "bg-amber-500/90 text-white" : "bg-forest-deep/70 text-white"
                    }`}
                  >
                    {t("pos.stock", { count: product.stock })}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-2.5">
                  <p className="line-clamp-1 text-sm font-medium text-ink">{name}</p>
                  <p className="text-[11px] text-ink/50">{product.sku}</p>
                  <p className="mt-auto pt-1.5 text-sm font-bold text-gold">
                    {product.variants.length > 0
                      ? t("pos.fromPrice", {
                          price: formatCurrency(Math.min(...product.variants.map((v) => Number(v.price)))),
                        })
                      : formatCurrency(Number(product.price))}
                  </p>
                </div>
              </button>
            );
          })}
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
