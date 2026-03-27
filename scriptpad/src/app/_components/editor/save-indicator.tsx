"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useEditorStore } from "~/stores/editor-store";

export function SaveIndicator() {
  const { saveState } = useEditorStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (saveState === "saving") {
      setVisible(true);
    } else if (saveState === "saved") {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [saveState]);

  if (!visible) return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs transition-opacity duration-300 ${
        saveState === "saved" ? "text-[var(--color-status-ready)]" : "text-[var(--color-text-muted)]"
      }`}
    >
      {saveState === "saving" && (
        <>
          <Loader2 size={12} className="animate-spin" />
          Saving...
        </>
      )}
      {saveState === "saved" && (
        <>
          <Check size={12} />
          Saved
        </>
      )}
    </div>
  );
}
