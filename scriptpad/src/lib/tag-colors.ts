/**
 * 12 preset hex colors for the tag color picker.
 * Imported by settings tags section, sidebar tag create, and tag picker popover.
 */
export const TAG_PRESET_COLORS = [
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#EF4444", // red
  "#F97316", // orange
  "#F59E0B", // amber
  "#10B981", // emerald
  "#14B8A6", // teal
  "#06B6D4", // cyan
  "#6B7280", // gray
  "#A78BFA", // purple-light
] as const;

export type PresetColor = (typeof TAG_PRESET_COLORS)[number];
