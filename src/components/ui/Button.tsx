import Link from "next/link";
import { clsx } from "clsx";
import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
} & (
  | ({ href: string } & { disabled?: never; type?: never; onClick?: never })
  | ({ href?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">)
);

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-sm shadow-brand/20 hover:bg-brand-hover",
  secondary:
    "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
};

export default function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = clsx(base, variants[variant], className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { href: _, ...buttonProps } = props as { href?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
