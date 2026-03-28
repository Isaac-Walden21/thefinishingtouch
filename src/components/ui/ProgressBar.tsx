import clsx from "clsx";

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  label?: string;
  showPercent?: boolean;
}

export function ProgressBar({
  value,
  max,
  color = "bg-brand",
  label,
  showPercent = true,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && <span className="font-medium text-slate-600">{label}</span>}
          {showPercent && <span className="text-slate-400">{percent}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
