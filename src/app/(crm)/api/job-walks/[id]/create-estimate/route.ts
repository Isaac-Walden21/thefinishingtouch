import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, logAudit } from "@/lib/audit";

// POST /api/job-walks/[id]/create-estimate — create estimate from job walk data
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch job walk with customer
  const { data: walk } = await supabase
    .from("job_walks")
    .select("*, customer:customers(id, name, email, phone, address)")
    .eq("id", id)
    .single();

  if (!walk) {
    return NextResponse.json(
      { error: "Job walk not found" },
      { status: 404 }
    );
  }

  if (walk.status === "estimated") {
    return NextResponse.json(
      { error: "Estimate already created from this job walk" },
      { status: 400 }
    );
  }

  const measurements = walk.measurements as Record<string, unknown> ?? {};
  const siteConditions = walk.site_conditions as Record<string, unknown> ?? {};
  const preferences = walk.customer_preferences as Record<string, unknown> ?? {};

  // Derive estimate inputs from job walk data
  const totalSqft = (measurements.total_sqft as number) || 0;
  const linearFeet = (measurements.linear_feet as number) || 0;
  const areas = (measurements.areas as Array<{ depth?: number }>) || [];
  const avgDepth =
    areas.length > 0
      ? areas.reduce((sum, a) => sum + (a.depth || 4), 0) / areas.length
      : 4;

  const projectDescription = (preferences.description as string) || "";
  const material = (preferences.material as string) || "";
  const colorFinish = (preferences.color_finish as string) || "";

  // Map description to a project type
  const projectType = inferProjectType(projectDescription, material);

  // Map site conditions to complexity
  const complexity = inferComplexity(siteConditions);

  // Build generate-estimate compatible input and call generate logic inline
  const demolition = !!(siteConditions.demolition_required);
  const grading = !!(siteConditions.grading_required);

  // Generate line items using the same pricing logic as /api/estimates/generate
  const result = generateEstimateFromWalk({
    project_type: projectType,
    sqft: totalSqft,
    linear_feet: linearFeet,
    depth: avgDepth,
    materials: material ? [material] : [],
    complexity,
    demolition,
    grading,
    sealing: projectType.includes("Stamped") || projectType.includes("Decorative"),
    color_stain: colorFinish,
  });

  // Create the estimate record
  const customerName = walk.customer?.name ?? "Customer";
  const { data: estimate, error: estimateError } = await supabase
    .from("estimates")
    .insert({
      customer_id: walk.customer_id,
      customer_name: customerName,
      project_type: projectType,
      dimensions: {
        length: areas[0]?.length ?? undefined,
        width: areas[0]?.width ?? undefined,
        depth: avgDepth,
        square_footage: totalSqft,
        linear_feet: linearFeet || undefined,
      },
      materials: material ? [material] : [],
      complexity,
      options: {
        demolition,
        grading,
        sealing: result.sealing,
        color_stain: colorFinish,
      },
      line_items: result.line_items,
      subtotal: result.subtotal,
      margin: result.margin,
      total: result.total,
      timeline: result.timeline,
      notes: buildNotes(walk),
      job_walk_id: id,
    })
    .select("*")
    .single();

  if (estimateError) {
    return NextResponse.json({ error: estimateError.message }, { status: 500 });
  }

  // Update job walk status to "estimated"
  await supabase
    .from("job_walks")
    .update({ status: "estimated" })
    .eq("id", id);

  await logActivity({
    customer_id: walk.customer_id,
    lead_id: walk.lead_id ?? null,
    type: "quote",
    description: `Estimate created from job walk for ${customerName} — $${result.total}`,
    created_by: walk.created_by ?? null,
  });

  await logAudit({
    action: "estimate_created_from_job_walk",
    category: "estimates",
    entity_type: "estimate",
    entity_id: estimate.id,
    new_value: { job_walk_id: id, total: result.total },
  });

  return NextResponse.json({ estimate_id: estimate.id, estimate }, { status: 201 });
}

// ── Pricing constants (mirrors /api/estimates/generate) ──

const LABOR_RATE = 65;
const MARGIN_PERCENT = 0.25;

const COMPLEXITY_MULTIPLIER = {
  easy: 1.0,
  moderate: 1.15,
  difficult: 1.35,
};

interface LineItem {
  id: string;
  category: "material" | "labor" | "equipment";
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total: number;
}

interface GenerateInput {
  project_type: string;
  sqft: number;
  linear_feet: number;
  depth: number;
  materials: string[];
  complexity: "easy" | "moderate" | "difficult";
  demolition: boolean;
  grading: boolean;
  sealing: boolean;
  color_stain: string;
}

