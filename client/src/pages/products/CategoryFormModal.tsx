import { useForm } from "react-hook-form";
import { useState } from "react";
import { Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useCreateCategory, useUpdateCategory } from "../../hooks/useCategories";
import type { Category } from "../../types/category";
import { ApiError } from "../../types/api";

interface CategoryFormModalProps {
  category: Category | null;
  onClose: () => void;
}

interface FormValues {
  name: string;
  nameAr: string;
}

export function CategoryFormModal({ category, onClose }: CategoryFormModalProps) {
  const { t } = useTranslation();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { name: category?.name ?? "", nameAr: category?.nameAr ?? "" } });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const input = { name: values.name.trim(), nameAr: values.nameAr.trim() || undefined };
      if (category) {
        await updateCategory.mutateAsync({ id: category.id, input });
      } else {
        await createCategory.mutateAsync(input);
      }
      toast.success(t(category ? "toast.categoryUpdated" : "toast.categoryCreated"));
      onClose();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("products.couldNotSaveCategory"));
    }
  }

  return (
    <Modal title={category ? t("products.editCategory") : t("products.newCategoryTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          icon={Tag}
          placeholder={t("products.categoryNamePlaceholder")}
          error={errors.name?.message}
          {...register("name", { required: t("products.nameRequired") })}
        />

        <div className="mt-3">
          <Input
            icon={Tag}
            placeholder={t("products.categoryNameArPlaceholder")}
            dir="rtl"
            {...register("nameAr")}
          />
        </div>

        {serverError && <p className="mt-3 text-sm text-destructive">{serverError}</p>}

        <div className="-mx-6 -mb-5 mt-5 flex justify-end gap-2 border-t border-ink/10 px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
