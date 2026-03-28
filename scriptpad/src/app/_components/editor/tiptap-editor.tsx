"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Sparkles,
} from "lucide-react";
import { useEditorStore, type SectionStat } from "~/stores/editor-store";
import { api } from "~/trpc/react";
import { SlashCommandMenu } from "./slash-command-menu";
import { ScriptSection, SECTION_LABELS } from "./extensions/script-section";
import { SceneNote } from "./extensions/scene-note";
import { TimingMarks } from "./extensions/timing-marks";
import { LineVariant } from "./extensions/line-variant";
import { KeyboardShortcuts } from "./extensions/keyboard-shortcuts";

interface TiptapEditorProps {
  initialContent: unknown;
  onContentChange: (body: unknown, bodyPlainText: string) => void;
  onForceSave: () => void;
  notesRef: React.RefObject<HTMLTextAreaElement | null>;
}

// Note: CustomKeymap has been replaced by the KeyboardShortcuts extension
// which includes Mod-Shift-minus and all other shortcuts

/**
 * Compute stats from the editor document, excluding scene notes from word/char counts.
 */
function computeStats(editor: ReturnType<typeof useEditor>) {
  if (!editor) return { wordCount: 0, charCount: 0, estimatedDurationSeconds: 0, sectionStats: [], plainText: "" };

  const doc = editor.state.doc;

  // Gather spoken text (excluding scene notes) for overall stats
  let spokenText = "";
  doc.descendants((node) => {
    if (node.type.name === "sceneNote") return false;
    if (node.isText && node.text) spokenText += node.text;
    if (node.isBlock && spokenText.length > 0 && !spokenText.endsWith("\n")) {
      spokenText += "\n";
    }
  });

  const words = spokenText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = words.length;
  const charCount = spokenText.trim().length;
  const estimatedDurationSeconds = Math.round((wordCount / 150) * 60);

  // Compute per-section stats
  const sectionStats: SectionStat[] = [];
  doc.descendants((node) => {
    if (node.type.name === "scriptSection") {
      let sectionText = "";
      node.descendants((child) => {
        if (child.type.name === "sceneNote") return false;
        if (child.isText && child.text) sectionText += child.text + " ";
      });
      const sectionWords = sectionText
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      const swc = sectionWords.length;
      sectionStats.push({
        type: node.attrs.sectionType as string,
        label:
          (node.attrs.customLabel as string) ||
          SECTION_LABELS[node.attrs.sectionType as string] ||
          "Section",
        wordCount: swc,
        durationSeconds: Math.round((swc / 150) * 60),
      });
      return false; // don't descend further (already did inside)
    }
  });

  // For bodyPlainText, use editor.getText() which naturally excludes atom nodes (scene notes)
  const plainText = editor.getText();

  return { wordCount, charCount, estimatedDurationSeconds, sectionStats, plainText };
}

