"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Phone,
  MapPin,
  Navigation,
  ChevronDown,
  Camera,
  Plus,
  Trash2,
  Pencil,
  Mic,
  Square,
  Play,
  Pause,
  X,
  Flame,
  Sun,
  Snowflake,
  Check,
  FileText,
  Sparkles,
  CalendarPlus,
  Share2,
  AlertCircle,
  Ruler,
  Grid3X3,
  Undo2,
  Eraser,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import AnnotationCanvas from "@/components/AnnotationCanvas";
import type { Customer, JobWalk, JobWalkPhoto } from "@/lib/types";
import {
  JOB_WALK_STATUS_CONFIG,
  MATERIAL_OPTIONS,
  type JobWalk,
  type JobWalkPhoto,
  type JobWalkMeasurementArea,
  type SoilType,
  type DrainageType,
  type AccessType,
  type ExistingSurface,
  type GradeType,
  type ObstacleType,
  type UtilityLineStatus,
  type PermitNeeded,
  type TimelineOption,
  type BudgetRange,
  type DecisionMaker,
  type ReferralPotential,
  type PriorityLevel,
  type PhotoCategory,
  type Annotation,
} from "@/lib/types";
import { formatDate, formatPhone } from "@/lib/format";

// ── Collapsible Section ──

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-4"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 pb-4 pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Segmented Button Group ──

interface SegmentedGroupProps<T extends string> {
  label: string;
  options: T[];
  value: T | null;
  onChange: (val: T) => void;
}

function SegmentedGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedGroupProps<T>) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={clsx(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
              value === opt
                ? "border-brand bg-brand-light text-brand"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Multi-select Chips ──

interface ChipSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function ChipSelect({ label, options, selected, onChange }: ChipSelectProps) {
  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px]",
              selected.includes(opt)
                ? "border-brand bg-brand text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Radio Group ──

interface RadioGroupProps {
  label: string;
  options: string[];
  value: string | null;
  onChange: (val: string) => void;
}

function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={clsx(
              "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors min-h-[44px]",
              value === opt
                ? "border-brand bg-brand-light text-brand"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            <div
              className={clsx(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                value === opt ? "border-brand" : "border-slate-300"
              )}
            >
              {value === opt && (
                <div className="h-2 w-2 rounded-full bg-brand" />
              )}
            </div>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Number Stepper ──

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  step?: number;
  unit?: string;
}

function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  unit,
}: NumberStepperProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl font-bold text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100"
        >
          -
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, v));
          }}
          className="h-12 w-20 rounded-lg border border-slate-200 bg-white text-center text-lg font-semibold text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl font-bold text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100"
        >
          +
        </button>
        {unit && (
          <span className="text-sm text-slate-500">{unit}</span>
        )}
      </div>
    </div>
  );
}

// ── Photo Category Options ──

const PHOTO_CATEGORIES: PhotoCategory[] = [
  "Overview",
  "Existing Condition",
  "Obstacle",
  "Measurement Reference",
  "Customer Request",
];

// ── Obstacle Options ──

const OBSTACLE_OPTIONS: ObstacleType[] = [
  "Trees",
  "Roots",
  "Utilities",
  "Fence",
  "Deck",
  "Pool",
  "Septic",
  "Other",
];

// ── Quick Sketch Canvas ──

