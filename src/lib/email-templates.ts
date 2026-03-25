import { utcToLocalDisplay } from "./timezone";

interface QualifiedLeadData {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  service_type: string;
  project_description: string;
  appointment_time: string;
  assigned_rep: string;
  call_duration_seconds: number;
  transcript_url: string | null;
  lead_id: string;
  crm_base_url: string;
}

interface MissedLeadData {
  customer_phone: string | null;
  call_duration_seconds: number;
  ended_reason: string;
}

interface CallbackData {
  customer_name: string;
  customer_phone: string;
  message: string;
  service_type: string | null;
}

interface FirewoodData {
  customer_name: string;
  customer_phone: string;
  message: string;
}

export function qualifiedLeadEmail(data: QualifiedLeadData) {
  return {
    subject: `New Quote Request — ${data.customer_name} — ${data.service_type}`,
    html: `
      <h2>New Quote Visit Scheduled</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px 0;color:#666;">Customer</td><td style="padding:8px 0;font-weight:600;">${data.customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Address</td><td style="padding:8px 0;">${data.customer_address}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Service</td><td style="padding:8px 0;">${data.service_type}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Description</td><td style="padding:8px 0;">${data.project_description}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Appointment</td><td style="padding:8px 0;font-weight:600;">${utcToLocalDisplay(data.appointment_time)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Assigned To</td><td style="padding:8px 0;">${data.assigned_rep}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Call Duration</td><td style="padding:8px 0;">${Math.round(data.call_duration_seconds / 60)} min</td></tr>
      </table>
      ${data.transcript_url ? `<p style="margin-top:16px;"><a href="${data.transcript_url}">View Full Transcript</a></p>` : ""}
      <p style="margin-top:16px;"><a href="${data.crm_base_url}/leads/${data.lead_id}">View in CRM</a></p>
    `,
  };
}

export function missedLeadEmail(data: MissedLeadData) {
  return {
    subject: `Missed Lead — ${data.customer_phone ?? "Unknown Caller"}`,
    html: `
      <h2>Missed Call</h2>
      <p>A caller did not complete the booking process.</p>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${data.customer_phone ?? "Unknown"}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Call Duration</td><td style="padding:8px 0;">${Math.round(data.call_duration_seconds / 60)} min</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Reason</td><td style="padding:8px 0;">${data.ended_reason}</td></tr>
      </table>
    `,
  };
}

export function callbackEmail(data: CallbackData) {
  return {
    subject: `Callback Requested — ${data.customer_name}`,
    html: `
      <h2>Callback Requested</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px 0;color:#666;">Customer</td><td style="padding:8px 0;font-weight:600;">${data.customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></td></tr>
        ${data.service_type ? `<tr><td style="padding:8px 0;color:#666;">Service</td><td style="padding:8px 0;">${data.service_type}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#666;">Message</td><td style="padding:8px 0;">${data.message}</td></tr>
      </table>
    `,
  };
}

export function firewoodEmail(data: FirewoodData) {
  return {
    subject: `Firewood Order — ${data.customer_name}`,
    html: `
      <h2>Firewood Order</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px 0;color:#666;">Customer</td><td style="padding:8px 0;font-weight:600;">${data.customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Details</td><td style="padding:8px 0;">${data.message}</td></tr>
      </table>
    `,
  };
}
