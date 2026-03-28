import Link from "next/link";
import {
  Zap,
  FileText,
  FolderOpen,
  ArrowRight,
  Layers,
  Camera,
  Timer,
  GitBranch,
  Keyboard,
  Monitor,
  Sparkles,
  Download,
} from "lucide-react";

const STATUS_STEPS = [
  { label: "Idea", color: "var(--color-status-idea)" },
  { label: "Writing", color: "var(--color-status-writing)" },
  { label: "Ready", color: "var(--color-status-ready)" },
  { label: "Posted", color: "var(--color-status-posted)" },
] as const;

const FEATURES = [
  {
    icon: Layers,
    title: "Script Structure",
    description:
      "Hook, Body, CTA sections with per-section word counts and timing. Your script understands its own anatomy.",
  },
  {
    icon: Camera,
    title: "Scene Annotations",
    description:
      "Inline B-roll, transition, and direction notes that live with your script but don't count toward spoken time.",
  },
  {
    icon: Timer,
    title: "Timing Marks",
    description:
      "See exactly where you'll be at 0:15, 0:30, 1:00. Paragraph-level timestamps computed at your speaking pace.",
  },
] as const;

const POWER_FEATURES = [
  {
    icon: GitBranch,
    title: "Line Variants",
    description:
      "Write multiple versions of any line. Toggle between them instantly. Only the active version counts.",
  },
  {
    icon: Sparkles,
    title: "Hook Scorer",
    description:
      "Real-time heuristic scoring for your hooks. See red/yellow/green strength indicators as you write.",
  },
  {
    icon: Monitor,
    title: "Teleprompter",
    description:
      "Full-screen auto-scroll at speaking pace. Mirror mode for hardware prompters. Scene notes dimmed.",
  },
  {
    icon: Keyboard,
    title: "Keyboard-First",
    description:
      "Cmd+Shift+H/B/C for sections, slash commands for everything, split view with Cmd+\\. Never leave the keyboard.",
  },
  {
    icon: Download,
    title: "Export",
    description:
      "Copy spoken-only text, full script with annotations, or download as .txt. Ready for any teleprompter app.",
  },
  {
    icon: FolderOpen,
    title: "Organize",
    description:
      "Folders, tags, statuses, and hook templates. Quick capture from anywhere. Auto-save everything.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Nav */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <span className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
          ScriptPad
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-12 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: copy */}
          <div>
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
              <Zap size={12} className="text-[var(--color-accent)]" />
              Built for short-form creators
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)] md:text-5xl xl:text-6xl">
              Write scripts
              <br />
              that know their
              <br />
              <span className="text-[var(--color-accent)]">own structure.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-[var(--color-text-muted)]">
              Not another notes app. A purpose-built script editor with Hook/Body/CTA
              structure, B-roll annotations, timing marks, and a built-in teleprompter.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-muted)] transition hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Right: hero feature cards */}
          <div className="flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                  <feature.icon className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Power Features Grid */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
              Everything a script needs. Nothing it doesn&apos;t.
            </h2>
            <p className="mt-3 text-[var(--color-text-muted)]">
              Every feature exists to make your next script better than the last.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {POWER_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <feature.icon className="mb-3 h-6 w-6 text-[var(--color-accent)]" />
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow + CTA */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-20 lg:px-12">
          {/* Left: status workflow */}
          <div>
            <h2 className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">
              Track every script&apos;s journey
            </h2>
            <p className="mb-8 max-w-md text-sm text-[var(--color-text-muted)]">
              From spark of an idea to published content — always know where you
              stand.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              {STATUS_STEPS.map((step, i) => (
                <div
                  key={step.label}
                  className="flex items-center gap-4 sm:gap-6"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: step.color }}
                    />
                    <span className="text-xs font-medium text-[var(--color-text-muted)] sm:text-sm">
                      {step.label}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className="mb-5 h-px w-8 bg-[var(--color-border)] sm:w-12" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: CTA card */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-10">
            <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
              Ready to write better scripts?
            </h2>
            <p className="mb-6 text-sm text-[var(--color-text-muted)]">
              Create your free account and start writing with structure in
              seconds.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              Sign Up Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] px-6 py-6 text-center text-xs text-[var(--color-text-muted)]">
        &copy; {new Date().getFullYear()} ScriptPad. All rights reserved.
      </footer>
    </div>
  );
}
