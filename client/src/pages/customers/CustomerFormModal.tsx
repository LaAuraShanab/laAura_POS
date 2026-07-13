import { useForm } from "react-hook-form";
import { useState } from "react";
import { User, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useCreateCustomer, useUpdateCustomer } from "../../hooks/useCustomers";
import type { Customer, CustomerInput } from "../../types/customer";
import { ApiError } from "../../types/api";

interface CustomerFormModalProps {
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerFormModal({ customer, onClose }: CustomerFormModalProps) {
  const { t } = useTranslation();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
    },
  });

  async function onSubmit(values: CustomerInput) {
    setServerError(null);
    const input: CustomerInput = {
      name: values.name.trim(),
      phone: values.phone.trim(),
    };

    try {
      if (customer) {
        await updateCustomer.mutateAsync({ id: customer.id, input });
      } else {
        await createCustomer.mutateAsync(input);
      }
      toast.success(t(customer ? "toast.customerUpdated" : "toast.customerCreated"));
      onClose();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("customers.couldNotSave"));
    }
  }

  return (
    <Modal title={customer ? t("customers.editCustomerModal") : t("customers.newCustomerModal")} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-3">
          <Input
            icon={User}
            placeholder={t("customers.fullNamePlaceholder")}
            error={errors.name?.message}
            {...register("name", { required: t("products.nameRequired") })}
          />

          <Input
            icon={Phone}
            type="tel"
            placeholder={t("customers.phoneNumberPlaceholder")}
            error={errors.phone?.message}
            {...register("phone", { required: t("customers.phoneRequired") })}
          />
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