export function TiptapEditor({
  initialContent,
  onContentChange,
  onForceSave,
  notesRef,
}: TiptapEditorProps) {
  const { setStats } = useEditorStore();
  const isInitializedRef = useRef(false);
  const [punchUpResult, setPunchUpResult] = useState<string | null>(null);

  const punchUpMutation = api.ai.punchUp.useMutation({
    onSuccess: (data) => {
      setPunchUpResult(data.rewritten);
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Start writing your script...",
      }),
      HorizontalRule,
      KeyboardShortcuts,
      ScriptSection,
      SceneNote,
      LineVariant,
      TimingMarks.configure({ wpm: 150 }),
    ],
    content: initialContent as Record<string, unknown> | undefined,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor }) => {
      if (!isInitializedRef.current) return;

      const json = editor.getJSON();
      const stats = computeStats(editor);

      setStats({
        wordCount: stats.wordCount,
        charCount: stats.charCount,
        estimatedDurationSeconds: stats.estimatedDurationSeconds,
        sectionStats: stats.sectionStats,
      });
      onContentChange(json, stats.plainText);
    },
    onCreate: () => {
      // Mark as initialized after the first render to avoid firing onUpdate
      // during initial content load
      requestAnimationFrame(() => {
        isInitializedRef.current = true;
      });
    },
    immediatelyRender: false,
  });

  // Handle Cmd+S at editor level
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onForceSave();
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener("keydown", handleKeyDown);
    return () => editorElement.removeEventListener("keydown", handleKeyDown);
  }, [editor, onForceSave]);

  const handleSlashCommand = useCallback(
    (command: string) => {
      if (!editor) return;

      switch (command) {
        case "divider":
          editor.chain().focus().setHorizontalRule().run();
          break;
        case "date": {
          const dateStr = new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          editor.chain().focus().insertContent(dateStr).run();
          break;
        }
        case "note":
          notesRef.current?.focus();
          break;
        case "hook-section":
          editor.commands.insertContent({
            type: "scriptSection",
            attrs: { sectionType: "hook" },
            content: [{ type: "paragraph" }],
          });
          break;
        case "body-section":
          editor.commands.insertContent({
            type: "scriptSection",
            attrs: { sectionType: "body" },
            content: [{ type: "paragraph" }],
          });
          break;
        case "cta-section":
          editor.commands.insertContent({
            type: "scriptSection",
            attrs: { sectionType: "cta" },
            content: [{ type: "paragraph" }],
          });
          break;
        case "structure":
          editor.commands.insertContent([
            {
              type: "scriptSection",
              attrs: { sectionType: "hook" },
              content: [{ type: "paragraph" }],
            },
            {
              type: "scriptSection",
              attrs: { sectionType: "body" },
              content: [{ type: "paragraph" }],
            },
            {
              type: "scriptSection",
              attrs: { sectionType: "cta" },
              content: [{ type: "paragraph" }],
            },
          ]);
          break;
        case "scene":
        case "broll":
          editor.commands.insertContent({
            type: "sceneNote",
            attrs: { text: "", noteType: "broll" },
          });
          break;
        case "transition":
          editor.commands.insertContent({
            type: "sceneNote",
            attrs: { text: "", noteType: "transition" },
          });
          break;
        case "direction":
          editor.commands.insertContent({
            type: "sceneNote",
            attrs: { text: "", noteType: "direction" },
          });
          break;
        case "variant":
          editor.commands.insertContent({
            type: "lineVariant",
            attrs: { variants: [""], activeIndex: 0 },
          });
          break;
      }
    },
    [editor, notesRef],
  );

  const handleHookInsert = useCallback(
    (body: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(body).run();
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="relative mt-4 min-h-[400px]">
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-xl shadow-black/30"
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`cursor-pointer rounded p-1.5 transition-colors ${
            editor.isActive("bold")
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
          }`}
          title="Bold (Cmd+B)"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`cursor-pointer rounded p-1.5 transition-colors ${
            editor.isActive("italic")
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
          }`}
          title="Italic (Cmd+I)"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`cursor-pointer rounded p-1.5 transition-colors ${
            editor.isActive("underline")
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
          }`}
          title="Underline (Cmd+U)"
        >
          <UnderlineIcon size={16} />
        </button>
        <div className="mx-0.5 h-4 w-px bg-[var(--color-border)]" />
        <button
          onClick={() => {
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to);
            if (selectedText.trim().length > 0) {
              setPunchUpResult(null);
              punchUpMutation.mutate({ selectedText });
            }
          }}
          className="cursor-pointer rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[#A78BFA]"
          title="Punch Up"
        >
          <Sparkles size={16} />
        </button>
      </BubbleMenu>

      {/* Punch Up popover */}
      {(punchUpResult || punchUpMutation.isPending) && (
        <div className="fixed right-8 top-1/3 z-50 w-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-xl shadow-black/30">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA]">
              <Sparkles size={12} />
              Punch Up
            </span>
            <button
              onClick={() => {
                setPunchUpResult(null);
                punchUpMutation.reset();
              }}
              className="cursor-pointer text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              Close
            </button>
          </div>
          {punchUpMutation.isPending ? (
            <div className="text-sm text-[var(--color-text-muted)]">
              Rewriting...
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
                {punchUpResult}
              </p>
              <button
                onClick={() => {
                  if (punchUpResult) {
                    const { from, to } = editor.state.selection;
                    editor
                      .chain()
                      .focus()
                      .deleteRange({ from, to })
                      .insertContent(punchUpResult)
                      .run();
                    setPunchUpResult(null);
                    punchUpMutation.reset();
                  }
                }}
                className="mt-3 w-full cursor-pointer rounded bg-[#A78BFA] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#8B5CF6]"
              >
                Replace with this
              </button>
            </>
          )}
        </div>
      )}

      <EditorContent editor={editor} />

      <SlashCommandMenu
        editor={editor}
        onCommand={handleSlashCommand}
        onHookInsert={handleHookInsert}
      />
    </div>
  );
}
