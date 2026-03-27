# ScriptPad — Build Log

**Project:** ScriptPad MVP
**Started:** March 27, 2026
**PRD:** `ScriptPad_MVP_Spec.md`
**Stack:** Next.js 15 (App Router) · tRPC v11 · Drizzle ORM · Supabase (PostgreSQL) · NextAuth v5 · TipTap · Tailwind CSS v4

---

## Phase 1 — Scaffold & Database ✅

**Completed:** March 27, 2026

### What was built

1. **T3 App Scaffolded** via `create-t3-app` with App Router, tRPC, Drizzle, NextAuth, Tailwind
   - Installed all project dependencies: TipTap (react, starter-kit, underline, placeholder, horizontal-rule, bubble-menu, pm), lucide-react, sonner, date-fns, cmdk, zustand, @supabase/supabase-js, @tailwindcss/typography, bcryptjs, nodemailer

2. **Database Schema** (`src/server/db/schema.ts`)
   - `scriptpad_user` — extended with `hashedPassword`, `preferences` (JSONB), `createdAt`
   - `scriptpad_account` — NextAuth adapter table
   - `scriptpad_session` — NextAuth adapter table
   - `scriptpad_verification_token` — NextAuth adapter table
   - `scriptpad_script` — UUID PK, JSONB `body` (TipTap format), `bodyPlainText` (TEXT for search/previews), `scriptStatusEnum` (idea/writing/ready/posted), `postDate`, `notes`, `wordCount`, `charCount`, `estimatedDurationSeconds`, `folderId` FK, `deletedAt` (soft delete), `createdAt`, `updatedAt`
   - `scriptpad_tag` — UUID PK, `name`, `color` (hex), scoped per user
   - `scriptpad_script_tag` — join table, composite PK (scriptId, tagId), cascade deletes
   - `scriptpad_folder` — UUID PK, `name`, `sortOrder`, scoped per user
   - `scriptpad_media_attachment` — UUID PK, `scriptId` FK, `fileUrl`, `fileName`, `fileType`, `fileSizeBytes`, cascade delete on script
   - `scriptpad_hook_template` — UUID PK, optional `title`, required `body` (text), scoped per user
   - **Indexes:** `script_user_status_idx`, `script_user_created_idx`, `script_user_updated_idx`, `script_user_postdate_idx`, `script_user_folder_idx`, `script_deleted_idx`, plus indexes on all FK columns
   - **Relations:** Full Drizzle relations defined for all tables

3. **Supabase Connected**
   - Using Session Pooler connection (IPv4 compatible)
   - Schema pushed via `drizzle-kit push`
   - Host: `aws-1-us-east-1.pooler.supabase.com`

