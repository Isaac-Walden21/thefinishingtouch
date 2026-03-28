"use client";

import { useState, useRef, useCallback } from "react";
import {
  ArrowUpRight,
  Circle,
  Square,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Palette,
} from "lucide-react";
import clsx from "clsx";
import type { Annotation, AnnotationType } from "@/lib/types";

interface AnnotationCanvasProps {
  width: number;
  height: number;
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  readOnly?: boolean;
}

const COLORS = ["#0085FF", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ffffff"];

const TOOLS: { type: AnnotationType; icon: typeof ArrowUpRight; label: string }[] = [
  { type: "arrow", icon: ArrowUpRight, label: "Arrow" },
  { type: "circle", icon: Circle, label: "Circle" },
  { type: "rectangle", icon: Square, label: "Rectangle" },
  { type: "text", icon: Type, label: "Text" },
];

export default function AnnotationCanvas({
  width,
  height,
  annotations,
  onChange,
  readOnly = false,
}: AnnotationCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeTool, setActiveTool] = useState<AnnotationType | null>(null);
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);

  const getRelativePos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * width,
        y: ((clientY - rect.top) / rect.height) * height,
      };
    },
    [width, height]
  );

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev, annotations]);
    setRedoStack([]);
  }, [annotations]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (readOnly || !activeTool) return;
      const pos = getRelativePos(e);
      setDrawing(true);
      setStartPos(pos);

      if (activeTool === "text") {
        const text = prompt("Enter annotation text:");
        if (text) {
          pushUndo();
          const newAnnotation: Annotation = {
            id: `ann-${Date.now()}`,
            type: "text",
            x: pos.x,
            y: pos.y,
            text,
            color: activeColor,
          };
          onChange([...annotations, newAnnotation]);
        }
        setDrawing(false);
        setStartPos(null);
      }
    },
    [readOnly, activeTool, getRelativePos, activeColor, annotations, onChange, pushUndo]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!drawing || !startPos || !activeTool || activeTool === "text") {
        setDrawing(false);
        return;
      }

      const endPos = getRelativePos(e);
      pushUndo();

      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: activeTool,
        x: Math.min(startPos.x, endPos.x),
        y: Math.min(startPos.y, endPos.y),
        color: activeColor,
      };

      if (activeTool === "arrow") {
        newAnnotation.x = startPos.x;
        newAnnotation.y = startPos.y;
        newAnnotation.endX = endPos.x;
        newAnnotation.endY = endPos.y;
      } else if (activeTool === "circle") {
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        newAnnotation.x = (startPos.x + endPos.x) / 2;
        newAnnotation.y = (startPos.y + endPos.y) / 2;
        newAnnotation.radius = Math.sqrt(dx * dx + dy * dy) / 2;
      } else if (activeTool === "rectangle") {
        newAnnotation.width = Math.abs(endPos.x - startPos.x);
        newAnnotation.height = Math.abs(endPos.y - startPos.y);
      }

      onChange([...annotations, newAnnotation]);
      setDrawing(false);
      setStartPos(null);
    },
    [drawing, startPos, activeTool, getRelativePos, activeColor, annotations, onChange, pushUndo]
  );

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, annotations]);
    setUndoStack((u) => u.slice(0, -1));
    onChange(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, annotations]);
    setRedoStack((r) => r.slice(0, -1));
    onChange(next);
  };

  const handleClear = () => {
    if (annotations.length === 0) return;
    pushUndo();
    onChange([]);
  };

  const renderAnnotation = (ann: Annotation) => {
    switch (ann.type) {
      case "arrow":
        return (
          <g key={ann.id}>
            <defs>
              <marker
                id={`arrowhead-${ann.id}`}
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={ann.color} />
              </marker>
            </defs>
            <line
              x1={ann.x}
              y1={ann.y}
              x2={ann.endX}
              y2={ann.endY}
              stroke={ann.color}
              strokeWidth="3"
              markerEnd={`url(#arrowhead-${ann.id})`}
            />
          </g>
        );
      case "circle":
        return (
          <circle
            key={ann.id}
            cx={ann.x}
            cy={ann.y}
            r={ann.radius || 20}
            stroke={ann.color}
            strokeWidth="3"
            fill="none"
          />
        );
      case "rectangle":
        return (
          <rect
            key={ann.id}
            x={ann.x}
            y={ann.y}
            width={ann.width || 50}
            height={ann.height || 50}
            stroke={ann.color}
            strokeWidth="3"
            fill="none"
          />
        );
      case "text":
        return (
          <text
            key={ann.id}
            x={ann.x}
            y={ann.y}
            fill={ann.color}
            fontSize="16"
            fontWeight="bold"
            style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
          >
            {ann.text}
          </text>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Toolbar */}
      {!readOnly && (
        <div className="mb-2 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(activeTool === tool.type ? null : tool.type)}
              className={clsx(
                "rounded-md p-2 text-xs transition-colors",
                activeTool === tool.type
                  ? "bg-[#0085FF] text-white"
                  : "text-slate-500 hover:bg-slate-100"
              )}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
            </button>
          ))}

          <div className="mx-1 h-5 w-px bg-slate-200" />

          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              title="Color"
            >
              <div className="h-4 w-4 rounded-sm border border-slate-300" style={{ backgroundColor: activeColor }} />
            </button>
            {showColorPicker && (
              <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setActiveColor(c);
                      setShowColorPicker(false);
                    }}
                    className={clsx(
                      "h-6 w-6 rounded-sm border-2",
                      activeColor === c ? "border-slate-800" : "border-slate-200"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mx-1 h-5 w-px bg-slate-200" />

          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            disabled={annotations.length === 0}
            className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
            title="Clear"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={clsx(
          "w-full rounded-lg",
          activeTool && !readOnly ? "cursor-crosshair" : "cursor-default"
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {annotations.map(renderAnnotation)}
      </svg>
    </div>
  );
}
