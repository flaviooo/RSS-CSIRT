"use client";

import { useCallback, useEffect, useState } from "react";
import type { IEmailLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<IEmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (status !== "all") params.set("status", status);
      
      const res = await fetch(`/api/email-logs?${params}`);
      
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
    setLoading(false);
  }, [status, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Email Logs</h1>

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <p className="p-4 text-gray-400">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="p-4 text-gray-400">No email logs found</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-300">Alert</th>
                <th className="px-4 py-3 text-left text-gray-300">Recipient</th>
                <th className="px-4 py-3 text-left text-gray-300">Date</th>
                <th className="px-4 py-3 text-left text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-gray-300">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-750">
                  <td className="px-4 py-3 text-white max-w-xs truncate">
                    {log.alertTitle}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{log.recipient}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(log.sentAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.status === "success" ? (
                      <span className="bg-green-600 px-2 py-1 rounded text-sm">Success</span>
                    ) : (
                      <span className="bg-red-600 px-2 py-1 rounded text-sm">Failed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-red-400 max-w-xs truncate">
                    {log.error || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-white px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
