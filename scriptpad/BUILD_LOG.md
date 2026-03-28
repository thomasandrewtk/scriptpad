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

## Phase 5 — Quick Capture ✅

**Completed:** March 27, 2026

### What was built

Minimal Quick Capture modal for instant script idea capture (title + notes → status: idea). Three trigger points all wired to a single Zustand store.

1. **Quick Capture Store** (`src/stores/quick-capture-store.ts`)
   - Zustand store: `isOpen`, `open()`, `close()`
   - Shared by FAB, sidebar button, and keyboard shortcut

2. **Quick Capture Modal** (`src/app/_components/quick-capture-modal.tsx`)
   - Portal to `document.body` (same pattern as context menu)
   - Backdrop: `bg-black/50`, click-to-close
   - Panel: centered `max-w-md`, rounded-xl, elevated surface
   - Title input (autoFocus, required, max 500 chars) + Notes textarea (3 rows, optional)
   - Cancel + "Save as Idea" buttons (disabled when title empty or mutation pending)
   - Calls `scripts.create` mutation → invalidates `scripts.list` + `scripts.statusCounts`
   - Success toast with "Open" action link → navigates to `/script/${id}`
   - Escape key closes, form resets on close
   - Enter on title submits form
   - Fade-in + zoom-in animation (200ms)

3. **Keyboard Shortcut** (`src/app/_components/quick-capture-keyboard.tsx`)
   - Global `Cmd/Ctrl+N` listener, `preventDefault()` blocks browser new window
   - Skips on `/script/` pages (matches FAB visibility)

4. **FAB wired** (`src/app/_components/fab.tsx`)
   - `onClick` calls `useQuickCaptureStore.open()`

5. **Sidebar Nav wired** (`src/app/_components/sidebar-nav.tsx`)
   - Quick Capture button calls `openCapture()` + `setMobileOpen(false)` to close mobile sidebar

6. **Layout updated** (`src/app/(dashboard)/layout.tsx`)
   - `<QuickCaptureModal />` and `<QuickCaptureKeyboard />` mounted after `<Fab />`

### Edge cases handled
- Double-submit prevented: Save button disabled while `isPending`
- Toast "Open" link uses script ID from `onSuccess` callback
- Mobile: modal takes near-full width (`mx-4`)
- No Cmd+N on script editor pages (pathname check)
- Form state reset when modal closes

### Verification
```
SKIP_ENV_VALIDATION=1 pnpm typecheck → 0 TypeScript errors
```

### Files created
- `src/stores/quick-capture-store.ts`
- `src/app/_components/quick-capture-modal.tsx`
- `src/app/_components/quick-capture-keyboard.tsx`

### Files modified
- `src/app/_components/fab.tsx` — added onClick → store.open()
- `src/app/_components/sidebar-nav.tsx` — added onClick → store.open() + close mobile sidebar
- `src/app/(dashboard)/layout.tsx` — mounted QuickCaptureModal + QuickCaptureKeyboard

---

## Phase 5b — Quick Capture & FAB UI Fix ✅

**Completed:** March 27, 2026

### What was done

Fixed Quick Capture modal rendering as a full-width bottom panel instead of a centered dialog, and removed the FAB's permanent pulse animation. Root cause: `animate-in`, `fade-in`, `zoom-in-95` classes come from the `tailwindcss-animate` plugin which is **not installed** — in Tailwind v4 these unknown classes produced unpredictable CSS that broke the modal's flex centering and width constraints.

1. **Quick Capture Modal** (`quick-capture-modal.tsx`)
   - Removed broken `tailwindcss-animate` classes from backdrop: `animate-in fade-in duration-200`
   - Removed broken `tailwindcss-animate` classes from panel: `animate-in fade-in zoom-in-95 duration-200`
   - Replaced with native CSS keyframe animations via Tailwind v4 arbitrary syntax:
     - Backdrop: `animate-[modal-backdrop_200ms_ease-out_forwards]`
     - Panel: `animate-[modal-panel_200ms_ease-out_forwards]`
   - Layout classes (`fixed inset-0 z-50 flex items-center justify-center`, `max-w-md`, `rounded-xl`) were already correct — the stray animation classes were the sole cause of the broken rendering

2. **globals.css** — Added two `@keyframes` definitions:
   - `modal-backdrop`: opacity 0 → 1
   - `modal-panel`: opacity 0 + scale(0.95) → opacity 1 + scale(1)

3. **FAB** (`fab.tsx`)
   - Removed `animate-pulse` and `hover:animate-none` — PRD says "pulse on first load (once)" but the implementation pulsed forever. The accent color + shadow already provide sufficient visibility.

### Verification
```
SKIP_ENV_VALIDATION=1 pnpm typecheck → 0 TypeScript errors
```

### Files modified
- `src/app/_components/quick-capture-modal.tsx`
- `src/styles/globals.css`
- `src/app/_components/fab.tsx`

---

## Phase 6 — Script Editor ✅

**Completed:** March 27, 2026

### What was built

Full script editor — the core writing experience. TipTap rich text editor with auto-save, bubble menu, slash commands, metadata editing, notes, and file attachments.

1. **Editor Store** (`src/stores/editor-store.ts`)
   - Zustand store: `saveState` ("idle"|"saving"|"saved"), `wordCount`, `charCount`, `estimatedDurationSeconds`
   - Shared across header (save indicator) and stats bar (live stats)

2. **Supabase Client** (`src/lib/supabase-client.ts`)
   - Browser-side Supabase client for Storage uploads using public env vars

3. **Page Shell** (`src/app/(dashboard)/script/[id]/page.tsx`)
   - Server component: awaits params.id, renders `<ScriptEditorPage scriptId={id} />`

4. **Script Editor Page** (`src/app/_components/editor/script-editor-page.tsx`)
   - Client orchestrator: fetches script via `scripts.getById`, manages auto-save
   - **Auto-save:** 3-second debounce via `useRef<NodeJS.Timeout>` + `pendingRef` accumulating changed fields
   - `scheduleAutoSave(fields)` — merges fields, resets 3s timer (for title, body, notes)
   - `saveImmediate(fields)` — flushes immediately (for status, folder, tags, date)
   - `flushSave()` / `flushSaveAsync()` — sends pending changes in one `scripts.update` call
   - Flush on Cmd+S, flush before unload (via `navigator.sendBeacon`)
   - Layout: flex column, scrollable content area with `max-w-3xl mx-auto`, fixed stats bar at bottom
   - Loading skeleton + 404 error state

