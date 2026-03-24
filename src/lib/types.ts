export type LeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "booked"
  | "in_progress"
  | "completed"
  | "lost";

export type ActivityType =
  | "call"
  | "email"
  | "quote"
  | "payment"
  | "note"
  | "ai_action";

export type TeamRole = "admin" | "manager" | "crew";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  service_type: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  customer_id: string;
  status: LeadStatus;
  quoted_amount: number | null;
  project_type: string | null;
  project_description: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Activity {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  type: ActivityType;
  description: string;
  created_by: string | null;
  created_at: string;
}

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bgColor: string }
> = {
  new: { label: "New", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  contacted: {
    label: "Contacted",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  quoted: {
    label: "Quoted",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
  booked: {
    label: "Booked",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  in_progress: {
    label: "In Progress",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  completed: {
    label: "Completed",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  lost: { label: "Lost", color: "text-red-400", bgColor: "bg-red-500/20" },
};

export const PIPELINE_STAGES: LeadStatus[] = [
  "new",
  "contacted",
  "quoted",
  "booked",
  "in_progress",
  "completed",
  "lost",
];