interface QuickSketchProps {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

function QuickSketch({ open, onClose, onSave }: QuickSketchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [showGrid, setShowGrid] = useState(true);
  const drawing = useRef(false);
  const history = useRef<ImageData[]>([]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (showGrid) drawGrid(ctx, canvas.width, canvas.height);
    history.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
  }, [open, showGrid]);

  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    const step = 20;
    for (let x = step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function getPos(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = tool === "eraser" ? 20 : 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    drawing.current = false;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    history.current.push(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
  }

  function handleUndo() {
    if (history.current.length <= 1) return;
    history.current.pop();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(history.current[history.current.length - 1], 0, 0);
  }

  function handleClear() {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (showGrid) drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
    history.current = [ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)];
  }

  function handleSave() {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setTool("pen"); setColor("#000000"); }}
            className={clsx(
              "h-10 w-10 rounded-lg border flex items-center justify-center",
              tool === "pen" && color === "#000000"
                ? "border-brand bg-brand-light"
                : "border-slate-200"
            )}
          >
            <div className="h-4 w-4 rounded-full bg-black" />
          </button>
          <button
            type="button"
            onClick={() => { setTool("pen"); setColor("#ef4444"); }}
            className={clsx(
              "h-10 w-10 rounded-lg border flex items-center justify-center",
              tool === "pen" && color === "#ef4444"
                ? "border-brand bg-brand-light"
                : "border-slate-200"
            )}
          >
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </button>
          <button
            type="button"
            onClick={() => setTool("eraser")}
            className={clsx(
              "h-10 w-10 rounded-lg border flex items-center justify-center",
              tool === "eraser" ? "border-brand bg-brand-light" : "border-slate-200"
            )}
          >
            <Eraser className="h-4 w-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={handleUndo}
            className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center"
          >
            <Undo2 className="h-4 w-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={clsx(
              "h-10 w-10 rounded-lg border flex items-center justify-center",
              showGrid ? "border-brand bg-brand-light" : "border-slate-200"
            )}
          >
            <Grid3X3 className="h-4 w-4 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white"
          >
            Save
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  );
}

// ── Main Page ──

