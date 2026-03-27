"use client";

import { useRef, useState } from "react";

interface EditorTitleProps {
  initialTitle: string;
  onTitleChange: (title: string) => void;
}

export function EditorTitle({ initialTitle, onTitleChange }: EditorTitleProps) {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setTitle(value);
    if (value.trim()) {
      onTitleChange(value);
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={title}
      onChange={handleChange}
      placeholder="Untitled Script"
      maxLength={500}
      className="mb-2 w-full border-none bg-transparent font-editor text-3xl font-bold text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]/40 outline-none"
    />
  );
}
