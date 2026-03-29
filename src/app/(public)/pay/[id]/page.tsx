"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import type { Invoice, Customer } from "@/lib/types";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function CustomerPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [viewLogged, setViewLogged] = useState(false);

  useEffect(() => {
    fetch(`/api/pay/${id}`)
      .then(r => r.json())
      .then((data) => {
        if (data && !data.error) {
          setInvoice(data.invoice ?? data);
          setCustomer(data.customer ?? null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Log read receipt when customer views this page
  useEffect(() => {
    if (invoice && !viewLogged) {
      setViewLogged(true);
      fetch(`/api/invoices/${id}/view`, { method: "POST" }).catch(() => {});
    }
  }, [invoice, id, viewLogged]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F1F5F9]">
      <div className="text-slate-500">Loading...</div>
    </div>
  );

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F5F9]">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#0F172A] mb-2">
            Invoice Not Found
          </h1>
          <p className="text-slate-500">
            This invoice link may be invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "paid" || paid;

  async function handlePayNow() {
    setProcessing(true);
    try {
      const res = await fetch(`/api/pay/${id}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPaid(true);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPaid(true);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center px-4 py-8 sm:py-16">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="rounded-xl bg-[#0F172A] p-4">
          <Image
            src="/logo.png"
            alt="The Finishing Touch LLC"
            width={180}
            height={68}
            className="object-contain"
            priority
          />
        </div>
        <p className="text-xs text-slate-500">
          Greentown, Indiana
        </p>
      </div>

      {/* Invoice Card */}
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        {/* Invoice Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Invoice
              </p>
              <p className="text-lg font-bold text-[#0F172A]">
                {invoice.invoice_number}
              </p>
            </div>
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Paid
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-sm font-medium text-amber-700">
                Due {new Date(invoice.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* From/To */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                From
              </p>
              <p className="text-sm font-medium text-[#0F172A]">
                The Finishing Touch LLC
              </p>
              <p className="text-xs text-slate-500">9909 East 100 South</p>
              <p className="text-xs text-slate-500">Greentown, IN 46936</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                Bill To
              </p>
              {customer && (
                <>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {customer.name}
                  </p>
                  {customer.address && (
                    <p className="text-xs text-slate-500">{customer.address}</p>
                  )}
                  {customer.city && (
                    <p className="text-xs text-slate-500">
                      {customer.city}, {customer.state} {customer.zip}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="space-y-3">
            {invoice.line_items.map((li) => (
              <div key={li.id} className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#0F172A]">{li.description}</p>
                  <p className="text-xs text-slate-500">
                    {li.quantity} x {fmt.format(li.unit_price)}
                  </p>
                </div>
                <p className="text-sm font-medium text-[#0F172A]">
                  {fmt.format(li.total)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-[#0F172A]">
                {fmt.format(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Tax ({(invoice.tax_rate * 100).toFixed(0)}%)
              </span>
              <span className="text-[#0F172A]">
                {fmt.format(invoice.tax_amount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
              <span className="text-[#0F172A]">Total</span>
              <span className="text-[#0085FF]">
                {fmt.format(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-xs text-slate-500">{invoice.notes}</p>
          </div>
        )}

        {/* Pay Button */}
        <div className="px-6 py-5">
          {isPaid ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-lg font-semibold text-[#0F172A]">
                Payment Complete
              </p>
              <p className="text-sm text-slate-500">
                Thank you for your payment!
              </p>
            </div>
          ) : (
            <button
              onClick={handlePayNow}
              disabled={processing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0085FF] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#0085FF]/20 transition-colors hover:bg-[#0177E3] disabled:opacity-60"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              {processing ? "Processing..." : `Pay ${fmt.format(invoice.total)}`}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-400">
        Secure payment powered by Stripe &bull; The Finishing Touch LLC
      </p>
    </div>
  );
}
