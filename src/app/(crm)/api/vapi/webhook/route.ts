import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth";
import { findOrCreateCustomer } from "@/lib/customer-upsert";
import { sendEmail } from "@/lib/send-email";
import {
  qualifiedLeadEmail,
  missedLeadEmail,
  callbackEmail,
  firewoodEmail,
} from "@/lib/email-templates";

const DEFAULT_NOTIFICATION_EMAIL = "evan@thefinishingtouchllc.com";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const body = await request.json();

  const eventType = body.message?.type ?? body.type;
  if (eventType && eventType !== "end-of-call-report") {
    return NextResponse.json({ success: true, skipped: eventType });
  }

  const callId = body.call?.id ?? body.call_id;
  const phoneNumber = body.call?.customer?.number ?? body.phone_number;
  const duration = body.call?.duration ?? body.duration ?? 0;
  const transcriptUrl = body.call?.transcript_url ?? body.transcript_url;
  const endedReason = body.call?.ended_reason ?? body.ended_reason ?? "unknown";

  if (!callId) {
    return NextResponse.json({ error: "No call_id in payload" }, { status: 400 });
  }

  try {
    const { data: existingLead } = await supabase
      .from("leads")
      .select("*, customer:customers(*)")
      .eq("vapi_call_id", callId)
      .limit(1)
      .single();

    const crmBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

    let notificationEmail = DEFAULT_NOTIFICATION_EMAIL;
    if (existingLead?.assigned_to) {
      const { data: member } = await supabase
        .from("team_members")
        .select("notification_email, email")
        .eq("id", existingLead.assigned_to)
        .single();
      if (member) {
        notificationEmail = member.notification_email ?? member.email;
      }
    }

    if (existingLead) {
      await supabase
        .from("leads")
        .update({
          call_transcript_url: transcriptUrl,
          call_duration_seconds: duration,
        })
        .eq("id", existingLead.id);

      const { data: event } = await supabase
        .from("calendar_events")
        .select("*, team_member:team_members(name)")
        .eq("lead_id", existingLead.id)
        .limit(1)
        .single();

      if (event && existingLead.status === "booked") {
        const template = qualifiedLeadEmail({
          customer_name: existingLead.customer?.name ?? "Unknown",
          customer_phone: existingLead.customer?.phone ?? phoneNumber ?? "",
          customer_address: event.customer_address ?? existingLead.customer?.address ?? "",
          service_type: existingLead.project_type ?? "",
          project_description: existingLead.project_description ?? "",
          appointment_time: event.start_time,
          assigned_rep: event.team_member?.name ?? "Unassigned",
          call_duration_seconds: duration,
          transcript_url: transcriptUrl,
          lead_id: existingLead.id,
          crm_base_url: crmBaseUrl,
        });
        await sendEmail(notificationEmail, template.subject, template.html);
      } else if (existingLead.project_type === "Firewood Delivery") {
        const template = firewoodEmail({
          customer_name: existingLead.customer?.name ?? "Unknown",
          customer_phone: existingLead.customer?.phone ?? phoneNumber ?? "",
          message: existingLead.project_description ?? "",
        });
        await sendEmail(notificationEmail, template.subject, template.html);
      } else {
        const template = callbackEmail({
          customer_name: existingLead.customer?.name ?? "Unknown",
          customer_phone: existingLead.customer?.phone ?? phoneNumber ?? "",
          message: existingLead.project_description ?? "",
          service_type: existingLead.project_type,
        });
        await sendEmail(notificationEmail, template.subject, template.html);
      }
    } else {
      if (phoneNumber) {
        const customerId = await findOrCreateCustomer({
          name: "Unknown Caller",
          phone: phoneNumber,
        });

        await supabase.from("leads").insert({
          customer_id: customerId,
          status: "new",
          vapi_call_id: callId,
          call_transcript_url: transcriptUrl,
          call_duration_seconds: duration,
          project_description: `Missed call — ${endedReason}`,
        });
      }

      const template = missedLeadEmail({
        customer_phone: phoneNumber,
        call_duration_seconds: duration,
        ended_reason: endedReason,
      });
      await sendEmail(notificationEmail, template.subject, template.html);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}
