/**
 * Script export utilities.
 * Converts TipTap document JSON to plain text formats for clipboard or file download.
 */

const SECTION_LABELS: Record<string, string> = {
  hook: "HOOK",
  body: "BODY",
  cta: "CTA",
  custom: "CUSTOM",
};

interface ExportOptions {
  /** Include scene notes / B-roll annotations */
  includeAnnotations: boolean;
  /** Include section headers */
  includeSectionHeaders: boolean;
  /** Script title */
  title: string;
}

/**
 * Convert TipTap JSON document to plain text.
 */
export function exportToText(
  doc: Record<string, unknown> | null | undefined,
  options: ExportOptions,
): string {
  if (!doc) return "";

  const lines: string[] = [];

  if (options.title) {
    lines.push(options.title);
    lines.push("=".repeat(options.title.length));
    lines.push("");
  }

  function processNodes(nodes: unknown[]) {
    for (const node of nodes) {
      const n = node as Record<string, unknown>;
      const type = n.type as string;

      if (type === "doc") {
        const content = n.content as unknown[] | undefined;
        if (content) processNodes(content);
        continue;
      }

      if (type === "scriptSection") {
        const attrs = n.attrs as Record<string, unknown> | undefined;
        const sectionType = (attrs?.sectionType as string) || "custom";
        const customLabel = attrs?.customLabel as string | undefined;
        const label =
          customLabel?.toUpperCase() ||
          SECTION_LABELS[sectionType] ||
          "SECTION";

        if (options.includeSectionHeaders) {
          lines.push("");
          lines.push(`--- ${label} ---`);
          lines.push("");
        }

        const content = n.content as unknown[] | undefined;
        if (content) processNodes(content);
        continue;
      }

      if (type === "paragraph") {
        const content = n.content as unknown[] | undefined;
        if (!content) {
          lines.push("");
          continue;
        }

        let lineText = "";
        for (const child of content) {
          const c = child as Record<string, unknown>;
          if (c.type === "text") {
            lineText += c.text as string;
          } else if (c.type === "sceneNote" && options.includeAnnotations) {
            const attrs = c.attrs as Record<string, unknown> | undefined;
            const noteText = (attrs?.text as string) || "";
            const noteType = (attrs?.noteType as string) || "broll";
            const prefix =
              noteType === "transition"
                ? "TRANSITION"
                : noteType === "direction"
                  ? "DIRECTION"
                  : "B-ROLL";
            lineText += `[${prefix}: ${noteText}]`;
          }
        }
        lines.push(lineText);
        continue;
      }

      if (type === "lineVariant") {
        const attrs = n.attrs as Record<string, unknown> | undefined;
        const variants = (attrs?.variants as string[]) || [""];
        const activeIndex = (attrs?.activeIndex as number) || 0;
        const activeText =
          variants[Math.min(activeIndex, variants.length - 1)] || "";
        lines.push(activeText);

        // In full export, also show alternate variants
        if (options.includeAnnotations && variants.length > 1) {
          for (let i = 0; i < variants.length; i++) {
            if (i !== activeIndex && variants[i]?.trim()) {
              lines.push(`  [ALT ${i + 1}: ${variants[i]}]`);
            }
          }
        }
        continue;
      }

      if (type === "horizontalRule") {
        lines.push("");
        lines.push("---");
        lines.push("");
        continue;
      }
    }
  }

  processNodes([doc]);
  return lines.join("\n").trim();
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download text as a file.
 */
export function downloadAsFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
