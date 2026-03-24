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
