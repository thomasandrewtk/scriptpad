"use client";

import { Node, mergeAttributes } from "@tiptap/react";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useState, useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown, Plus, X } from "lucide-react";

// ─── React NodeView Component ────────────────────────────────────────────────

function LineVariantView({ node, updateAttributes }: ReactNodeViewProps) {
  const variants = (node.attrs.variants as string[]) || [""];
  const activeIndex = (node.attrs.activeIndex as number) || 0;
  const [expanded, setExpanded] = useState(false);

  const safeIndex = Math.min(activeIndex, variants.length - 1);

  const cycleUp = useCallback(() => {
    const newIndex = safeIndex > 0 ? safeIndex - 1 : variants.length - 1;
    updateAttributes({ activeIndex: newIndex });
  }, [safeIndex, variants.length, updateAttributes]);

  const cycleDown = useCallback(() => {
    const newIndex = safeIndex < variants.length - 1 ? safeIndex + 1 : 0;
    updateAttributes({ activeIndex: newIndex });
  }, [safeIndex, variants.length, updateAttributes]);

  const addVariant = useCallback(() => {
    const newVariants = [...variants, ""];
    updateAttributes({
      variants: newVariants,
      activeIndex: newVariants.length - 1,
    });
    setExpanded(true);
  }, [variants, updateAttributes]);

  const updateVariant = useCallback(
    (index: number, text: string) => {
      const newVariants = [...variants];
      newVariants[index] = text;
      updateAttributes({ variants: newVariants });
    },
    [variants, updateAttributes],
  );

  const removeVariant = useCallback(
    (index: number) => {
      if (variants.length <= 1) return;
      const newVariants = variants.filter((_, i) => i !== index);
      const newActive = safeIndex >= newVariants.length ? newVariants.length - 1 : safeIndex > index ? safeIndex - 1 : safeIndex;
      updateAttributes({
        variants: newVariants,
        activeIndex: newActive,
      });
    },
    [variants, safeIndex, updateAttributes],
  );

  const activeText = variants[safeIndex] || "";
  const hasMultiple = variants.length > 1;

  return (
    <NodeViewWrapper as="div" className="line-variant" contentEditable={false}>
      {/* Active variant display */}
      <div className="line-variant-active">
        {hasMultiple && (
          <div className="line-variant-controls">
            <button
              className="line-variant-btn"
              onClick={cycleUp}
              title="Previous variant (Cmd+Alt+Up)"
              type="button"
            >
              <ChevronUp size={12} />
            </button>
            <span className="line-variant-counter">
              {safeIndex + 1}/{variants.length}
            </span>
            <button
              className="line-variant-btn"
              onClick={cycleDown}
              title="Next variant (Cmd+Alt+Down)"
              type="button"
            >
              <ChevronDown size={12} />
            </button>
          </div>
        )}
        <div
          className="line-variant-text"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateVariant(safeIndex, e.currentTarget.textContent || "")}
        >
          {activeText}
        </div>
        <div className="line-variant-actions">
          <button
            className="line-variant-btn"
            onClick={addVariant}
            title="Add variant (Cmd+Shift+V)"
            type="button"
          >
            <Plus size={12} />
          </button>
          {hasMultiple && (
            <button
              className="line-variant-btn"
              onClick={() => setExpanded(!expanded)}
              title="Toggle all variants"
              type="button"
            >
              {expanded ? "Hide" : "Show all"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded view showing all variants */}
      {expanded && hasMultiple && (
        <div className="line-variant-list">
          {variants.map((text, i) => (
            <div
              key={i}
              className={`line-variant-item ${i === safeIndex ? "line-variant-item-active" : ""}`}
            >
              <button
                className="line-variant-btn line-variant-select"
                onClick={() => updateAttributes({ activeIndex: i })}
                title={`Select variant ${i + 1}`}
                type="button"
              >
                {i + 1}
              </button>
              <input
                type="text"
                value={text}
                onChange={(e) => updateVariant(i, e.target.value)}
                className="line-variant-input"
                placeholder="Write a variant..."
              />
              {variants.length > 1 && (
                <button
                  className="line-variant-btn line-variant-remove"
                  onClick={() => removeVariant(i)}
                  title="Remove variant"
                  type="button"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
}

// ─── TipTap Node Extension ──────────────────────────────────────────────────

export const LineVariant = Node.create({
  name: "lineVariant",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      variants: {
        default: [""],
        parseHTML: (element: HTMLElement) => {
          const data = element.getAttribute("data-variants");
          if (data) {
            try {
              return JSON.parse(data) as string[];
            } catch {
              return [""];
            }
          }
          return [element.textContent || ""];
        },
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-variants": JSON.stringify(attributes.variants),
        }),
      },
      activeIndex: {
        default: 0,
        parseHTML: (element: HTMLElement) =>
          parseInt(element.getAttribute("data-active-index") || "0", 10),
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-active-index": String(attributes.activeIndex),
        }),
      },
    };
  },

  /**
   * Return only the active variant's text for getText()/textContent
   * so only the active variant counts toward word count and export.
   */
  renderText({ node }) {
    const variants = (node.attrs.variants as string[]) || [""];
    const activeIndex = (node.attrs.activeIndex as number) || 0;
    return variants[Math.min(activeIndex, variants.length - 1)] || "";
  },

  parseHTML() {
    return [{ tag: "div[data-line-variant]" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes as Record<string, string>, {
        "data-line-variant": "",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LineVariantView);
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-ArrowUp": ({ editor }) => {
        // Find the line variant node at cursor position
        const { $from } = editor.state.selection;
        let found = false;
        editor.state.doc.nodesBetween(
          $from.start(),
          $from.end(),
          (node, pos) => {
            if (node.type.name === "lineVariant" && !found) {
              found = true;
              const variants = (node.attrs.variants as string[]) || [""];
              const activeIndex = (node.attrs.activeIndex as number) || 0;
              const newIndex =
                activeIndex > 0 ? activeIndex - 1 : variants.length - 1;
              editor.view.dispatch(
                editor.state.tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  activeIndex: newIndex,
                }),
              );
            }
          },
        );
        return found;
      },
      "Mod-Alt-ArrowDown": ({ editor }) => {
        const { $from } = editor.state.selection;
        let found = false;
        editor.state.doc.nodesBetween(
          $from.start(),
          $from.end(),
          (node, pos) => {
            if (node.type.name === "lineVariant" && !found) {
              found = true;
              const variants = (node.attrs.variants as string[]) || [""];
              const activeIndex = (node.attrs.activeIndex as number) || 0;
              const newIndex =
                activeIndex < variants.length - 1 ? activeIndex + 1 : 0;
              editor.view.dispatch(
                editor.state.tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  activeIndex: newIndex,
                }),
              );
            }
          },
        );
        return found;
      },
    };
  },
});
