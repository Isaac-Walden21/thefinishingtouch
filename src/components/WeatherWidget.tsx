"use client";

import { Cloud, CloudRain, Sun, Snowflake, CloudSun, AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: "sunny" | "partly_cloudy" | "cloudy" | "rain" | "snow";
  precipitation: number;
}

// Demo data for Greentown, IN
const demoForecast: ForecastDay[] = [
  { day: "Mon", high: 62, low: 44, condition: "sunny", precipitation: 0 },
  { day: "Tue", high: 58, low: 40, condition: "partly_cloudy", precipitation: 10 },
  { day: "Wed", high: 52, low: 38, condition: "rain", precipitation: 70 },
  { day: "Thu", high: 48, low: 34, condition: "cloudy", precipitation: 30 },
  { day: "Fri", high: 55, low: 42, condition: "sunny", precipitation: 5 },
];

const conditionIcons = {
  sunny: Sun,
  partly_cloudy: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: Snowflake,
};

const conditionColors = {
  sunny: "text-amber-500",
  partly_cloudy: "text-amber-400",
  cloudy: "text-slate-400",
  rain: "text-blue-500",
  snow: "text-cyan-400",
};

function isBadForConcrete(day: ForecastDay): boolean {
  return day.condition === "rain" || day.condition === "snow" || day.low <= 32;
}

export function WeatherWidget() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Weather</h2>
        <span className="text-xs text-slate-400">Greentown, IN</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {demoForecast.map((day) => {
          const Icon = conditionIcons[day.condition];
          const bad = isBadForConcrete(day);
          return (
            <div
              key={day.day}
              className={clsx(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center",
                bad
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-100 bg-slate-50"
              )}
            >
              <span className="text-xs font-medium text-slate-600">{day.day}</span>
              <Icon className={clsx("h-6 w-6", conditionColors[day.condition])} />
              <div className="text-xs">
                <span className="font-medium text-slate-700">{day.high}</span>
                <span className="text-slate-400"> / {day.low}</span>
              </div>
              <span className="text-xs text-slate-400">{day.precipitation}%</span>
              {bad && (
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Days highlighted in amber are not ideal for concrete work.
      </p>
    </div>
  );
}
