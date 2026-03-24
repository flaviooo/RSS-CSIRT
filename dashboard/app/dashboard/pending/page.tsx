"use client";

import { useCallback, useEffect, useState } from "react";
import type { IPendingAlert, PendingAlertStatus } from "@/lib/types";

export default function PendingPage() {
  const [alerts, setAlerts] = useState<IPendingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PendingAlertStatus | "all">("pending");
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");
  const [cveSearch, setCveSearch] = useState("");
  const [expandedAlert, setExpandedAlert] = useState<IPendingAlert | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (severity !== "all") params.set("severity", severity);
      if (search) params.set("search", search);
      if (cveSearch) params.set("cve", cveSearch.toUpperCase());
      
      const res = await fetch(`/api/pending-alerts?${params}`);
      
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        console.error("API Error:", data.error);
        setAlerts([]);
      } else {
        setAlerts(data.alerts || []);
      }
    } catch {
      console.error("Failed to fetch pending alerts");
      setAlerts([]);
    }
    setLoading(false);
  }, [status, severity, search, cveSearch]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAction = async (id: string, action: "reject" | "approve" | "send-email") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/pending-alerts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      
      const data = await res.json();
      
      if (data.success) {
        if (action === "send-email" && data.log) {
          alert(`Email ${data.log.status === "success" ? "inviata" : "fallita"}\nDestinatario: ${data.log.recipient}`);
        } else {
          alert(data.message);
        }
        fetchAlerts();
      } else {
        alert(data.error || "Errore durante l'operazione");
      }
    } catch {
      alert("Errore durante l'operazione");
    }
    setProcessing(null);
  };

  const deleteAlert = async (id: string, title: string) => {
    if (!confirm(`Eliminare l'alert "${title.substring(0, 50)}..."?\n\nQuesta azione non può essere annullata.`)) {
      return;
    }
    
    setProcessing(id);
    try {
      const res = await fetch(`/api/pending-alerts/${id}`, { method: "DELETE" });
      
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      
      const data = await res.json();
      
      if (data.success) {
        setAlerts(alerts.filter((a) => a._id !== id));
      } else {
        alert(data.error || "Errore durante l'eliminazione");
      }
    } catch {
      alert("Errore durante l'eliminazione");
    }
    setProcessing(null);
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-600",
    high: "bg-orange-600",
    medium: "bg-yellow-600",
    low: "bg-green-600",
    unknown: "bg-gray-600",
  };

  const statusColors: Record<PendingAlertStatus, string> = {
    pending: "bg-blue-600",
    approved: "bg-green-600",
    outofftopic: "bg-gray-600",
    sent: "bg-purple-600",
  };

  const statusLabels: Record<PendingAlertStatus, string> = {
    pending: "Da Valutare",
    approved: "Approvato",
    outofftopic: "Out of Topic",
    sent: "Inviato",
  };

  const searchByCve = (cveId: string) => {
    setCveSearch(cveId);
  };

  const getCounts = () => {
    return alerts.reduce((acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    }, {} as Record<PendingAlertStatus, number>);
  };

  const counts = getCounts();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Pending Alerts</h1>
        <button
          onClick={fetchAlerts}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {(["pending", "approved", "outofftopic", "sent"] as PendingAlertStatus[]).map((s) => (
          <div
            key={s}
            className={`${status === s ? "ring-2 ring-white" : ""} ${statusColors[s]} rounded-lg p-4 cursor-pointer hover:opacity-90`}
            onClick={() => setStatus(status === s ? "all" : s)}
          >
            <div className="text-white font-bold">{statusLabels[s]}</div>
            <div className="text-white text-2xl">{counts[s] || 0}</div>
          </div>
        ))}
      </div>
        
      <div className="flex gap-4 items-center flex-wrap mb-6">
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
        
        {(search || cveSearch || status !== "pending") && (
          <button
            onClick={() => {
              setSearch("");
              setCveSearch("");
              setStatus("pending");
            }}
            className="text-gray-400 hover:text-white text-sm"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <p className="p-4 text-gray-400">Loading...</p>
        ) : alerts.length === 0 ? (
          <p className="p-4 text-gray-400">No pending alerts found</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-gray-300">Severity</th>
                <th className="px-4 py-3 text-left text-gray-300">Title</th>
                <th className="px-4 py-3 text-left text-gray-300">CVE</th>
                <th className="px-4 py-3 text-left text-gray-300">Link</th>
                <th className="px-4 py-3 text-left text-gray-300">Pub. Date</th>
                <th className="px-4 py-3 text-left text-gray-300">Email</th>
                <th className="px-4 py-3 text-left text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {alerts.map((alert) => (
                <tr key={alert._id} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <span
                      className={`${statusColors[alert.status]} px-2 py-1 rounded text-xs font-semibold`}
                    >
                      {statusLabels[alert.status]}
                    </span>
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
                        {alert.cveIds.slice(0, 2).map((cve, i) => (
                          <button
                            key={i}
                            onClick={() => searchByCve(cve)}
                            className="bg-blue-900 hover:bg-blue-800 text-blue-300 px-2 py-0.5 rounded text-xs transition-colors"
                          >
                            {cve}
                          </button>
                        ))}
                        {alert.cveIds.length > 2 && (
                          <span className="text-gray-500 text-xs">+{alert.cveIds.length - 2}</span>
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
                        🔗
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(alert.pubDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {alert.sentViaEmail ? (
                      <span className="text-green-400 text-lg" title={`Inviato: ${alert.emailSentAt ? new Date(alert.emailSentAt).toLocaleString() : ""}`}>✅</span>
                    ) : (
                      <span className="text-gray-500 text-lg">❌</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {alert.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction(alert._id, "send-email")}
                            disabled={processing === alert._id}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                            title="Invia Mail"
                          >
                            📧
                          </button>
                          <button
                            onClick={() => handleAction(alert._id, "reject")}
                            disabled={processing === alert._id}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                            title="Cancella (Out of Topic)"
                          >
                            🚫
                          </button>
                        </>
                      )}
                      {alert.status === "approved" && (
                        <button
                          onClick={() => handleAction(alert._id, "send-email")}
                          disabled={processing === alert._id || alert.sentViaEmail}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                          title="Invia Mail"
                        >
                          📧
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert._id, alert.title)}
                        disabled={processing === alert._id}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                        title="Elimina"
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
              
              <div className="flex gap-2 mb-4">
                <span className={`${statusColors[expandedAlert.status]} px-2 py-1 rounded text-xs font-semibold`}>
                  {statusLabels[expandedAlert.status]}
                </span>
                <span className={`${severityColors[expandedAlert.severity]} px-2 py-1 rounded text-xs font-semibold`}>
                  {expandedAlert.severity.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-4">
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
                  <span className="text-gray-400 text-sm">
                    Received: {new Date(expandedAlert.receivedAt).toLocaleString()}
                  </span>
                  {expandedAlert.evaluatedAt && (
                    <span className="text-gray-400 text-sm">
                      Evaluated: {new Date(expandedAlert.evaluatedAt).toLocaleString()}
                    </span>
                  )}
                  {expandedAlert.sentViaEmail && (
                    <span className="text-green-400 text-sm">✅ Email sent</span>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  {expandedAlert.status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          handleAction(expandedAlert._id, "send-email");
                          setExpandedAlert(null);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      >
                        📧 Invia Mail
                      </button>
                      <button
                        onClick={() => {
                          handleAction(expandedAlert._id, "reject");
                          setExpandedAlert(null);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                      >
                        🚫 Cancella
                      </button>
                    </>
                  )}
                  {expandedAlert.status === "approved" && (
                    <button
                      onClick={() => {
                        handleAction(expandedAlert._id, "send-email");
                        setExpandedAlert(null);
                      }}
                      disabled={expandedAlert.sentViaEmail}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                      📧 Invia Mail
                    </button>
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
