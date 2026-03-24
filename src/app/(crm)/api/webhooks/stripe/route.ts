import { NextResponse } from "next/server";

// POST /api/webhooks/stripe — handle Stripe payment webhooks
export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 400 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  try {
    const stripe = await import("stripe").then(
      (m) => new m.default(stripeSecretKey)
    );

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoice_id;

        if (invoiceId) {
          // In production:
          // 1. Update invoice status to 'paid', set paid_at, payment_method = 'stripe'
          // 2. Create payment record
          // 3. Log activity in CRM
          // 4. Send confirmation email to customer
          // 5. Send notification to TFT team
          console.log(
            `Payment received for invoice ${invoiceId}: ${session.amount_total}`
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        console.log(`Payment failed: ${intent.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }
}
