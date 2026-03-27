# Claude Code — ScriptPad Project Instructions

## Source of Truth

The **single source of truth** for this project is the PRD:
`/Users/thomas/Documents/ScriptPad/ScriptPad_MVP_Spec.md`

Read the full PRD before writing any code. Every feature, data model, UI component, and design decision is defined there. Do not invent features not in the PRD. Do not skip features that are in it. If something is ambiguous, ask — don't guess.

## Build Log

You **must** update the build log as you work:
`/Users/thomas/Documents/ScriptPad/scriptpad/BUILD_LOG.md`

- When you **start** a phase: update its status to "In progress"
- When you **create or modify** files: add them to the phase's file list
- When you **fix bugs**: document them in the phase section
- When you **complete** a phase: mark it ✅, summarize what was built, note test results
- Keep the log accurate — it's the project's memory across sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router, `src/` directory) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with `@tailwindcss/typography` |
| API | tRPC v11 |
| ORM | Drizzle ORM (PostgreSQL) |
| Database | Supabase PostgreSQL (Session Pooler) |
| Auth | NextAuth v5 (credentials + email magic link) |
| Rich Text Editor | TipTap |
| File Storage | Supabase Storage |
| UI State | React Query (via tRPC) + Zustand |
| Icons | lucide-react |
| Toasts | sonner |
| Date utils | date-fns |
| Command menu | cmdk |
| Package manager | pnpm |

## Critical Rules

1. **Dark mode only.** No light theme. Every component must look correct on dark backgrounds.
2. **Every DB query filters by authenticated userId.** No exceptions.
3. **Auto-save is non-negotiable.** Debounce at 3 seconds. Show save state.
4. **No markdown syntax in the editor.** Users should never see `#`, `**`, backticks, or `>`.
5. **Speed of capture is the #1 UX priority.** Minimize loading states and friction.
6. **Do not add features not in the PRD.** No AI features, no calendar view, no notifications, no platform field, no drag-to-reorder.
7. **Soft delete for scripts.** Use `deletedAt` timestamp.
8. **Use distinctive typography.** DM Sans (UI), Plus Jakarta Sans (editor), JetBrains Mono (stats). No Inter/Roboto/Arial.

## Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm typecheck    # TypeScript type checking
pnpm db:push      # Push schema to Supabase
pnpm db:seed      # Seed database with sample data
pnpm build        # Production build
```

For typecheck without env validation: `SKIP_ENV_VALIDATION=1 pnpm typecheck`

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── auth/         # Sign-in page
│   ├── api/          # tRPC + NextAuth API routes
│   └── page.tsx      # Dashboard (home)
├── components/       # Shared UI components (to be built)
├── server/
│   ├── api/
│   │   ├── root.ts   # tRPC root router
│   │   ├── trpc.ts   # tRPC context + procedures
│   │   └── routers/  # All tRPC routers (scripts, tags, folders, hookTemplates, attachments)
│   ├── auth/         # NextAuth config
│   └── db/
│       ├── schema.ts # Drizzle schema (all tables)
│       ├── index.ts  # DB connection
│       └── seed.ts   # Seed script
├── styles/
│   └── globals.css   # Tailwind + theme CSS variables
├── trpc/             # tRPC client helpers
└── env.js            # Environment variable validation
```

## Current Status

See `BUILD_LOG.md` for detailed phase-by-phase progress.
