import clsx from "clsx";

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  className?: string;
}

export function Badge({
  label,
  color = "text-slate-600",
  bgColor = "bg-slate-100",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        color,
        bgColor,
        className
      )}
    >
      {label}
    </span>
  );
}
