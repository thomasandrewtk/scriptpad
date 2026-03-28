import Link from "next/link";
import { Zap, FileText, FolderOpen, ArrowRight } from "lucide-react";

const STATUS_STEPS = [
  { label: "Idea", color: "var(--color-status-idea)" },
  { label: "Writing", color: "var(--color-status-writing)" },
  { label: "Ready", color: "var(--color-status-ready)" },
  { label: "Posted", color: "var(--color-status-posted)" },
] as const;

const FEATURES = [
  {
    icon: Zap,
    title: "Quick Capture",
    description:
      "Jot down ideas instantly with keyboard shortcuts. Never lose a thought again.",
  },
  {
    icon: FileText,
    title: "Rich Editor",
    description:
      "Write with a distraction-free editor that auto-saves. Formatting without the fuss.",
  },
  {
    icon: FolderOpen,
    title: "Organize",
    description:
      "Folders, tags, and statuses keep your scripts organized from idea to posted.",
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

      {/* Hero — split layout on desktop */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-12 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: copy + CTAs */}
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)] md:text-5xl xl:text-6xl">
              Write scripts.
              <br />
              Ship content.
              <br />
              <span className="text-[var(--color-accent)]">Stay organized.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-[var(--color-text-muted)]">
              A fast, focused writing app for short-form content creators.
              Capture ideas, draft scripts, and track your workflow — all in one
              place.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                Get Started
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

          {/* Right: feature cards stacked vertically */}
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

      {/* Workflow + CTA — side by side on desktop */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
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
                <div key={step.label} className="flex items-center gap-4 sm:gap-6">
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
              Ready to start writing?
            </h2>
            <p className="mb-6 text-sm text-[var(--color-text-muted)]">
              Create your free account and start capturing ideas in seconds.
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
