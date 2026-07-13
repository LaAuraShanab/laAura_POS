import { useState } from "react";
import { Pencil, UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useUsersQuery, useDeactivateUser } from "../../hooks/useUsers";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { UserFormModal } from "./UserFormModal";
import type { AdminUser } from "../../types/user";
import { ApiError } from "../../types/api";

const ROLE_LABEL_KEY: Record<AdminUser["role"], string> = {
  ADMIN: "users.roleAdmin",
  MANAGER: "users.roleManager",
  CASHIER: "users.roleCashier",
  REPORTER: "users.roleReporter",
};

export function UsersListPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsersQuery();
  const deactivateUser = useDeactivateUser();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState<AdminUser | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  function openCreate() {
    setEditingUser(null);
    setShowForm(true);
  }

  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setShowForm(true);
  }

  async function confirmDeactivate() {
    if (!pendingDeactivate) return;
    setIsDeactivating(true);
    setDeactivateError(null);
    try {
      await deactivateUser.mutateAsync(pendingDeactivate.id);
      toast.success(t("toast.userDeactivated"));
      setPendingDeactivate(null);
    } catch (err) {
      setDeactivateError(err instanceof ApiError ? err.message : t("users.couldNotDeactivate"));
    } finally {
      setIsDeactivating(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-medium text-ink">{t("users.title")}</h1>
          <p className="mt-1 text-sm text-ink/60">{t("users.subtitle")}</p>
        </div>
        <Button onClick={openCreate}>{t("users.newUser")}</Button>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-3xl glass-surface shadow-resting">
          <div className="bg-sage/6 px-4 py-3">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="divide-y divide-ink/10">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-4 py-2.5">
                <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="ml-auto h-3 w-16" />
                <Skeleton className="h-3 w-16" />
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
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("common.email")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("users.colRole")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("common.status")}</TableHead>
                <TableHead className="px-4 py-2.5 text-end font-medium text-ink/55">
                  {t("products.colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!users || users.length === 0) && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="px-4 py-8 text-center text-ink/40">
                    {t("users.noUsersYet")}
                  </TableCell>
                </TableRow>
              )}
              {users?.map((user) => (
                <TableRow key={user.id} className="border-ink/10 hover:bg-sage/6">
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft/40 text-[10px] font-medium text-gold">
                        {user.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="font-medium text-ink">{user.name}</span>
                      {user.id === currentUser?.id && (
                        <span className="rounded-full bg-forest/15 px-2 py-0.5 text-[10px] font-medium text-forest">
                          {t("users.youBadge")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-ink/70">{user.email}</TableCell>
                  <TableCell className="px-4 py-2.5 text-ink/70">{t(ROLE_LABEL_KEY[user.role])}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.status === "ACTIVE" ? "bg-forest/15 text-forest" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {user.status === "ACTIVE" ? t("users.statusActive") : t("users.statusInactive")}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded-full p-1.5 text-ink/50 hover:bg-sage/10 hover:text-ink"
                        aria-label={t("products.editName", { name: user.name })}
                        title={t("common.edit")}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {user.id !== currentUser?.id && user.status === "ACTIVE" && (
                        <button
                          onClick={() => {
                            setDeactivateError(null);
                            setPendingDeactivate(user);
                          }}
                          className="rounded-full p-1.5 text-ink/50 hover:bg-destructive/10 hover:text-destructive"
                          aria-label={t("users.deactivateName", { name: user.name })}
                          title={t("users.deactivateTitle")}
                        >
                          <UserX className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && <UserFormModal user={editingUser} onClose={() => setShowForm(false)} />}

      {pendingDeactivate && (
        <ConfirmDialog
          title={t("users.deactivateUserTitle")}
          message={deactivateError ?? t("users.deactivateUserConfirm", { name: pendingDeactivate.name })}
          confirmLabel={t("users.deactivateBtn")}
          isLoading={isDeactivating}
          onConfirm={confirmDeactivate}
          onCancel={() => setPendingDeactivate(null)}
        />
      )}
    </div>
  );
}