function generateEstimateFromWalk(input: GenerateInput) {
  const { project_type, sqft, linear_feet, depth, materials, complexity, demolition, grading, sealing } = input;
  const complexityMult = COMPLEXITY_MULTIPLIER[complexity];
  const lineItems: LineItem[] = [];
  let itemCount = 0;

  // Materials
  if (project_type === "Decorative Curbing") {
    const rate = 7.5 * 0.35;
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: `Curbing mix & color additive (${materials.join(", ") || "standard"})`,
      quantity: linear_feet,
      unit: "linear ft",
      unit_cost: rate,
      total: Math.round(linear_feet * rate),
    });
  } else if (project_type === "Firewood Delivery") {
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: `${materials.join(", ") || "Seasoned Hardwood"} - firewood`,
      quantity: 1,
      unit: "cord",
      unit_cost: 250,
      total: 250,
    });
  } else if (project_type === "Post Frame Building") {
    const matRate = 22.5 * 0.45;
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: `Post frame materials package - ${materials.join(", ") || "standard"}`,
      quantity: sqft,
      unit: "sq ft",
      unit_cost: Math.round(matRate * 100) / 100,
      total: Math.round(sqft * matRate),
    });
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: "Concrete for footings & floor",
      quantity: Math.ceil(sqft / 80),
      unit: "yards",
      unit_cost: 165,
      total: Math.ceil(sqft / 80) * 165,
    });
  } else if (project_type === "Landscaping") {
    const baseMat = Math.max(2000, sqft * 3);
    const mats = materials.length > 0 ? materials : ["Landscaping materials"];
    mats.forEach((mat) => {
      const portion = baseMat / mats.length;
      lineItems.push({
        id: `gen-${++itemCount}`,
        category: "material",
        description: mat,
        quantity: 1,
        unit: "lot",
        unit_cost: Math.round(portion),
        total: Math.round(portion),
      });
    });
  } else {
    // Concrete patio / driveway / stamped
    const cubicYards = Math.ceil((sqft * (depth / 12)) / 27);
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: `Concrete (6-sack mix) - ${sqft} sq ft at ${depth}" depth`,
      quantity: cubicYards,
      unit: "yards",
      unit_cost: 165,
      total: cubicYards * 165,
    });
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: "Rebar & mesh reinforcement",
      quantity: sqft,
      unit: "sq ft",
      unit_cost: 1.25,
      total: Math.round(sqft * 1.25),
    });
    if (project_type === "Stamped Concrete") {
      lineItems.push({
        id: `gen-${++itemCount}`,
        category: "material",
        description: `Stamp mats & color hardener (${materials.join(", ") || "standard"})`,
        quantity: 1,
        unit: "set",
        unit_cost: Math.round(sqft * 1.5),
        total: Math.round(sqft * 1.5),
      });
    }
  }

  if (sealing) {
    const gallons = Math.max(2, Math.ceil(sqft / 70));
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: "Acrylic sealer (2 coats)",
      quantity: gallons,
      unit: "gallons",
      unit_cost: 45,
      total: gallons * 45,
    });
  }

  // Labor
  if (demolition) {
    const demoHours = Math.max(4, Math.ceil(sqft / 50));
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "labor",
      description: "Demolition & haul-off",
      quantity: demoHours,
      unit: "hours",
      unit_cost: LABOR_RATE,
      total: demoHours * LABOR_RATE,
    });
  }

  if (grading) {
    const gradeHours = Math.max(4, Math.ceil(sqft / 80));
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "labor",
      description: "Excavation & grading",
      quantity: gradeHours,
      unit: "hours",
      unit_cost: LABOR_RATE,
      total: gradeHours * LABOR_RATE,
    });
  }

  // Main labor
  let mainLaborHours: number;
  if (project_type === "Decorative Curbing") {
    mainLaborHours = Math.max(4, Math.ceil(linear_feet / 15));
  } else if (project_type === "Firewood Delivery") {
    mainLaborHours = 2;
  } else if (project_type === "Post Frame Building") {
    mainLaborHours = Math.max(40, Math.ceil(sqft / 10));
  } else if (project_type === "Landscaping") {
    mainLaborHours = Math.max(24, Math.ceil(sqft / 30));
  } else {
    mainLaborHours = Math.max(8, Math.ceil(sqft / 25));
  }

  mainLaborHours = Math.round(mainLaborHours * complexityMult);

  const mainLaborDesc =
    project_type === "Post Frame Building"
      ? "Construction, framing & finishing"
      : project_type === "Landscaping"
        ? "Installation & planting"
        : project_type === "Decorative Curbing"
          ? "Layout, extrude & finish curbing"
          : project_type === "Firewood Delivery"
            ? "Delivery & stacking"
            : "Forming, pouring & finishing";

  lineItems.push({
    id: `gen-${++itemCount}`,
    category: "labor",
    description: mainLaborDesc,
    quantity: mainLaborHours,
    unit: "hours",
    unit_cost: LABOR_RATE,
    total: mainLaborHours * LABOR_RATE,
  });

  // Equipment
  if (project_type !== "Firewood Delivery") {
    if (project_type === "Post Frame Building" || project_type === "Landscaping") {
      const days = Math.max(1, Math.ceil(mainLaborHours / 24));
      lineItems.push({
        id: `gen-${++itemCount}`,
        category: "equipment",
        description: "Mini excavator / skid steer rental",
        quantity: days,
        unit: "days",
        unit_cost: 400,
        total: days * 400,
      });
    } else if (project_type === "Decorative Curbing") {
      lineItems.push({
        id: `gen-${++itemCount}`,
        category: "equipment",
        description: "Curbing machine",
        quantity: 1,
        unit: "day",
        unit_cost: 200,
        total: 200,
      });
    } else {
      lineItems.push({
        id: `gen-${++itemCount}`,
        category: "equipment",
        description: "Concrete pump truck",
        quantity: 1,
        unit: "trip",
        unit_cost: 450,
        total: 450,
      });
      if (sqft > 400 || demolition) {
        lineItems.push({
          id: `gen-${++itemCount}`,
          category: "equipment",
          description: "Skid steer rental",
          quantity: demolition ? 2 : 1,
          unit: "days",
          unit_cost: 350,
          total: (demolition ? 2 : 1) * 350,
        });
      }
    }
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const margin = Math.round(subtotal * MARGIN_PERCENT);
  const total = subtotal + margin;

  // Timeline
  let timeline: string;
  if (project_type === "Firewood Delivery") {
    timeline = "Same-day or next-day delivery";
  } else if (project_type === "Decorative Curbing") {
    timeline = linear_feet > 200 ? "2 days on site" : "1 day on site";
  } else if (project_type === "Post Frame Building") {
    const weeks = Math.max(2, Math.ceil(sqft / 400));
    timeline = `${weeks}-${weeks + 2} weeks, weather permitting`;
  } else {
    const days = Math.max(1, Math.ceil(mainLaborHours / 8));
    timeline = `${days}-${days + 1} days on site, weather permitting`;
  }

  return { line_items: lineItems, subtotal, margin, total, timeline, sealing };
}

