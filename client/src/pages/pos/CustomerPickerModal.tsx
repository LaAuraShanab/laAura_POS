import { useState } from "react";
import { Search, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { useCustomersQuery } from "../../hooks/useCustomers";
import type { Customer } from "../../types/customer";

interface CustomerPickerModalProps {
  onSelect: (customer: Customer | null) => void;
  onClose: () => void;
}

export function CustomerPickerModal({ onSelect, onClose }: CustomerPickerModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useCustomersQuery({ search: search || undefined });

  return (
    <Modal title={t("pos.chooseCustomer")} onClose={onClose}>
      <div className="space-y-3">
        <Input
          icon={Search}
          placeholder={t("pos.searchByNameOrPhone")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className="max-h-80 space-y-1 overflow-y-auto">
          <button
            onClick={() => onSelect(null)}
            className="flex w-full items-center gap-2.5 rounded-xl bg-sage/8 px-4 py-3 text-start transition-colors hover:bg-sage/15"
          >
            <UserCircle className="h-4 w-4 text-forest" aria-hidden="true" />
            <span className="text-sm font-medium text-ink">{t("pos.walkInCustomer")}</span>
          </button>

          {isLoading && <p className="px-2 py-4 text-center text-sm text-ink/40">{t("pos.loadingCustomers")}</p>}

          {!isLoading && customers?.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-ink/40">{t("pos.noCustomersFound")}</p>
          )}

          {customers?.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-start transition-colors hover:bg-sage/8"
            >
              <span className="text-sm font-medium text-ink">{customer.name}</span>
              <span className="text-xs text-ink/50">{customer.phone}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
