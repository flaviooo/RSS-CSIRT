"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [emailTo, setEmailTo] = useState("");
  const [threshold, setThreshold] = useState("high");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // In a real app, this would save to the database
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

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
