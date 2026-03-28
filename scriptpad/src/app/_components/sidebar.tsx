"use client";

import { PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useSidebarStore } from "~/stores/sidebar-store";
import { SidebarSearch } from "./sidebar-search";
import { SidebarNav } from "./sidebar-nav";
import { SidebarFolders } from "./sidebar-folders";
import { SidebarTags } from "./sidebar-tags";

export function Sidebar() {
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } =
    useSidebarStore();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-collapsed={isCollapsed}
        className={[
          "group/sidebar flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-sans transition-all duration-200 ease-in-out",
          // Mobile: overlay drawer, always full width
          "fixed inset-y-0 left-0 z-40 w-64 md:relative md:z-auto",
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
          // Tablet: always icon-only. Desktop: respect collapsed state.
          "md:w-16",
          isCollapsed ? "lg:w-16" : "lg:w-64",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--color-border)] px-4">
          {/* Mobile: full name */}
          <span className="flex-1 text-lg font-bold text-[var(--color-text-primary)] md:hidden">
            ScriptPad
          </span>

          {/* Tablet & collapsed desktop: centered expand icon only */}
          <div
            className={[
              "hidden w-full items-center justify-center",
              isCollapsed ? "md:flex" : "max-lg:flex",
            ].join(" ")}
          >
            <button
              onClick={toggle}
              className="hidden cursor-pointer rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] lg:inline-flex"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
            {/* Tablet: just show logo mark (no toggle available) */}
            <span className="text-lg font-bold text-[var(--color-text-primary)] lg:hidden">
              SP
            </span>
          </div>

          {/* Desktop expanded: full name + collapse toggle */}
          {!isCollapsed && (
            <div className="hidden w-full items-center justify-between lg:flex">
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                ScriptPad
              </span>
              <button
                onClick={toggle}
                className="cursor-pointer rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar content */}
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
          <SidebarSearch />
          <SidebarNav />
          <SidebarFolders />
          <SidebarTags />
        </div>

        {/* Sign out */}
        <div className="shrink-0 border-t border-[var(--color-border)] px-2 py-3">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={[
              "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
              isCollapsed ? "lg:justify-center lg:px-0" : "",
            ].join(" ")}
          >
            <LogOut size={18} />
            <span
              className={[
                "md:hidden",
                isCollapsed ? "lg:hidden" : "lg:inline",
              ].join(" ")}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