4. **Seed Data** (`src/server/db/seed.ts`)
   - Default user: `thomas@dailydrivr.com` / `scriptpad123`
   - "Welcome to ScriptPad" script — full TipTap JSON body with formatting examples, status: idea
   - "Tutorial" tag — green (#10B981)
   - "Secret Reveal" hook template
   - Welcome script tagged with Tutorial

5. **Auth** (`src/server/auth/config.ts`)
   - Credentials provider (email/password with bcrypt, 12 rounds)
   - Email magic link provider (conditionally enabled when EMAIL_SERVER env is set)
   - JWT session strategy (required for credentials)
   - Session callback exposes user.id
   - Custom sign-in page at `/auth/signin`

6. **Typography** (PRD Section 10)
   - DM Sans — headings/UI (`--font-dm-sans`)
   - Plus Jakarta Sans — editor body text (`--font-plus-jakarta`)
   - JetBrains Mono — stats/counts (`--font-jetbrains-mono`)

7. **Dark Theme CSS** (`src/styles/globals.css`)
   - CSS variables for all PRD colors: backgrounds (#0F0F0F, #1A1A1A), surfaces (#1E1E1E, #252525), text (#E5E5E5, #9CA3AF), accent (#3B82F6), borders (#2E2E2E, #333333)
   - Status colors: idea (#6B7280), writing (#F59E0B), ready (#10B981), posted (#6366F1)
   - Custom dark scrollbar styling, selection color

8. **Environment** (`.env`)
   - DATABASE_URL (Supabase pooler)
   - AUTH_SECRET
   - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### Files created/modified
- `src/server/db/schema.ts` — full schema (rewrote from scaffold)
- `src/server/db/seed.ts` — new file
- `src/server/auth/config.ts` — rewrote (credentials + email providers)
- `src/app/layout.tsx` — updated fonts, dark mode, metadata
- `src/app/page.tsx` — placeholder with auth redirect
- `src/app/auth/signin/page.tsx` — new file (sign-in form)
- `src/styles/globals.css` — rewrote with theme variables
- `src/env.js` — updated for ScriptPad env vars
- `.env` — configured for Supabase
- `package.json` — added db:seed script, all dependencies

### Removed
- `src/server/api/routers/post.ts` — T3 boilerplate
- `src/app/_components/post.tsx` — T3 boilerplate
- Discord auth provider — replaced with credentials + email

---

## Phase 2 — tRPC Router Layer ✅

**Completed:** March 27, 2026

### What was built

All tRPC routers with full CRUD. Every procedure uses `protectedProcedure` and filters by authenticated user's ID.

1. **Scripts Router** (`src/server/api/routers/scripts.ts`)
   - `list` — filters: status, folderId, tagId, search (ILIKE on title + bodyPlainText), sortBy (createdAt/updatedAt/postDate), sortOrder (asc/desc). Returns scripts with tags and folder names. Excludes soft-deleted.
   - `getById` — full script with tags, folder, and attachments
   - `create` — minimum: title. Defaults status to "idea". Used by Quick Capture.
   - `update` — any field. Auto-computes wordCount, charCount, estimatedDurationSeconds from bodyPlainText. Used by auto-save.
   - `updateStatus` — dedicated status change endpoint
   - `duplicate` — copies title ("Copy of ..."), body, bodyPlainText, tags, folder, notes, stats. Resets status to idea, clears postDate. Does NOT copy attachments.
   - `softDelete` — sets deletedAt timestamp
   - `statusCounts` — returns count per status + total for dashboard tabs

2. **Tags Router** (`src/server/api/routers/tags.ts`)
   - `list` — all user tags with script counts (excluding soft-deleted scripts)
   - `create` — with duplicate name check, hex color validation
   - `update` — name and/or color
   - `delete` — cascade removes script_tags associations
   - `addToScript` — verifies ownership of both script and tag
   - `removeFromScript` — verifies script ownership

3. **Folders Router** (`src/server/api/routers/folders.ts`)
   - `list` — all user folders with script counts + uncategorized count
   - `create` — auto-assigns sortOrder (appends to end)
   - `rename` — updates folder name
   - `delete` — sets scripts' folderId to null first, then deletes folder

4. **Hook Templates Router** (`src/server/api/routers/hookTemplates.ts`)
   - `list` — ordered by createdAt desc
   - `create` — title (optional) + body (required)
   - `update` — title and/or body
   - `delete`

5. **Attachments Router** (`src/server/api/routers/attachments.ts`)
   - `listByScript` — verifies script ownership
   - `create` — stores metadata after client uploads to Supabase Storage. Verifies script ownership.
   - `delete` — verifies ownership through script. Returns fileUrl so caller can also delete from Storage.

6. **Root Router** (`src/server/api/root.ts`)
   - Wired up all 5 routers: scripts, tags, folders, hookTemplates, attachments

### Bug fixed
- Tags `list` was using `eq(scripts.deletedAt, sql\`null\`)` instead of `isNull(scripts.deletedAt)` — tag script counts were returning 0. Fixed.

### Live tested (all passing)
```
scripts.list         → "Welcome to ScriptPad" (status: idea, tags: [Tutorial])
scripts.statusCounts → {idea: 1, writing: 0, ready: 0, posted: 0, all: 1}
tags.list            → Tutorial (#10B981) — 1 script
folders.list         → 0 folders, 1 uncategorized
hookTemplates.list   → "Secret Reveal"
TypeScript           → compiles clean (0 errors)
```

### Files created/modified
- `src/server/api/routers/scripts.ts` — new
- `src/server/api/routers/tags.ts` — new
- `src/server/api/routers/folders.ts` — new
- `src/server/api/routers/hookTemplates.ts` — new
- `src/server/api/routers/attachments.ts` — new
- `src/server/api/root.ts` — updated (wired all routers)

---

## Phase 3 — Global Layout & Navigation ✅

**Completed:** March 27, 2026

### What was built

Full global layout shell with sidebar navigation, responsive behavior, FAB, and route stubs — providing the frame for all subsequent UI phases.

1. **Route Group Architecture** (`src/app/(dashboard)/`)
   - `(dashboard)` route group separates authenticated pages (sidebar + layout) from auth pages (no sidebar)
   - `layout.tsx` — server component auth gate (redirects to `/auth/signin` if no session), renders sidebar + mobile header + main content + FAB + Toaster
   - `page.tsx` — dashboard placeholder ("Welcome, [name]"), replaces old `src/app/page.tsx`
   - Deleted `src/app/page.tsx` to avoid route conflict

2. **Zustand Sidebar Store** (`src/stores/sidebar-store.ts`)
   - `isCollapsed` — desktop toggle between full (w-64) and icon-only (w-16)
   - `isMobileOpen` — mobile overlay drawer open/closed
   - `toggle()` and `setMobileOpen(open)` actions

3. **Sidebar** (`src/app/_components/sidebar.tsx`)
   - **Desktop (≥1024px):** `w-64` expanded, `w-16` collapsed (user-toggled via PanelLeftClose/PanelLeftOpen icons)
   - **Tablet (768–1023px):** Always `w-16` icon-only
   - **Mobile (<768px):** Hidden by default; overlay drawer when `isMobileOpen=true` (fixed, z-40, slide from left with backdrop at z-30)
   - Styled: `bg-[var(--color-bg-secondary)]`, `border-r border-[var(--color-border)]`
   - Smooth transitions: `transition-all duration-200 ease-in-out`
   - Header shows "ScriptPad" expanded, "SP" on tablet, expand icon when collapsed on desktop

4. **Sidebar Navigation** (`src/app/_components/sidebar-nav.tsx`)
   - **Quick Capture [+]** button — accent-colored, noop onClick (Phase 5)
   - Nav links: All Scripts → `/`, Hook Templates → `/hooks`, Settings → `/settings`
   - Active state: `bg-[var(--color-surface)] text-[var(--color-text-primary)]` via `usePathname()`
   - Collapsed mode: icon only with hover tooltips (z-50, positioned left-full)

5. **Sidebar Folders** (`src/app/_components/sidebar-folders.tsx`)
   - Calls `api.folders.list.useQuery()` — shows folders with `(scriptCount)`
   - Shows "Uncategorized (n)" if `uncategorizedCount > 0`
   - Loading: skeleton placeholders (3 pulsing lines)
   - Collapsed: folder icons with hover tooltips

6. **Sidebar Tags** (`src/app/_components/sidebar-tags.tsx`)
   - Calls `api.tags.list.useQuery()` — shows tags with colored dots + `(scriptCount)`
   - Links to `/tag/${encodeURIComponent(tag.name)}`
   - Collapsed: color dot only with hover tooltips

7. **Sidebar Search** (`src/app/_components/sidebar-search.tsx`)
   - Input with Search icon, placeholder "Search scripts... ⌘K"
   - Global `Cmd+K` / `Ctrl+K` keydown listener → focuses input, `preventDefault()`
   - 300ms debounce → navigates to `/?search=<value>` via `router.push`
   - Collapsed: search icon button; clicking expands sidebar and focuses input

8. **Mobile Header** (`src/app/_components/mobile-header.tsx`)
   - Visible `md:hidden` only
   - Hamburger Menu icon → `setMobileOpen(true)`
   - "ScriptPad" title centered

9. **FAB** (`src/app/_components/fab.tsx`)
   - Fixed `bottom-6 right-6`, `rounded-full w-14 h-14`
   - `bg-[var(--color-accent)]` with hover scale effect
   - Plus icon, `shadow-lg`, pulse animation on first load
   - Hidden when `pathname.startsWith('/script/')` via `usePathname()`
   - onClick: noop (Quick Capture modal in Phase 5)

10. **Toast Provider**
    - Sonner `<Toaster>` in dashboard layout, dark theme, bottom-left position
    - Styled with CSS variables for surface/border/text colors

11. **Route Stubs** — minimal placeholder pages:
    - `/folder/[id]` → "Folder view — Phase 4"
    - `/tag/[name]` → "Tag view — Phase 4"
    - `/script/[id]` → "Script editor — Phase 6"
    - `/hooks` → "Hook Templates — Phase 8"
    - `/settings` → "Settings — Phase 9"

### Bugs fixed
- **Tailwind v4 class conflicts:** `lg:hidden` and `lg:inline` on the same element produced non-deterministic results in Tailwind v4 (CSS generation order, not class attribute order, determines winner). Fixed by never using conflicting responsive utilities — instead conditionally include only one: `isCollapsed ? "" : "lg:inline"` with `hidden max-md:inline` as base.
- **Collapsed sidebar alignment:** Icons and text were misaligned in collapsed w-16 mode. Fixed with consistent centering pattern: `md:justify-center md:p-2` for tablet/collapsed, explicit `lg:` overrides only when expanded.
- **Quick Capture button stretching:** Was using dynamic template literal class construction (`max-md:${...}`) which Tailwind's JIT scanner can't detect. Replaced with explicit static class names.

### Live tested (all passing)
```
pnpm typecheck       → 0 TypeScript errors
pnpm dev             → starts cleanly in ~1s
/                    → redirects to /auth/signin (unauthenticated)
Sign in              → sidebar with nav, folders, tags, search
Sidebar collapse     → icon-only mode, tooltips on hover
Sidebar expand       → full sidebar restored
Cmd+K                → focuses search input
Nav links            → navigate to stubs, active state highlights
FAB                  → visible on dashboard, hidden on /script/*
Mobile responsive    → hamburger + drawer overlay working
```

### Files created
- `src/stores/sidebar-store.ts` — new
- `src/app/(dashboard)/layout.tsx` — new
- `src/app/(dashboard)/page.tsx` — new
- `src/app/_components/sidebar.tsx` — new
- `src/app/_components/sidebar-nav.tsx` — new
- `src/app/_components/sidebar-folders.tsx` — new
- `src/app/_components/sidebar-tags.tsx` — new
- `src/app/_components/sidebar-search.tsx` — new
- `src/app/_components/mobile-header.tsx` — new
- `src/app/_components/fab.tsx` — new
- `src/app/(dashboard)/folder/[id]/page.tsx` — new (stub)
- `src/app/(dashboard)/tag/[name]/page.tsx` — new (stub)
- `src/app/(dashboard)/script/[id]/page.tsx` — new (stub)
- `src/app/(dashboard)/hooks/page.tsx` — new (stub)
- `src/app/(dashboard)/settings/page.tsx` — new (stub)

### Files deleted
- `src/app/page.tsx` — replaced by `(dashboard)/page.tsx`

---

## Phase 4 — Dashboard (Main Page) ✅

**Completed:** March 27, 2026

### What was built

Full dashboard home screen with script cards, status filtering, sorting, search integration, and context menus. Same `DashboardContent` component is reused across three routes (all scripts, folder-filtered, tag-filtered).

1. **StatusBadge** (`src/app/_components/dashboard/status-badge.tsx`)
   - Colored pill for each status (idea=gray, writing=amber, ready=green, posted=indigo)
   - Uses hardcoded hex colors with 20% opacity backgrounds

2. **EmptyState** (`src/app/_components/dashboard/empty-state.tsx`)
   - Three variants: no-scripts (no data), no-results (search miss), no-status (filtered status empty)
   - Centered with icon, title, and descriptive message

3. **ScriptCardGrid** (`src/app/_components/dashboard/script-card-grid.tsx`)
   - Responsive grid: 1 column mobile, 2 tablet (sm), 3 desktop (xl)
   - Skeleton loading state with 6 animated placeholder cards

4. **StatusTabs** (`src/app/_components/dashboard/status-tabs.tsx`)
   - Horizontal tabs: All, Idea, Writing, Ready, Posted
   - Count badges from `scripts.statusCounts` query, font-mono for consistent width
   - Active tab: accent bottom border + primary text color
   - Colored dots per status

5. **SortControls** (`src/app/_components/dashboard/sort-controls.tsx`)
   - Custom dropdown: Date Created (default), Last Edited, Post Date
   - Dark theme styling, click-outside closes, chevron rotation animation

6. **ScriptCard** (`src/app/_components/dashboard/script-card.tsx`)
   - Link wraps entire card → `/script/${id}`
   - Top: StatusBadge + relative post date (via date-fns `formatDistanceToNow` within 7 days)
   - Middle: title (line-clamp-1), body preview (line-clamp-3)
   - Bottom: tag pills (max 3, "+N more" overflow) + folder name with icon
   - Hover: `-translate-y-0.5` + shadow lift, 150ms transition
   - Long-press support for mobile (500ms touchstart timeout)

7. **ScriptCardContextMenu** (`src/app/_components/dashboard/script-card-context-menu.tsx`)
   - Portal to document.body with fixed positioning at click coordinates
   - Viewport boundary clamping (repositions if overflowing)
   - **Change Status** → submenu with colored dots → `scripts.updateStatus`
   - **Move to Folder** → submenu from `folders.list` + "No Folder" → `scripts.update`
   - **Duplicate** → `scripts.duplicate` → toast + navigate to new script
   - **Delete** → `scripts.softDelete` → toast confirmation
   - Invalidates scripts.list, statusCounts, folders.list, tags.list after every mutation
   - Closes on click-outside, Escape, or after action

8. **DashboardContent** (`src/app/_components/dashboard/dashboard-content.tsx`)
   - Main orchestrator: wires StatusTabs, SortControls, ScriptCardGrid, EmptyState, ContextMenu
   - Reads `useSearchParams().get("search")` for search integration from sidebar
   - Sort order: `asc` for postDate (upcoming first), `desc` for others (newest first)
   - Loading: skeleton grid, empty states for each scenario

9. **Page rewrites:**
   - `/` → `<DashboardContent />` wrapped in `<Suspense>`
   - `/folder/[id]` → resolves folder ID from params → `<DashboardContent folderId={id} />`
   - `/tag/[name]` → client component, resolves tag name → ID via `tags.list` → `<DashboardContent tagId={id} />`

### Verification
```
SKIP_ENV_VALIDATION=1 pnpm typecheck → 0 TypeScript errors
```

### Files created
- `src/app/_components/dashboard/status-badge.tsx`
- `src/app/_components/dashboard/empty-state.tsx`
- `src/app/_components/dashboard/script-card-grid.tsx`
- `src/app/_components/dashboard/status-tabs.tsx`
- `src/app/_components/dashboard/sort-controls.tsx`
- `src/app/_components/dashboard/script-card.tsx`
- `src/app/_components/dashboard/script-card-context-menu.tsx`
- `src/app/_components/dashboard/dashboard-content.tsx`

### Files modified
- `src/app/(dashboard)/page.tsx` — rewrote (placeholder → DashboardContent)
- `src/app/(dashboard)/folder/[id]/page.tsx` — rewrote (placeholder → DashboardContent with folderId)
- `src/app/(dashboard)/tag/[name]/page.tsx` — rewrote (placeholder → client component resolving tag name → DashboardContent)

---

## Phase 4b — Dashboard UI Polish ✅

**Completed:** March 27, 2026

### What was done

Purely visual polish pass on the dashboard — no functional changes. Addressed issues where status tab counts merged with labels, cards stretched too wide, status badges were hard to read on dark surfaces, and the layout lacked visual hierarchy.

1. **StatusBadge** (`status-badge.tsx`)
   - Added colored dot inside each badge for stronger visual signal
   - Increased vertical padding (`py-0.5` → `py-1`)
   - Brightened text colors for dark-on-dark readability (e.g. idea: `#6B7280` → `#9CA3AF`, writing: `#F59E0B` → `#FBBF24`, etc.)
   - Switched from hex alpha (`#6B728020`) to proper `rgba()` at 15% opacity for consistent rendering

2. **StatusTabs** (`status-tabs.tsx`)
   - Wrapped count numbers in pill-shaped backgrounds (`rounded-full`, `min-w-5 h-5`) so counts no longer visually merge with labels
   - Active pill: accent-tinted background (`var(--color-accent)/15`); inactive: `var(--color-surface-elevated)`
   - Added `ml-1` spacing between label text and count pill
   - Increased tab button padding: `px-3 py-2` → `px-4 py-2.5`

3. **ScriptCard** (`script-card.tsx`)
   - Added `max-w-lg` so lone cards don't stretch full-width
   - Increased internal padding: `p-5` → `p-6`
   - Added hover border lighten: `hover:border-[var(--color-border-light)]`
   - Fixed tag background opacity: `${tag.color}20` (hex = 12.5%) → `${tag.color}33` (hex = 20%)

4. **ScriptCardGrid** (`script-card-grid.tsx`)
   - Increased grid gap: `gap-4` → `gap-5` (both main grid and skeleton)

5. **DashboardContent** (`dashboard-content.tsx`)
   - Added bottom border to header area: `border-b border-[var(--color-border)] pb-4`
   - Increased top padding: `py-6` → `py-8`
   - Increased content gap: `mt-6` → `mt-8`

6. **SortControls** (`sort-controls.tsx`)
   - Added "Sort:" prefix label in muted text before the current sort value

### Verification
```
SKIP_ENV_VALIDATION=1 pnpm typecheck → 0 TypeScript errors
```

### Files modified
- `src/app/_components/dashboard/status-badge.tsx`
- `src/app/_components/dashboard/status-tabs.tsx`
- `src/app/_components/dashboard/script-card.tsx`
- `src/app/_components/dashboard/script-card-grid.tsx`
- `src/app/_components/dashboard/dashboard-content.tsx`
- `src/app/_components/dashboard/sort-controls.tsx`

---

## Phase 5 — Quick Capture

**Status:** Not started

---

## Phase 6 — Script Editor

**Status:** Not started

---

## Phase 7 — Folders & Tags Management

**Status:** Not started

---

## Phase 8 — Hook Templates

**Status:** Not started

---

## Phase 9 — Onboarding

**Status:** Not started

---

## Phase 10 — Polish & Keyboard Shortcuts

**Status:** Not started

---

## Infrastructure Notes

- **Node.js:** v20.20.2 (installed via nvm)
- **pnpm:** v10.33.0
- **Database:** Supabase PostgreSQL (Session Pooler, us-east-1)
- **Dev server:** `pnpm dev` → http://localhost:3000
- **Schema push:** `pnpm db:push`
- **Seed:** `pnpm db:seed`
- **Type check:** `pnpm typecheck` (or `SKIP_ENV_VALIDATION=1 pnpm typecheck`)
