"use client";

import { Node, mergeAttributes } from "@tiptap/react";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Scissors, ArrowRight } from "lucide-react";

// ─── React NodeView Component ────────────────────────────────────────────────

const NOTE_TYPE_ICONS: Record<string, typeof Camera> = {
  broll: Camera,
  direction: Scissors,
  transition: ArrowRight,
};

const NOTE_TYPE_COLORS: Record<string, string> = {
  broll: "rgba(139, 92, 246, 0.1)",
  direction: "rgba(59, 130, 246, 0.1)",
  transition: "rgba(245, 158, 11, 0.1)",
};

const NOTE_TYPE_BORDER_COLORS: Record<string, string> = {
  broll: "rgba(139, 92, 246, 0.2)",
  direction: "rgba(59, 130, 246, 0.2)",
  transition: "rgba(245, 158, 11, 0.2)",
};

const NOTE_TYPE_TEXT_COLORS: Record<string, string> = {
  broll: "#A78BFA",
  direction: "#60A5FA",
  transition: "#FBBF24",
};

function SceneNoteView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: ReactNodeViewProps) {
  const noteText = (node.attrs.text as string) || "";
  const noteType = (node.attrs.noteType as string) || "broll";
  const Icon = NOTE_TYPE_ICONS[noteType] || Camera;
  const bgColor = NOTE_TYPE_COLORS[noteType] || NOTE_TYPE_COLORS.broll!;
  const borderColor = NOTE_TYPE_BORDER_COLORS[noteType] || NOTE_TYPE_BORDER_COLORS.broll!;
  const textColor = NOTE_TYPE_TEXT_COLORS[noteType] || NOTE_TYPE_TEXT_COLORS.broll!;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(noteText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed.length === 0) {
      deleteNode();
    } else {
      updateAttributes({ text: trimmed });
    }
    setIsEditing(false);
  }, [editText, updateAttributes, deleteNode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setEditText(noteText);
        setIsEditing(false);
      }
      if (e.key === "Backspace" && editText.length === 0) {
        e.preventDefault();
        deleteNode();
      }
    },
    [commitEdit, deleteNode, editText.length, noteText],
  );

  // Open a new scene note in edit mode if text is empty
  useEffect(() => {
    if (noteText === "" && !isEditing) {
      setIsEditing(true);
    }
  }, [noteText, isEditing]);

  return (
    <NodeViewWrapper as="span" className="scene-note-wrapper">
      {isEditing ? (
        <span
          className="scene-note scene-note-editing"
          style={{ background: bgColor, borderColor, color: textColor }}
        >
          <Icon size={12} className="scene-note-icon" />
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="scene-note-input"
            style={{ color: textColor }}
            placeholder="describe the scene..."
          />
        </span>
      ) : (
        <span
          className={`scene-note ${selected ? "scene-note-selected" : ""}`}
          style={{ background: bgColor, borderColor, color: textColor }}
          onClick={() => {
            setEditText(noteText);
            setIsEditing(true);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setEditText(noteText);
              setIsEditing(true);
            }
          }}
        >
          <Icon size={12} className="scene-note-icon" />
          <span className="scene-note-text">{noteText}</span>
        </span>
      )}
    </NodeViewWrapper>
  );
}

// ─── TipTap Node Extension ──────────────────────────────────────────────────

export const SceneNote = Node.create({
  name: "sceneNote",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      text: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-scene-text") || element.textContent || "",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-scene-text": attributes.text,
        }),
      },
      noteType: {
        default: "broll",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-note-type") || "broll",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-note-type": attributes.noteType,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-scene-note]" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes as Record<string, string>, { "data-scene-note": "" }),
      (HTMLAttributes["data-scene-text"] as string) || "",
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SceneNoteView);
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        const nodeBefore = $from.nodeBefore;
        if (
          nodeBefore &&
          nodeBefore.type.name === "sceneNote" &&
          selection.empty
        ) {
          // Delete the scene note when backspacing into it
          const from = $from.pos - nodeBefore.nodeSize;
          const to = $from.pos;
          editor.view.dispatch(editor.state.tr.delete(from, to));
          return true;
        }
        return false;
      },
    };
  },
});
