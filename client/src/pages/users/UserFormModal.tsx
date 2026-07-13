import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { User, Mail, Lock, ShieldCheck, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/Button";
import { useCreateUser, useUpdateUser } from "../../hooks/useUsers";
import type { AdminUser, Role, UserInput, UserStatus } from "../../types/user";
import { ApiError } from "../../types/api";

interface UserFormModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

interface FormValues {
  name: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
}

const ROLE_OPTIONS: { value: Role; labelKey: string }[] = [
  { value: "ADMIN", labelKey: "users.roleAdmin" },
  { value: "MANAGER", labelKey: "users.roleManager" },
  { value: "CASHIER", labelKey: "users.roleCashier" },
  { value: "REPORTER", labelKey: "users.roleReporter" },
];

export function UserFormModal({ user, onClose }: UserFormModalProps) {
  const { t } = useTranslation();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "CASHIER",
      status: user?.status ?? "ACTIVE",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const input: UserInput = {
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
      ...(user ? { status: values.status } : {}),
      ...(values.password ? { password: values.password } : {}),
    };

    try {
      if (user) {
        await updateUser.mutateAsync({ id: user.id, input });
      } else {
        await createUser.mutateAsync(input);
      }
      toast.success(t(user ? "toast.userUpdated" : "toast.userCreated"));
      onClose();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("users.couldNotSaveUser"));
    }
  }

  return (
    <Modal title={user ? t("users.editUserModal") : t("users.newUserModal")} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-3">
          <Input
            icon={User}
            placeholder={t("customers.fullNamePlaceholder")}
            error={errors.name?.message}
            {...register("name", { required: t("products.nameRequired") })}
          />

          <Input
            icon={Mail}
            type="email"
            placeholder={t("login.email")}
            error={errors.email?.message}
            {...register("email", { required: t("login.emailRequired") })}
          />

          <Input
            icon={Lock}
            type="password"
            placeholder={user ? t("users.newPasswordPlaceholder") : t("users.passwordPlaceholder")}
            error={errors.password?.message}
            {...register("password", {
              required: user ? false : t("login.passwordRequired"),
              minLength: { value: 8, message: t("users.passwordMinLength") },
            })}
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder={t("users.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {user && (
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
                    <SelectValue placeholder={t("users.statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t("users.statusActive")}</SelectItem>
                    <SelectItem value="INACTIVE">{t("users.statusInactive")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          )}
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
