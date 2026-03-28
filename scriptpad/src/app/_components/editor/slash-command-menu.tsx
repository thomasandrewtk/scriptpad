"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { Minus, Anchor, Calendar, StickyNote } from "lucide-react";
import type { Editor } from "@tiptap/react";

const HookTemplatePicker = dynamic(
  () =>
    import("./hook-template-picker").then((m) => ({
      default: m.HookTemplatePicker,
    })),
  { ssr: false },
);

const COMMANDS = [
  {
    id: "divider",
    label: "Divider",
    description: "Insert a horizontal rule",
    icon: Minus,
  },
  {
    id: "hook",
    label: "Hook",
    description: "Insert a hook template",
    icon: Anchor,
  },
  {
    id: "date",
    label: "Date",
    description: "Insert today's date",
    icon: Calendar,
  },
  {
    id: "note",
    label: "Note",
    description: "Jump to notes field",
    icon: StickyNote,
  },
];

interface SlashCommandMenuProps {
  editor: Editor;
  onCommand: (command: string) => void;
  onHookInsert: (body: string) => void;
}

export function SlashCommandMenu({
  editor,
  onCommand,
  onHookInsert,
}: SlashCommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showHookPicker, setShowHookPicker] = useState(false);
  const slashStartRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.id.toLowerCase().includes(query.toLowerCase()),
  );

  const deleteSlashText = useCallback(() => {
    if (slashStartRef.current === null) return;
    const { state } = editor.view;
    const from = slashStartRef.current;
    const to = state.selection.from;
    editor.view.dispatch(state.tr.delete(from, to));
  }, [editor]);

  const executeCommand = useCallback(
    (commandId: string) => {
      deleteSlashText();
      setIsOpen(false);
      setQuery("");
      slashStartRef.current = null;

      if (commandId === "hook") {
        setShowHookPicker(true);
        return;
      }

      onCommand(commandId);
    },
    [deleteSlashText, onCommand],
  );

  // Listen for "/" typed in editor
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      const { state } = editor.view;
      const { from } = state.selection;

      if (isOpen && slashStartRef.current !== null) {
        // Update query from typed text after "/"
        const text = state.doc.textBetween(slashStartRef.current + 1, from, "");
        setQuery(text);
        setSelectedIndex(0);

        // Update position
        const coords = editor.view.coordsAtPos(slashStartRef.current);
        setPosition({ top: coords.bottom + 4, left: coords.left });
        return;
      }

      // Check if user just typed "/"
      if (from < 1) return;
      const charBefore = state.doc.textBetween(from - 1, from, "");
      if (charBefore !== "/") return;

      // Check it's at start of line or after whitespace
      if (from >= 2) {
        const twoCharsBefore = state.doc.textBetween(from - 2, from - 1, "");
        if (twoCharsBefore && !/\s/.test(twoCharsBefore)) return;
      }

      // Open slash menu
      slashStartRef.current = from - 1;
      setQuery("");
      setSelectedIndex(0);
      setIsOpen(true);

      const coords = editor.view.coordsAtPos(from - 1);
      setPosition({ top: coords.bottom + 4, left: coords.left });
    };

    editor.on("transaction", handleTransaction);
    return () => {
      editor.off("transaction", handleTransaction);
    };
  }, [editor, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        slashStartRef.current = null;
        editor.commands.focus();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0,
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1,
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          executeCommand(cmd.id);
        }
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand, editor]);

  // Close if no matches and user keeps typing
  useEffect(() => {
    if (isOpen && filteredCommands.length === 0 && query.length > 10) {
      setIsOpen(false);
      setQuery("");
      slashStartRef.current = null;
    }
  }, [isOpen, filteredCommands.length, query]);

  const handleHookSelect = useCallback(
    (body: string) => {
      setShowHookPicker(false);
      onHookInsert(body);
    },
    [onHookInsert],
  );

  return (
    <>
      {isOpen &&
        filteredCommands.length > 0 &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 w-[220px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-1 shadow-xl shadow-black/30"
            style={position}
          >
            {filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeCommand(cmd.id);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{cmd.label}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {cmd.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>,
          document.body,
        )}

      {showHookPicker && (
        <HookTemplatePicker
          onSelect={handleHookSelect}
          onClose={() => {
            setShowHookPicker(false);
            editor.commands.focus();
          }}
        />
      )}
    </>
  );
}
