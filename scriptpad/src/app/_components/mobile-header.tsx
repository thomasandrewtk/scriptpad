"use client";

import { Menu } from "lucide-react";
import { useSidebarStore } from "~/stores/sidebar-store";

export function MobileHeader() {
  const { setMobileOpen } = useSidebarStore();

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 md:hidden">
      <button
        onClick={() => setMobileOpen(true)}
        className="rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
        aria-label="Open sidebar"
      >
        <Menu size={22} />
      </button>
      <span className="flex-1 text-center text-lg font-bold text-[var(--color-text-primary)]">
        ScriptPad
      </span>
      {/* Spacer to balance hamburger for centering */}
      <div className="w-8" />
    </header>
  );
}
