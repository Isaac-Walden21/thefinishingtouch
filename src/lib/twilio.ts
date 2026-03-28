/**
 * Twilio SMS client for appointment reminders and confirmations
 */

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

function getConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error("Twilio environment variables not configured");
  }

  return { accountSid, authToken, phoneNumber };
}

/** Send an SMS message via Twilio */
export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const config = getConfig();

  // Normalize phone number to E.164
  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    return { success: false, error: "Invalid phone number" };
  }

  const credentials = Buffer.from(
    `${config.accountSid}:${config.authToken}`
  ).toString("base64");

  try {
    const res = await fetch(
      `${TWILIO_API_BASE}/Accounts/${config.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: normalizedTo,
          From: config.phoneNumber,
          Body: body,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message ?? `Twilio error: ${res.status}`,
      };
    }

    return { success: true, sid: data.sid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMS send failed",
    };
  }
}

/** Send an appointment reminder SMS */
export async function sendAppointmentReminder(event: {
  customer_name: string;
  customer_phone: string;
  start_time: string;
  service_type: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const date = new Date(event.start_time);
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Indiana/Indianapolis",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Indiana/Indianapolis",
  });

  const body = [
    `Hi ${event.customer_name}, this is The Finishing Touch LLC.`,
    `Just a reminder about your ${event.service_type ?? "appointment"} on ${formatted} at ${time}.`,
    `If you need to reschedule, please call us. Thanks!`,
  ].join(" ");

  return sendSMS(event.customer_phone, body);
}

/** Send an appointment confirmation SMS */
export async function sendConfirmation(event: {
  customer_name: string;
  customer_phone: string;
  start_time: string;
  service_type: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const date = new Date(event.start_time);
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Indiana/Indianapolis",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Indiana/Indianapolis",
  });

  const body = [
    `Hi ${event.customer_name}! Your ${event.service_type ?? "appointment"} with The Finishing Touch LLC is confirmed for ${formatted} at ${time}.`,
    `We look forward to seeing you!`,
  ].join(" ");

  return sendSMS(event.customer_phone, body);
}

/** Normalize a US phone number to E.164 format (+1XXXXXXXXXX) */
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (digits.length > 10 && phone.startsWith("+")) {
    return `+${digits}`;
  }

  return null;
}
