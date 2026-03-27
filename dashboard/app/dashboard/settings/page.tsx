"use client";

import { useState, useEffect, useCallback } from "react";

interface CronStatus {
  isRunning: boolean;
  lastRun: string | null;
  nextRun: string | null;
  newAlerts: number;
  emailsSent: number;
  error: string | null;
  intervalMinutes: number;
}

export default function SettingsPage() {
  const [emailTo, setEmailTo] = useState("");
  const [threshold, setThreshold] = useState("high");
  const [saved, setSaved] = useState(false);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [intervalSaved, setIntervalSaved] = useState(false);

  const fetchCronStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/cron/status');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setCronStatus(data);
      setIntervalMinutes(data.intervalMinutes || 15);
    } catch {
      console.error('Error fetching cron status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCronStatus();
    const interval = setInterval(fetchCronStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchCronStatus]);

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleIntervalSave = async () => {
    try {
      const res = await fetch('/api/settings/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMinutes }),
      });
      if (res.ok) {
        setIntervalSaved(true);
        setTimeout(() => setIntervalSaved(false), 3000);
      }
    } catch {
      alert('Error saving interval');
    }
  };

  const triggerCronNow = async () => {
    try {
      const res = await fetch('/api/cron/fetch', {
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || ''}` }
      });
      const data = await res.json();
      alert(data.message || 'Cron executed');
      fetchCronStatus();
    } catch {
      alert('Error triggering cron');
    }
  };

  const getTimeRemaining = () => {
    if (!cronStatus?.nextRun) return '-';
    const now = new Date();
    const next = new Date(cronStatus.nextRun);
    const diff = next.getTime() - now.getTime();
    if (diff < 0) return '0 min';
    const mins = Math.floor(diff / 60000);
    return `${mins} min`;
  };

  const getLastRunFormatted = () => {
    if (!cronStatus?.lastRun) return 'Never';
    return new Date(cronStatus.lastRun).toLocaleString('it-IT');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Cron Job Status</h2>
        
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${cronStatus?.isRunning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-white font-medium">
                {cronStatus?.isRunning ? 'Running...' : 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Interval (minutes)</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 15)}
                    className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                  <button
                    onClick={handleIntervalSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                  >
                    Save
                  </button>
                  {intervalSaved && (
                    <span className="text-green-400 text-sm self-center">Saved!</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next run in</p>
                <p className="text-white">{getTimeRemaining()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last run</p>
                <p className="text-white">{getLastRunFormatted()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last result</p>
                <p className="text-white">
                  {cronStatus?.newAlerts} new alerts, {cronStatus?.emailsSent} emails
                </p>
              </div>
            </div>

            {cronStatus?.error && (
              <div className="bg-red-900/50 border border-red-700 rounded p-3">
                <p className="text-red-400 text-sm">Error: {cronStatus.error}</p>
              </div>
            )}

            <button
              onClick={triggerCronNow}
              disabled={cronStatus?.isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {cronStatus?.isRunning ? 'Running...' : 'Run Now'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl">
        <h2 className="text-xl font-semibold text-white mb-4">Email Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Default Email Recipient</label>
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Alert Severity Threshold</label>
            <p className="text-gray-500 text-sm mb-2">
              Only receive alerts at or above this severity level
            </p>
            <select
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="critical">Critical only</option>
              <option value="high">High and above</option>
              <option value="medium">Medium and above</option>
              <option value="low">Low and above</option>
              <option value="unknown">All alerts</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Save Settings
            </button>
            {saved && (
              <span className="ml-4 text-green-400">Settings saved!</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">SMTP Configuration</h2>
        
        <div className="space-y-4 text-gray-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Host</p>
              <p>smtp.gmail.com</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Port</p>
              <p>587</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Connected Email</p>
            <p>{process.env.MAIL_GMAIL_USER || "Not configured"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
