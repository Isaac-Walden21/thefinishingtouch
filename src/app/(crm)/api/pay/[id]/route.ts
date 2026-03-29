import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/pay/[id] — get invoice data for public payment page
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, customer:customers(id, name, email)")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

// POST /api/pay/[id] — create Stripe Checkout session for invoice payment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "Invoice is already paid" },
      { status: 400 }
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    // Demo mode: return success without Stripe
    return NextResponse.json({
      demo: true,
      message: "Stripe not configured. Running in demo mode.",
      invoice_id: id,
    });
  }

  // Production: create Stripe Checkout Session
  try {
    const stripe = await import("stripe").then(
      (m) => new m.default(stripeSecretKey)
    );

    const origin =
      request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: Array.isArray(invoice.line_items)
                ? invoice.line_items
                    .map((li: { description?: string }) => li.description)
                    .join(", ")
                : "",
            },
            unit_amount: Math.round(invoice.total * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/pay/${id}?success=true`,
      cancel_url: `${origin}/pay/${id}?cancelled=true`,
      metadata: {
        invoice_id: id,
        invoice_number: invoice.invoice_number,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}
