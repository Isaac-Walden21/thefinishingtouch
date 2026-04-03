import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

interface GenerateEstimateInput {
  project_type: string;
  length?: number;
  width?: number;
  depth?: number;
  linear_feet?: number;
  square_footage?: number;
  materials: string[];
  complexity: "easy" | "moderate" | "difficult";
  options: {
    demolition: boolean;
    grading: boolean;
    sealing: boolean;
    color_stain: string;
  };
  notes: string;
}

const PRICING: Record<
  string,
  { min_sqft: number; max_sqft: number; unit: string }
> = {
  "Concrete Patio": { min_sqft: 8, max_sqft: 15, unit: "sq ft" },
  "Concrete Driveway": { min_sqft: 8, max_sqft: 15, unit: "sq ft" },
  "Stamped Concrete": { min_sqft: 15, max_sqft: 25, unit: "sq ft" },
  "Decorative Curbing": { min_sqft: 5, max_sqft: 10, unit: "linear ft" },
  "Post Frame Building": { min_sqft: 15, max_sqft: 30, unit: "sq ft" },
  Landscaping: { min_sqft: 0, max_sqft: 0, unit: "project" },
  "Firewood Delivery": { min_sqft: 0, max_sqft: 0, unit: "cord" },
};

const COMPLEXITY_MULTIPLIER = {
  easy: 1.0,
  moderate: 1.15,
  difficult: 1.35,
};

const LABOR_RATE = 65;
const MARGIN_PERCENT = 0.25;

function generateEstimate(input: GenerateEstimateInput) {
  const pricing = PRICING[input.project_type] || PRICING["Concrete Patio"];
  const complexityMult = COMPLEXITY_MULTIPLIER[input.complexity];

  const sqft =
    input.square_footage ||
    (input.length && input.width ? input.length * input.width : 0);
  const linearFt = input.linear_feet || 0;
  const depth = input.depth || 4;

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
      description: `Curbing mix & color additive (${input.materials.join(", ")})`,
      quantity: linearFt,
      unit: "linear ft",
      unit_cost: rate,
      total: Math.round(linearFt * rate),
    });
  } else if (input.project_type === "Firewood Delivery") {
    lineItems.push({
      id: `gen-${++itemCount}`,
      category: "material",
      description: `${input.materials.join(", ")} — firewood`,
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
      description: `Post frame materials package — ${input.materials.join(", ")}`,
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
    input.materials.forEach((mat) => {
      const portion = baseMat / input.materials.length;
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
        description: `Stamp mats & color hardener (${input.materials.join(", ")})`,
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

  // Main labor
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
    if (
      input.project_type === "Post Frame Building" ||
      input.project_type === "Landscaping"
    ) {
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

  // Timeline
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();

  try {
    const body = (await request.json()) as GenerateEstimateInput;

    if (!body.project_type) {
      return Response.json(
        { error: "Project type is required" },
        { status: 400 }
      );
    }

    const result = generateEstimate(body);

    return Response.json(result);
  } catch (error) {
    console.error("Estimate generation error:", error);
    return Response.json(
      { error: "Failed to generate estimate" },
      { status: 500 }
    );
  }

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
