import { Check } from "lucide-react";
import clsx from "clsx";

interface TimelineStep {
  label: string;
  date: string | null;
  description?: string;
}

interface PaymentTimelineProps {
  steps: TimelineStep[];
}

export default function PaymentTimeline({ steps }: PaymentTimelineProps) {
  // Find the index of the last completed step
  let lastCompleted = -1;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].date) {
      lastCompleted = i;
      break;
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-6 py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isComplete = step.date !== null;
          const isCurrent = i === lastCompleted + 1 && i < steps.length;

          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                    isComplete
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
                        : "border-slate-200 bg-white text-slate-300"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <p
                  className={clsx(
                    "mt-1.5 text-xs font-medium",
                    isComplete ? "text-emerald-600" : isCurrent ? "text-[#0085FF]" : "text-slate-400"
                  )}
                >
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[10px] text-slate-400">
                    {new Date(step.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
                {step.description && (
                  <p className="text-[10px] text-slate-400">{step.description}</p>
                )}
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={clsx(
                    "mx-2 h-0.5 flex-1",
                    i < lastCompleted ? "bg-emerald-500" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
