import { useMemo, useState } from "react";
import { Pencil, Trash2, ChevronsUpDown, ChevronUp, ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useProductsQuery, useDeleteProduct } from "../../hooks/useProducts";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { StockBadge } from "../../components/ui/StockBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { Checkbox } from "../../components/ui/checkbox";
import { ProductFormModal } from "./ProductFormModal";
import { ProductDetailModal } from "./ProductDetailModal";
import { CategoriesPanel } from "./CategoriesPanel";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { Product } from "../../types/product";

type Tab = "products" | "categories";

type SortKey = "name" | "sku" | "price" | "stock";
type SortDir = "asc" | "desc";
type PendingDelete = { type: "single"; id: string } | { type: "bulk" };

const PAGE_SIZE = 8;

export function ProductsListPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [tab, setTab] = useState<Tab>("products");
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useProductsQuery({ search: search || undefined });
  const deleteProduct = useDeleteProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sorted = useMemo(() => {
    if (!products) return [];
    const copy = [...products];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "sku") cmp = a.sku.localeCompare(b.sku);
      else if (sortKey === "price") cmp = Number(a.price) - Number(b.price);
      else if (sortKey === "stock") cmp = a.stock - b.stock;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [products, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginated = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ChevronsUpDown className="h-3.5 w-3.5 text-ink/30" aria-hidden="true" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
    );
  }

  function toggleSelectAll() {
    if (selectedIds.size > 0 && paginated.every((p) => selectedIds.has(p.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((p) => p.id)));
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setViewingProduct(null);
    setEditingProduct(product);
    setShowForm(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      if (pendingDelete.type === "single") {
        await deleteProduct.mutateAsync(pendingDelete.id);
        toast.success(t("toast.productDeleted"));
      } else {
        const count = selectedIds.size;
        await Promise.all(Array.from(selectedIds).map((id) => deleteProduct.mutateAsync(id)));
        setSelectedIds(new Set());
        toast.success(t("toast.productsDeleted", { count }));
      }
      setPendingDelete(null);
    } catch {
      toast.error(t("toast.productDeleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }

  const headerCheckboxChecked = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-3xl font-heading font-medium text-ink">{t("products.catalog")}</h1>
        {tab === "products" && <Button onClick={openCreate}>{t("products.newProduct")}</Button>}
      </div>

      <div className="mb-5 flex gap-1 rounded-full bg-sage/8 p-1" style={{ width: "fit-content" }}>
        <button
          onClick={() => setTab("products")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            tab === "products" ? "bg-gold text-forest-deep" : "text-ink/60 hover:text-ink"
          }`}
        >
          {t("products.productsTab")}
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            tab === "categories" ? "bg-gold text-forest-deep" : "text-ink/60 hover:text-ink"
          }`}
        >
          {t("products.categoriesTab")}
        </button>
      </div>

      {tab === "categories" ? (
        <CategoriesPanel />
      ) : (
        <>
          <Input
            placeholder={t("products.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="mb-4 max-w-sm"
          />

          {selectedIds.size > 0 && (
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-gold-soft/20 px-4 py-2.5 shadow-resting">
              <span className="text-sm font-medium text-ink">
                {t("products.selectedCount", { count: selectedIds.size })}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="danger" onClick={() => setPendingDelete({ type: "bulk" })}>
                  <Trash2 className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  {t("common.delete")}
                </Button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-full p-1.5 text-ink/50 hover:bg-sage/10 hover:text-ink"
                  aria-label={t("products.clearSelection")}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="overflow-hidden rounded-3xl glass-surface shadow-resting">
              <div className="bg-sage/6 px-4 py-3">
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="divide-y divide-ink/10">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-4 py-2.5">
                    <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="ml-auto h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl glass-surface shadow-resting">
              <Table className="text-sm">
                <TableHeader className="bg-sage/6 [&_tr]:border-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 px-4 py-2.5">
                      <Checkbox
                        checked={headerCheckboxChecked}
                        onCheckedChange={toggleSelectAll}
                        aria-label={t("products.selectAllOnPage")}
                      />
                    </TableHead>
                    <TableHead className="px-4 py-2.5 font-medium text-ink/55">
                      <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                        {t("products.colName")} <SortIcon column="name" />
                      </button>
                    </TableHead>
                    <TableHead className="px-4 py-2.5 font-medium text-ink/55">
                      <button className="flex items-center gap-1" onClick={() => toggleSort("sku")}>
                        {t("products.colSku")} <SortIcon column="sku" />
                      </button>
                    </TableHead>
                    <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("products.colCategory")}</TableHead>
                    <TableHead className="px-4 py-2.5 text-end font-medium text-ink/55">
                      <button className="ms-auto flex items-center gap-1" onClick={() => toggleSort("price")}>
                        {t("products.colPrice")} <SortIcon column="price" />
                      </button>
                    </TableHead>
                    <TableHead className="px-4 py-2.5 font-medium text-ink/55">
                      <button className="flex items-center gap-1" onClick={() => toggleSort("stock")}>
                        {t("products.colStock")} <SortIcon column="stock" />
                      </button>
                    </TableHead>
                    <TableHead className="px-4 py-2.5 text-end font-medium text-ink/55">
                      {t("products.colActions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="px-4 py-8 text-center text-ink/40">
                        {t("products.noProductsFound")}
                      </TableCell>
                    </TableRow>
                  )}
                  {paginated.map((product) => (
                    <TableRow
                      key={product.id}
                      onClick={() => setViewingProduct(product)}
                      className={`cursor-pointer border-ink/10 hover:bg-sage/6 ${selectedIds.has(product.id) ? "bg-forest/10" : ""}`}
                    >
                      <TableCell className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(product.id)}
                          onCheckedChange={() => toggleSelectRow(product.id)}
                          aria-label={t("products.select", { name: localizedName(product, language) })}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-sage/10">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={localizedName(product, language)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-forest">
                                {product.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-ink">{localizedName(product, language)}</span>
                            {product.variants.length > 0 && (
                              <span className="ms-1.5 text-[10px] text-ink/45">
                                {t("products.sizesCount", { count: product.variants.length })}
                              </span>
                            )}
                            {product.extras.length > 0 && (
                              <span className="ms-1.5 text-[10px] text-ink/45">
                                {t("products.extrasCount", { count: product.extras.length })}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-ink/70">{product.sku}</TableCell>
                      <TableCell className="px-4 py-2.5 text-ink/70">
                        {product.category ? localizedName(product.category, language) : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-end text-ink">
                        {product.variants.length > 0
                          ? t("pos.fromPrice", { price: `$${Math.min(...product.variants.map((v) => Number(v.price))).toFixed(2)}` })
                          : `$${Number(product.price).toFixed(2)}`}
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <StockBadge stock={product.stock} />
                      </TableCell>
                      <TableCell className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(product)}
                            className="rounded-full p-1.5 text-ink/50 hover:bg-sage/10 hover:text-ink"
                            aria-label={t("products.editName", { name: localizedName(product, language) })}
                            title={t("common.edit")}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setPendingDelete({ type: "single", id: product.id })}
                            className="rounded-full p-1.5 text-ink/50 hover:bg-destructive/10 hover:text-destructive"
                            aria-label={t("products.deleteName", { name: localizedName(product, language) })}
                            title={t("common.delete")}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {sorted.length > 0 && (
                <div className="flex items-center justify-between bg-sage/5 px-4 py-3 text-xs text-ink/55">
                  <span>
                    {t("products.showingRange", {
                      start: pageStart + 1,
                      end: Math.min(pageStart + PAGE_SIZE, sorted.length),
                      total: sorted.length,
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full px-2 py-1 hover:bg-sage/10 disabled:opacity-30"
                    >
                      {t("common.previous")}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`h-6 w-6 rounded-full ${
                          n === currentPage ? "bg-gold text-forest-deep" : "hover:bg-sage/10"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-full px-2 py-1 hover:bg-sage/10 disabled:opacity-30"
                    >
                      {t("common.next")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewingProduct && (
            <ProductDetailModal
              product={viewingProduct}
              onClose={() => setViewingProduct(null)}
              onEdit={() => openEdit(viewingProduct)}
            />
          )}

          {showForm && <ProductFormModal product={editingProduct} onClose={() => setShowForm(false)} />}

          {pendingDelete && (
            <ConfirmDialog
              title={
                pendingDelete.type === "bulk" ? t("products.deleteSelectedProducts") : t("products.deleteProduct")
              }
              message={
                pendingDelete.type === "bulk"
                  ? t("products.removeBulkConfirm", { count: selectedIds.size })
                  : t("products.removeSingleConfirm")
              }
              confirmLabel={t("common.delete")}
              isLoading={isDeleting}
              onConfirm={confirmDelete}
              onCancel={() => setPendingDelete(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
