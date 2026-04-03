"use client";

import { useState, useEffect } from "react";
import { Plus, X, Mail, Clock } from "lucide-react";
import type { AppUser, UserRole, Invite } from "@/lib/types";

interface TeamMembersProps {
  companyId: string;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "crew", label: "Crew" },
  { value: "sales_rep", label: "Sales Rep" },
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]";

export default function TeamMembers({ companyId }: TeamMembersProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("crew");
  const [sending, setSending] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch team users
    fetch("/api/team-members")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch pending invites
    fetch("/api/auth/invite")
      .then((r) => r.json())
      .then((data) => setInvites(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [companyId]);

  async function handleInvite() {
    if (!inviteEmail) return;
    setSending(true);
    setInviteUrl(null);

    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setInviteUrl(data.invite_url);
      setInvites((prev) => [data.invite, ...prev]);
      setInviteEmail("");
      setInviteRole("crew");
    } catch {
      // Error handling
    } finally {
      setSending(false);
    }
  }

  const pendingInvites = invites.filter((i) => !i.accepted_at && new Date(i.expires_at) > new Date());

  return (
    <div className="space-y-6">
      {/* Active team members */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-500">{users.length} team member{users.length !== 1 ? "s" : ""}</p>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-1.5 rounded-lg bg-[#0085FF] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0070DD]"
          >
            {showInvite ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showInvite ? "Cancel" : "Invite Member"}
          </button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className={inputClass}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className={inputClass}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={sending || !inviteEmail}
              className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0070DD] disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              {sending ? "Sending..." : "Send Invite"}
            </button>
            {inviteUrl && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Invite created. Share this link: <code className="font-mono text-xs">{window.location.origin}{inviteUrl}</code>
              </div>
            )}
          </div>
        )}

        {/* Team list */}
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{u.name}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                {u.role.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Pending Invites</p>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm text-slate-700">{inv.email}</p>
                    <p className="text-xs text-slate-500">Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium capitalize text-amber-700">
                  {inv.role.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
