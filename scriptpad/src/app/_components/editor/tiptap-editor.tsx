"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Bold, Italic, Underline as UnderlineIcon } from "lucide-react";
import { useEditorStore } from "~/stores/editor-store";
import { SlashCommandMenu } from "./slash-command-menu";

interface TiptapEditorProps {
  initialContent: unknown;
  onContentChange: (body: unknown, bodyPlainText: string) => void;
  onForceSave: () => void;
  notesRef: React.RefObject<HTMLTextAreaElement | null>;
}

// Custom keyboard shortcuts extension
const CustomKeymap = Extension.create({
  name: "customKeymap",
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-minus": ({ editor: e }) => {
        e.chain().focus().setHorizontalRule().run();
        return true;
      },
    };
  },
});

export function TiptapEditor({
  initialContent,
  onContentChange,
  onForceSave,
  notesRef,
}: TiptapEditorProps) {
  const { setStats } = useEditorStore();
  const isInitializedRef = useRef(false);

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
      CustomKeymap,
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
      const text = editor.getText();

      // Compute local stats
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      const wordCount = words.length;
      const charCount = text.length;
      const estimatedDurationSeconds = Math.round((wordCount / 150) * 60);

      setStats({ wordCount, charCount, estimatedDurationSeconds });
      onContentChange(json, text);
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
      </BubbleMenu>

      <EditorContent editor={editor} />

      <SlashCommandMenu
        editor={editor}
        onCommand={handleSlashCommand}
        onHookInsert={handleHookInsert}
      />
    </div>
  );
}
