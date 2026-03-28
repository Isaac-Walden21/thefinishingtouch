import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/send-email";
import { logActivity } from "@/lib/audit";

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
          const amountPaid = (session.amount_total ?? 0) / 100;

          // 1. Update invoice status
          await supabase
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "stripe",
              stripe_payment_intent_id: session.payment_intent as string ?? null,
            })
            .eq("id", invoiceId);

          // 2. Create payment record
          await supabase.from("payments").insert({
            invoice_id: invoiceId,
            amount: amountPaid,
            method: "stripe",
            stripe_payment_id: session.payment_intent as string ?? null,
          });

          // 3. Log activity
          const { data: invoice } = await supabase
            .from("invoices")
            .select("*, customer:customers(id, name, email)")
            .eq("id", invoiceId)
            .single();

          if (invoice) {
            await logActivity({
              customer_id: invoice.customer_id,
              type: "payment",
              description: `Payment of $${amountPaid.toLocaleString()} received via Stripe for invoice ${invoice.invoice_number}`,
            });

            // 4. Send receipt email to customer
            if (invoice.customer?.email) {
              await sendEmail(
                invoice.customer.email,
                `Payment Receipt — Invoice ${invoice.invoice_number}`,
                `
                  <h2>Payment Received</h2>
                  <p>Hi ${invoice.customer?.name},</p>
                  <p>We have received your payment of <strong>$${amountPaid.toLocaleString()}</strong> for invoice <strong>${invoice.invoice_number}</strong>.</p>
                  <table style="border-collapse:collapse;width:100%;max-width:400px;margin-top:16px;">
                    <tr><td style="padding:6px 0;color:#666;">Invoice</td><td style="padding:6px 0;">${invoice.invoice_number}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Amount</td><td style="padding:6px 0;">$${amountPaid.toLocaleString()}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Date</td><td style="padding:6px 0;">${new Date().toLocaleDateString()}</td></tr>
                    <tr><td style="padding:6px 0;color:#666;">Method</td><td style="padding:6px 0;">Card (Stripe)</td></tr>
                  </table>
                  <p style="margin-top:24px;color:#666;">Thank you for your business!<br/>The Finishing Touch LLC</p>
                `
              );
            }

            // 5. Send notification to TFT team
            const { data: teamMembers } = await supabase
              .from("team_members")
              .select("notification_email, email")
              .eq("role", "admin")
              .eq("is_active", true);

            for (const member of teamMembers ?? []) {
              const notifyEmail = member.notification_email ?? member.email;
              if (notifyEmail) {
                await sendEmail(
                  notifyEmail,
                  `Payment Received — ${invoice.invoice_number} — $${amountPaid.toLocaleString()}`,
                  `
                    <h2>Payment Received</h2>
                    <table style="border-collapse:collapse;">
                      <tr><td style="padding:6px 12px 6px 0;color:#666;">Customer</td><td>${invoice.customer?.name}</td></tr>
                      <tr><td style="padding:6px 12px 6px 0;color:#666;">Invoice</td><td>${invoice.invoice_number}</td></tr>
                      <tr><td style="padding:6px 12px 6px 0;color:#666;">Amount</td><td>$${amountPaid.toLocaleString()}</td></tr>
                    </table>
                  `
                );
              }
            }

            // 6. Auto-push to QuickBooks if connected
            try {
              const { data: qbIntegration } = await supabase
                .from("integrations")
                .select("status")
                .eq("provider", "quickbooks")
                .single();

              if (qbIntegration?.status === "connected") {
                // Trigger async QB sync — fire and forget
                const appUrl = process.env.NEXT_PUBLIC_APP_URL;
                if (appUrl) {
                  fetch(`${appUrl}/api/invoices/qb-sync`, { method: "POST" }).catch(() => {
                    console.log("QB sync triggered but no response needed in webhook");
                  });
                }
              }
            } catch {
              // QB sync is optional, don't fail the webhook
            }
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const invoiceId = intent.metadata?.invoice_id;
        console.log(`Payment failed: ${intent.id}`);

        if (invoiceId) {
          await logActivity({
            type: "payment",
            description: `Payment failed for invoice ${invoiceId}: ${intent.last_payment_error?.message ?? "Unknown error"}`,
          });
        }
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
