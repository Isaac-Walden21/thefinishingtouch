"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const tabs = [
  { href: "/marketing/contacts", label: "Contacts" },
  { href: "/marketing/templates", label: "Templates" },
  { href: "/marketing/campaigns", label: "Campaigns" },
  { href: "/marketing/automations", label: "Automations" },
];

export default function MarketingNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "rounded-md px-4 py-2 text-sm font-medium",
              isActive
                ? "bg-brand/10 text-brand"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
