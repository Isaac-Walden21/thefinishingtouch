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

export type TeamRole = "admin" | "manager" | "crew" | "sales_rep";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  phone: string | null;
  color: string;
  notification_email: string | null;
  is_active: boolean;
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
  vapi_call_id: string | null;
  call_transcript_url: string | null;
  call_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

// Calendar & Availability
export type EventType = "quote_visit" | "blocked" | "personal";
export type EventStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface AvailabilityRule {
  id: string;
  team_member_id: string;
  day_of_week: number; // 0=Sun, 6=Sat
  start_time: string;  // HH:MM
  end_time: string;    // HH:MM
  is_enabled: boolean;
}

export interface CalendarEvent {
  id: string;
  team_member_id: string;
  type: EventType;
  status: EventStatus;
  title: string;
  description: string | null;
  start_time: string; // ISO 8601 UTC
  end_time: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  service_type: string | null;
  project_description: string | null;
  created_by: "agent" | "manual";
  lead_id: string | null;
  created_at: string;
  updated_at: string;
  team_member?: TeamMember;
}

export interface TimeSlot {
  start: string; // ISO 8601 UTC
  end: string;
  team_member_id: string;
  team_member_name: string;
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

// ── Module 2: Estimates ──

export type EstimateStatus = "draft" | "sent" | "accepted" | "declined";

export const ESTIMATE_STATUS_CONFIG: Record<
  EstimateStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
  },
  sent: { label: "Sent", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  accepted: {
    label: "Accepted",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  declined: {
    label: "Declined",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
};

export interface EstimateLineItem {
  id: string;
  category: "material" | "labor" | "equipment";
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total: number;
}

export interface Estimate {
  id: string;
  customer_id: string | null;
  customer_name: string;
  status: EstimateStatus;
  project_type: string;
  dimensions: {
    length?: number;
    width?: number;
    depth?: number;
    square_footage?: number;
    linear_feet?: number;
  };
  materials: string[];
  complexity: "easy" | "moderate" | "difficult";
  options: {
    demolition: boolean;
    grading: boolean;
    sealing: boolean;
    color_stain: string;
  };
  line_items: EstimateLineItem[];
  subtotal: number;
  margin: number;
  total: number;
  timeline: string;
  notes: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export const PROJECT_TYPES = [
  "Concrete Patio",
  "Concrete Driveway",
  "Stamped Concrete",
  "Decorative Curbing",
  "Post Frame Building",
  "Landscaping",
  "Firewood Delivery",
] as const;

export const MATERIAL_OPTIONS: Record<string, string[]> = {
  "Concrete Patio": [
    "Broom Finish",
    "Exposed Aggregate",
    "Colored Concrete",
    "Broomed with Border",
  ],
  "Concrete Driveway": [
    "Broom Finish",
    "Exposed Aggregate",
    "Colored Concrete",
    "Stamped Border",
  ],
  "Stamped Concrete": [
    "Ashlar Slate",
    "Cobblestone",
    "Wood Plank",
    "Random Stone",
    "Herringbone Brick",
    "European Fan",
  ],
  "Decorative Curbing": [
    "Slant Style",
    "Mower Edge",
    "Curb & Gutter",
    "Stamped Curbing",
  ],
  "Post Frame Building": [
    "Metal Roof & Siding",
    "Board & Batten",
    "Wainscot Siding",
    "Stone Veneer Accent",
  ],
  Landscaping: [
    "Mulch Beds",
    "Rock/Gravel Beds",
    "Retaining Walls",
    "Sod Installation",
    "Plantings & Shrubs",
  ],
  "Firewood Delivery": [
    "Seasoned Hardwood",
    "Mixed Hardwood",
    "Oak Only",
    "Cherry/Hickory Mix",
  ],
};

// ── Module 4: Invoicing & Payments ──

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partial"
  | "paid"
  | "overdue"
  | "cancelled";

export const INVOICE_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
  },
  sent: { label: "Sent", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  viewed: {
    label: "Viewed",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  partial: {
    label: "Partial",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  paid: {
    label: "Paid",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  overdue: {
    label: "Overdue",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-slate-500",
    bgColor: "bg-slate-600/20",
  },
};

export type PaymentMethod = "stripe" | "cash" | "check" | "other";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  customer_id: string;
  lead_id: string | null;
  estimate_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  due_date: string;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  stripe_payment_id: string | null;
  notes: string | null;
  created_at: string;
}

// ── Module 5: AI Agents ──

export type AgentType =
  | "lead_followup"
  | "quote_followup"
  | "review_request"
  | "website_chatbot";

export type AgentStatus = "active" | "paused";

export type ApprovalMode = "auto_send" | "requires_approval";

export interface AgentConfig {
  wait_hours: number;
  escalate_after_days: number;
  approval_mode: ApprovalMode;
  message_template: string;
}

export interface AgentAction {
  id: string;
  agent_id: string;
  customer_id: string | null;
  lead_id: string | null;
  action_type: "email_sent" | "sms_sent" | "escalated" | "lead_created" | "review_requested";
  description: string;
  status: "completed" | "pending_approval" | "failed";
  created_at: string;
}

export interface AIAgent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  config: AgentConfig;
  last_run: string | null;
  actions_today: number;
  actions_this_week: number;
  created_at: string;
}

export const AGENT_TYPE_CONFIG: Record<
  AgentType,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  lead_followup: {
    label: "Lead Follow-Up",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: "UserPlus",
  },
  quote_followup: {
    label: "Quote Follow-Up",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    icon: "FileText",
  },
  review_request: {
    label: "Review Request",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    icon: "Star",
  },
  website_chatbot: {
    label: "Website Chatbot",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    icon: "MessageCircle",
  },
};

// ── Module 6: Email Marketing ──

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

export type AutomationStatus = "active" | "paused" | "draft";

export interface MarketingContact {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  tags: string[];
  subscribed: boolean;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "seasonal_promo" | "new_service" | "project_showcase" | "review_request" | "custom";
  merge_fields: string[];
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  template_id: string;
  segment_tags: string[];
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationEmail {
  id: string;
  subject: string;
  body: string;
  delay_days: number;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: AutomationStatus;
  emails: AutomationEmail[];
  enrolled_count: number;
  completed_count: number;
  created_at: string;
}

export const CAMPAIGN_STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Draft", color: "text-slate-400", bgColor: "bg-slate-500/20" },
  scheduled: { label: "Scheduled", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  sending: { label: "Sending", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  sent: { label: "Sent", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
};

export const AUTOMATION_STATUS_CONFIG: Record<
  AutomationStatus,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: "Active", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  paused: { label: "Paused", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  draft: { label: "Draft", color: "text-slate-400", bgColor: "bg-slate-500/20" },
};

// ── Module 3: Vision Studio ──

export interface VisionIteration {
  id: string;
  image_url: string;
  prompt_used: string;
  add_on: string | null;
  created_at: string;
}

export interface VisionProject {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  original_image_url: string;
  service_type: string;
  description: string;
  iterations: VisionIteration[];
  created_at: string;
  updated_at: string;
  customer?: Customer;
}
