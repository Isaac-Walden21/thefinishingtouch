import { NextRequest } from "next/server";
import { demoCustomers } from "@/lib/demo-data";

interface JobWalkInput {
  customer_id: string;
  customer_name: string;
  lead_id: string | null;
  project_type: string;
  dimensions: {
    length?: number;
    width?: number;
    depth?: number;
    height?: number;
    square_footage?: number;
    linear_feet?: number;
  };
  materials: string[];
  color_stain: string;
  complexity: "easy" | "moderate" | "difficult";
  options: {
    demolition: boolean;
    grading: boolean;
    sealing: boolean;
  };
  photo_count: number;
  notes: string;
}

// Pricing constants (same as estimates/generate)
const PRICING: Record<string, { min_sqft: number; max_sqft: number; unit: string }> = {
  "Concrete Patio": { min_sqft: 8, max_sqft: 15, unit: "sq ft" },
  "Concrete Driveway": { min_sqft: 8, max_sqft: 15, unit: "sq ft" },
  "Stamped Concrete": { min_sqft: 15, max_sqft: 25, unit: "sq ft" },
  "Decorative Curbing": { min_sqft: 5, max_sqft: 10, unit: "linear ft" },
  "Post Frame Building": { min_sqft: 15, max_sqft: 30, unit: "sq ft" },
  Landscaping: { min_sqft: 0, max_sqft: 0, unit: "project" },
  "Firewood Delivery": { min_sqft: 0, max_sqft: 0, unit: "cord" },
};

const COMPLEXITY_MULTIPLIER = { easy: 1.0, moderate: 1.15, difficult: 1.35 };
const LABOR_RATE = 65;
const MARGIN_PERCENT = 0.25;

