import { useEffect, useState } from "react";
import { Eye, Receipt, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSalesQuery } from "../../hooks/useSales";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { PaymentMethodBadge, PAYMENT_METHOD_META } from "./paymentMethodMeta";
import { StatusBadge } from "./saleStatusMeta";
import { formatCurrency, formatDateTime } from "../../lib/format";
import { useLanguage } from "../../context/LanguageContext";
import { localizedName } from "../../lib/localize";
import type { PaymentMethod, Sale, SaleStatus } from "../../types/sale";

const STATUS_LABEL_KEY: Record<SaleStatus, string> = {
  COMPLETED: "transactions.statusCompleted",
  VOIDED: "transactions.statusVoided",
  REFUNDED: "transactions.statusRefunded",
};

const PAGE_SIZE = 10;

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TransactionsListPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  function itemsSummary(sale: Sale) {
    const [first, ...rest] = sale.items;
    if (!first) return "—";
    const productName = localizedName(first.product, language);
    const variantName = first.variant ? localizedName(first.variant, language) : first.variantName;
    const label = variantName ? `${productName} (${variantName})` : productName;
    return rest.length > 0 ? `${label} ${t("transactions.moreItems", { count: rest.length })}` : label;
  }

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">("all");
  const [status, setStatus] = useState<SaleStatus | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useSalesQuery({
    search: search || undefined,
    paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
    status: status === "all" ? undefined : status,
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const sales = data?.sales ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-3xl font-heading font-medium text-ink">{t("transactions.title")}</h1>
        <p className="mt-1 text-sm text-ink/60">{t("transactions.subtitle")}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Input
          icon={Search}
          placeholder={t("transactions.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={paymentMethod}
          onValueChange={(value) => {
            setPaymentMethod(value as PaymentMethod | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("transactions.allPayments")}</SelectItem>
            {(Object.keys(PAYMENT_METHOD_META) as PaymentMethod[]).map((method) => (
              <SelectItem key={method} value={method}>
                {t(PAYMENT_METHOD_META[method].labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as SaleStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("transactions.allStatuses")}</SelectItem>
            {(Object.keys(STATUS_LABEL_KEY) as SaleStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {t(STATUS_LABEL_KEY[s])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label={t("transactions.fromDate")}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="w-[9.5rem]"
          />
          <span className="text-xs text-ink/40">{t("transactions.toConnector")}</span>
          <Input
            type="date"
            aria-label={t("transactions.toDate")}
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="w-[9.5rem]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-3xl glass-surface shadow-resting">
          <div className="bg-sage/6 px-4 py-3">
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="divide-y divide-ink/10">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="ml-auto h-3 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <p className="rounded-2xl glass-surface p-4 text-sm text-destructive shadow-resting">
          {t("transactions.loadError")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-3xl glass-surface shadow-resting">
          <Table className="text-sm">
            <TableHeader className="bg-sage/6 [&_tr]:border-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("transactions.colReference")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("common.date")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("transactions.colSeller")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("transactions.colCustomer")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("transactions.colItems")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("transactions.colPayment")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("common.status")}</TableHead>
                <TableHead className="px-4 py-2.5 text-end font-medium text-ink/55">{t("common.total")}</TableHead>
                <TableHead className="px-4 py-2.5 text-end font-medium text-ink/55">
                  <span className="sr-only">{t("transactions.actionsSr")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="px-4 py-10 text-center text-ink/40">
                    <Receipt className="mx-auto mb-2 h-8 w-8 text-ink/20" aria-hidden="true" />
                    {t("transactions.noMatch")}
                  </TableCell>
                </TableRow>
              )}
              {sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer border-ink/10 hover:bg-sage/6"
                  onClick={() => setSelectedSale(sale)}
                >
                  <TableCell className="px-4 py-2.5 font-medium text-ink">{sale.reference}</TableCell>
                  <TableCell className="px-4 py-2.5 text-ink/70">{formatDateTime(sale.date)}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft/40 text-[9px] font-medium text-gold">
                        {initialsOf(sale.cashier.name)}
                      </div>
                      <span className="text-ink/85">{sale.cashier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-ink/70">
                    {sale.customer?.name ?? t("transactions.walkIn")}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate px-4 py-2.5 text-ink/70">
                    {itemsSummary(sale)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <PaymentMethodBadge method={sale.paymentMethod} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusBadge status={sale.status} />
                  </TableCell>
                  <TableCell
                    className={`px-4 py-2.5 text-end tabular-nums ${
                      sale.status === "COMPLETED" ? "text-ink" : "text-ink/40 line-through decoration-ink/30"
                    }`}
                  >
                    {formatCurrency(Number(sale.grandTotal))}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSale(sale);
                      }}
                      className="rounded-full p-1.5 text-ink/50 hover:bg-sage/10 hover:text-ink"
                      aria-label={t("transactions.viewTransaction", { reference: sale.reference })}
                      title={t("common.viewDetails")}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {total > 0 && (
            <div className="flex items-center justify-between bg-sage/5 px-4 py-3 text-xs text-ink/55">
              <span>
                {t("transactions.showingRange", {
                  start: (page - 1) * PAGE_SIZE + 1,
                  end: Math.min(page * PAGE_SIZE, total),
                  total,
                })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-full px-2 py-1 hover:bg-sage/10 disabled:opacity-30"
                >
                  {t("common.previous")}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-6 w-6 rounded-full ${
                      n === page ? "bg-gold text-forest-deep" : "hover:bg-sage/10"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-full px-2 py-1 hover:bg-sage/10 disabled:opacity-30"
                >
                  {t("common.next")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedSale && <TransactionDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}
    </div>
  );
}
