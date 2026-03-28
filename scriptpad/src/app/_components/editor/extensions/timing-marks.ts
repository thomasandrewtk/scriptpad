import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/react";

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_WPM = 150;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

const timingMarksPluginKey = new PluginKey("timingMarks");

function createTimingMarksPlugin(wpm: number) {
  return new Plugin({
    key: timingMarksPluginKey,
    props: {
      decorations(state) {
        const decorations: Decoration[] = [];
        let cumulativeWords = 0;
        const doc = state.doc;

        doc.descendants((node, pos) => {
          // Only add timing marks on paragraphs
          if (node.isBlock && node.type.name === "paragraph") {
            // Count words in this paragraph, excluding scene notes
            let paragraphText = "";
            node.descendants((child) => {
              if (child.type.name === "sceneNote") return false;
              if (child.isText && child.text) {
                paragraphText += child.text;
              }
            });

            if (cumulativeWords > 0 || paragraphText.trim().length > 0) {
              const seconds = Math.round((cumulativeWords / wpm) * 60);
              const timeStr = formatTime(seconds);

              const widget = Decoration.widget(
                pos,
                () => {
                  const el = document.createElement("span");
                  el.className = "timing-mark";
                  el.textContent = timeStr;
                  el.contentEditable = "false";
                  return el;
                },
                { side: -1, key: `timing-${pos}` },
              );

              decorations.push(widget);
            }

            // Add this paragraph's words to cumulative count
            const words = paragraphText
              .trim()
              .split(/\s+/)
              .filter((w) => w.length > 0);
            cumulativeWords += words.length;
          }

          // For scriptSection nodes, descend into them but don't add marks on the section itself
          if (node.type.name === "scriptSection") {
            return true; // continue descending
          }

          // For horizontal rules and other non-paragraph blocks, skip
          if (
            node.isBlock &&
            node.type.name !== "paragraph" &&
            node.type.name !== "scriptSection"
          ) {
            return false;
          }
        });

        return DecorationSet.create(doc, decorations);
      },
    },
  });
}

// ─── TipTap Extension ────────────────────────────────────────────────────────

export const TimingMarks = Extension.create({
  name: "timingMarks",

  addOptions() {
    return {
      wpm: DEFAULT_WPM,
    };
  },

  addProseMirrorPlugins() {
    return [createTimingMarksPlugin(this.options.wpm as number)];
  },
});
