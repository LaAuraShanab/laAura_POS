import { Tag, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { formatDateTime } from "../../lib/format";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { Category } from "../../types/category";

interface CategoryDetailModalProps {
  category: Category;
  onClose: () => void;
  onEdit: () => void;
}

export function CategoryDetailModal({ category, onClose, onEdit }: CategoryDetailModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  return (
    <Modal title={t("products.categoryDetails")} onClose={onClose}>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gold-soft/40">
          <Tag className="h-6 w-6 text-gold" aria-hidden="true" />
        </div>
        <p className="font-heading text-xl font-medium text-ink">{localizedName(category, language)}</p>
      </div>

      <p className="mt-5 border-t border-ink/10 pt-4 text-xs text-ink/45">
        {t("products.addedUpdated", {
          added: formatDateTime(category.createdAt),
          updated: formatDateTime(category.updatedAt),
        })}
      </p>

      <div className="-mx-6 -mb-5 mt-5 flex justify-end gap-2 border-t border-ink/10 px-6 py-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("common.close")}
        </Button>
        <Button type="button" onClick={onEdit}>
          <Pencil className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t("products.editCategory")}
        </Button>
      </div>
    </Modal>
  );
}
