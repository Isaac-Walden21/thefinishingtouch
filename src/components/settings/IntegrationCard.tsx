"use client";

import { useState } from "react";
import { Check, X, Loader2, Plug } from "lucide-react";
import type { IntegrationConfig } from "@/lib/types";

interface IntegrationCardProps {
  integration: IntegrationConfig;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onTest?: () => Promise<boolean>;
}

const ICONS: Record<string, string> = {
  stripe: "S",
  google_calendar: "G",
  twilio: "T",
  google_places: "P",
  gmail: "M",
  quickbooks: "Q",
};

export default function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onTest,
}: IntegrationCardProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleTest = async () => {
    if (!onTest) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
    } catch {
      setTestResult(false);
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const isConnected = integration.status === "connected";
  const hasError = integration.status === "error";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
            {ICONS[integration.provider] || <Plug className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700">{integration.label}</h4>
            <p className="text-xs text-slate-400">{integration.description}</p>
          </div>
        </div>
        {/* Status dot */}
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? "bg-emerald-500" : hasError ? "bg-red-500" : "bg-slate-300"
            }`}
          />
          <span className="text-xs text-slate-400">
            {isConnected ? "Connected" : hasError ? "Error" : "Not Connected"}
          </span>
        </div>
      </div>

      {integration.last_activity && (
        <p className="mb-3 text-[10px] text-slate-400">
          Last activity: {new Date(integration.last_activity).toLocaleString()}
        </p>
      )}

      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {testing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : testResult === true ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : testResult === false ? (
                <X className="h-3 w-3 text-red-500" />
              ) : null}
              Test Connection
            </button>
            <button
              onClick={onDisconnect}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            className="rounded-lg bg-[#0085FF] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0177E3]"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
