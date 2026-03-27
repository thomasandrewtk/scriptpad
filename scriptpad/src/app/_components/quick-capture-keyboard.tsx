"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQuickCaptureStore } from "~/stores/quick-capture-store";

export function QuickCaptureKeyboard() {
  const pathname = usePathname();
  const open = useQuickCaptureStore((s) => s.open);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        // Skip on script editor pages (FAB is hidden there too)
        if (pathname.startsWith("/script/")) return;
        e.preventDefault();
        open();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pathname, open]);

  return null;
}
