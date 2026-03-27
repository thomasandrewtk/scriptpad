"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useQuickCaptureStore } from "~/stores/quick-capture-store";

export function Fab() {
  const pathname = usePathname();
  const open = useQuickCaptureStore((s) => s.open);

  // Hide on script editor pages
  if (pathname.startsWith("/script/")) {
    return null;
  }

  return (
    <button
      data-onboarding="fab"
      onClick={open}
      className="fixed bottom-6 right-6 z-20 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg animate-[fab-pulse_600ms_ease-in-out_1] transition-all duration-200 hover:scale-105 hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]"
      aria-label="Quick capture"
    >
      <Plus size={24} />
    </button>
  );
}
