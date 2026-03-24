import { NextRequest } from "next/server";

function buildEnrichedPrompt(
  serviceType: string,
  description: string,
  addOn: string | null
): string {
  const serviceContext: Record<string, string> = {
    "Concrete Patio":
      "a professionally poured concrete patio with clean edges, proper slope for drainage, and saw-cut control joints",
    "Concrete Driveway":
      "a new concrete driveway with smooth broom finish, proper expansion joints, and clean formed edges",
    "Stamped Concrete":
      "stamped decorative concrete with realistic stone pattern, color hardener, and antiquing release agent for depth",
    "Decorative Curbing":
      "extruded decorative landscape curbing with clean lines and consistent profile along garden beds and walkways",
    "Post Frame Building":
      "a post frame building/pole barn with metal roof and siding, proper overhangs, and concrete apron",
    Landscaping:
      "professional landscaping with layered plantings, mulch beds, defined edges, and seasonal color",
    "Firewood Delivery":
      "neatly stacked seasoned firewood in a covered storage area",
  };

  const context =
    serviceContext[serviceType] ||
    "professional concrete and landscaping work by an experienced contractor";

  let prompt = `Professional architectural visualization of ${context}. `;
  prompt += `Based on this request: "${description}". `;
  prompt += `Realistic materials, proper shadows and lighting matching the existing photo. `;
  prompt += `Seamless integration with surrounding landscape and existing structures. `;
  prompt += `High quality, photorealistic render showing the completed project.`;

  if (addOn) {
    prompt += ` Additionally, include ${addOn} integrated naturally into the scene.`;
  }

  return prompt;
}

function suggestAddOns(serviceType: string): string[] {
  const addOns: Record<string, string[]> = {
    "Concrete Patio": [
      "landscape lighting along the patio edges",
      "flower beds along the border",
      "a built-in fire pit",
      "decorative curbing around the patio",
      "outdoor furniture staged on the patio",
      "a pergola or shade structure",
    ],
    "Concrete Driveway": [
      "landscape lighting along the driveway",
      "decorative curbing along both sides",
      "a stamped concrete border accent",
      "flower beds flanking the driveway entrance",
    ],
    "Stamped Concrete": [
      "landscape lighting highlighting the pattern",
      "a matching stamped concrete walkway",
      "outdoor furniture staged on the surface",
      "a fire pit as the centerpiece",
      "decorative curbing around the edges",
      "potted plants and planters",
    ],
    "Decorative Curbing": [
      "colorful annual flower plantings inside the curbing",
      "landscape lighting along the curbed beds",
      "fresh mulch inside the curbed areas",
      "ornamental grasses and perennials",
    ],
    "Post Frame Building": [
      "a concrete apron in front of the doors",
      "landscape plantings around the foundation",
      "exterior lighting on the building",
      "a gravel parking area",
    ],
    Landscaping: [
      "landscape lighting throughout",
      "a water feature or fountain",
      "a fire pit seating area",
      "decorative curbing around all beds",
      "a stone walkway path",
      "outdoor string lights",
    ],
    "Firewood Delivery": [
      "a firewood storage rack or shed",
      "a covered lean-to for the woodpile",
    ],
  };

  return addOns[serviceType] || addOns["Concrete Patio"];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const serviceType = formData.get("service_type") as string;
    const description = formData.get("description") as string;
    const addOn = formData.get("add_on") as string | null;
    const image = formData.get("image") as File | null;

    if (!serviceType || !description) {
      return Response.json(
        { error: "Service type and description are required" },
        { status: 400 }
      );
    }

    const enrichedPrompt = buildEnrichedPrompt(serviceType, description, addOn);

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Demo mode — return a placeholder response
      const addOns = suggestAddOns(serviceType);
      return Response.json({
        image_url: null,
        prompt_used: enrichedPrompt,
        suggested_add_ons: addOns,
        demo_mode: true,
        message:
          "GEMINI_API_KEY not configured. Set it in your environment variables to enable image generation. Showing prompt preview and add-on suggestions.",
      });
    }

    // Real Gemini API call
    // Upload image if provided, then generate with Gemini
    let imageData: { mimeType: string; data: string } | null = null;
    if (image) {
      const bytes = await image.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      imageData = {
        mimeType: image.type || "image/jpeg",
        data: base64,
      };
    }

    const parts: Record<string, unknown>[] = [];

    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.data,
        },
      });
    }

    parts.push({ text: enrichedPrompt });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return Response.json(
        { error: "Image generation failed" },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const candidate = geminiData.candidates?.[0];
    const responseParts = candidate?.content?.parts || [];

    let generatedImageBase64: string | null = null;
    for (const part of responseParts) {
      if (part.inlineData) {
        generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    const addOns = suggestAddOns(serviceType);

    return Response.json({
      image_url: generatedImageBase64,
      prompt_used: enrichedPrompt,
      suggested_add_ons: addOns,
      demo_mode: false,
    });
  } catch (error) {
    console.error("Vision generation error:", error);
    return Response.json(
      { error: "Failed to generate visualization" },
      { status: 500 }
    );
  }
}
