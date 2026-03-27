"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export function Fab() {
  const pathname = usePathname();

  // Hide on script editor pages
  if (pathname.startsWith("/script/")) {
    return null;
  }

  return (
    <button
      className="fixed bottom-6 right-6 z-20 flex h-14 w-14 animate-pulse cursor-pointer items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-[var(--color-accent-hover)] hover:animate-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]"
      aria-label="Quick capture"
    >
      <Plus size={24} />
    </button>
  );
}
