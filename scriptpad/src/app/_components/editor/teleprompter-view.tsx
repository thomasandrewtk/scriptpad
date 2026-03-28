"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Minus,
  Plus,
  FlipHorizontal,
} from "lucide-react";

interface TeleprompterSection {
  type: "text" | "section-header" | "scene-note";
  content: string;
  sectionType?: string;
}

interface TeleprompterViewProps {
  isOpen: boolean;
  onClose: () => void;
  content: TeleprompterSection[];
}

const DEFAULT_FONT_SIZE = 36;
const DEFAULT_SCROLL_SPEED = 40; // pixels per second
const MIN_FONT_SIZE = 20;
const MAX_FONT_SIZE = 72;
const MIN_SPEED = 10;
const MAX_SPEED = 120;

const SECTION_COLORS: Record<string, string> = {
  hook: "#F59E0B",
  body: "#3B82F6",
  cta: "#10B981",
  custom: "#9CA3AF",
};

export function TeleprompterView({
  isOpen,
  onClose,
  content,
}: TeleprompterViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [speed, setSpeed] = useState(DEFAULT_SCROLL_SPEED);
  const [isMirrored, setIsMirrored] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Auto-scroll animation
  const animate = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (scrollContainerRef.current && isPlaying) {
        scrollContainerRef.current.scrollTop += (speed * delta) / 1000;

        // Stop at bottom
        const { scrollTop, scrollHeight, clientHeight } =
          scrollContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight) {
          setIsPlaying(false);
          return;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [isPlaying, speed],
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
        case " ":
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSpeed((s) => Math.min(s + 5, MAX_SPEED));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSpeed((s) => Math.max(s - 5, MIN_SPEED));
          break;
        case "r":
          e.preventDefault();
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
          setIsPlaying(false);
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  const restart = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setIsPlaying(false);
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0A0A0A]">
      {/* Content area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-8 py-[40vh]"
        style={{
          transform: isMirrored ? "scaleX(-1)" : undefined,
        }}
      >
        <div className="mx-auto max-w-3xl">
          {content.map((block, i) => {
            if (block.type === "section-header") {
              const color =
                SECTION_COLORS[block.sectionType || "custom"] ||
                SECTION_COLORS.custom;
              return (
                <div
                  key={i}
                  className="my-6 border-l-2 py-2 pl-4"
                  style={{
                    borderColor: color,
                    fontSize: fontSize * 0.5,
                    color: color,
                    fontFamily:
                      "var(--font-dm-sans), ui-sans-serif, system-ui",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {block.content}
                </div>
              );
            }

            if (block.type === "scene-note") {
              return (
                <div
                  key={i}
                  className="my-3"
                  style={{
                    fontSize: fontSize * 0.45,
                    color: "#A78BFA",
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    opacity: 0.5,
                  }}
                >
                  [{block.content}]
                </div>
              );
            }

            return (
              <p
                key={i}
                className="my-4"
                style={{
                  fontSize,
                  lineHeight: 1.6,
                  color: "#E5E5E5",
                  fontFamily:
                    "var(--font-plus-jakarta), ui-sans-serif, system-ui",
                }}
              >
                {block.content}
              </p>
            );
          })}
          {/* Extra space at bottom for scrolling */}
          <div style={{ height: "60vh" }} />
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-3">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? "Pause" : "Play"}
        </button>

        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>Speed</span>
          <button
            onClick={() => setSpeed((s) => Math.max(s - 5, MIN_SPEED))}
            className="cursor-pointer rounded p-1 hover:bg-[var(--color-surface)]"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-mono">{speed}</span>
          <button
            onClick={() => setSpeed((s) => Math.min(s + 5, MAX_SPEED))}
            className="cursor-pointer rounded p-1 hover:bg-[var(--color-surface)]"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>Size</span>
          <button
            onClick={() => setFontSize((s) => Math.max(s - 4, MIN_FONT_SIZE))}
            className="cursor-pointer rounded p-1 hover:bg-[var(--color-surface)]"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-mono">{fontSize}</span>
          <button
            onClick={() => setFontSize((s) => Math.min(s + 4, MAX_FONT_SIZE))}
            className="cursor-pointer rounded p-1 hover:bg-[var(--color-surface)]"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          onClick={restart}
          className="flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
        >
          <RotateCcw size={14} />
          Restart
        </button>

        <button
          onClick={() => setIsMirrored((m) => !m)}
          className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-xs transition-colors hover:bg-[var(--color-surface)] ${
            isMirrored
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
          title="Mirror mode for teleprompter hardware"
        >
          <FlipHorizontal size={14} />
          Mirror
        </button>

        <button
          onClick={onClose}
          className="ml-4 flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
        >
          <X size={14} />
          Exit
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Extract teleprompter content from a TipTap document JSON.
 */
export function extractTeleprompterContent(
  doc: Record<string, unknown> | null | undefined,
): TeleprompterSection[] {
  if (!doc) return [];
  const sections: TeleprompterSection[] = [];

  function processNodes(nodes: unknown[]) {
    for (const node of nodes) {
      const n = node as Record<string, unknown>;
      const type = n.type as string;

      if (type === "scriptSection") {
        const attrs = n.attrs as Record<string, unknown> | undefined;
        const sectionType = (attrs?.sectionType as string) || "custom";
        const label =
          (attrs?.customLabel as string) ||
          { hook: "Hook", body: "Body", cta: "CTA", custom: "Custom" }[
            sectionType
          ] ||
          "Section";

        sections.push({
          type: "section-header",
          content: label,
          sectionType,
        });

        const content = n.content as unknown[] | undefined;
        if (content) processNodes(content);
      } else if (type === "paragraph") {
        const content = n.content as unknown[] | undefined;
        if (!content) return;

        let text = "";
        for (const child of content) {
          const c = child as Record<string, unknown>;
          if (c.type === "text") {
            text += c.text as string;
          } else if (c.type === "sceneNote") {
            const attrs = c.attrs as Record<string, unknown> | undefined;
            const noteText = (attrs?.text as string) || "";
            if (noteText) {
              // Flush current text first
              if (text.trim()) {
                sections.push({ type: "text", content: text.trim() });
                text = "";
              }
              sections.push({ type: "scene-note", content: noteText });
            }
          }
        }
        if (text.trim()) {
          sections.push({ type: "text", content: text.trim() });
        }
      } else if (type === "lineVariant") {
        const attrs = n.attrs as Record<string, unknown> | undefined;
        const variants = (attrs?.variants as string[]) || [""];
        const activeIndex = (attrs?.activeIndex as number) || 0;
        const activeText =
          variants[Math.min(activeIndex, variants.length - 1)] || "";
        if (activeText.trim()) {
          sections.push({ type: "text", content: activeText.trim() });
        }
      } else if (type === "horizontalRule") {
        // Visual break - skip
      } else if (type === "doc") {
        const content = n.content as unknown[] | undefined;
        if (content) processNodes(content);
      }
    }
  }

  processNodes([doc]);
  return sections;
}
