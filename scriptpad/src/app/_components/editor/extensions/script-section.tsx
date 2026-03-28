"use client";

import { Node, mergeAttributes } from "@tiptap/react";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { scoreHook, HOOK_SCORE_COLORS } from "../hook-scorer";

// ─── Constants ───────────────────────────────────────────────────────────────

export const SECTION_LABELS: Record<string, string> = {
  hook: "Hook",
  body: "Body",
  cta: "CTA",
  custom: "Custom",
};

const SECTION_COLORS: Record<string, string> = {
  hook: "#F59E0B",
  body: "#3B82F6",
  cta: "#10B981",
  custom: "#9CA3AF",
};

// ─── React NodeView Component ────────────────────────────────────────────────

function ScriptSectionView({ node, updateAttributes }: ReactNodeViewProps) {
  const sectionType = (node.attrs.sectionType as string) || "body";
  const customLabel = node.attrs.customLabel as string | null;
  const collapsed = (node.attrs.collapsed as boolean) || false;
  const label = customLabel || SECTION_LABELS[sectionType] || "Section";
  const color = SECTION_COLORS[sectionType] || SECTION_COLORS.custom!;

  // Compute word count and hook score from section content, excluding scene notes
  const { wordCount, durationStr, hookScore } = useMemo(() => {
    let text = "";
    node.descendants((child) => {
      if (child.type.name === "sceneNote") return false;
      if (child.isText && child.text) text += child.text + " ";
    });
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 0);
    const wc = words.length;
    const dur = Math.round((wc / 150) * 60);
    const mins = Math.floor(dur / 60);
    const secs = dur % 60;
    // Score the hook if this is a hook section
    const hs = sectionType === "hook" ? scoreHook(text.trim()) : null;

    return {
      wordCount: wc,
      durationStr: `${mins}:${secs.toString().padStart(2, "0")}`,
      hookScore: hs,
    };
  }, [node, sectionType]);

  return (
    <NodeViewWrapper
      as="div"
      className="script-section"
      data-section-type={sectionType}
    >
      <div
        className="script-section-header"
        style={{ borderLeftColor: color }}
        contentEditable={false}
      >
        <button
          className="script-section-collapse"
          onClick={() => updateAttributes({ collapsed: !collapsed })}
          type="button"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <span className="script-section-label" style={{ color }}>
          {label}
        </span>
        <span className="script-section-stats">
          <span className="font-mono">{wordCount}</span> words &middot; ~
          <span className="font-mono">{durationStr}</span>
        </span>
        {hookScore && wordCount > 0 && (
          <span
            className="script-section-hook-score"
            style={{ color: HOOK_SCORE_COLORS[hookScore.level] }}
            title={hookScore.suggestions.join("\n")}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: HOOK_SCORE_COLORS[hookScore.level] }}
            />
            <span className="font-mono">{hookScore.total}</span>
          </span>
        )}
      </div>
      <NodeViewContent
        className="script-section-content"
        style={
          collapsed
            ? { maxHeight: 0, overflow: "hidden", opacity: 0 }
            : undefined
        }
      />
    </NodeViewWrapper>
  );
}

// ─── TipTap Node Extension ──────────────────────────────────────────────────

export const ScriptSection = Node.create({
  name: "scriptSection",
  group: "block",
  content: "block+",
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      sectionType: {
        default: "body",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-section-type"),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-section-type": attributes.sectionType,
        }),
      },
      customLabel: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-custom-label"),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.customLabel
            ? { "data-custom-label": attributes.customLabel }
            : {},
      },
      collapsed: {
        default: false,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-collapsed") === "true",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-collapsed": String(attributes.collapsed),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-section-type]" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes as Record<string, string>, { class: "script-section" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ScriptSectionView);
  },
});
