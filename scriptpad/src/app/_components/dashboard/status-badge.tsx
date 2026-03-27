"use client";

type ScriptStatus = "idea" | "writing" | "ready" | "posted";

const STATUS_COLORS: Record<ScriptStatus, { text: string; bg: string; dot: string }> = {
  idea: { text: "#9CA3AF", bg: "rgba(107, 114, 128, 0.15)", dot: "#6B7280" },
  writing: { text: "#FBBF24", bg: "rgba(245, 158, 11, 0.15)", dot: "#F59E0B" },
  ready: { text: "#34D399", bg: "rgba(16, 185, 129, 0.15)", dot: "#10B981" },
  posted: { text: "#818CF8", bg: "rgba(99, 102, 241, 0.15)", dot: "#6366F1" },
};

const STATUS_LABELS: Record<ScriptStatus, string> = {
  idea: "Idea",
  writing: "Writing",
  ready: "Ready",
  posted: "Posted",
};

export function StatusBadge({ status }: { status: ScriptStatus }) {
  const colors = STATUS_COLORS[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-200"
      style={{
        color: colors.text,
        backgroundColor: colors.bg,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
