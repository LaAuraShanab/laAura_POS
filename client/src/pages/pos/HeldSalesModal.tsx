import { Clock, PauseCircle, Trash2, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import { lineUnitPrice } from "./Cart";
import type { HeldSale } from "../../hooks/useHeldSales";
import type { Language } from "../../i18n";

interface HeldSalesModalProps {
  heldSales: HeldSale[];
  onResume: (id: string) => void;
  onDiscard: (id: string) => void;
  onClose: () => void;
}

function heldSaleTotal(sale: HeldSale): number {
  const subtotal = sale.lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.quantity, 0);
  return Math.max(0, subtotal - sale.discount + sale.tax);
}

function heldSaleSummary(sale: HeldSale, language: Language): string {
  return sale.lines.map((line) => `${localizedName(line.product, language)} ×${line.quantity}`).join(", ");
}

export function HeldSalesModal({ heldSales, onResume, onDiscard, onClose }: HeldSalesModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <Modal title={t("pos.heldSalesTitle")} onClose={onClose}>
      {heldSales.length === 0 ? (
        <div className="py-8 text-center">
          <PauseCircle className="mx-auto mb-2 h-8 w-8 text-ink/20" aria-hidden="true" />
          <p className="text-sm text-ink/40">{t("pos.noHeldSales")}</p>
        </div>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {heldSales.map((sale) => (
            <div key={sale.id} className="rounded-xl bg-sage/8 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    <UserCircle className="h-3.5 w-3.5 flex-shrink-0 text-forest" aria-hidden="true" />
                    <span className="truncate">{sale.customer?.name ?? t("pos.walkInCustomer")}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-ink/55">{heldSaleSummary(sale, language)}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-ink/40">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatDateTime(sale.heldAt)}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  <span className="text-sm font-semibold text-gold">{formatCurrency(heldSaleTotal(sale))}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" onClick={() => onResume(sale.id)}>
                      {t("pos.resumeSale")}
                    </Button>
                    <button
                      onClick={() => onDiscard(sale.id)}
                      className="rounded-full p-1.5 text-ink/50 hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("pos.discardHeldSale")}
                      title={t("pos.discardHeldSale")}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