function generateEstimateFromWalk(input: JobWalkInput) {
  const pricing = PRICING[input.project_type] || PRICING["Concrete Patio"];
  const complexityMult = COMPLEXITY_MULTIPLIER[input.complexity];

  const sqft = input.dimensions.square_footage || ((input.dimensions.length ?? 0) * (input.dimensions.width ?? 0)) || 0;
  const linearFt = input.dimensions.linear_feet || 0;
  const depth = input.dimensions.depth || 4;

  const lineItems: {
    id: string;
    category: "material" | "labor" | "equipment";
    description: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total: number;
  }[] = [];
  let itemCount = 0;

  // Materials
  if (input.project_type === "Decorative Curbing") {
    const rate = ((pricing.min_sqft + pricing.max_sqft) / 2) * 0.35;
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: `Curbing mix & color additive (${input.materials.join(", ") || "Standard"})`,
      quantity: linearFt,
      unit: "linear ft",
      unit_cost: rate,
      total: Math.round(linearFt * rate),
    });
  } else if (input.project_type === "Firewood Delivery") {
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: `${input.materials.join(", ") || "Seasoned Hardwood"} — firewood`,
      quantity: 1,
      unit: "cord",
      unit_cost: 250,
      total: 250,
    });
  } else if (input.project_type === "Post Frame Building") {
    const matRate = ((pricing.min_sqft + pricing.max_sqft) / 2) * 0.45;
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: `Post frame materials package — ${input.materials.join(", ") || "Metal Roof & Siding"}`,
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
  } else if (input.project_type === "Landscaping") {
    const baseMat = Math.max(2000, sqft * 3);
    const mats = input.materials.length > 0 ? input.materials : ["General Landscaping"];
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
    const cubicYards = Math.ceil((sqft * (depth / 12)) / 27);
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: `Concrete (6-sack mix) — ${sqft} sq ft at ${depth}" depth`,
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
    if (input.project_type === "Stamped Concrete") {
      lineItems.push({
        id: `gen-${++itemCount}`,
        category: "material",
        description: `Stamp mats & color hardener (${input.materials.join(", ") || "Ashlar Slate"})`,
        quantity: 1,
        unit: "set",
        unit_cost: Math.round(sqft * 1.5),
        total: Math.round(sqft * 1.5),
      });
    }
  }

  if (input.options.sealing) {
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
  if (input.options.demolition) {
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

  if (input.options.grading) {
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

  let mainLaborHours: number;
  if (input.project_type === "Decorative Curbing") {
    mainLaborHours = Math.max(4, Math.ceil(linearFt / 15));
  } else if (input.project_type === "Firewood Delivery") {
    mainLaborHours = 2;
  } else if (input.project_type === "Post Frame Building") {
    mainLaborHours = Math.max(40, Math.ceil(sqft / 10));
  } else if (input.project_type === "Landscaping") {
    mainLaborHours = Math.max(24, Math.ceil(sqft / 30));
  } else {
    mainLaborHours = Math.max(8, Math.ceil(sqft / 25));
  }

  mainLaborHours = Math.round(mainLaborHours * complexityMult);

  const mainLaborDesc =
    input.project_type === "Post Frame Building"
      ? "Construction, framing & finishing"
      : input.project_type === "Landscaping"
        ? "Installation & planting"
        : input.project_type === "Decorative Curbing"
          ? "Layout, extrude & finish curbing"
          : input.project_type === "Firewood Delivery"
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
  if (input.project_type !== "Firewood Delivery") {
    if (input.project_type === "Post Frame Building" || input.project_type === "Landscaping") {
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
    } else if (input.project_type === "Decorative Curbing") {
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
      if (sqft > 400 || input.options.demolition) {
        lineItems.push({
          id: `gen-${++itemCount}`,
          category: "equipment",
          description: "Skid steer rental",
          quantity: input.options.demolition ? 2 : 1,
          unit: "days",
          unit_cost: 350,
          total: (input.options.demolition ? 2 : 1) * 350,
        });
      }
    }
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const margin = Math.round(subtotal * MARGIN_PERCENT);
  const total = subtotal + margin;

  let timeline: string;
  if (input.project_type === "Firewood Delivery") {
    timeline = "Same-day or next-day delivery";
  } else if (input.project_type === "Decorative Curbing") {
    timeline = linearFt > 200 ? "2 days on site" : "1 day on site";
  } else if (input.project_type === "Post Frame Building") {
    const weeks = Math.max(2, Math.ceil(sqft / 400));
    timeline = `${weeks}-${weeks + 2} weeks, weather permitting`;
  } else {
    const days = Math.max(1, Math.ceil(mainLaborHours / 8));
    timeline = `${days}-${days + 1} days on site, weather permitting`;
  }

  return { line_items: lineItems, subtotal, margin, total, timeline };
}

function generateAIFlags(input: JobWalkInput, total: number): Array<{
  id: string;
  type: "warning" | "suggestion" | "info";
  message: string;
  action: string | null;
  dismissed: boolean;
}> {
  const flags: Array<{
    id: string;
    type: "warning" | "suggestion" | "info";
    message: string;
    action: string | null;
    dismissed: boolean;
  }> = [];
  let flagCount = 0;

  const sqft = input.dimensions.square_footage || ((input.dimensions.length ?? 0) * (input.dimensions.width ?? 0)) || 0;
  const pricing = PRICING[input.project_type];

  // Sanity check — compare against typical ranges
  if (pricing && sqft > 0 && pricing.min_sqft > 0) {
    const typicalMin = sqft * pricing.min_sqft;
    const typicalMax = sqft * pricing.max_sqft;
    if (total < typicalMin * 0.7) {
      flags.push({
        id: `flag-${++flagCount}`,
        type: "warning",
        message: `Total of $${total.toLocaleString()} is below typical range ($${typicalMin.toLocaleString()}-$${typicalMax.toLocaleString()}) for ${sqft} sq ft ${input.project_type}. Verify dimensions.`,
        action: null,
        dismissed: false,
      });
    }
    if (total > typicalMax * 1.5) {
      flags.push({
        id: `flag-${++flagCount}`,
        type: "warning",
        message: `Total of $${total.toLocaleString()} is above typical range ($${typicalMin.toLocaleString()}-$${typicalMax.toLocaleString()}). Double-check inputs.`,
        action: null,
        dismissed: false,
      });
    }
  }

  // Suggest sealing if not selected
  if (!input.options.sealing && ["Concrete Patio", "Stamped Concrete", "Concrete Driveway"].includes(input.project_type)) {
    flags.push({
      id: `flag-${++flagCount}`,
      type: "suggestion",
      message: "Consider adding sealing — extends lifespan 3-5 years and protects the finish.",
      action: "add_sealing",
      dismissed: false,
    });
  }

  // Demolition + large area warning
  if (input.options.demolition && sqft > 500) {
    flags.push({
      id: `flag-${++flagCount}`,
      type: "info",
      message: `Large demolition area (${sqft} sq ft) — verify equipment access for skid steer and haul-off truck.`,
      action: null,
      dismissed: false,
    });
  }

  // Stamped concrete without color
  if (input.project_type === "Stamped Concrete" && !input.color_stain) {
    flags.push({
      id: `flag-${++flagCount}`,
      type: "suggestion",
      message: "No color/stain specified for stamped concrete. Add color selection before sending to customer.",
      action: null,
      dismissed: false,
    });
  }

  // Difficult complexity note
  if (input.complexity === "difficult") {
    flags.push({
      id: `flag-${++flagCount}`,
      type: "info",
      message: "Difficult access selected — 35% complexity multiplier applied to labor. Review if appropriate.",
      action: null,
      dismissed: false,
    });
  }

  return flags;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as JobWalkInput;

    if (!body.project_type) {
      return Response.json({ error: "Project type is required" }, { status: 400 });
    }
    if (!body.customer_id) {
      return Response.json({ error: "Customer is required" }, { status: 400 });
    }

    // Generate estimate using rule engine
    const estimate = generateEstimateFromWalk(body);

    // Generate AI flags
    const aiFlags = generateAIFlags(body, estimate.total);

    // Look up customer name
    const customer = demoCustomers.find((c) => c.id === body.customer_id);

    // Build the job walk + estimate response
    const jobWalkId = `jw-${Date.now()}`;
    const estimateId = `est-${Date.now()}`;
    const now = new Date().toISOString();

    const jobWalk = {
      id: jobWalkId,
      customer_id: body.customer_id,
      customer_name: customer?.name ?? body.customer_name,
      lead_id: body.lead_id,
      estimate_id: estimateId,
      project_type: body.project_type,
      dimensions: body.dimensions,
      materials: body.materials,
      color_stain: body.color_stain,
      complexity: body.complexity,
      options: body.options,
      photos: [],
      notes: body.notes,
      ai_flags: aiFlags,
      status: "estimated" as const,
      created_by: "tm-1",
      created_at: now,
      updated_at: now,
    };

    const estimateRecord = {
      id: estimateId,
      customer_id: body.customer_id,
      customer_name: customer?.name ?? body.customer_name,
      status: "draft" as const,
      project_type: body.project_type,
      dimensions: body.dimensions,
      materials: body.materials,
      complexity: body.complexity,
      options: {
        demolition: body.options.demolition,
        grading: body.options.grading,
        sealing: body.options.sealing,
        color_stain: body.color_stain,
      },
      line_items: estimate.line_items,
      subtotal: estimate.subtotal,
      margin: estimate.margin,
      total: estimate.total,
      timeline: estimate.timeline,
      notes: body.notes,
      created_at: now,
      updated_at: now,
    };

    // In production: save to Supabase
    // For now: return the generated data for the client to use
    return Response.json({
      id: jobWalkId,
      job_walk: jobWalk,
      estimate: estimateRecord,
    });
  } catch (error) {
    console.error("Job walk submission error:", error);
    return Response.json({ error: "Failed to process job walk" }, { status: 500 });
  }
}
