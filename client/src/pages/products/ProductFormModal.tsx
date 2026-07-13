import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { ImageIcon, Tag, Hash, Barcode, DollarSign, Package, Layers, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/Button";
import { useCategoriesQuery } from "../../hooks/useCategories";
import { useCreateProduct, useUpdateProduct, useUploadProductImage } from "../../hooks/useProducts";
import type { Product, ProductInput } from "../../types/product";
import { ApiError } from "../../types/api";

interface ProductFormModalProps {
  product: Product | null;
  onClose: () => void;
}

interface VariantFormValue {
  id?: string;
  name: string;
  nameAr: string;
  price: string;
}

interface ExtraFormValue {
  id?: string;
  name: string;
  nameAr: string;
  price: string;
}

interface FormValues {
  sku: string;
  barcode: string;
  name: string;
  nameAr: string;
  price: string;
  categoryId: string;
  stock: string;
  variants: VariantFormValue[];
  extras: ExtraFormValue[];
}

export function ProductFormModal({ product, onClose }: ProductFormModalProps) {
  const { t } = useTranslation();
  const { data: categories } = useCategoriesQuery();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadImage = useUploadProductImage();
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image ?? null);

  useEffect(() => {
    if (!imageFile) return;
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      name: product?.name ?? "",
      nameAr: product?.nameAr ?? "",
      price: product?.price ?? "",
      categoryId: product?.categoryId ?? "",
      stock: product ? String(product.stock) : "0",
      variants: product?.variants.map((v) => ({ id: v.id, name: v.name, nameAr: v.nameAr ?? "", price: v.price })) ?? [],
      extras: product?.extras.map((e) => ({ id: e.id, name: e.name, nameAr: e.nameAr ?? "", price: e.price })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({
    control,
    name: "extras",
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const variants = values.variants
      .filter((v) => v.name.trim() !== "")
      .map((v) => ({ id: v.id, name: v.name.trim(), nameAr: v.nameAr.trim() || undefined, price: Number(v.price) || 0 }));

    const extras = values.extras
      .filter((e) => e.name.trim() !== "")
      .map((e) => ({ id: e.id, name: e.name.trim(), nameAr: e.nameAr.trim() || undefined, price: Number(e.price) || 0 }));

    const input: ProductInput = {
      sku: values.sku.trim(),
      barcode: values.barcode.trim() || undefined,
      name: values.name.trim(),
      nameAr: values.nameAr.trim() || undefined,
      price: Number(values.price),
      categoryId: values.categoryId || undefined,
      stock: Number(values.stock),
      variants,
      extras,
    };

    try {
      const saved = product
        ? await updateProduct.mutateAsync({ id: product.id, input })
        : await createProduct.mutateAsync(input);

      if (imageFile) {
        await uploadImage.mutateAsync({ id: saved.id, file: imageFile });
      }

      toast.success(t(product ? "toast.productUpdated" : "toast.productCreated"));
      onClose();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("products.couldNotSaveProduct"));
    }
  }

  return (
    <Modal title={product ? t("products.editProduct") : t("products.newProductTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] sm:gap-6">
          <div>
            <h3 className="text-sm font-medium text-ink">{t("products.aboutProduct")}</h3>
            <p className="mt-1 text-xs text-ink/55">{t("products.aboutProductDesc")}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sage/10">
                {previewUrl ? (
                  <img src={previewUrl} alt={t("products.productPreview")} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-ink/30" aria-hidden="true" />
                )}
              </div>
              <label className="flex-1 cursor-pointer rounded-md border border-dashed border-ink/20 px-3 py-2.5 text-xs text-ink/55 hover:border-forest/40">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                {imageFile ? imageFile.name : t("products.uploadPhoto")}
              </label>
            </div>

            <Input
              icon={Tag}
              placeholder={t("products.namePlaceholder")}
              error={errors.name?.message}
              {...register("name", { required: t("products.nameRequired") })}
            />

            <Input
              icon={Tag}
              placeholder={t("products.nameArPlaceholder")}
              dir="rtl"
              {...register("nameAr")}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                icon={Hash}
                placeholder={t("products.skuPlaceholder")}
                error={errors.sku?.message}
                {...register("sku", { required: t("products.skuRequired") })}
              />
              <Input icon={Barcode} placeholder={t("products.barcodePlaceholder")} {...register("barcode")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                icon={DollarSign}
                type="number"
                step="0.01"
                placeholder={t("products.pricePlaceholder")}
                error={errors.price?.message}
                {...register("price", {
                  required: t("products.priceRequired"),
                  min: { value: 0, message: t("products.pricePositive") },
                })}
              />
              <Input
                icon={Package}
                type="number"
                placeholder={t("products.stockPlaceholder")}
                error={errors.stock?.message}
                {...register("stock", {
                  required: t("products.stockRequired"),
                  min: { value: 0, message: t("products.stockPositive") },
                })}
              />
            </div>

            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                >
                  <SelectTrigger className="w-full">
                    <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
                    <SelectValue placeholder={t("products.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("products.noCategory")}</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-ink/10 pt-5 sm:grid-cols-[180px_1fr] sm:gap-6">
          <div>
            <h3 className="text-sm font-medium text-ink">{t("products.sizesTitle")}</h3>
            <p className="mt-1 text-xs text-ink/55">{t("products.sizesDesc")}</p>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  placeholder={t("products.sizeNamePlaceholder")}
                  className="flex-1"
                  {...register(`variants.${index}.name` as const)}
                />
                <Input
                  placeholder={t("products.sizeNameArPlaceholder")}
                  className="flex-1"
                  dir="rtl"
                  {...register(`variants.${index}.nameAr` as const)}
                />
                <Input
                  icon={DollarSign}
                  type="number"
                  step="0.01"
                  placeholder={t("products.pricePlaceholder")}
                  className="w-32"
                  {...register(`variants.${index}.price` as const, { min: 0 })}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="flex-shrink-0 rounded-full p-1.5 text-ink/50 hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t("products.removeSize", { index: index + 1 })}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ name: "", nameAr: "", price: "" })}
            >
              <Plus className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t("products.addSize")}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-ink/10 pt-5 sm:grid-cols-[180px_1fr] sm:gap-6">
          <div>
            <h3 className="text-sm font-medium text-ink">{t("products.extrasTitle")}</h3>
            <p className="mt-1 text-xs text-ink/55">{t("products.extrasDesc")}</p>
          </div>

          <div className="space-y-2">
            {extraFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  placeholder={t("products.extraNamePlaceholder")}
                  className="flex-1"
                  {...register(`extras.${index}.name` as const)}
                />
                <Input
                  placeholder={t("products.extraNameArPlaceholder")}
                  className="flex-1"
                  dir="rtl"
                  {...register(`extras.${index}.nameAr` as const)}
                />
                <Input
                  icon={DollarSign}
                  type="number"
                  step="0.01"
                  placeholder={t("products.pricePlaceholder")}
                  className="w-32"
                  {...register(`extras.${index}.price` as const, { min: 0 })}
                />
                <button
                  type="button"
                  onClick={() => removeExtra(index)}
                  className="flex-shrink-0 rounded-full p-1.5 text-ink/50 hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t("products.removeExtra", { index: index + 1 })}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendExtra({ name: "", nameAr: "", price: "" })}
            >
              <Plus className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t("products.addExtra")}
            </Button>
          </div>
        </div>

        {serverError && <p className="mt-4 text-sm text-destructive">{serverError}</p>}

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
