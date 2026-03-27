"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useSidebarStore } from "~/stores/sidebar-store";

export function SidebarSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const { isCollapsed, toggle } = useSidebarStore();

  // Debounced navigation
  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.trim()) {
          router.push(`/?search=${encodeURIComponent(value.trim())}`);
        } else {
          router.push("/");
        }
      }, 300);
    },
    [router],
  );

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isCollapsed) {
          toggle();
        }
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed, toggle]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="mb-2">
      {/* Collapsed: centered search icon button */}
      <button
        onClick={() => {
          toggle();
          setTimeout(() => inputRef.current?.focus(), 250);
        }}
        className={[
          "hidden w-full cursor-pointer items-center justify-center rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]",
          isCollapsed ? "md:flex" : "max-lg:flex",
        ].join(" ")}
        aria-label="Search scripts"
      >
        <Search size={18} />
      </button>

      {/* Expanded: full search input */}
      <div
        className={[
          "relative max-md:block md:hidden",
          isCollapsed ? "" : "lg:block",
        ].join(" ")}
      >
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search scripts... ⌘K"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>
    </div>
  );
}
