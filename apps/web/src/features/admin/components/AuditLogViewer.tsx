
import { useEffect, useState, Fragment } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Badge } from "../../../shared/ui/badge";
import { api } from "../../../services/api";
import { AdminAuditLogResult } from "../../../services/api/admin";
import { formatCompactDateTime } from "../../../shared/lib/dateTime";
import { logger } from "../../../shared/lib/logger";

const TABLE_OPTIONS = ["", "Users", "Posts", "Reviews", "Categories", "Roles"];

export function AuditLogViewer() {
  const [auditResult, setAuditResult] = useState<AdminAuditLogResult>({
    entries: [],
    totalCount: 0,
  });
  const [tableFilter, setTableFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchLogs = async (currentPage: number, currentTable?: string) => {
    try {
      setIsLoading(true);
      const result = await api.admin.getAuditLogs(
        currentTable || undefined,
        currentPage,
        50,
      );
      setAuditResult({
        entries: Array.isArray(result?.entries) ? result.entries : [],
        totalCount: result?.totalCount ?? 0,
      });
    } catch (error) {
      logger.warn("[AuditLogViewer] Failed to fetch audit logs", error);
      toast.error("Failed to fetch audit logs");
      setAuditResult({ entries: [], totalCount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs(page, tableFilter);
  }, [page, tableFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "INSERT":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            INSERT
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            UPDATE
          </Badge>
        );
      case "DELETE":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            DELETE
          </Badge>
        );
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const filteredEntries = (auditResult?.entries || []).filter(
    (entry) =>
      (entry.tableName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.changedByUserName ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (entry.action || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatJson = (jsonStr: string | null) => {
    if (!jsonStr) return null;
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by table, user, action..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter by Table"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background md:w-[150px]"
            value={tableFilter}
            onChange={(e) => {
              setPage(1);
              setTableFilter(e.target.value);
            }}
          >
            <option value="">All Tables</option>
            {TABLE_OPTIONS.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border border-border">
        <div className="overflow-x-auto min-h-96">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted text-muted-foreground sticky top-0">
              <tr>
                <th scope="col" className="px-4 py-3 w-8"><span className="sr-only">Expand</span></th>
                <th scope="col" className="px-4 py-3">
                  ID
                </th>
                <th scope="col" className="px-4 py-3">
                  Table
                </th>
                <th scope="col" className="px-4 py-3">
                  Record
                </th>
                <th scope="col" className="px-4 py-3">
                  Action
                </th>
                <th scope="col" className="px-4 py-3">
                  Changed By
                </th>
                <th scope="col" className="px-4 py-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Loading" /><span className="sr-only">Loading…</span>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <Fragment key={entry.auditLogID}>
                    <tr
                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      tabIndex={0}
                      role="row"
                      aria-expanded={expandedRow === entry.auditLogID}
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === entry.auditLogID
                            ? null
                            : entry.auditLogID,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedRow(
                            expandedRow === entry.auditLogID
                              ? null
                              : entry.auditLogID,
                          );
                        }
                      }}
                    >
                      <td className="px-4 py-3">
                        {expandedRow === entry.auditLogID ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {entry.auditLogID}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{entry.tableName}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        #{entry.recordID}
                      </td>
                      <td className="px-4 py-3">
                        {getActionBadge(entry.action)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {entry.changedByUserName ?? (
                          <span className="italic text-xs">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatCompactDateTime(entry.changedAt)}
                      </td>
                    </tr>
                    {expandedRow === entry.auditLogID && (
                      <tr key={`${entry.auditLogID}-detail`}>
                        <td colSpan={7} className="bg-muted/30 px-8 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {entry.oldValues && (
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                  Old Values
                                </h4>
                                <pre className="text-xs bg-background p-3 rounded-md border border-border overflow-auto max-h-48">
                                  {formatJson(entry.oldValues)}
                                </pre>
                              </div>
                            )}
                            {entry.newValues && (
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                  New Values
                                </h4>
                                <pre className="text-xs bg-background p-3 rounded-md border border-border overflow-auto max-h-48">
                                  {formatJson(entry.newValues)}
                                </pre>
                              </div>
                            )}
                            {!entry.oldValues && !entry.newValues && (
                              <div className="text-xs text-muted-foreground italic col-span-2">
                                No value snapshots recorded for this entry.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Total: {auditResult.totalCount} entries
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm font-medium">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(auditResult?.entries?.length ?? 0) < 50 || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