5. **Editor Header** (`src/app/_components/editor/editor-header.tsx`)
   - Back button (ArrowLeft): flush save async, invalidate lists, `router.back()`
   - Status dropdown: portal-based, shows 4 statuses with colored dots, calls `scripts.updateStatus` immediately
   - More menu (MoreHorizontal): Duplicate (→ navigate to new), Delete (→ navigate to `/`), timestamps (created/updated)

6. **Editor Title** (`src/app/_components/editor/editor-title.tsx`)
   - `<input>` styled as heading: `text-3xl font-bold`, `font-editor`, no border
   - Placeholder: "Untitled Script", onChange → scheduleAutoSave({ title })

7. **TipTap Editor** (`src/app/_components/editor/tiptap-editor.tsx`)
   - Extensions: StarterKit (stripped: no heading/lists/blockquote/code), Underline, Placeholder, HorizontalRule, CustomKeymap (Mod-Shift-Minus → divider)
   - **BubbleMenu:** Bold/Italic/Underline buttons with active state highlighting
   - **onUpdate:** extracts JSON + plain text, computes local stats → Zustand, schedules auto-save
   - `immediatelyRender: false` for SSR compatibility
   - `isInitializedRef` prevents firing onUpdate during initial content load

8. **Slash Command Menu** (`src/app/_components/editor/slash-command-menu.tsx`)
   - Custom implementation using TipTap's transaction listener
   - Detects `/` at start of line or after whitespace
   - 4 commands: `/divider` (HR), `/hook` (template picker), `/date` (today's date), `/note` (focus notes)
   - Arrow key navigation, Enter to execute, Escape to dismiss
   - Portal positioned at cursor via `editor.view.coordsAtPos()`
   - Deletes the `/...` text on command execution

9. **Hook Template Picker** (`src/app/_components/editor/hook-template-picker.tsx`)
   - Modal overlay triggered by `/hook` slash command
   - Fetches `hookTemplates.list`, filterable by title/body
   - On select: inserts template body text at cursor position

10. **Metadata Row** (`src/app/_components/editor/metadata-row.tsx`)
    - Compact row between title and editor: Folder selector, tag chips, date picker
    - **Folder:** Button → portal dropdown from `folders.list` + "No Folder" option → immediate save
    - **Tags:** Inline colored chips with ✕ remove. "+Add tag" button → TagPickerPopover
    - **Post Date:** Styled button → hidden `<input type="date">` → immediate save. Clear (✕) sets null

11. **Tag Picker Popover** (`src/app/_components/editor/tag-picker-popover.tsx`)
    - Portal popover with text filter input
    - Shows existing tags with checkmarks for applied ones, click to toggle
    - "Create new tag" option at bottom → `tags.create` then `tags.addToScript`

12. **Notes Field** (`src/app/_components/editor/notes-field.tsx`)
    - Collapsible with chevron toggle, expanded if notes exist
    - Auto-resizing textarea, plain text only
    - `forwardRef` so `/note` slash command can `.focus()` it
    - onChange → scheduleAutoSave({ notes })

13. **Attachments Section** (`src/app/_components/editor/attachments-section.tsx`)
    - Collapsible with chevron toggle (expanded if attachments exist)
    - Upload: hidden file input accepting `image/*,video/*,audio/*`, 50MB limit
    - Upload flow: Supabase Storage → `attachments.create` mutation
    - File rows: type icon, filename, formatted size, delete button
    - Preview portals: fullscreen lightbox for images, native players for video/audio
    - Delete: removes from DB + Supabase Storage

14. **Stats Bar** (`src/app/_components/editor/stats-bar.tsx`)
    - Fixed footer: "N words · N characters · ~M:SS estimated duration"
    - Font-mono for numbers, reads from Zustand store

15. **Save Indicator** (`src/app/_components/editor/save-indicator.tsx`)
    - "Saving..." with spinner, "Saved" with check (fades after 2s)

16. **TipTap CSS** (`src/styles/globals.css`)
    - `.tiptap-editor` styles: font-editor, 18px, 1.75 line-height, paragraph spacing
    - HR styling, placeholder pseudo-element, bold/italic/underline rendering

### Key design decisions
- TipTap owns its ProseMirror state; React only reads via onUpdate (no double state management)
- getById NOT invalidated on body auto-save (prevents TipTap re-initialization / cursor reset)
- Content changes debounced (3s), metadata changes immediate
- Slash commands via ProseMirror transaction listener (no @tiptap/suggestion dependency)
- Date picker uses native `<input type="date">` behind styled button

### Verification
```
SKIP_ENV_VALIDATION=1 pnpm typecheck → 0 TypeScript errors
pnpm build → success (script/[id] route: 202KB first load JS)
```

### Files created
- `src/stores/editor-store.ts`
- `src/lib/supabase-client.ts`
- `src/app/_components/editor/script-editor-page.tsx`
- `src/app/_components/editor/editor-header.tsx`
- `src/app/_components/editor/editor-title.tsx`
- `src/app/_components/editor/tiptap-editor.tsx`
- `src/app/_components/editor/slash-command-menu.tsx`
- `src/app/_components/editor/hook-template-picker.tsx`
- `src/app/_components/editor/metadata-row.tsx`
- `src/app/_components/editor/tag-picker-popover.tsx`
- `src/app/_components/editor/notes-field.tsx`
- `src/app/_components/editor/attachments-section.tsx`
- `src/app/_components/editor/stats-bar.tsx`
- `src/app/_components/editor/save-indicator.tsx`

### Files modified
- `src/app/(dashboard)/script/[id]/page.tsx` — rewrote stub → render ScriptEditorPage
- `src/styles/globals.css` — added TipTap editor styles + save animation

---

## Phase 6b — Editor Bugfixes ✅

**Completed:** March 27, 2026

### Bugs fixed

1. **Cmd+Shift+D conflicted with macOS bookmark shortcut**
   - Changed divider keyboard shortcut from `Mod-Shift-d` to `Mod-Shift-minus` (hyphen)
   - Minus key is intuitive for a horizontal divider and doesn't conflict with any macOS system shortcut
   - **File:** `src/app/_components/editor/tiptap-editor.tsx`

2. **Escape key did not navigate to dashboard**
   - Added a two-phase keydown listener to `script-editor-page.tsx`
   - **Capture phase:** checks if any portal popover (`.fixed.z-50`) is in the DOM
   - **Bubble phase:** if no popover is open, calls `handleBack()` which flushes pending saves and navigates back
   - This ensures Escape closes popovers first (status dropdown, tag picker, etc.) before ever triggering navigation
   - **File:** `src/app/_components/editor/script-editor-page.tsx`

3. **"Invalid Compact JWS" error when uploading attachments**
   - **Root cause:** The app uses NextAuth (not Supabase Auth), so the browser Supabase client had no valid JWT for Storage operations. The anon key alone cannot authenticate Storage uploads.
   - **Fix:** Replaced client-side Supabase uploads with server-side API routes that use the Supabase service key:
     - `POST /api/upload` — accepts multipart form data, authenticates via NextAuth session, uploads to Supabase Storage using service key, returns public URL.
     - `POST /api/upload/delete` — deletes files from Storage via service key, verifies the storage path belongs to the authenticated user (path must start with `{userId}/`)
   - Attachments component now uses `fetch("/api/upload", ...)` instead of the client-side Supabase SDK
   - **Files created:** `src/app/api/upload/route.ts`, `src/app/api/upload/delete/route.ts`
   - **File modified:** `src/app/_components/editor/attachments-section.tsx`

4. **"Bucket not found" error when uploading attachments**
   - **Root cause:** The Supabase Storage bucket `attachments` did not exist. The upload route attempted to upload to a non-existent bucket.
   - **Fix:** Added auto-creation logic to `POST /api/upload` — before the first upload, the route checks `supabase.storage.listBuckets()` and creates the `attachments` bucket (public: true) if it's missing. This runs once; subsequent uploads skip creation since the bucket already exists.
   - **File modified:** `src/app/api/upload/route.ts`

### Verification
```
SKIP_ENV_VALIDATION=1 pnpm typecheck → 0 TypeScript errors
```

### Files created
- `src/app/api/upload/route.ts` — server-side file upload route (service key)
- `src/app/api/upload/delete/route.ts` — server-side file delete route (service key)

### Files modified
- `src/app/_components/editor/tiptap-editor.tsx` — changed divider shortcut to Mod-Shift-Minus
- `src/app/_components/editor/script-editor-page.tsx` — added Escape key → dashboard navigation
- `src/app/_components/editor/attachments-section.tsx` — switched from client Supabase to server API routes for upload/delete

---

## Phase 7 — Folders & Tags Management ✅

**Completed:** March 27, 2026

### What was built

1. **Shared Constants & Reusable Components**
   - `src/lib/tag-colors.ts` — 12 preset hex colors for tag color picker (blue, indigo, violet, pink, red, orange, amber, emerald, teal, cyan, gray, purple-light)
   - `src/app/_components/confirm-dialog.tsx` — Reusable portal-based delete confirmation modal with danger/default variants, backdrop + panel animations
   - `src/app/_components/settings/color-picker.tsx` — Inline 6×2 preset color grid with ring selection indicator

2. **Settings Page (`/settings`)**
   - `src/app/(dashboard)/settings/page.tsx` — Rewritten as `"use client"`, max-w-2xl centered layout with two section cards
   - `src/app/_components/settings/folders-settings.tsx` — Full CRUD: inline create, inline rename, delete with confirmation dialog, script count badges, hover-reveal action icons
   - `src/app/_components/settings/tags-settings.tsx` — Full CRUD: inline create with color picker, inline edit (name + color), delete with confirmation dialog, auto-selects first unused preset color

3. **Sidebar Enhancements**
   - `src/app/_components/sidebar-folders.tsx` — Added `+` button next to "Folders" header (hidden when collapsed), inline input for quick folder creation
   - `src/app/_components/sidebar-tags.tsx` — Added `+` button next to "Tags" header (hidden when collapsed), portal popover with name input + color picker grid for quick tag creation

4. **Tag Picker Color Cycling**
   - `src/app/_components/editor/tag-picker-popover.tsx` — Imports `TAG_PRESET_COLORS`, auto-cycles color on inline tag create via `TAG_PRESET_COLORS[existingTags.length % length]` instead of hardcoded `#3B82F6`

### Files created/modified

- `src/lib/tag-colors.ts` — NEW
- `src/app/_components/confirm-dialog.tsx` — NEW
- `src/app/_components/settings/color-picker.tsx` — NEW
- `src/app/_components/settings/folders-settings.tsx` — NEW
- `src/app/_components/settings/tags-settings.tsx` — NEW
- `src/app/(dashboard)/settings/page.tsx` — REWRITTEN
- `src/app/_components/sidebar-folders.tsx` — MODIFIED
- `src/app/_components/sidebar-tags.tsx` — MODIFIED
- `src/app/_components/editor/tag-picker-popover.tsx` — MODIFIED

### Verification

- `SKIP_ENV_VALIDATION=1 pnpm typecheck` → 0 errors

---

## Phase 8 — Hook Templates

**Status:** ✅ Complete

### What was built
Full Hook Templates management page at `/hooks` with tag association. Replaced `title` column with `tagId` FK to reuse the existing tag system.

### Schema change
- Removed `title` column from `hookTemplates` table
- Added `tagId` column (UUID, FK → tags, `onDelete: "set null"`)
- Added `tag` relation to `hookTemplatesRelations`

### Features
- Page header with Zap icon + "New Hook" accent button
- Inline create form: body textarea + tag dropdown + Save/Cancel
- Template list: each row shows quoted body text + tag pill (color dot + name)
- Inline edit mode: replaces display row with pre-filled form
- Delete with ConfirmDialog (danger variant, shows truncated body preview)
- Skeleton loading state (3 pulsing rows)
- Empty state: "No hook templates yet. Create one to speed up your script writing."
- Success/error toasts via sonner
- Hover-reveal Edit (Pencil) and Delete (Trash2) action buttons

### Updated hook-template-picker
- Search filters by body text and tag name (instead of title)
- Shows tag color dot + name below each template in the picker

### Patterns reused
- CRUD state management from `folders-settings.tsx`
- Inline editing from `tags-settings.tsx`
- ConfirmDialog with danger variant
- Page layout (`max-w-2xl`, centered) from settings page
- Query invalidation via `api.useUtils()`

### Files changed
| File | Action |
|------|--------|
| `src/server/db/schema.ts` | Replaced `title` with `tagId` FK on hookTemplates |
| `src/server/api/routers/hookTemplates.ts` | Updated CRUD for tagId, added tag join on list |
| `src/app/(dashboard)/hooks/page.tsx` | Rewrite — stub → full page with tag picker |
| `src/app/_components/editor/hook-template-picker.tsx` | Updated for tag-based display/search |
| `BUILD_LOG.md` | Updated with Phase 8 details |

### Verification
- `SKIP_ENV_VALIDATION=1 pnpm typecheck` — 0 errors
- `pnpm db:push` — schema applied (title dropped, tagId + FK created)

---

## Phase 9 — Onboarding Tour ✅

**Completed:** March 27, 2026

### What was built

1. **User Preferences Router** (`src/server/api/routers/user.ts`)
   - `getPreferences` (query) — returns JSONB `preferences` for authenticated user
   - `updatePreferences` (mutation) — merges partial JSON into existing preferences via `COALESCE || jsonb`
   - Registered in `src/server/api/root.ts` as `user: userRouter`

2. **Onboarding Zustand Store** (`src/stores/onboarding-store.ts`)
   - State: `currentStep`, `isActive`
   - Actions: `start()`, `nextStep()`, `dismiss()`
   - Pure client state; server persistence handled in tour component

3. **Onboarding Tooltip** (`src/app/_components/onboarding/onboarding-tooltip.tsx`)
   - Portal-rendered to `document.body` (matches existing modal/context menu pattern)
   - Dynamic positioning via `getBoundingClientRect()` with viewport clamping
   - Semi-transparent backdrop with spotlight cutout (box-shadow approach)
   - CSS triangle arrow pointing to target element
   - Step indicator (progress dots + "X of 3"), description, Next/Got it button, Skip tour link
   - Recalculates on resize/scroll

4. **Tour Orchestrator** (`src/app/_components/onboarding/onboarding-tour.tsx`)
   - 3-step tour: FAB → Status Tabs → Search
   - Queries `user.getPreferences` on mount; starts tour if `onboardingComplete !== true`
   - Waits for target DOM elements via `requestAnimationFrame` loop
   - Expands sidebar for search step if collapsed
   - Auto-dismisses on navigation away from dashboard
   - Persists `{ onboardingComplete: true }` on dismiss/complete

5. **Data Attributes** on target elements:
   - `fab.tsx` — `data-onboarding="fab"`
   - `status-tabs.tsx` — `data-onboarding="status-tabs"`
   - `sidebar-search.tsx` — `data-onboarding="search"`

6. **CSS Additions** (`globals.css`)
   - `@keyframes tooltip-enter` — fade in + translateY(4px→0)
   - `.onboarding-tooltip-enter` animation class
   - `.onboarding-spotlight` — z-index bump + accent ring glow

7. **Layout Integration** — `<OnboardingTour />` mounted in dashboard layout alongside FAB

### Files created
- `src/server/api/routers/user.ts`
- `src/stores/onboarding-store.ts`
- `src/app/_components/onboarding/onboarding-tooltip.tsx`
- `src/app/_components/onboarding/onboarding-tour.tsx`

### Files modified
- `src/server/api/root.ts` — registered user router
- `src/app/(dashboard)/layout.tsx` — mounted OnboardingTour
- `src/app/_components/fab.tsx` — data-onboarding attribute
- `src/app/_components/dashboard/status-tabs.tsx` — data-onboarding attribute
- `src/app/_components/sidebar-search.tsx` — data-onboarding attribute
- `src/styles/globals.css` — tooltip animation + spotlight class

### Test results
- `SKIP_ENV_VALIDATION=1 pnpm typecheck` — 0 errors

---

## Phase 10 — Polish & Keyboard Shortcuts

**Status:** ✅ Complete

### What was built
Three cosmetic polish items to align with the PRD:

1. **Empty state wording** — Updated all three variants (`no-scripts`, `no-results`, `no-status`) to match PRD Section 4.3 text exactly. Added `searchQuery` prop to `EmptyState` so the `no-results` variant can display the query in quotes. Passed search query from `dashboard-content.tsx`.
2. **FAB pulse-once animation** — Added `@keyframes fab-pulse` (scale 1 → 1.08 → 1, 600ms) in `globals.css` and applied `animate-[fab-pulse_600ms_ease-in-out_1]` to the FAB button so it pulses once on mount to draw attention (PRD Section 10.3).
3. **StatusBadge transition** — Added `transition-colors duration-200` to the badge `<span>` for smooth color cross-fade on status change (PRD Section 10.3).

All 8 keyboard shortcuts from PRD Section 12 were already implemented in Phase 9.

### Files modified
- `src/app/_components/dashboard/empty-state.tsx` — Updated wording + added `searchQuery` prop
- `src/app/_components/dashboard/dashboard-content.tsx` — Pass `searchQuery` to `EmptyState`
- `src/styles/globals.css` — Added `@keyframes fab-pulse`
- `src/app/_components/fab.tsx` — Applied pulse-once animation class
- `src/app/_components/dashboard/status-badge.tsx` — Added `transition-colors duration-200`

### Test results
- `SKIP_ENV_VALIDATION=1 pnpm typecheck` — 0 errors

---

## Phase 11 — User Registration, Error Handling & Security Hardening ✅

**Completed:** March 27, 2026

### What was built

1. **11.1 — User Registration Flow**
   - Added `register` mutation to user router (`publicProcedure`) with email normalization, duplicate check, bcrypt hashing (12 rounds), and UUID generation
   - Created sign-up page (`/auth/signup`) mirroring sign-in styling — Name (optional), Email, Password fields with tRPC mutation, auto-sign-in on success, error handling for duplicates/validation
   - Added "Don't have an account? Sign up" link to sign-in page and "Already have an account? Sign in" link to sign-up page

2. **11.2 — Error Boundaries & Loading States**
   - Root error boundary (`src/app/error.tsx`) — full-screen centered layout with AlertTriangle icon, error message, "Try again" + "Go home" buttons
   - Dashboard error boundary (`src/app/(dashboard)/error.tsx`) — same pattern, renders inside dashboard layout with "Back to dashboard" link
   - Custom 404 page (`src/app/not-found.tsx`) — server component with large "404" text, description, "Go back home" accent button
   - Dashboard loading skeleton (`src/app/(dashboard)/loading.tsx`) — skeleton status tabs + 6-card grid with animate-pulse, responsive 3/2/1 column layout

3. **11.3 — Security Hardening**
   - Next.js middleware (`src/middleware.ts`) with in-memory rate limiter (Map with periodic cleanup):
     - Auth routes (`/auth/*`, `/api/auth/*`): 10 req/min per IP
     - API routes (`/api/*`): 100 req/min per IP
     - Returns 429 JSON when exceeded
   - Security headers on all matched responses: CSP (self + inline styles + Google Fonts + Supabase storage), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy
   - Upload MIME/extension validation: `ALLOWED_MIME_TYPES` set (images, video, audio) + `ALLOWED_EXTENSIONS` set with descriptive 400 errors

### Files created/modified
- `src/server/api/routers/user.ts` — added `register` procedure
- `src/app/auth/signup/page.tsx` — **new** sign-up page
- `src/app/auth/signin/page.tsx` — added sign-up link
- `src/app/error.tsx` — **new** root error boundary
- `src/app/(dashboard)/error.tsx` — **new** dashboard error boundary
- `src/app/not-found.tsx` — **new** 404 page
- `src/app/(dashboard)/loading.tsx` — **new** loading skeleton
- `src/middleware.ts` — **new** rate limiting + security headers
- `src/app/api/upload/route.ts` — added MIME/extension validation

### Test results
- `SKIP_ENV_VALIDATION=1 pnpm typecheck` — passes with no errors

---

## Phase 12 — Production Infrastructure & Deployment

**Status:** ✅ Complete

### 12.1 — Environment & Next.js Config
- Added `NEXT_PUBLIC_APP_URL` to env schema (`src/env.js`) with `z.string().url().optional()`
- Configured `next.config.js` with `output: "standalone"` for Docker-friendly builds
- Added `images.remotePatterns` for Supabase Storage URL optimization via `next/image`
- Updated `.env.example` with `NEXT_PUBLIC_APP_URL`

### 12.2 — SEO & Meta Tags
- Expanded `src/app/layout.tsx` metadata: `metadataBase`, `title.template`, full `openGraph` and `twitter` blocks, `robots`
- Exported separate `viewport` with `themeColor: "#0F0F0F"` (Next.js 15 requirement)
- Created `public/og-image.png` (1200×630, dark background, ScriptPad branding)
- Created `public/robots.txt` (Allow `/`, Disallow `/api/` and `/auth/`)
- Created `src/app/sitemap.ts` with single entry for landing page

### 12.3 — Landing Page
- Created `src/app/_components/landing-page.tsx` — full server component with two-column desktop layout:
  - Hero: left-aligned headline + CTAs on left, stacked feature cards on right
  - Workflow section: status visualization on left, CTA card on right
  - `max-w-7xl` with wide padding to use full horizontal space; stacks vertically on mobile
- Modified `src/app/(dashboard)/layout.tsx` — renders `<LandingPage />` instead of redirecting to `/auth/signin` for unauthenticated users
- Updated `src/app/auth/signin/page.tsx` — "ScriptPad" heading now links back to `/`
- Added sign-out button to sidebar footer (`signOut` from `next-auth/react`, `LogOut` icon, responsive to collapsed state)

### 12.4 — Database Migrations
- Added `out: "./drizzle"` to `drizzle.config.ts` for explicit migration output directory
- Workflow: `pnpm db:push` for dev, `pnpm db:generate` → review SQL → `pnpm db:migrate` for production

### Files modified
- `src/env.js` — added `NEXT_PUBLIC_APP_URL` to client schema and runtimeEnv
- `next.config.js` — standalone output + image remote patterns
- `.env.example` — added `NEXT_PUBLIC_APP_URL`
- `src/app/layout.tsx` — expanded metadata (OG, Twitter, viewport, robots)
- `public/og-image.png` — **new** static OG image
- `public/robots.txt` — **new** robots file
- `src/app/sitemap.ts` — **new** sitemap route
- `src/app/_components/landing-page.tsx` — **new** landing page component
- `src/app/(dashboard)/layout.tsx` — render landing page for unauth users
- `src/app/auth/signin/page.tsx` — heading links to `/`
- `src/app/_components/sidebar.tsx` — added sign-out button in sidebar footer
- `drizzle.config.ts` — explicit `out` directory

### Test results
- `SKIP_ENV_VALIDATION=1 pnpm typecheck` — passes with no errors

---

## Phase 13 — QA, Performance & Launch Readiness ✅

**Status:** Complete

### 13.1 — End-to-End QA Pass
- Full feature checklist verified against PRD spec
- Auth flows (sign-up, sign-in, sign-out, magic link)
- Dashboard: status tabs with counts, sort controls, card grid
- Quick Capture: Cmd+N, modal, save → toast → card appears
- Script Editor: title, body (TipTap), metadata row, notes, attachments, stats bar
- Auto-save: 3s debounce, save indicator, Cmd+S force save
- Slash commands: /divider, /hook, /date, /note
- Floating toolbar: bold, italic, underline on text selection
- Tags: create, assign, remove, color picker, sidebar filter
- Folders: create, assign, sidebar filter, settings CRUD
- Hook Templates: /hooks page CRUD, /hook slash command insertion
- Search: sidebar search, 300ms debounce, combines with status tabs
- Context menu: right-click on cards → status, folder, duplicate, delete
- Keyboard shortcuts: Cmd+N, Cmd+K, Cmd+S, Escape, Cmd+Shift+D
- Onboarding tour: 3-step tooltip, dismissable, stored in preferences
- Empty states: no scripts, no results, no status — all match PRD Section 4.3
- Error boundaries: root, dashboard, 404
- Responsive: mobile sidebar drawer, tablet icon-only, desktop full sidebar
- Landing page: unauthenticated users see it, CTAs work

### 13.2 — Performance Optimization
- **Dynamic import for TipTap editor** — `script/[id]/page.tsx` now uses `next/dynamic` with `ssr: false` to lazy-load the entire ScriptEditorPage. TipTap + 7 extension packages only load when user navigates to a script. Script route first-load JS: **104 kB** (lean).
- **Extracted EditorSkeleton** — reusable `editor-skeleton.tsx` component used as loading fallback for both dynamic import and internal loading state.
- **Dynamic import for HookTemplatePicker** — `slash-command-menu.tsx` lazy-loads the hook template picker (with its own tRPC query) only when user types `/hook`.
- **Dynamic import for AttachmentsSection** — `script-editor-page.tsx` lazy-loads the file upload component since it's collapsible and often hidden.
- **Optimized attachments.delete (N+1 fix)** — replaced 2 sequential queries (find attachment, then find script) with a single `innerJoin` query that verifies ownership in one DB round-trip.
- **Bundle analyzer** — installed `@next/bundle-analyzer` as devDep. Run with `ANALYZE=true pnpm build` for visibility into chunk sizes.

### 13.3 — Final Polish
- **Toast consistency audit** — all toasts follow consistent patterns: `toast.success("Action completed.")` / `toast.error("Failed to action.")` with optional descriptions. No redundant or missing toasts found.
- **Empty state alignment** — verified all 3 variants match PRD Section 4.3 exactly:
  - No scripts: "No scripts yet. Hit the + button to capture your first idea."
  - No scripts in status: "No scripts in [Status]. Scripts will appear here as you move them along."
  - No search results: "No scripts match '[query]'. Try a different search or check your filters."
- **Console logging audit** — all console.error calls are intentional (error boundaries, upload error handling). No debug console.log calls in production paths. Server-side timing log is appropriate for monitoring.

### 13.4 — Launch Checklist
- [x] `pnpm build` succeeds with 0 errors
- [x] `SKIP_ENV_VALIDATION=1 pnpm typecheck` passes with 0 errors
- [x] `robots.txt` accessible at /robots.txt
- [x] Sitemap accessible at /sitemap.xml
- [x] No unnecessary console.log calls in production code
- [ ] Verify `AUTH_SECRET` is set (not the dev placeholder) — deploy-time check
- [ ] Verify `DATABASE_URL` uses production Supabase pooler — deploy-time check
- [ ] Verify Supabase Storage bucket exists and is configured — deploy-time check
- [ ] OG image accessible at /og-image.png — deploy-time check

### Build Metrics (Final)
| Route | Size | First Load JS |
|-------|------|---------------|
| `/` (Dashboard) | 176 B | 159 kB |
| `/script/[id]` (Editor) | 1.59 kB | 104 kB |
| `/hooks` | 3.36 kB | 147 kB |
| `/settings` | 4.09 kB | 147 kB |
| `/auth/signin` | 1.15 kB | 109 kB |
| `/auth/signup` | 1.81 kB | 141 kB |
| Shared JS | — | 102 kB |
| Middleware | 34.7 kB | — |

### Files modified
- `src/app/(dashboard)/script/[id]/page.tsx` — dynamic import for ScriptEditorPage with `ssr: false`
- `src/app/_components/editor/editor-skeleton.tsx` — **new** extracted reusable loading skeleton
- `src/app/_components/editor/script-editor-page.tsx` — uses EditorSkeleton, lazy-loads AttachmentsSection
- `src/app/_components/editor/slash-command-menu.tsx` — lazy-loads HookTemplatePicker
- `src/server/api/routers/attachments.ts` — optimized delete with single JOIN query
- `next.config.js` — conditional bundle analyzer integration
- `package.json` — added `@next/bundle-analyzer` devDep

### Test results
- `SKIP_ENV_VALIDATION=1 pnpm typecheck` — passes with 0 errors
- `pnpm build` — succeeds, all routes compile cleanly

---

## Phase 13b — Free-Tier Guardrails (Vercel + Supabase Free)

**Status:** Complete ✅

### Problem
Deploying to Vercel free tier + Supabase free tier (500 MB DB, 1 GB storage, 100k serverless invocations/month). Need guardrails against abuse if anyone uses the app.

### Changes

#### Removed: File Uploads & Attachments
Completely removed the file upload feature to eliminate Supabase Storage risk:
- **Deleted** `src/app/api/upload/route.ts` — upload endpoint
- **Deleted** `src/app/api/upload/delete/route.ts` — delete endpoint
- **Deleted** `src/app/_components/editor/attachments-section.tsx` — UI component
- **Deleted** `src/server/api/routers/attachments.ts` — tRPC router
- **Deleted** `src/lib/supabase-client.ts` — Supabase client (only used for storage)
- **Removed** `@supabase/supabase-js` dependency (saves ~50 KB from bundle)
- **Removed** Supabase Storage env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_*`)
- **Removed** attachments from `scripts.getById` response and `root.ts` router
- **Removed** Supabase CDN from CSP headers and Next.js image remote patterns

#### Added: Per-User Resource Limits
New `src/server/api/limits.ts` defines all limits in one place:

| Resource | Limit | Rationale |
|----------|-------|-----------|
| Scripts per user | 50 | ~50 KB avg body × 50 = 2.5 MB/user |
| Tags per user | 20 | Keeps sidebar manageable |
| Folders per user | 10 | Keeps sidebar manageable |
| Hook templates per user | 25 | Generous for template library |
| Script body size | 100,000 chars | ~100 KB max per script |
| Notes size | 10,000 chars | ~10 KB max per script |

Enforced server-side in tRPC mutations:
- `scripts.create` — checks count before insert
- `scripts.duplicate` — checks count before insert
- `scripts.update` — checks body + notes size
- `tags.create` — checks count before insert
- `folders.create` — checks count before insert
- `hookTemplates.create` — checks count before insert, body capped at 5000 chars

All limits return user-friendly error messages (e.g., "You've reached the limit of 50 scripts. Delete some scripts to create new ones.").

#### Tightened: Rate Limits
| Route | Before | After |
|-------|--------|-------|
| Auth routes | 10 req/min | **5 req/min** |
| API routes | 100 req/min | **60 req/min** |

#### Cleaned: CSP Headers
Removed `https://*.supabase.co` from `img-src`, `media-src`, and `connect-src` since storage is no longer used.

### Files modified
- `src/server/api/limits.ts` — **new** centralized resource limits
- `src/server/api/root.ts` — removed attachments router
- `src/server/api/routers/scripts.ts` — added script count + body/notes size limits
- `src/server/api/routers/tags.ts` — added tag count limit
- `src/server/api/routers/folders.ts` — added folder count limit
- `src/server/api/routers/hookTemplates.ts` — added template count limit + body max
- `src/app/_components/editor/script-editor-page.tsx` — removed AttachmentsSection
- `src/middleware.ts` — tightened rate limits, cleaned CSP
- `src/env.js` — removed Supabase storage env vars
- `next.config.js` — removed Supabase image remote patterns
- `package.json` — removed `@supabase/supabase-js`

### Files deleted
- `src/app/api/upload/route.ts`
- `src/app/api/upload/delete/route.ts`
- `src/app/_components/editor/attachments-section.tsx`
- `src/server/api/routers/attachments.ts`
- `src/lib/supabase-client.ts`

### Test results
- `SKIP_ENV_VALIDATION=1 pnpm typecheck` — 0 errors
- `pnpm build` — succeeds, all routes compile cleanly
- Upload API routes removed from build output

---

## Phase 14 — Script Structure, Creative Tools, Speed & Polish (Evolution Update) ✅

**Completed:** March 27, 2026

Transformed ScriptPad from a CRUD note app into a purpose-built script writing environment. Added structural awareness (Hook/Body/CTA sections), creative tools (line variants, hook scorer, scene annotations), speed features (keyboard shortcuts, teleprompter, split view), and export capabilities.

### Phase 14.1 — Script Structure Awareness

1. **ScriptSection Node** (`src/app/_components/editor/extensions/script-section.tsx`)
   - Custom TipTap `Node` extension: wraps content in labeled, collapsible blocks
   - Section types: `hook`, `body`, `cta`, `custom` — each with distinct accent color (amber/blue/emerald/gray)
   - Header shows: collapse toggle (ChevronDown/Right), colored label (uppercase), per-section word count, estimated duration
   - `draggable: true` for mouse-based reordering
   - Collapsed state uses `max-height: 0; overflow: hidden` to hide content while preserving ProseMirror document structure

2. **SceneNote Node** (`src/app/_components/editor/extensions/scene-note.tsx`)
   - Inline atom `Node`: renders as a colored pill with icon
   - Three note types with distinct styling:
     - `broll` — Camera icon, purple (rgba(139, 92, 246))
     - `direction` — Scissors icon, blue (rgba(59, 130, 246))
     - `transition` — ArrowRight icon, amber (rgba(245, 158, 11))
   - Click-to-edit inline input, backspace-to-delete
   - Auto-opens in edit mode when inserted empty
   - **Excluded from word count and duration** — atom nodes have no text content in ProseMirror's getText()

3. **Timing Marks** (`src/app/_components/editor/extensions/timing-marks.ts`)
   - ProseMirror `Plugin` with `Decoration.widget` at each paragraph boundary
   - Shows cumulative time ("0:00", "0:15", "0:30") in left margin
   - Computed from word count at configurable WPM (default 150)
   - Excludes scene notes from calculation
   - Styled: absolute positioned, JetBrains Mono, 10px, 35% opacity

4. **Enhanced Stats Bar** (`src/app/_components/editor/stats-bar.tsx`)
   - Now shows per-section breakdown below main stats when sections exist
   - Each section: colored dot + label + word count + duration
   - Uses `sectionStats` from editor store

5. **Editor Store** (`src/stores/editor-store.ts`)
   - Added `sectionStats: SectionStat[]` to state
   - `SectionStat` type: `{ type, label, wordCount, durationSeconds }`
   - `setStats` now accepts optional `sectionStats`

6. **Stats Computation** (`tiptap-editor.tsx`)
   - Replaced simple `editor.getText().split()` with `computeStats()` function
   - Traverses document tree, excludes `sceneNote` nodes from word/char counts
   - Computes per-section stats by finding all `scriptSection` nodes
   - Returns both spoken-text stats and section breakdown

7. **Schema** — Added `structureMetadata` jsonb column to `scriptpad_script` table for cross-script analytics
8. **Scripts Router** — Updated `scripts.update` to accept and persist `structureMetadata`

9. **Slash Commands** — Added 6 new commands:
   - `/hook-section`, `/body-section`, `/cta-section` — insert individual sections
   - `/structure` — insert all three (Hook + Body + CTA)
   - `/scene`, `/broll` — insert B-roll scene note

### Phase 14.2 — Creative Tools

1. **Line Variants** (`src/app/_components/editor/extensions/line-variant.tsx`)
   - Block-level atom `Node` with `variants` (string[]) and `activeIndex` attributes
   - Cycle through variants with Cmd+Alt+Up/Down keyboard shortcuts
   - Add variant button (+), expand/collapse to see all variants
   - Inline editing per variant, remove individual variants
   - `renderText()` returns only active variant — so word count, export, and teleprompter only use the selected version
   - Counter display: "1/3", "2/3", etc.

2. **Hook Strength Indicator** (`src/app/_components/editor/hook-scorer.ts`)
   - Heuristic scoring function: `scoreHook(text) → HookScore`
   - Six criteria (0-100 total):
     - Question format (0-20): ends with "?"
     - Statistics/numbers (0-15): contains digits, bonus for percentages
     - Addresses "you" (0-15): you/your/you're count
     - Power words (0-20): 40+ words like "secret", "proven", "mistake", "exactly"
     - Length (0-15): ideal 8-20 words
     - Urgency (0-15): "now", "today", "before", "don't wait"
   - Three levels: weak (<35, red), medium (35-59, amber), strong (60+, green)
   - Returns `suggestions[]` with actionable tips
   - Integrated into Hook section header: colored dot + score number + tooltip with suggestions

3. **Punch Up (AI Shell)** — Sparkle button in bubble menu
   - On text selection, sends to `ai.punchUp` tRPC mutation
   - Shows floating popover with rewritten text + "Replace with this" button
   - Currently returns placeholder (stub router) — ready for real LLM in future
   - `src/server/api/routers/ai.ts` — stub with `punchUp` and `scoreHook` mutations

4. **AI Usage Table** — `scriptpad_ai_usage` table for future token tracking (userId, feature, inputTokens, outputTokens, createdAt)

5. **Slash Commands** — Added 3 more:
   - `/transition` — insert transition annotation
   - `/direction` — insert direction note
   - `/variant` — insert line variant block

### Phase 14.3 — Speed & Flow

1. **Keyboard Shortcuts Extension** (`src/app/_components/editor/extensions/keyboard-shortcuts.ts`)
   - Replaced inline `CustomKeymap` with comprehensive extension
   - Section shortcuts: Cmd+Shift+H (Hook), Cmd+Shift+B (Body), Cmd+Shift+C (CTA)
   - Cmd+Shift+N — insert scene note
   - Cmd+Shift+V — convert current paragraph to line variant
   - Cmd+Shift+Minus — insert divider
   - Cmd+Alt+Up/Down — reorder sections (swap with sibling via ProseMirror transactions)

2. **Keyboard Help Modal** (`src/app/_components/editor/keyboard-help-modal.tsx`)
   - Opens with Cmd+? — full shortcut reference organized by category
   - Portal-rendered, Escape to close, backdrop click to close
   - Categories: Formatting, Structure, Navigation, Views

3. **Split View** (`script-editor-page.tsx`)
   - Cmd+\\ toggles right panel (280px wide)
   - Shows: script notes, quick actions (teleprompter, keyboard help), tags
   - Hidden on mobile (`hidden lg:block`)
   - Editor stays at `max-w-3xl`

4. **Teleprompter Mode** (`src/app/_components/editor/teleprompter-view.tsx`)
   - Full-screen overlay activated by Cmd+Enter
   - `extractTeleprompterContent()` converts TipTap JSON to flat section list
   - Section headers rendered as colored dividers
   - Scene notes rendered dimmed (purple, 50% opacity, monospace)
   - Line variants use only active variant text
   - Controls bar: Play/Pause (Space), Speed +/- (arrows, 10-120 px/sec), Font size +/- (20-72px), Restart (R), Mirror mode (horizontal flip for teleprompter hardware), Exit (Escape)
   - `requestAnimationFrame` loop for smooth scrolling
   - Starts with 40vh top padding (content begins mid-screen)

### Phase 14.4 — Polish & Export

1. **Script Export** (`src/app/_components/editor/export-script.ts`)
   - `exportToText(doc, options)` — converts TipTap JSON to plain text
   - Two modes:
     - **Spoken-only** (`includeAnnotations: false`): just the words you'd say, with section headers
     - **Full with annotations** (`includeAnnotations: true`): includes `[B-ROLL: ...]`, `[TRANSITION: ...]`, `[DIRECTION: ...]`, and `[ALT N: ...]` for inactive line variants
   - Title + underline header
   - `copyToClipboard()` and `downloadAsFile()` utilities

2. **Editor Header Export Menu** (`editor-header.tsx`)
   - Three new items in "More" menu between Duplicate and Timestamps:
     - "Copy spoken text" — clipboard, spoken-only
     - "Copy with annotations" — clipboard, full
     - "Download as .txt" — file download, sanitized filename

3. **Updated Landing Page** (`landing-page.tsx`)
   - New hero copy: "Write scripts that know their own structure."
   - "Built for short-form creators" badge
   - Three hero feature cards: Script Structure, Scene Annotations, Timing Marks
   - 6-card power features grid: Line Variants, Hook Scorer, Teleprompter, Keyboard-First, Export, Organize
   - Updated CTA: "Ready to write better scripts?"

### Verification
```
SKIP_ENV_VALIDATION=1 pnpm typecheck → 0 TypeScript errors
pnpm build → success, all routes compile cleanly
pnpm db:push → schema applied (structureMetadata column + ai_usage table)
```

### Files created (10)
- `src/app/_components/editor/extensions/script-section.tsx`
- `src/app/_components/editor/extensions/scene-note.tsx`
- `src/app/_components/editor/extensions/timing-marks.ts`
- `src/app/_components/editor/extensions/line-variant.tsx`
- `src/app/_components/editor/extensions/keyboard-shortcuts.ts`
- `src/app/_components/editor/hook-scorer.ts`
- `src/app/_components/editor/export-script.ts`
- `src/app/_components/editor/keyboard-help-modal.tsx`
- `src/app/_components/editor/teleprompter-view.tsx`
- `src/server/api/routers/ai.ts`

### Files modified (10)
- `src/stores/editor-store.ts` — added sectionStats
- `src/app/_components/editor/tiptap-editor.tsx` — registered all new extensions, computeStats(), punch up button
- `src/app/_components/editor/slash-command-menu.tsx` — 9 new slash commands
- `src/app/_components/editor/stats-bar.tsx` — per-section breakdown
- `src/app/_components/editor/script-editor-page.tsx` — split view, teleprompter, keyboard help
- `src/app/_components/editor/editor-header.tsx` — export menu items
- `src/app/_components/landing-page.tsx` — full rewrite with new features
- `src/server/db/schema.ts` — structureMetadata column + ai_usage table
- `src/server/api/root.ts` — registered ai router
- `src/styles/globals.css` — styles for sections, scene notes, timing marks, line variants, hook score

---

## Infrastructure Notes

- **Node.js:** v20.20.2 (installed via nvm)
- **pnpm:** v10.33.0
- **Database:** Supabase PostgreSQL (Session Pooler, us-east-1)
- **Dev server:** `pnpm dev` → http://localhost:3000
- **Schema push:** `pnpm db:push`
- **Seed:** `pnpm db:seed`
- **Type check:** `pnpm typecheck` (or `SKIP_ENV_VALIDATION=1 pnpm typecheck`)
