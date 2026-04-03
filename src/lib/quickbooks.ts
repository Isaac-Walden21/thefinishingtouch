/**
 * QuickBooks Online API client — multi-tenant OAuth2 integration
 * Per-company tokens stored in the companies table
 */

import { supabaseAdmin } from "@/lib/supabase";

const QB_BASE_URL = "https://quickbooks.api.intuit.com/v3";
const QB_SANDBOX_URL = "https://sandbox-quickbooks.api.intuit.com/v3";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

function getAppCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("QuickBooks app credentials not configured");
  }

  return { clientId, clientSecret };
}

function getBaseUrl(): string {
  const sandbox = process.env.QUICKBOOKS_SANDBOX === "true";
  return sandbox ? QB_SANDBOX_URL : QB_BASE_URL;
}

/** Refresh a company's QB tokens via Intuit token endpoint */
export async function refreshCompanyToken(
  companyId: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const { data: company, error } = await supabaseAdmin
    .from("companies")
    .select("qb_refresh_token")
    .eq("id", companyId)
    .single();

  if (error || !company?.qb_refresh_token) {
    throw new Error("Company has no QuickBooks refresh token");
  }

  const { clientId, clientSecret } = getAppCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: company.qb_refresh_token,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QuickBooks token refresh failed: ${err}`);
  }

  const tokens = await res.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const { error: updateError } = await supabaseAdmin
    .from("companies")
    .update({
      qb_access_token: tokens.access_token,
      qb_refresh_token: tokens.refresh_token,
      qb_token_expires_at: expiresAt.toISOString(),
    })
    .eq("id", companyId);

  if (updateError) {
    throw new Error(`Failed to save refreshed QB tokens: ${updateError.message}`);
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  };
}

/** Fetch a company's QB tokens, auto-refreshing if expiring within 5 minutes */
export async function getCompanyQBTokens(
  companyId: string
): Promise<{ realmId: string; accessToken: string; refreshToken: string; expiresAt: Date }> {
  const { data: company, error } = await supabaseAdmin
    .from("companies")
    .select("qb_realm_id, qb_access_token, qb_refresh_token, qb_token_expires_at")
    .eq("id", companyId)
    .single();

  if (error || !company?.qb_realm_id || !company?.qb_access_token || !company?.qb_refresh_token) {
    throw new Error("Company has no QuickBooks connection");
  }

  const expiresAt = new Date(company.qb_token_expires_at);
  const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt < fiveMinFromNow) {
    const refreshed = await refreshCompanyToken(companyId);
    return { realmId: company.qb_realm_id, ...refreshed };
  }

  return {
    realmId: company.qb_realm_id,
    accessToken: company.qb_access_token,
    refreshToken: company.qb_refresh_token,
    expiresAt,
  };
}

/** Generate the QuickBooks OAuth2 authorization URL for a company */
export function connectQB(companyId: string): string {
  const { clientId } = getAppCredentials();
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/qb/callback`;
  const scopes = "com.intuit.quickbooks.accounting";
  const state = JSON.stringify({ companyId, nonce: crypto.randomUUID() });

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });

  return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
}

interface QBApiOptions {
  accessToken: string;
  realmId: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
}

async function qbApi(path: string, options: QBApiOptions) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/company/${options.realmId}${path}`;

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QuickBooks API error (${res.status}): ${err}`);
  }

  return res.json();
}

/** Map CRM invoice to QuickBooks invoice format */
function mapInvoiceToQB(invoice: {
  customer_name: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  due_date: string;
  invoice_number: string;
  notes: string | null;
}, qbCustomerId: string) {
  return {
    CustomerRef: { value: qbCustomerId },
    DocNumber: invoice.invoice_number,
    DueDate: invoice.due_date,
    Line: invoice.line_items.map((item, i) => ({
      Id: String(i + 1),
      LineNum: i + 1,
      Amount: item.total,
      DetailType: "SalesItemLineDetail",
      Description: item.description,
      SalesItemLineDetail: {
        Qty: item.quantity,
        UnitPrice: item.unit_price,
      },
    })),
    CustomerMemo: invoice.notes ? { value: invoice.notes } : undefined,
  };
}

/** Push a single invoice to QuickBooks */
export async function pushInvoice(
  companyId: string,
  invoice: {
    customer_name: string;
    line_items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    due_date: string;
    invoice_number: string;
    notes: string | null;
  },
  qbCustomerId: string
) {
  const { accessToken, realmId } = await getCompanyQBTokens(companyId);
  const qbInvoice = mapInvoiceToQB(invoice, qbCustomerId);
  return qbApi("/invoice", {
    accessToken,
    realmId,
    method: "POST",
    body: qbInvoice,
  });
}

/** Push a payment record to QuickBooks */
export async function pushPayment(
  companyId: string,
  payment: {
    amount: number;
    invoice_id: string;
    method: string;
    notes: string | null;
  },
  qbInvoiceId: string,
  qbCustomerId: string
) {
  const { accessToken, realmId } = await getCompanyQBTokens(companyId);
  return qbApi("/payment", {
    accessToken,
    realmId,
    method: "POST",
    body: {
      CustomerRef: { value: qbCustomerId },
      TotalAmt: payment.amount,
      Line: [
        {
          Amount: payment.amount,
          LinkedTxn: [
            {
              TxnId: qbInvoiceId,
              TxnType: "Invoice",
            },
          ],
        },
      ],
      PrivateNote: payment.notes ?? undefined,
    },
  });
}

/** Query QuickBooks for a customer by name, create if not found */
export async function findOrCreateQBCustomer(
  companyId: string,
  name: string,
  email?: string | null
) {
  const { accessToken, realmId } = await getCompanyQBTokens(companyId);
  const query = `SELECT * FROM Customer WHERE DisplayName = '${name.replace(/'/g, "\\'")}'`;
  const result = await qbApi(`/query?query=${encodeURIComponent(query)}`, {
    accessToken,
    realmId,
  });

  const existing = result.QueryResponse?.Customer?.[0];
  if (existing) return existing.Id;

  const newCustomer = await qbApi("/customer", {
    accessToken,
    realmId,
    method: "POST",
    body: {
      DisplayName: name,
      PrimaryEmailAddr: email ? { Address: email } : undefined,
    },
  });

  return newCustomer.Customer.Id;
}

/** Sync all unsynced invoices to QuickBooks */
export async function syncAllUnsynced(
  companyId: string,
  invoices: Array<{
    id: string;
    customer_name: string;
    customer_email?: string | null;
    line_items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    due_date: string;
    invoice_number: string;
    notes: string | null;
  }>
): Promise<{ synced: number; errors: Array<{ id: string; error: string }> }> {
  const errors: Array<{ id: string; error: string }> = [];
  let synced = 0;

  for (const invoice of invoices) {
    try {
      const qbCustomerId = await findOrCreateQBCustomer(
        companyId,
        invoice.customer_name,
        invoice.customer_email
      );
      await pushInvoice(companyId, invoice, qbCustomerId);
      synced++;
    } catch (error) {
      errors.push({
        id: invoice.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { synced, errors };
}
