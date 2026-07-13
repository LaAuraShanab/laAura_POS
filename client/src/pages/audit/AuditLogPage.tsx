import { useEffect, useState } from "react";
import { ScrollText, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuditLogsQuery } from "../../hooks/useAuditLogs";
import { useUsersQuery } from "../../hooks/useUsers";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { ActionBadge, ACTION_META, metadataSummary } from "./auditActionMeta";
import { formatDateTime } from "../../lib/format";

const PAGE_SIZE = 20;

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AuditLogPage() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [userId, setUserId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data: users } = useUsersQuery();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useAuditLogsQuery({
    search: search || undefined,
    action: action === "all" ? undefined : action,
    userId: userId === "all" ? undefined : userId,
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-3xl font-heading font-medium text-ink">{t("audit.title")}</h1>
        <p className="mt-1 text-sm text-ink/60">{t("audit.subtitle")}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Input
          icon={Search}
          placeholder={t("audit.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("audit.allActions")}</SelectItem>
            {Object.keys(ACTION_META).map((key) => (
              <SelectItem key={key} value={key}>
                {t(ACTION_META[key].labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={userId}
          onValueChange={(value) => {
            setUserId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("audit.allUsers")}</SelectItem>
            {users?.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
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
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="ml-auto h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <p className="rounded-2xl glass-surface p-4 text-sm text-destructive shadow-resting">
          {t("audit.loadError")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-3xl glass-surface shadow-resting">
          <Table className="text-sm">
            <TableHeader className="bg-sage/6 [&_tr]:border-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("common.date")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("audit.colActor")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("audit.colAction")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("audit.colDetails")}</TableHead>
                <TableHead className="px-4 py-2.5 font-medium text-ink/55">{t("audit.colIp")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="px-4 py-10 text-center text-ink/40">
                    <ScrollText className="mx-auto mb-2 h-8 w-8 text-ink/20" aria-hidden="true" />
                    {t("audit.noMatch")}
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id} className="border-ink/10 hover:bg-sage/6">
                  <TableCell className="px-4 py-2.5 whitespace-nowrap text-ink/70">
                    {formatDateTime(log.date)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft/40 text-[9px] font-medium text-gold">
                          {initialsOf(log.user.name)}
                        </div>
                        <span className="text-ink/85">{log.user.name}</span>
                      </div>
                    ) : (
                      <span className="text-ink/40">{t("common.unknown")}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="max-w-[20rem] truncate px-4 py-2.5 text-ink/70">
                    {metadataSummary(log)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-ink/50">{log.ipAddress ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {total > 0 && (
            <div className="flex items-center justify-between bg-sage/5 px-4 py-3 text-xs text-ink/55">
              <span>
                {t("audit.showingRange", {
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
    </div>
  );
}
