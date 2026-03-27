"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Zap, Settings, Plus } from "lucide-react";
import { useSidebarStore } from "~/stores/sidebar-store";

const navItems = [
  { href: "/", label: "All Scripts", icon: FileText },
  { href: "/hooks", label: "Hook Templates", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebarStore();

  return (
    <nav className="flex flex-col gap-0.5">
      {/* Quick Capture button */}
      <button
        className={[
          "flex items-center rounded-lg transition-colors",
          "mb-2 cursor-pointer text-sm font-medium",
          "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]",
          // Mobile: always expanded row
          "max-md:gap-2 max-md:px-3 max-md:py-2",
          // Tablet: always centered icon
          "md:justify-center md:p-2",
          // Desktop: depends on state
          isCollapsed ? "" : "lg:justify-start lg:gap-2 lg:px-3 lg:py-2",
        ].join(" ")}
      >
        <Plus size={18} className="shrink-0" />
        <span
          className={[
            "hidden max-md:inline",
            isCollapsed ? "" : "lg:inline",
          ].join(" ")}
        >
          Quick Capture
        </span>
      </button>

      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex items-center rounded-lg transition-colors",
              "group relative text-sm font-medium",
              // Mobile: always expanded
              "max-md:gap-2 max-md:px-3 max-md:py-2",
              // Tablet: always collapsed
              "md:justify-center md:p-2",
              // Desktop: depends on state
              isCollapsed ? "" : "lg:justify-start lg:gap-2 lg:px-3 lg:py-2",
              isActive
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
            ].join(" ")}
          >
            <Icon size={18} className="shrink-0" />
            <span
              className={[
                "hidden max-md:inline",
                isCollapsed ? "" : "lg:inline",
              ].join(" ")}
            >
              {label}
            </span>
            {/* Tooltip */}
            <span
              className={[
                "pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text-primary)] shadow-lg",
                isCollapsed
                  ? "md:group-hover:block"
                  : "max-lg:group-hover:block",
              ].join(" ")}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
