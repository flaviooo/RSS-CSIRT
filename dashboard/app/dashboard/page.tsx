"use client";

import { useEffect, useState } from "react";
import type { DashboardStats } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CronStatus {
  isRunning: boolean;
  lastRun: string | null;
  nextRun: string | null;
  newAlerts: number;
  emailsSent: number;
  error: string | null;
  intervalMinutes: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      }),
      fetch("/api/cron/status").then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      }),
    ])
      .then(([statsData, cronData]) => {
        if (statsData) setStats(statsData);
        if (cronData) setCronStatus(cronData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const getTimeRemaining = () => {
    if (!cronStatus?.nextRun) return "-";
    const now = new Date();
    const next = new Date(cronStatus.nextRun);
    const diff = next.getTime() - now.getTime();
    if (diff < 0) return "0 min";
    const mins = Math.floor(diff / 60000);
    return `${mins} min`;
  };

  const getLastRunFormatted = () => {
    if (!cronStatus?.lastRun) return "Never";
    return new Date(cronStatus.lastRun).toLocaleString("it-IT");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading...</div>
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

      {/* Cron Status */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">⏰ Cron Job Status</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  cronStatus?.isRunning ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                }`}
              ></div>
              <p className="text-white font-medium">
                {cronStatus?.isRunning ? "Running..." : "Active"}
              </p>
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Next run in</p>
            <p className="text-2xl font-bold text-white mt-1">{getTimeRemaining()}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Last run</p>
            <p className="text-lg font-bold text-white mt-1">{getLastRunFormatted()}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Last result</p>
            <p className="text-lg font-bold text-white mt-1">
              {cronStatus?.newAlerts || 0} new, {cronStatus?.emailsSent || 0} email
            </p>
          </div>
        </div>
        {cronStatus?.error && (
          <div className="mt-4 bg-red-900/50 border border-red-700 rounded p-3">
            <p className="text-red-400 text-sm">Error: {cronStatus.error}</p>
          </div>
        )}
      </div>

      {/* Email Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">📧 Email Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Total Emails Sent</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {stats?.totalEmailsSent || 0}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Last 7 Days</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {stats?.emailsSentLast7Days || 0}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Last 30 Days</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">
              {stats?.emailsSentLast30Days || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">🔔 Alert Statistics</h2>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {Object.entries(stats?.alertsBySeverity || {}).map(([severity, count]) => (
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
            {stats?.totalAlerts || 0}
          </p>
        </div>
      </div>

      {/* Recent Alerts */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">📋 Recent Alerts</h2>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {(!stats?.recentAlerts || stats.recentAlerts.length === 0) ? (
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
