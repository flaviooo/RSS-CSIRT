"use client";

import { useEffect, useState } from "react";
import type { IAlert } from "@/lib/types";

type SortColumn = "severity" | "title" | "pubDate" | "updatedAt" | "sentViaEmail";
type SortDirection = "asc" | "desc";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");
  const [cveSearch, setCveSearch] = useState("");
  const [expandedAlert, setExpandedAlert] = useState<IAlert | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("pubDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortColumn) {
      case "severity":
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, unknown: 0 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "pubDate":
        comparison = new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
        break;
      case "updatedAt":
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        comparison = aUpdated - bUpdated;
        break;
      case "sentViaEmail":
        comparison = (a.sentViaEmail ? 1 : 0) - (b.sentViaEmail ? 1 : 0);
        break;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <span className="ml-1 text-gray-500">⇅</span>;
    }
    return <span className="ml-1 text-blue-400">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severity !== "all") params.set("severity", severity);
      if (search) params.set("search", search);
      if (cveSearch) params.set("cve", cveSearch.toUpperCase());
      
      const res = await fetch(`/api/alerts?${params}`);
      const data = await res.json();
      
      if (data.error) {
        console.error("API Error:", data.error);
        setAlerts([]);
      } else {
        setAlerts(data.alerts || []);
      }
    } catch {
      console.error("Failed to fetch alerts");
      setAlerts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, [severity, search, cveSearch]);

  const searchByCve = (cveId: string) => {
    setCveSearch(cveId);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const sendSelectedEmails = async () => {
    if (selectedIds.size === 0) return;
    
    setSending(true);
    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/alerts/${id}/email`, { method: "POST" });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setSending(false);
    setSelectedIds(new Set());
    alert(`Email inviate: ${success}, Fallite: ${failed}`);
    fetchAlerts();
  };

  const sendSingleEmail = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/email`, { method: "POST" });
      const data = await res.json();
      alert(data.message || (data.success ? "Email inviata!" : "Errore"));
      fetchAlerts();
    } catch {
      alert("Errore nell'invio email");
    }
  };

  const deleteAlert = async (id: string, title: string) => {
    if (!confirm(`Eliminare l'alert "${title.substring(0, 50)}..."?\n\nQuesta azione non può essere annullata.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        setAlerts(alerts.filter((a) => a._id !== id));
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        alert(data.error || "Errore durante l'eliminazione");
      }
    } catch {
      alert("Errore durante l'eliminazione");
    }
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-600",
    high: "bg-orange-600",
    medium: "bg-yellow-600",
    low: "bg-green-600",
    unknown: "bg-gray-600",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Alerts</h1>
        
        <div className="flex gap-4 items-center flex-wrap">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="unknown">Unknown</option>
          </select>

          <input
            type="text"
            placeholder="Search title/description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
          />

          <input
            type="text"
            placeholder="Search CVE (e.g. CVE-2024)..."
            value={cveSearch}
            onChange={(e) => setCveSearch(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 w-64"
          />
          
          {(search || cveSearch) && (
            <button
              onClick={() => {
                setSearch("");
                setCveSearch("");
              }}
              className="text-gray-400 hover:text-white text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-blue-900 rounded-lg flex items-center justify-between">
          <span className="text-white">
            {selectedIds.size} alert(s) selected
          </span>
          <button
            onClick={sendSelectedEmails}
            disabled={sending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Email to Selected"}
          </button>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <p className="p-4 text-gray-400">Loading...</p>
        ) : alerts.length === 0 ? (
          <p className="p-4 text-gray-400">No alerts found</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(alerts.map((a) => a._id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    checked={selectedIds.size === alerts.length && alerts.length > 0}
                    className="rounded"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("severity")}
                >
                  Severity <SortIcon column="severity" />
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("title")}
                >
                  Title <SortIcon column="title" />
                </th>
                <th className="px-4 py-3 text-left text-gray-300">CVE</th>
                <th className="px-4 py-3 text-left text-gray-300">Link</th>
                <th 
                  className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("pubDate")}
                >
                  Pub. Date <SortIcon column="pubDate" />
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("updatedAt")}
                >
                  Updated <SortIcon column="updatedAt" />
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white select-none"
                  onClick={() => handleSort("sentViaEmail")}
                >
                  Email <SortIcon column="sentViaEmail" />
                </th>
                <th className="px-4 py-3 text-left text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedAlerts.map((alert) => (
                <tr key={alert._id} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(alert._id)}
                      onChange={() => toggleSelect(alert._id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`${severityColors[alert.severity]} px-2 py-1 rounded text-xs font-semibold`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white max-w-md">
                    <button
                      onClick={() => setExpandedAlert(alert)}
                      className="text-blue-400 hover:text-blue-300 hover:underline text-left"
                    >
                      {alert.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {alert.cveIds && alert.cveIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {alert.cveIds.slice(0, 3).map((cve, i) => (
                          <button
                            key={i}
                            onClick={() => searchByCve(cve)}
                            className="bg-blue-900 hover:bg-blue-800 text-blue-300 px-2 py-0.5 rounded text-xs transition-colors"
                          >
                            {cve}
                          </button>
                        ))}
                        {alert.cveIds.length > 3 && (
                          <button
                            onClick={() => setExpandedAlert(alert)}
                            className="text-gray-400 hover:text-gray-300 text-xs"
                          >
                            +{alert.cveIds.length - 3}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {alert.link ? (
                      <a
                        href={alert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        🔗 Open
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(alert.pubDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {alert.updatedAt ? (
                      <span className="text-gray-400 text-sm" title={new Date(alert.updatedAt).toLocaleString()}>
                        {new Date(alert.updatedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {alert.sentViaEmail ? (
                      <span className="text-green-400 text-lg">✅</span>
                    ) : (
                      <span className="text-gray-500 text-lg">❌</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendSingleEmail(alert._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        📧
                      </button>
                      <button
                        onClick={() => deleteAlert(alert._id, alert.title)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        title="Elimina alert"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {expandedAlert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-600 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white pr-4">Alert Details</h2>
                <button
                  onClick={() => setExpandedAlert(null)}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className={`${severityColors[expandedAlert.severity]} px-2 py-1 rounded text-xs font-semibold`}>
                    {expandedAlert.severity.toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-gray-400 text-sm mb-1">Title</h3>
                  <p className="text-white">{expandedAlert.title}</p>
                </div>

                {expandedAlert.cveIds && expandedAlert.cveIds.length > 0 && (
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">CVE IDs</h3>
                    <div className="flex flex-wrap gap-2">
                      {expandedAlert.cveIds.map((cve, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setExpandedAlert(null);
                            searchByCve(cve);
                          }}
                          className="bg-blue-900 hover:bg-blue-800 text-blue-300 px-2 py-1 rounded text-sm transition-colors"
                        >
                          {cve}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-gray-400 text-sm mb-1">Description</h3>
                  <p className="text-white whitespace-pre-wrap">{expandedAlert.description || "No description available"}</p>
                </div>

                {expandedAlert.link && (
                  <div>
                    <h3 className="text-gray-400 text-sm mb-1">Link</h3>
                    <a
                      href={expandedAlert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline break-all"
                    >
                      {expandedAlert.link}
                    </a>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-700">
                  <span className="text-gray-400 text-sm">
                    Published: {new Date(expandedAlert.pubDate).toLocaleString()}
                  </span>
                  {expandedAlert.updatedAt && (
                    <span className="text-gray-400 text-sm">
                      Updated: {new Date(expandedAlert.updatedAt).toLocaleString()}
                    </span>
                  )}
                  {expandedAlert.sentViaEmail && (
                    <span className="text-green-400 text-sm">✅ Email sent</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