/** Infer project type from description and material fields */
function inferProjectType(description: string, material: string): string {
  const text = `${description} ${material}`.toLowerCase();
  if (text.includes("stamp")) return "Stamped Concrete";
  if (text.includes("curb")) return "Decorative Curbing";
  if (text.includes("drive")) return "Concrete Driveway";
  if (text.includes("post frame") || text.includes("pole barn")) return "Post Frame Building";
  if (text.includes("landscap") || text.includes("mulch") || text.includes("plant")) return "Landscaping";
  if (text.includes("firewood")) return "Firewood Delivery";
  if (text.includes("patio")) return "Concrete Patio";
  // Default to concrete patio
  return "Concrete Patio";
}

/** Map site conditions to complexity */
function inferComplexity(
  conditions: Record<string, unknown>
): "easy" | "moderate" | "difficult" {
  let score = 0;
  if (conditions.demolition_required) score += 2;
  if (conditions.grading_required) score += 1;
  if (conditions.access === "difficult") score += 2;
  if (conditions.access === "moderate") score += 1;
  if (conditions.drainage === "standing_water" || conditions.drainage === "needs_french_drain") score += 1;
  if (conditions.soil_type === "rocky") score += 1;
  if (conditions.permit_needed === "yes") score += 1;
  if ((conditions.obstacles as string[])?.length > 2) score += 1;

  if (score >= 4) return "difficult";
  if (score >= 2) return "moderate";
  return "easy";
}

/** Build notes from job walk data for the estimate */
function buildNotes(walk: Record<string, unknown>): string {
  const parts: string[] = [];
  const conditions = walk.site_conditions as Record<string, unknown> ?? {};
  const prefs = walk.customer_preferences as Record<string, unknown> ?? {};

  if (conditions.notes) {
    parts.push(`Site notes: ${conditions.notes}`);
  }
  if (prefs.description) {
    parts.push(`Customer request: ${prefs.description}`);
  }
  if (conditions.utility_lines === "need_811") {
    parts.push("NOTE: 811 utility locate required before work begins");
  }
  if (conditions.permit_needed === "yes") {
    parts.push("NOTE: Permit required");
  }
  if (conditions.permit_needed === "unsure") {
    parts.push("NOTE: Permit requirement needs verification");
  }

  parts.push(`Generated from job walk ${walk.id}`);
  return parts.join("\n");
}