export default function JobWalkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Find existing job walk or create blank state
  const [existingWalk, setExistingWalk] = useState<JobWalk | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<JobWalkPhoto[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // ── State ──

  const [status, setStatus] = useState("draft");

  // Measurements
  const [areas, setAreas] = useState<JobWalkMeasurementArea[]>([
    { id: "area-1", name: "Main Area", length: 0, width: 0, depth: 4 },
  ]);
  const [linearFeet, setLinearFeet] = useState(0);
  const [grade, setGrade] = useState<GradeType | null>(null);
  const [elevationChange, setElevationChange] = useState(0);

  useEffect(() => {
    fetch(`/api/job-walks/${id}`)
      .then(r => r.json())
      .then(async (data) => {
        if (data && !data.error) {
          setExistingWalk(data);
          setStatus(data.status ?? "draft");
          if (data.measurements) {
            setAreas(data.measurements.areas ?? [{ id: "area-1", name: "Main Area", length: 0, width: 0, depth: 4 }]);
            setLinearFeet(data.measurements.linear_feet ?? 0);
            setGrade(data.measurements.grade ?? null);
            setElevationChange(data.measurements.elevation_change ?? 0);
          }
          // Fetch customer
          const customers = await fetch('/api/customers').then(r => r.json());
          setCustomer(customers.find((c: Customer) => c.id === data.customer_id) ?? null);
        }
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [id]);

  // Site conditions
  const [soilType, setSoilType] = useState<SoilType | null>(
    existingWalk?.site_conditions.soil_type ?? null
  );
  const [drainage, setDrainage] = useState<DrainageType | null>(
    existingWalk?.site_conditions.drainage ?? null
  );
  const [access, setAccess] = useState<AccessType | null>(
    existingWalk?.site_conditions.access ?? null
  );
  const [existingSurface, setExistingSurface] = useState<ExistingSurface | null>(
    existingWalk?.site_conditions.existing_surface ?? null
  );
  const [demolitionRequired, setDemolitionRequired] = useState(
    existingWalk?.site_conditions.demolition_required ?? false
  );
  const [demolitionArea, setDemolitionArea] = useState(
    existingWalk?.site_conditions.demolition_area ?? 0
  );
  const [gradingRequired, setGradingRequired] = useState(
    existingWalk?.site_conditions.grading_required ?? false
  );
  const [gradingYards, setGradingYards] = useState(
    existingWalk?.site_conditions.grading_yards ?? 0
  );
  const [obstacles, setObstacles] = useState<ObstacleType[]>(
    existingWalk?.site_conditions.obstacles ?? []
  );
  const [utilityLines, setUtilityLines] = useState<UtilityLineStatus | null>(
    existingWalk?.site_conditions.utility_lines ?? null
  );
  const [permitNeeded, setPermitNeeded] = useState<PermitNeeded | null>(
    existingWalk?.site_conditions.permit_needed ?? null
  );
  const [conditionNotes, setConditionNotes] = useState(
    existingWalk?.site_conditions.notes ?? ""
  );

  // Customer preferences
  const [whatTheyWant, setWhatTheyWant] = useState(
    existingWalk?.customer_preferences.what_they_want ?? ""
  );
  const [materialPref, setMaterialPref] = useState(
    existingWalk?.customer_preferences.material_preference ?? ""
  );
  const [colorFinish, setColorFinish] = useState(
    existingWalk?.customer_preferences.color_finish ?? ""
  );
  const [timeline, setTimeline] = useState<TimelineOption | null>(
    existingWalk?.customer_preferences.timeline ?? null
  );
  const [budgetRange, setBudgetRange] = useState<BudgetRange | null>(
    existingWalk?.customer_preferences.budget_range ?? null
  );
  const [decisionMaker, setDecisionMaker] = useState<DecisionMaker | null>(
    existingWalk?.customer_preferences.decision_maker ?? null
  );
  const [gettingOtherQuotes, setGettingOtherQuotes] = useState(
    existingWalk?.customer_preferences.getting_other_quotes ?? false
  );
  const [otherQuotesCount, setOtherQuotesCount] = useState(
    existingWalk?.customer_preferences.other_quotes_count ?? 0
  );
  const [referralPotential, setReferralPotential] = useState<ReferralPotential | null>(
    existingWalk?.customer_preferences.referral_potential ?? null
  );
  const [priority, setPriority] = useState<PriorityLevel | null>(
    existingWalk?.customer_preferences.priority ?? null
  );

  // Photos
  const [photos, setPhotos] = useState<JobWalkPhoto[]>(existingPhotos);
  const [viewingPhoto, setViewingPhoto] = useState<JobWalkPhoto | null>(null);
  const [annotatingPhoto, setAnnotatingPhoto] = useState<JobWalkPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice note
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(
    existingWalk?.voice_note_url ?? null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Quick sketch
  const [sketchOpen, setSketchOpen] = useState(false);
  const [sketchUrl, setSketchUrl] = useState<string | null>(
    existingWalk?.sketch_url ?? null
  );

  // Completed state
  const [isCompleted, setIsCompleted] = useState(status !== "draft");

  // ── Computed ──

  const totalSqft = areas.reduce((sum, a) => sum + a.length * a.width, 0);
  const materialOptions =
    customer?.service_type && MATERIAL_OPTIONS[customer.service_type]
      ? MATERIAL_OPTIONS[customer.service_type]
      : Object.values(MATERIAL_OPTIONS).flat();

  // ── Handlers ──

  function addArea() {
    setAreas([
      ...areas,
      {
        id: `area-${Date.now()}`,
        name: `Area ${areas.length + 1}`,
        length: 0,
        width: 0,
        depth: 4,
      },
    ]);
  }

  function updateArea(idx: number, field: keyof JobWalkMeasurementArea, value: string | number) {
    setAreas(areas.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }

  function removeArea(idx: number) {
    if (areas.length <= 1) return;
    setAreas(areas.filter((_, i) => i !== idx));
  }

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file, i) => {
      const url = URL.createObjectURL(file);
      const newPhoto: JobWalkPhoto = {
        id: `jwp-${Date.now()}-${i}`,
        job_walk_id: id,
        photo_url: url,
        caption: "",
        category: "Overview",
        annotations: [],
        sort_order: photos.length + i + 1,
      };
      setPhotos((prev) => [...prev, newPhoto]);
    });
    e.target.value = "";
  }

  function updatePhoto(photoId: string, updates: Partial<JobWalkPhoto>) {
    setPhotos(photos.map((p) => (p.id === photoId ? { ...p, ...updates } : p)));
  }

  function deletePhoto(photoId: string) {
    setPhotos(photos.filter((p) => p.id !== photoId));
  }

  // Voice recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setVoiceNoteUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      // User denied microphone access
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function togglePlayback() {
    if (!voiceNoteUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(voiceNoteUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function deleteVoiceNote() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setVoiceNoteUrl(null);
    setIsPlaying(false);
  }

  function handleComplete() {
    setStatus("completed");
    setIsCompleted(true);
  }

  function formatSeconds(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // ── Missing fields check ──

  const missingFields: string[] = [];
  if (photos.length === 0) missingFields.push("Photos");
  if (totalSqft === 0) missingFields.push("Measurements");
  if (!soilType) missingFields.push("Soil Type");
  if (!drainage) missingFields.push("Drainage");
  if (!access) missingFields.push("Access");
  if (!whatTheyWant) missingFields.push("Customer wants");
  if (!priority) missingFields.push("Priority");

  // ── Render ──

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/job-walk"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Job Walks
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {customer?.name ?? "New Job Walk"}
            </h1>
            {customer?.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover"
              >
                <Phone className="h-4 w-4" />
                {formatPhone(customer.phone)}
              </a>
            )}
            {customer?.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand"
              >
                <MapPin className="h-4 w-4" />
                {customer.address}, {customer.city}, {customer.state}
              </a>
            )}
          </div>
          <Badge
            label={JOB_WALK_STATUS_CONFIG[status].label}
            color={JOB_WALK_STATUS_CONFIG[status].color}
            bgColor={JOB_WALK_STATUS_CONFIG[status].bgColor}
          />
        </div>

        {/* GPS / Weather */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          {existingWalk?.gps_lat && (
            <span className="inline-flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              {existingWalk.gps_lat.toFixed(4)}, {existingWalk.gps_lng?.toFixed(4)}
            </span>
          )}
          {existingWalk?.weather && (
            <span>
              {existingWalk.weather.temp}F, {existingWalk.weather.conditions}
              {existingWalk.weather.recent_rain && " (recent rain)"}
            </span>
          )}
          <span>{existingWalk ? formatDate(existingWalk.created_at) : "Today"}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── Photo Capture Section ── */}
        <CollapsibleSection
          title={`Photos (${photos.length})`}
          icon={<Camera className="h-5 w-5 text-brand" />}
          defaultOpen
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoCapture}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-600 transition-colors hover:border-brand hover:bg-brand-light hover:text-brand"
          >
            <Camera className="h-5 w-5" />
            Add Photo
          </button>

          {/* Photo thumbnail strip */}
          {photos.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="relative shrink-0 w-28"
                >
                  <button
                    type="button"
                    onClick={() => setViewingPhoto(photo)}
                    className="block w-28 h-28 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden"
                  >
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || `Photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <div className="mt-1.5 space-y-1">
                    <input
                      type="text"
                      placeholder="Caption..."
                      value={photo.caption ?? ""}
                      onChange={(e) =>
                        updatePhoto(photo.id, { caption: e.target.value })
                      }
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-brand focus:outline-none"
                    />
                    <select
                      value={photo.category}
                      onChange={(e) =>
                        updatePhoto(photo.id, {
                          category: e.target.value as PhotoCategory,
                        })
                      }
                      className="w-full rounded border border-slate-200 px-1 py-0.5 text-xs text-slate-600 focus:border-brand focus:outline-none"
                    >
                      {PHOTO_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAnnotatingPhoto(photo)}
                      className="flex-1 rounded border border-slate-200 px-1 py-1 text-xs text-slate-500 hover:border-brand hover:text-brand"
                    >
                      <Pencil className="mx-auto h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePhoto(photo.id)}
                      className="flex-1 rounded border border-slate-200 px-1 py-1 text-xs text-red-400 hover:border-red-300 hover:text-red-500"
                    >
                      <Trash2 className="mx-auto h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* ── Measurements Section ── */}
        <CollapsibleSection
          title={`Measurements ${totalSqft > 0 ? `(${totalSqft.toLocaleString()} sqft)` : ""}`}
          icon={<Ruler className="h-5 w-5 text-emerald-600" />}
          defaultOpen
        >
          <div className="space-y-6">
            {areas.map((area, idx) => (
              <div
                key={area.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <input
                    type="text"
                    value={area.name}
                    onChange={(e) => updateArea(idx, "name", e.target.value)}
                    className="rounded border border-transparent bg-transparent px-1 text-sm font-semibold text-foreground focus:border-brand focus:bg-white focus:outline-none"
                  />
                  {areas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArea(idx)}
                      className="rounded p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Length (ft)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={area.length || ""}
                      onChange={(e) =>
                        updateArea(idx, "length", parseFloat(e.target.value) || 0)
                      }
                      className="h-12 w-full rounded-lg border border-slate-200 bg-white text-center text-lg font-semibold text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={area.width || ""}
                      onChange={(e) =>
                        updateArea(idx, "width", parseFloat(e.target.value) || 0)
                      }
                      className="h-12 w-full rounded-lg border border-slate-200 bg-white text-center text-lg font-semibold text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Depth (in)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={area.depth || ""}
                      onChange={(e) =>
                        updateArea(idx, "depth", parseFloat(e.target.value) || 0)
                      }
                      className="h-12 w-full rounded-lg border border-slate-200 bg-white text-center text-lg font-semibold text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
                {area.length > 0 && area.width > 0 && (
                  <p className="mt-2 text-right text-sm font-medium text-brand">
                    {(area.length * area.width).toLocaleString()} sqft
                  </p>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addArea}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-brand hover:text-brand min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              Add Area
            </button>

            {totalSqft > 0 && (
              <div className="rounded-lg bg-brand-light px-4 py-3 text-center">
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-brand">
                  {totalSqft.toLocaleString()} sqft
                </p>
              </div>
            )}

            <NumberStepper
              label="Linear Feet"
              value={linearFeet}
              onChange={setLinearFeet}
              unit="ft"
            />

            <SegmentedGroup
              label="Grade"
              options={["Flat", "Slight Slope", "Moderate Slope", "Steep"] as GradeType[]}
              value={grade}
              onChange={setGrade}
            />

            <NumberStepper
              label="Elevation Change"
              value={elevationChange}
              onChange={setElevationChange}
              unit="inches"
            />
          </div>
        </CollapsibleSection>

        {/* ── Site Conditions Section ── */}
        <CollapsibleSection
          title="Site Conditions"
          icon={
            <svg
              className="h-5 w-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          }
        >
          <div className="space-y-6">
            <SegmentedGroup
              label="Soil Type"
              options={["Clay", "Sandy", "Rocky", "Topsoil", "Unknown"] as SoilType[]}
              value={soilType}
              onChange={setSoilType}
            />

            <SegmentedGroup
              label="Drainage"
              options={["Good", "Poor", "Standing Water", "Needs French Drain"] as DrainageType[]}
              value={drainage}
              onChange={setDrainage}
            />

            <SegmentedGroup
              label="Access"
              options={["Easy", "Moderate", "Difficult"] as AccessType[]}
              value={access}
              onChange={setAccess}
            />

            <SegmentedGroup
              label="Existing Surface"
              options={["None", "Concrete", "Asphalt", "Gravel", "Grass/Sod"] as ExistingSurface[]}
              value={existingSurface}
              onChange={setExistingSurface}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Toggle
                  checked={demolitionRequired}
                  onChange={setDemolitionRequired}
                  label="Demolition Required"
                />
              </div>
              {demolitionRequired && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <NumberStepper
                    label="Area to Remove"
                    value={demolitionArea}
                    onChange={setDemolitionArea}
                    step={10}
                    unit="sqft"
                  />
                </motion.div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Toggle
                  checked={gradingRequired}
                  onChange={setGradingRequired}
                  label="Grading Required"
                />
              </div>
              {gradingRequired && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <NumberStepper
                    label="Estimated Yards"
                    value={gradingYards}
                    onChange={setGradingYards}
                    unit="cu yd"
                  />
                </motion.div>
              )}
            </div>

            <ChipSelect
              label="Obstacles"
              options={OBSTACLE_OPTIONS}
              selected={obstacles}
              onChange={(s) => setObstacles(s as ObstacleType[])}
            />

            <RadioGroup
              label="Utility Lines"
              options={["Located", "Not Located", "Need to Call 811"]}
              value={utilityLines}
              onChange={(v) => setUtilityLines(v as UtilityLineStatus)}
            />

            <RadioGroup
              label="Permit Needed"
              options={["Yes", "No", "Unsure"]}
              value={permitNeeded}
              onChange={(v) => setPermitNeeded(v as PermitNeeded)}
            />

            <Textarea
              label="Additional Notes"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              rows={3}
              placeholder="Anything else about the site..."
            />
          </div>
        </CollapsibleSection>

        {/* ── Customer Preferences Section ── */}
        <CollapsibleSection
          title="Customer Preferences"
          icon={
            <svg
              className="h-5 w-5 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          }
        >
          <div className="space-y-6">
            <Textarea
              label="What They Want"
              value={whatTheyWant}
              onChange={(e) => setWhatTheyWant(e.target.value)}
              rows={4}
              placeholder="Describe what the customer is looking for..."
            />

            <Select
              label="Material Preference"
              value={materialPref}
              onChange={(e) => setMaterialPref(e.target.value)}
            >
              <option value="">Select material...</option>
              {materialOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>

            <Input
              label="Color / Finish"
              value={colorFinish}
              onChange={(e) => setColorFinish(e.target.value)}
              placeholder="e.g., Desert Brown with Charcoal release"
            />

            <SegmentedGroup
              label="Timeline"
              options={["ASAP", "2 Weeks", "1 Month", "Spring", "Summer", "Fall", "Flexible"] as TimelineOption[]}
              value={timeline}
              onChange={setTimeline}
            />

            <SegmentedGroup
              label="Budget Range"
              options={["Under $3K", "$3-5K", "$5-10K", "$10-20K", "$20K+", "Not Discussed"] as BudgetRange[]}
              value={budgetRange}
              onChange={setBudgetRange}
            />

            <RadioGroup
              label="Decision Maker"
              options={["Yes", "Need to talk to spouse", "Committee/HOA"]}
              value={decisionMaker}
              onChange={(v) => setDecisionMaker(v as DecisionMaker)}
            />

            <div className="space-y-3">
              <Toggle
                checked={gettingOtherQuotes}
                onChange={setGettingOtherQuotes}
                label="Getting Other Quotes"
              />
              {gettingOtherQuotes && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <NumberStepper
                    label="How Many"
                    value={otherQuotesCount ?? 0}
                    onChange={setOtherQuotesCount}
                  />
                </motion.div>
              )}
            </div>

            <SegmentedGroup
              label="Referral Potential"
              options={["Hot", "Maybe", "Unlikely"] as ReferralPotential[]}
              value={referralPotential}
              onChange={setReferralPotential}
            />

            {/* Priority Cards */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Priority</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  {
                    value: "hot" as PriorityLevel,
                    label: "Hot",
                    icon: Flame,
                    activeClass: "border-red-500 bg-red-50 text-red-600",
                    iconClass: "text-red-500",
                  },
                  {
                    value: "warm" as PriorityLevel,
                    label: "Warm",
                    icon: Sun,
                    activeClass: "border-amber-500 bg-amber-50 text-amber-600",
                    iconClass: "text-amber-500",
                  },
                  {
                    value: "cool" as PriorityLevel,
                    label: "Cool",
                    icon: Snowflake,
                    activeClass: "border-blue-500 bg-blue-50 text-blue-600",
                    iconClass: "text-blue-400",
                  },
                ] as const).map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={clsx(
                      "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all min-h-[80px]",
                      priority === p.value
                        ? p.activeClass
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    )}
                  >
                    <p.icon
                      className={clsx(
                        "h-6 w-6",
                        priority === p.value ? p.iconClass : "text-slate-400"
                      )}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Voice Note Section ── */}
        <CollapsibleSection
          title="Voice Note"
          icon={<Mic className="h-5 w-5 text-rose-500" />}
        >
          <div className="flex flex-col items-center gap-4">
            {!voiceNoteUrl && !isRecording && (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-600 min-h-[44px]"
              >
                <Mic className="h-5 w-5" />
                Record Voice Note
              </button>
            )}

            {isRecording && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                  <span className="text-lg font-semibold text-foreground">
                    {formatSeconds(recordingDuration)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 rounded-full bg-slate-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 min-h-[44px]"
                >
                  <Square className="h-4 w-4" />
                  Stop Recording
                </button>
              </div>
            )}

            {voiceNoteUrl && !isRecording && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </button>
                <span className="text-sm text-slate-500">Voice note recorded</span>
                <button
                  type="button"
                  onClick={deleteVoiceNote}
                  className="rounded-lg p-2 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ── Quick Sketch Section ── */}
        <CollapsibleSection
          title="Quick Sketch"
          icon={<Pencil className="h-5 w-5 text-indigo-500" />}
        >
          <div className="flex flex-col items-center gap-4">
            {!sketchUrl && (
              <button
                type="button"
                onClick={() => setSketchOpen(true)}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-sm font-medium text-slate-600 transition-colors hover:border-brand hover:text-brand min-h-[44px]"
              >
                <Pencil className="h-5 w-5" />
                Draw Sketch
              </button>
            )}
            {sketchUrl && (
              <div className="space-y-3">
                <img
                  src={sketchUrl}
                  alt="Quick sketch"
                  className="w-full max-w-sm rounded-lg border border-slate-200"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSketchOpen(true)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 min-h-[44px]"
                  >
                    Redraw
                  </button>
                  <button
                    type="button"
                    onClick={() => setSketchUrl(null)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50 min-h-[44px]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ── Summary & Actions Section ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Summary</h3>

          {/* Summary cards */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{photos.length}</p>
              <p className="text-xs text-slate-500">Photos</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {totalSqft.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Sq Ft</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {obstacles.length}
              </p>
              <p className="text-xs text-slate-500">Obstacles</p>
            </div>
          </div>

          {/* Missing fields */}
          {missingFields.length > 0 && status === "draft" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Missing fields
                  </p>
                  <p className="mt-0.5 text-xs text-amber-600">
                    {missingFields.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Complete button */}
          {status === "draft" && (
            <button
              type="button"
              onClick={handleComplete}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-700 min-h-[56px]"
            >
              <Check className="h-5 w-5" />
              Complete Job Walk
            </button>
          )}

          {/* Post-completion actions */}
          {isCompleted && (
            <div className="space-y-2">
              <Link
                href={`/estimates/new?jobwalk=${id}`}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 min-h-[44px]"
              >
                <FileText className="h-5 w-5 text-brand" />
                Create Estimate
              </Link>
              <Link
                href={`/vision?photo=${photos[0]?.photo_url ?? ""}`}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 min-h-[44px]"
              >
                <Sparkles className="h-5 w-5 text-purple-500" />
                Send to Vision Studio
              </Link>
              <Link
                href="/calendar"
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 min-h-[44px]"
              >
                <CalendarPlus className="h-5 w-5 text-emerald-500" />
                Schedule Follow-up
              </Link>
              <button
                type="button"
                onClick={() => {
                  // Placeholder for team sharing
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 min-h-[44px]"
              >
                <Share2 className="h-5 w-5 text-slate-500" />
                Share with Team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Photo Viewer Modal ── */}
      <Modal
        open={!!viewingPhoto}
        onClose={() => setViewingPhoto(null)}
        title={viewingPhoto?.caption || "Photo"}
        size="lg"
      >
        {viewingPhoto && (
          <img
            src={viewingPhoto.photo_url}
            alt={viewingPhoto.caption ?? "Job walk photo"}
            className="w-full rounded-lg"
          />
        )}
      </Modal>

      {/* ── Annotation Modal ── */}
      <Modal
        open={!!annotatingPhoto}
        onClose={() => setAnnotatingPhoto(null)}
        title="Annotate Photo"
        size="lg"
      >
        {annotatingPhoto && (
          <div>
            <div className="relative">
              <img
                src={annotatingPhoto.photo_url}
                alt="Annotating"
                className="absolute inset-0 w-full rounded-lg"
              />
              <AnnotationCanvas
                width={800}
                height={600}
                annotations={annotatingPhoto.annotations}
                onChange={(annotations: Annotation[]) => {
                  updatePhoto(annotatingPhoto.id, { annotations });
                  setAnnotatingPhoto({ ...annotatingPhoto, annotations });
                }}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setAnnotatingPhoto(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Quick Sketch Overlay ── */}
      <QuickSketch
        open={sketchOpen}
        onClose={() => setSketchOpen(false)}
        onSave={(dataUrl) => setSketchUrl(dataUrl)}
      />
    </div>
  );
}
