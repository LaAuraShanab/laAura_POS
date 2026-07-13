import { useEffect, useState } from "react";
import { Pencil, Search, UserX, Users as UsersIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useCustomersQuery, useDeactivateCustomer } from "../../hooks/useCustomers";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { CustomerFormModal } from "./CustomerFormModal";
import type { Customer } from "../../types/customer";
import { ApiError } from "../../types/api";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CustomersListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useCustomersQuery({ search: search || undefined });
  const deactivateCustomer = useDeactivateCustomer();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState<Customer | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function openCreate() {
    setEditingCustomer(null);
    setShowForm(true);
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setShowForm(true);
  }

  async function confirmDeactivate() {
    if (!pendingDeactivate) return;
    setIsDeactivating(true);
    setDeactivateError(null);
    try {
      await deactivateCustomer.mutateAsync(pendingDeactivate.id);
      toast.success(t("toast.customerRemoved"));
      setPendingDeactivate(null);
    } catch (err) {
      setDeactivateError(err instanceof ApiError ? err.message : t("customers.couldNotRemove"));
    } finally {
      setIsDeactivating(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-medium text-ink">{t("customers.title")}</h1>
          <p className="mt-1 text-sm text-ink/60">
            {canManage ? t("customers.subtitleManage") : t("customers.subtitleCreateOnly")}
          </p>
        </div>
        <Button onClick={openCreate}>{t("customers.newCustomer")}</Button>
      </div>

      <Input
        icon={Search}
        placeholder={t("customers.searchPlaceholder")}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="mb-4 max-w-xs"
      />

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
                <Skeleton className="ml-auto h-3 w-24" />
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
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("common.phone")}</TableHead>
                {canManage && (
                  <TableHead className="px-4 py-2.5 text-end font-medium text-ink/55">
                    {t("products.colActions")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!customers || customers.length === 0) && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={canManage ? 3 : 2} className="px-4 py-10 text-center text-ink/40">
                    <UsersIcon className="mx-auto mb-2 h-8 w-8 text-ink/20" aria-hidden="true" />
                    {t("customers.noCustomersYet")}
                  </TableCell>
                </TableRow>
              )}
              {customers?.map((customer) => (
                <TableRow key={customer.id} className="border-ink/10 hover:bg-sage/6">
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft/40 text-[10px] font-medium text-gold">
                        {initialsOf(customer.name)}
                      </div>
                      <span className="font-medium text-ink">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-ink/70">{customer.phone ?? "—"}</TableCell>
                  {canManage && (
                    <TableCell className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(customer)}
                          className="rounded-full p-1.5 text-ink/50 hover:bg-sage/10 hover:text-ink"
                          aria-label={t("products.editName", { name: customer.name })}
                          title={t("common.edit")}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => {
                            setDeactivateError(null);
                            setPendingDeactivate(customer);
                          }}
                          className="rounded-full p-1.5 text-ink/50 hover:bg-destructive/10 hover:text-destructive"
                          aria-label={t("customers.removeName", { name: customer.name })}
                          title={t("customers.removeTitle")}
                        >
                          <UserX className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && <CustomerFormModal customer={editingCustomer} onClose={() => setShowForm(false)} />}

      {pendingDeactivate && (
        <ConfirmDialog
          title={t("customers.removeCustomerTitle")}
          message={
            deactivateError ?? t("customers.removeCustomerConfirm", { name: pendingDeactivate.name })
          }
          confirmLabel={t("customers.removeBtn")}
          isLoading={isDeactivating}
          onConfirm={confirmDeactivate}
          onCancel={() => setPendingDeactivate(null)}
        />
      )}
    </div>
  );
}
