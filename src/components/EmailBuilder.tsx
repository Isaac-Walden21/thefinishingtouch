"use client";

import { useState, useCallback } from "react";
import {
  GripVertical,
  Type,
  ImageIcon,
  Link2,
  Minus,
  Trash2,
  Plus,
  ChevronDown,
  Monitor,
  Smartphone,
  Heading,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import clsx from "clsx";
import type { EmailBlock, EmailBlockType } from "@/lib/types";

interface EmailBuilderProps {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
  onSendTest?: () => void;
}

const BLOCK_TYPES: { type: EmailBlockType; label: string; icon: typeof Type }[] = [
  { type: "header", label: "Header", icon: Heading },
  { type: "text", label: "Text Block", icon: Type },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "button", label: "Button", icon: Link2 },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "footer", label: "Footer", icon: ArrowDown },
];

const MERGE_FIELDS = [
  "{{first_name}}",
  "{{company_name}}",
  "{{review_link}}",
  "{{referral_link}}",
  "{{unsubscribe_link}}",
];

function createBlock(type: EmailBlockType): EmailBlock {
  const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const defaults: Record<EmailBlockType, Record<string, string>> = {
    header: { logo_url: "", banner_text: "The Finishing Touch LLC" },
    text: { content: "Enter your text here..." },
    image: { src: "", alt: "Image description" },
    button: { text: "Click Here", url: "#", color: "#0085FF" },
    divider: {},
    footer: {
      text: "The Finishing Touch LLC | Greentown, IN | (765) 555-0100",
      unsubscribe: "{{unsubscribe_link}}",
    },
  };
  return { id, type, content: defaults[type] };
}

function BlockEditor({
  block,
  onUpdate,
}: {
  block: EmailBlock;
  onUpdate: (content: Record<string, string>) => void;
}) {
  const update = (key: string, value: string) => {
    onUpdate({ ...block.content, [key]: value });
  };

  switch (block.type) {
    case "header":
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={block.content.banner_text || ""}
            onChange={(e) => update("banner_text", e.target.value)}
            placeholder="Header text"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0085FF] focus:outline-none"
          />
        </div>
      );
    case "text":
      return (
        <textarea
          value={block.content.content || ""}
          onChange={(e) => update("content", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:border-[#0085FF] focus:outline-none"
        />
      );
    case "image":
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={block.content.src || ""}
            onChange={(e) => update("src", e.target.value)}
            placeholder="Image URL"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0085FF] focus:outline-none"
          />
          <input
            type="text"
            value={block.content.alt || ""}
            onChange={(e) => update("alt", e.target.value)}
            placeholder="Alt text"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0085FF] focus:outline-none"
          />
        </div>
      );
    case "button":
      return (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={block.content.text || ""}
            onChange={(e) => update("text", e.target.value)}
            placeholder="Button text"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0085FF] focus:outline-none"
          />
          <input
            type="text"
            value={block.content.url || ""}
            onChange={(e) => update("url", e.target.value)}
            placeholder="URL"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0085FF] focus:outline-none"
          />
        </div>
      );
    case "footer":
      return (
        <textarea
          value={block.content.text || ""}
          onChange={(e) => update("text", e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:border-[#0085FF] focus:outline-none"
        />
      );
    default:
      return null;
  }
}

function BlockPreview({ block, mobile }: { block: EmailBlock; mobile: boolean }) {
  const maxW = mobile ? "max-w-xs" : "max-w-lg";

  switch (block.type) {
    case "header":
      return (
        <div className={clsx("bg-[#0F172A] px-6 py-4 text-center", maxW)}>
          <p className="text-lg font-bold text-white">{block.content.banner_text || "Header"}</p>
        </div>
      );
    case "text":
      return (
        <div className={clsx("px-6 py-3", maxW)}>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{block.content.content || ""}</p>
        </div>
      );
    case "image":
      return (
        <div className={clsx("px-6 py-3", maxW)}>
          {block.content.src ? (
            <img src={block.content.src} alt={block.content.alt} className="w-full rounded" />
          ) : (
            <div className="flex h-32 items-center justify-center rounded bg-slate-100">
              <ImageIcon className="h-8 w-8 text-slate-300" />
            </div>
          )}
        </div>
      );
    case "button":
      return (
        <div className={clsx("px-6 py-3 text-center", maxW)}>
          <span
            className="inline-block rounded-lg px-6 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: block.content.color || "#0085FF" }}
          >
            {block.content.text || "Button"}
          </span>
        </div>
      );
    case "divider":
      return (
        <div className={clsx("px-6 py-3", maxW)}>
          <hr className="border-slate-200" />
        </div>
      );
    case "footer":
      return (
        <div className={clsx("bg-slate-50 px-6 py-4 text-center", maxW)}>
          <p className="text-xs text-slate-400">{block.content.text || "Footer"}</p>
          <p className="mt-1 text-xs text-[#0085FF] underline">Unsubscribe</p>
        </div>
      );
    default:
      return null;
  }
}

export default function EmailBuilder({ blocks, onChange, onSendTest }: EmailBuilderProps) {
  const [mobilePreview, setMobilePreview] = useState(false);
  const [showMergeFields, setShowMergeFields] = useState(false);

  const addBlock = (type: EmailBlockType) => {
    onChange([...blocks, createBlock(type)]);
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, content: Record<string, string>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onChange(newBlocks);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Content Blocks</h3>
          <div className="relative">
            <button
              onClick={() => setShowMergeFields(!showMergeFields)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
            >
              Merge Fields
              <ChevronDown className="h-3 w-3" />
            </button>
            {showMergeFields && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {MERGE_FIELDS.map((field) => (
                  <button
                    key={field}
                    onClick={() => {
                      navigator.clipboard.writeText(field);
                      setShowMergeFields(false);
                    }}
                    className="block w-full rounded px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {field}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Block list */}
        <div className="space-y-3">
          {blocks.map((block, i) => {
            const config = BLOCK_TYPES.find((bt) => bt.type === block.type);
            return (
              <div
                key={block.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-slate-300" />
                    <span className="text-xs font-medium uppercase text-slate-400">
                      {config?.label || block.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveBlock(i, -1)}
                      disabled={i === 0}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveBlock(i, 1)}
                      disabled={i === blocks.length - 1}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <BlockEditor block={block} onUpdate={(c) => updateBlock(block.id, c)} />
              </div>
            );
          })}
        </div>

        {/* Add block */}
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => addBlock(bt.type)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 transition-colors hover:border-[#0085FF] hover:text-[#0085FF]"
            >
              <Plus className="h-3 w-3" />
              {bt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Preview</h3>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => setMobilePreview(false)}
              className={clsx(
                "rounded-md p-1.5 transition-colors",
                !mobilePreview ? "bg-[#0085FF] text-white" : "text-slate-400"
              )}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobilePreview(true)}
              className={clsx(
                "rounded-md p-1.5 transition-colors",
                mobilePreview ? "bg-[#0085FF] text-white" : "text-slate-400"
              )}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className={clsx(
            "mx-auto overflow-hidden rounded-lg border border-slate-200 bg-white",
            mobilePreview ? "max-w-xs" : "max-w-lg"
          )}
        >
          {blocks.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Add blocks to preview your email
            </div>
          ) : (
            blocks.map((block) => (
              <BlockPreview key={block.id} block={block} mobile={mobilePreview} />
            ))
          )}
        </div>

        {onSendTest && (
          <button
            onClick={onSendTest}
            className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            Send Test Email
          </button>
        )}
      </div>
    </div>
  );
}
