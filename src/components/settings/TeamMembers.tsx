"use client";

import { useState } from "react";
import { Plus, X, UserMinus } from "lucide-react";
import type { TeamMember, TeamRole } from "@/lib/types";

interface TeamMembersProps {
  members: TeamMember[];
  onAdd: (member: Partial<TeamMember>) => void;
  onDeactivate: (id: string) => void;
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]";

const ROLES: { value: TeamRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "crew", label: "Crew" },
  { value: "sales_rep", label: "Sales Rep" },
];

export default function TeamMembers({ members, onAdd, onDeactivate }: TeamMembersProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>("crew");

  const handleAdd = () => {
    if (!newName || !newEmail) return;
    onAdd({
      name: newName,
      email: newEmail,
      phone: newPhone || null,
      role: newRole,
    });
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewRole("crew");
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{members.length} team member{members.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-[#0085FF] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0177E3]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Member
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border border-[#0085FF]/30 bg-[#0085FF]/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">New Team Member</p>
            <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full Name *" className={inputClass} />
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email *" className={inputClass} />
            <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone" className={inputClass} />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as TeamRole)} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!newName || !newEmail}
            className="rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0177E3] disabled:opacity-50"
          >
            Send Invite
          </button>
        </div>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: member.color || "#0085FF" }}
              >
                {member.name.split(" ").map((w) => w[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{member.name}</p>
                <p className="text-xs text-slate-500">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                {member.role.replace("_", " ")}
              </span>
              {!member.is_active && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-500">Inactive</span>
              )}
              <button
                onClick={() => onDeactivate(member.id)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                title={member.is_active ? "Deactivate" : "Reactivate"}
              >
                <UserMinus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
