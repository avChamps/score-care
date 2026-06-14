"use client";

import { Download, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppCard } from "@/components/dashboard/portal-ui";
import { apiRequest, apiUrl } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";

type AdminDataColumn = {
  key: string;
  label: string;
  type?: "date" | "datetime" | "money" | "status";
};

type AdminDataTableProps = {
  title: string;
  description: string;
  endpoint: string;
  columns: AdminDataColumn[];
  emptyMessage: string;
  exportEndpoint?: string;
  exportFileName?: string;
  pageSize?: number;
  serverPagination?: boolean;
};

type AdminRow = Record<string, unknown>;
type AdminPagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export function AdminDataTable({ columns, description, emptyMessage, endpoint, exportEndpoint, exportFileName, pageSize = 20, serverPagination = false, title }: AdminDataTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [pagination, setPagination] = useState<AdminPagination>({ limit: pageSize, page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const loadRows = useCallback(async () => {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const response = await apiRequest(buildEndpoint(endpoint, serverPagination ? { limit: pageSize, page, search } : undefined), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setRows([]);
        setNotice("Live table data is not connected yet.");
        return;
      }

      const result = await response.json();
      setRows(normalizeRows(result));
      setPagination(normalizePagination(result, pageSize));
    } catch {
      setRows([]);
      setNotice("Live table data is not connected yet.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, pageSize, router, search, serverPagination]);

  useEffect(() => {
    void Promise.resolve().then(loadRows);
  }, [loadRows]);

  const visibleRows = useMemo(() => {
    if (serverPagination) {
      return rows;
    }

    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const searchableText = columns.map((column) => formatCell(readValue(row, column.key), column.type)).join(" ").toLowerCase();
      return !query || searchableText.includes(query);
    });
  }, [columns, rows, search, serverPagination]);

  async function exportRows() {
    if (exporting) {
      return;
    }

    if (exportEndpoint) {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      setExporting(true);
      setNotice("");

      try {
        const response = await fetch(apiUrl(exportEndpoint), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          clearScorecareSession();
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to export data");
        }

        downloadBlob(await response.blob(), `${exportFileName ?? title.toLowerCase().replace(/\s+/g, "-")}-${formatExportTimestamp()}.csv`);
      } catch {
        setNotice("Could not export table data.");
      } finally {
        setExporting(false);
      }

      return;
    }

    const csvRows = [
      columns.map((column) => escapeCsvValue(column.label)).join(","),
      ...visibleRows.map((row) => columns.map((column) => escapeCsvValue(formatCell(readValue(row, column.key), column.type))).join(",")),
    ];

    downloadBlob(new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" }), `${title.toLowerCase().replace(/\s+/g, "-")}-${formatExportTimestamp()}.csv`);
  }

  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[var(--portal-orange)]">Admin</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--portal-ink)]">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--portal-muted)]">{description}</p>
        </div>
        {notice ? <p className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{notice}</p> : null}
      </div>

      <AppCard>
        <div className="flex items-center gap-3">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--portal-muted)]" />
            <input
              className="h-11 w-full rounded-xl border border-[var(--portal-border)] bg-white pl-10 pr-3 text-sm font-semibold text-[var(--portal-ink)] outline-none transition focus:border-[var(--portal-blue)]"
              onChange={(event) => {
                setSearch(event.target.value);

                if (serverPagination) {
                  setPage(1);
                }
              }}
              placeholder="Search"
              type="search"
              value={search}
            />
          </label>
          <button
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--portal-blue)] bg-[var(--portal-blue)] px-4 text-xs font-black text-white transition hover:bg-[#045ec0]"
            disabled={exporting}
            onClick={() => void exportRows()}
            type="button"
          >
            <Download className={exporting ? "size-4 animate-pulse" : "size-4"} /> {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </AppCard>

      <AppCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[var(--portal-surface-soft)] text-[12px] font-black uppercase tracking-[0.12em] text-[var(--portal-muted)]">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="whitespace-nowrap border-b border-[var(--portal-border)] px-4 py-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-bold text-[var(--portal-muted)]" colSpan={columns.length}>
                    Loading...
                  </td>
                </tr>
              ) : visibleRows.length ? (
                visibleRows.map((row, index) => (
                  <tr key={String(readValue(row, "id") ?? readValue(row, "_id") ?? index)} className="border-b border-[var(--portal-border)]">
                    {columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap border-b border-[var(--portal-border)] px-4 py-3 text-sm font-semibold text-[var(--portal-ink)]">
                        {column.type === "status" ? <StatusBadge value={formatCell(readValue(row, column.key), column.type)} /> : formatCell(readValue(row, column.key), column.type)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-bold text-[var(--portal-muted)]" colSpan={columns.length}>
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {serverPagination ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-border)] px-4 py-3">
            <p className="text-xs font-bold text-[var(--portal-muted)]">
              Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button
                className="rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 text-xs font-black text-[var(--portal-ink)] transition hover:border-[var(--portal-blue)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading || pagination.page <= 1}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                type="button"
              >
                Prev
              </button>
              <button
                className="rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 text-xs font-black text-[var(--portal-ink)] transition hover:border-[var(--portal-blue)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading || pagination.page >= pagination.totalPages}
                onClick={() => setPage((currentPage) => Math.min(pagination.totalPages, currentPage + 1))}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </AppCard>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const lowerValue = value.toLowerCase();
  const classes = lowerValue.includes("active") || lowerValue.includes("approved") || lowerValue.includes("resolved")
    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
    : lowerValue.includes("reject") || lowerValue.includes("block") || lowerValue.includes("overdue")
      ? "border-rose-100 bg-rose-50 text-rose-700"
      : "border-amber-100 bg-amber-50 text-amber-700";

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${classes}`}>{value || "-"}</span>;
}

function normalizeRows(value: unknown): AdminRow[] {
  const data = readRecord(readRecord(value).data ?? value);
  const candidates = [
    data.items,
    data.rows,
    data.results,
    data.users,
    data.loans,
    data.chats,
    data.messages,
    data.help,
    data.requests,
    data.tickets,
    value,
  ];
  const rows = candidates.find(Array.isArray);

  return Array.isArray(rows) ? rows.filter(isRecord) : [];
}

function normalizePagination(value: unknown, fallbackLimit: number): AdminPagination {
  const data = readRecord(readRecord(value).data ?? value);
  const pagination = readRecord(data.pagination);
  const total = readNumber(pagination.total);
  const totalPages = readNumber(pagination.totalPages);

  return {
    limit: readNumber(pagination.limit) || fallbackLimit,
    page: readNumber(pagination.page) || 1,
    total,
    totalPages: totalPages || 1,
  };
}

function buildEndpoint(endpoint: string, pagination?: { limit: number; page: number; search: string }) {
  if (!pagination) {
    return endpoint;
  }

  const params = new URLSearchParams();

  params.set("page", String(pagination.page));
  params.set("limit", String(pagination.limit));

  if (pagination.search.trim()) {
    params.set("search", pagination.search.trim());
  }

  return `${endpoint}?${params.toString()}`;
}

function readValue(row: AdminRow, key: string) {
  return key.split(".").reduce<unknown>((value, part) => (isRecord(value) ? value[part] : undefined), row);
}

function readRecord(value: unknown): AdminRow {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is AdminRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNumber(value: unknown) {
  const numberValue = typeof value === "string" ? Number(value) : value;
  return typeof numberValue === "number" && Number.isFinite(numberValue) ? numberValue : 0;
}

function readDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCell(value: unknown, type?: AdminDataColumn["type"]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (type === "date" || type === "datetime") {
    return formatDate(value, type === "datetime");
  }

  if (type === "money") {
    return formatMoney(value);
  }

  return String(value);
}

function formatDate(value: unknown, includeTime: boolean) {
  const date = readDate(value);

  if (!date) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: includeTime ? "2-digit" : undefined,
    minute: includeTime ? "2-digit" : undefined,
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMoney(value: unknown) {
  const numberValue = typeof value === "string" ? Number(value) : value;

  if (typeof numberValue !== "number" || !Number.isFinite(numberValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(numberValue);
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function formatExportTimestamp() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}
