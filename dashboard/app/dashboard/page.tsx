"use client";

import { useEffect, useState } from "react";
import type { DashboardStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response content type");
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setStats(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Stats fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!stats || 'error' in stats) {
    const errorMessage = stats && 'error' in stats ? (stats as { error: string }).error : 'Unknown error';
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 text-xl">Error loading stats: {errorMessage}</div>
      </div>
    );
  }

  const severityColors: Record<string, string> = {
    critical: "bg-red-600",
    high: "bg-orange-600",
    medium: "bg-yellow-600",
    low: "bg-green-600",
    unknown: "bg-gray-600",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* Email Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">📧 Email Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Total Emails Sent</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {stats.totalEmailsSent}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Last 7 Days</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {stats.emailsSentLast7Days}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Last 30 Days</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">
              {stats.emailsSentLast30Days}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">🔔 Alert Statistics</h2>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {Object.entries(stats.alertsBySeverity).map(([severity, count]) => (
            <div
              key={severity}
              className={`${severityColors[severity]} p-4 rounded-lg text-center`}
            >
              <p className="text-sm opacity-80 capitalize">{severity}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm">Total Alerts</p>
          <p className="text-3xl font-bold text-white mt-2">
            {stats.totalAlerts}
          </p>
        </div>
      </div>

      {/* Recent Alerts */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">📋 Recent Alerts</h2>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {stats.recentAlerts.length === 0 ? (
            <p className="p-4 text-gray-400">No alerts yet</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-300">Severity</th>
                  <th className="px-4 py-3 text-left text-gray-300">Title</th>
                  <th className="px-4 py-3 text-left text-gray-300">Date</th>
                  <th className="px-4 py-3 text-left text-gray-300">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats.recentAlerts.slice(0, 5).map((alert) => (
                  <tr key={alert._id} className="hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <span
                        className={`${severityColors[alert.severity]} px-2 py-1 rounded text-xs font-semibold`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{alert.title}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(alert.pubDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {alert.sentViaEmail ? (
                        <span className="text-green-400">✅</span>
                      ) : (
                        <span className="text-gray-500">❌</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
