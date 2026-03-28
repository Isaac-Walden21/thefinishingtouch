/**
 * QuickBooks Online API client — OAuth2-based integration
 * Handles invoice/payment sync between CRM and QBO
 */

const QB_BASE_URL = "https://quickbooks.api.intuit.com/v3";
const QB_SANDBOX_URL = "https://sandbox-quickbooks.api.intuit.com/v3";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

function getConfig() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const realmId = process.env.QUICKBOOKS_REALM_ID;
  const refreshToken = process.env.QUICKBOOKS_REFRESH_TOKEN;
  const sandbox = process.env.QUICKBOOKS_SANDBOX === "true";

  if (!clientId || !clientSecret || !realmId || !refreshToken) {
    throw new Error("QuickBooks environment variables not configured");
  }

  return { clientId, clientSecret, realmId, refreshToken, sandbox };
}

function getBaseUrl(sandbox: boolean): string {
  return sandbox ? QB_SANDBOX_URL : QB_BASE_URL;
}

/** Exchange refresh token for a new access token */
export async function refreshToken(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const config = getConfig();
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QuickBooks token refresh failed: ${err}`);
  }

  return res.json();
}

/** Generate the QuickBooks OAuth2 authorization URL */
export function connectQB(): string {
  const config = getConfig();
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/qb/callback`;
  const scopes = "com.intuit.quickbooks.accounting";

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    scope: scopes,
    redirect_uri: redirectUri,
    state: crypto.randomUUID(),
  });

  return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
}

interface QBApiOptions {
  accessToken: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
}

async function qbApi(path: string, options: QBApiOptions) {
  const config = getConfig();
  const baseUrl = getBaseUrl(config.sandbox);
  const url = `${baseUrl}/company/${config.realmId}${path}`;

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
  accessToken: string,
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
  const qbInvoice = mapInvoiceToQB(invoice, qbCustomerId);
  return qbApi("/invoice", {
    accessToken,
    method: "POST",
    body: qbInvoice,
  });
}

/** Push a payment record to QuickBooks */
export async function pushPayment(
  accessToken: string,
  payment: {
    amount: number;
    invoice_id: string;
    method: string;
    notes: string | null;
  },
  qbInvoiceId: string,
  qbCustomerId: string
) {
  return qbApi("/payment", {
    accessToken,
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
  accessToken: string,
  name: string,
  email?: string | null
) {
  const query = `SELECT * FROM Customer WHERE DisplayName = '${name.replace(/'/g, "\\'")}'`;
  const result = await qbApi(`/query?query=${encodeURIComponent(query)}`, {
    accessToken,
  });

  const existing = result.QueryResponse?.Customer?.[0];
  if (existing) return existing.Id;

  const newCustomer = await qbApi("/customer", {
    accessToken,
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
  accessToken: string,
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
        accessToken,
        invoice.customer_name,
        invoice.customer_email
      );
      await pushInvoice(accessToken, invoice, qbCustomerId);
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
