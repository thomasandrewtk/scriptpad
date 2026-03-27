"use client";

import { TAG_PRESET_COLORS } from "~/lib/tag-colors";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {TAG_PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={[
            "h-5 w-5 cursor-pointer rounded-full transition-all",
            value === color
              ? "ring-2 ring-white/50 ring-offset-1 ring-offset-[var(--color-surface-elevated)]"
              : "hover:scale-110",
          ].join(" ")}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
