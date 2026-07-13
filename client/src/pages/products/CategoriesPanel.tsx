import { useState } from "react";
import { Pencil, Trash2, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCategoriesQuery, useDeleteCategory } from "../../hooks/useCategories";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { CategoryFormModal } from "./CategoryFormModal";
import { CategoryDetailModal } from "./CategoryDetailModal";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { Category } from "../../types/category";
import { ApiError } from "../../types/api";

export function CategoriesPanel() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { data: categories, isLoading } = useCategoriesQuery();
  const deleteCategory = useDeleteCategory();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setEditingCategory(null);
    setShowForm(true);
  }

  function openEdit(category: Category) {
    setViewingCategory(null);
    setEditingCategory(category);
    setShowForm(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory.mutateAsync(pendingDelete.id);
      toast.success(t("toast.categoryDeleted"));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : t("products.couldNotDeleteCategory")
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-ink/60">{t("products.organizeCategories")}</p>
        <Button onClick={openCreate}>{t("products.newCategory")}</Button>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-3xl glass-surface shadow-resting">
          <div className="bg-sage/6 px-4 py-3">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="divide-y divide-ink/10">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-4 py-2.5">
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl glass-surface shadow-resting">
          <Table className="text-sm">
            <TableHeader className="bg-sage/6 [&_tr]:border-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("products.colName")}</TableHead>
                <TableHead className="px-4 py-2.5 text-end font-medium text-ink/55">
                  {t("products.colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!categories || categories.length === 0) && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={2} className="px-4 py-8 text-center text-ink/40">
                    {t("products.noCategoriesYet")}
                  </TableCell>
                </TableRow>
              )}
              {categories?.map((category) => (
                <TableRow
                  key={category.id}
                  onClick={() => setViewingCategory(category)}
                  className="cursor-pointer border-ink/10 hover:bg-sage/6"
                >
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft/40">
                        <Tag className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                      </div>
                      <span className="font-medium text-ink">{localizedName(category, language)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(category)}
                        className="rounded-full p-1.5 text-ink/50 hover:bg-sage/10 hover:text-ink"
                        aria-label={t("products.editName", { name: localizedName(category, language) })}
                        title={t("common.edit")}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDelete(category);
                        }}
                        className="rounded-full p-1.5 text-ink/50 hover:bg-destructive/10 hover:text-destructive"
                        aria-label={t("products.deleteName", { name: localizedName(category, language) })}
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
        </div>
      )}

      {viewingCategory && (
        <CategoryDetailModal
          category={viewingCategory}
          onClose={() => setViewingCategory(null)}
          onEdit={() => openEdit(viewingCategory)}
        />
      )}

      {showForm && <CategoryFormModal category={editingCategory} onClose={() => setShowForm(false)} />}

      {pendingDelete && (
        <ConfirmDialog
          title={t("products.deleteCategoryTitle")}
          message={deleteError ?? t("products.removeCategoryConfirm", { name: localizedName(pendingDelete, language) })}
          confirmLabel={t("common.delete")}
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
