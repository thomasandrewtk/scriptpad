# ScriptPad — MVP Product Specification

**Version:** 1.0 MVP
**Author:** Thomas (DailyDrivr)
**Date:** March 27, 2026
**Platform:** Web Application

---

## 1. Product Overview

### 1.1 What Is ScriptPad?

ScriptPad is a web-based script writing and tracking tool purpose-built for short-form content creators. It provides a distraction-free, speed-first environment to capture ideas, write scripts, organize content by status and topic, and keep a clear view of what's scheduled to go out and when.

### 1.2 Core Philosophy

**Speed of capture above all else.** The #1 priority is eliminating friction between having an idea and getting it into the app. Every design decision filters through this lens: if it slows the creator down, it doesn't ship.

Secondary priorities (in order): focus during writing, and organizational clarity.

### 1.3 Target User

Built for a solo creator (Thomas / DailyDrivr) as the primary user, but architected from day one to support multiple creators in the future. The data model, auth layer, and UI patterns should all assume multi-tenancy will come later — but the MVP serves a single authenticated user.

### 1.4 Tech Stack

**Recommended (open to adjustment):**

- **Frontend:** React (Vite) with Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **Editor:** TipTap (ProseMirror-based, highly customizable, supports slash commands natively)

**Rationale:** This stack is fast to ship, cheap to host, scales naturally to multi-user, and gives full control over the editor experience. Supabase Storage handles file uploads (media attachments) out of the box.

---

## 2. Information Architecture

### 2.1 Data Model

```
User
├── id (UUID)
├── email
├── display_name
├── created_at
└── preferences (JSON — theme, default sort, etc.)

Script
├── id (UUID)
├── user_id (FK → User)
├── title (string, required)
├── body (JSON — TipTap document format)
├── status (enum: idea | writing | ready | posted)
├── post_date (date, nullable — plain date label, no time)
├── notes (text, nullable — plain text field)
├── word_count (integer, computed)
├── char_count (integer, computed)
├── estimated_duration_seconds (integer, computed)
├── folder_id (FK → Folder, nullable)
├── created_at (timestamp)
├── updated_at (timestamp)

Script_Tags (join table)
├── script_id (FK → Script)
├── tag_id (FK → Tag)

Tag
├── id (UUID)
├── user_id (FK → User)
├── name (string, unique per user)
├── color (string, hex — for visual badges)

Folder
├── id (UUID)
├── user_id (FK → User)
├── name (string)
├── sort_order (integer)
├── created_at (timestamp)

Media_Attachment
├── id (UUID)
├── script_id (FK → Script)
├── file_url (string — Supabase Storage URL)
├── file_name (string)
├── file_type (string — MIME type)
├── file_size_bytes (integer)
├── uploaded_at (timestamp)

Hook_Template
├── id (UUID)
├── user_id (FK → User)
├── title (string)
├── body (text — the hook text content)
├── created_at (timestamp)
```

### 2.2 Status Lifecycle

```
[Idea] → [Writing] → [Ready] → [Posted]
```

- **Idea** — A captured concept. May only have a title and a few rough notes.
- **Writing** — Actively being drafted. The script body is being fleshed out.
- **Ready** — Script is complete and approved for posting. Optionally has a post_date.
- **Posted** — Content has been published. Archived but always accessible. Manual status change only (no auto-transition in MVP).

Status changes are manual (dropdown or click). There is no auto-advancement based on post_date in the MVP. The user moves scripts to "Posted" themselves after publishing.

---

## 3. App Structure & Navigation

### 3.1 Global Layout

```
┌─────────────────────────────────────────────────┐
│  Sidebar (collapsible)     │  Main Content Area  │
│                            │                     │
│  - Logo / App Name         │  (varies by view)   │
│  - Quick Capture [+]       │                     │
│  - Navigation:             │                     │
│    • All Scripts           │                     │
│    • Folders               │                     │
│    • Tags                  │                     │
│    • Hook Templates        │                     │
│  - Search bar              │                     │
│                            │                     │
└─────────────────────────────────────────────────┘
```

- **Sidebar** is always visible on desktop, collapsible on smaller screens.
- **Dark mode is the default** and primary design target. Light mode is NOT in MVP scope.
- Visual style: dark, minimal, clean — think a cross between iA Writer's focus and a modern code editor's dark theme. Muted surfaces, high-contrast text, accent color for interactive elements.

### 3.2 Views

| View | Route | Description |
|------|-------|-------------|
| Dashboard (All Scripts) | `/` | Default landing page. All scripts in card view. |
| Folder View | `/folder/:id` | Scripts filtered to a specific folder. Same layout as dashboard. |
| Tag View | `/tag/:name` | Scripts filtered to a specific tag. Same layout as dashboard. |
| Script Editor | `/script/:id` | Full editor view for a single script. |
| Hook Templates | `/hooks` | List of saved hook templates. |
| Settings | `/settings` | Tag management, folder management, preferences. |

---

## 4. Dashboard (Main Page)

### 4.1 Layout & Behavior

The dashboard is the home screen. It shows **all scripts, newest first** by default.

**Status Tabs** sit horizontally across the top of the content area:

```
[ All ]  [ Idea ]  [ Writing ]  [ Ready ]  [ Posted ]
```

- Clicking a tab filters the list to that status.
- "All" is the default active tab.
- Each tab shows a count badge (e.g., `Writing (4)`).
- Active tab has an accent-colored underline or highlight.

**Sort Controls** appear as a dropdown or toggle group next to the tabs:

- Sort by: **Post Date** (upcoming first) | **Date Created** (newest first, DEFAULT) | **Last Edited** (most recent first)
- Sort order persists during the session. Resets to default on reload (or save to user preferences later).

**Search Bar** is accessible from the sidebar (always visible) and supports:

- Full-text search across script titles AND body content.
- Tag-based filtering: typing a tag name surfaces scripts with that tag.
- Results update as you type (debounced, 300ms).
- Search + status tab filters combine (e.g., search "iPhone" while on the "Writing" tab shows only Writing scripts matching "iPhone").

### 4.2 Script Cards

Each script appears as a **card** with the following layout:

```
┌──────────────────────────────────────────────┐
│  [Status Badge]                  [Post Date] │
│                                              │
│  Script Title                                │
│                                              │
│  First 2-3 lines of the script body,         │
│  truncated with ellipsis if longer...        │
│                                              │
│  [Tag] [Tag]                     [Folder 📁] │
└──────────────────────────────────────────────┘
```

**Card details:**

- **Status Badge** — Color-coded pill. Suggested colors:
  - Idea: `#6B7280` (gray)
  - Writing: `#F59E0B` (amber)
  - Ready: `#10B981` (green)
  - Posted: `#6366F1` (indigo/muted)
- **Post Date** — Displayed in relative format if within 7 days ("Tomorrow", "In 3 days", "Mar 30"), otherwise absolute ("Apr 15, 2026"). Only shown if a date is set.
- **Title** — Bold, prominent. Truncated at 1 line with ellipsis.
- **Preview** — First 2–3 lines of the script body, plain text (no formatting rendered). Truncated.
- **Tags** — Small colored pills at the bottom-left. Max 3 visible, "+2 more" overflow.
- **Folder** — Small folder icon + name at the bottom-right, if assigned.

**Card interactions:**

- **Click anywhere on the card** → Opens the Script Editor for that script.
- **Right-click or long-press** → Context menu: Change Status, Move to Folder, Duplicate, Delete.
- Cards are displayed in a **responsive grid**: 3 columns on desktop, 2 on tablet, 1 on mobile.

### 4.3 Empty States

- **No scripts at all:** "No scripts yet. Hit the + button to capture your first idea." with a prominent CTA pointing to the quick-capture button.
- **No scripts in a filtered status:** "No scripts in [Status]. Scripts will appear here as you move them along." — friendly, not alarming.
- **No search results:** "No scripts match '[query]'. Try a different search or check your filters."

---

## 5. Quick Capture

### 5.1 Trigger

A **floating action button (FAB)** in the bottom-right corner of the screen. Always visible on the dashboard. Uses a `+` icon. Accent-colored for maximum visibility.

On the editor view, the FAB is hidden (to avoid distraction).

### 5.2 Behavior

Clicking the FAB opens a **modal overlay** (not a full page navigation). The modal is minimal:

```
┌────────────────────────────────────────┐
│  Quick Capture                    [✕]  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Title (required)                 │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Notes (optional)                 │  │
│  │                                  │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Cancel]              [Save as Idea]  │
└────────────────────────────────────────┘
```

**Fields:**

- **Title** — Auto-focused on open. Single line. Required.
- **Notes** — Multi-line plain text. Optional. For jotting context, a rough hook, a link, whatever.

**On save:**

- Creates a new Script with `status: idea`.
- Title and notes are saved. Body is empty.
- The user is returned to the dashboard. The new script card appears at the top (since it's newest).
- A subtle toast confirmation: "Idea saved." with an "Open" link to jump straight into the editor.

**Keyboard shortcut:** `Cmd/Ctrl + N` globally triggers Quick Capture from the dashboard.

---

## 6. Script Editor

### 6.1 Layout

The editor is a **full-width, focused writing view**. Sidebar remains accessible but can be collapsed for maximum writing space.

```
┌───────────────────────────────────────────────────────┐
│  ← Back to Scripts          [Status ▼]   [⋯ More]    │
├───────────────────────────────────────────────────────┤
│                                                       │
│  [Title — large, editable inline]                     │
│                                                       │
│  [Folder: Select...]  [Tags: + Add]  [Date: Set...]  │
│                                                       │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Script Body Editor                                   │
│                                                       │
│  Line 1 of the script...                              │
│  Line 2 of the script...                              │
│  --- (section divider) ---                            │
│  Line 3 of the script...                              │
│  Line 4 of the script...                              │
│                                                       │
│                                                       │
│                                                       │
├───────────────────────────────────────────────────────┤
│  Notes                                          [▼]   │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Plain text notes field...                       │  │
│  └─────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────┤
│  Attachments                                    [▼]   │
│  [+ Upload File]  | image.jpg (1.2MB) [✕]            │
│                   | reference.mp4 (4.5MB) [✕]        │
├───────────────────────────────────────────────────────┤
│  📊 124 words · 687 chars · ~0:37 est. duration      │
└───────────────────────────────────────────────────────┘
```

### 6.2 Header Bar

- **Back arrow** — Returns to the previous view (dashboard, folder, or tag view). Auto-saves before navigating.
- **Status dropdown** — Inline status changer. Click to cycle or select: Idea → Writing → Ready → Posted. Color-coded to match the badges.
- **More menu (⋯)** — Contains: Duplicate Script, Delete Script, View Created/Updated timestamps.

### 6.3 Metadata Row

Sits between the title and the editor body. Compact, single row on desktop. Stacks on mobile.

- **Folder** — Dropdown to assign/change folder. Shows "No folder" if unset.
- **Tags** — Inline tag chips with a `+ Add` button. Clicking opens a popover with existing tags (filterable) and a "Create new tag" option. Tags are removable with an `✕` on each chip.
- **Post Date** — Click to open a date picker. Displays the selected date or "No date set". Clearable.

### 6.4 Script Body Editor

**Editor engine:** TipTap (recommended) — ProseMirror-based, headless, fully customizable.

**Writing experience:**

- A clean text editor. No markdown syntax visible. No `#`, no `"`, no `` ` ``.
- Typing feels like writing in Notion — press Enter for a new line/paragraph, and the text flows naturally.
- **Line breaks create new paragraphs** (block-level). Not a monospace/code-style editor.
- Formatting is applied via toolbar or keyboard shortcuts — the text itself stays clean.

**Formatting options (toolbar + shortcuts):**

| Format | Shortcut | Toolbar Icon |
|--------|----------|-------------|
| Bold | `Cmd/Ctrl + B` | **B** |
| Italic | `Cmd/Ctrl + I` | *I* |
| Underline | `Cmd/Ctrl + U` | U̲ |

The toolbar is a **floating toolbar** that appears when text is selected (like Notion/Medium), not a fixed bar. This keeps the interface clean during writing.

**Section dividers:**

- Users can insert a horizontal section divider to visually separate parts of the script (e.g., Hook / Body / CTA).
- The divider is a thin horizontal line that spans the editor width.
- Dividers are NOT labeled by default. They're purely visual separators. The user decides what each section means.
- Insert via slash command (`/divider`) or keyboard shortcut (`Cmd/Ctrl + Shift + D`).

**Slash commands:**

Typing `/` at the beginning of a line (or after a blank line) opens a command menu:

| Command | Action |
|---------|--------|
| `/divider` | Insert a section divider (horizontal rule) |
| `/hook` | Insert a saved hook template (opens template picker) |
| `/date` | Insert today's date as inline text |
| `/note` | Jump focus to the Notes field below |

The slash menu is a small popover list, filterable by typing. Pressing Escape closes it. This is a standard TipTap extension pattern.

**Auto-save:**

- The editor auto-saves every 3 seconds after the last keystroke (debounced).
- A subtle save indicator in the bottom bar: "Saved" (with a checkmark) or "Saving..." during the debounce.
- No manual save button. It just works.

### 6.5 Notes Field

A collapsible section below the editor body.

- **Plain text only.** No formatting. This is for personal notes, not script content.
- Use cases: reference links, context, reminders to self, alternate wording ideas.
- Default state: collapsed if empty, expanded if has content.
- Toggle with a chevron icon.

### 6.6 Media Attachments

A collapsible section below Notes.

- **Upload button** — Click to select files. Supports images (png, jpg, gif, webp), video (mp4, mov), and audio (mp3, m4a, wav).
- **File size limit:** 50MB per file (configurable in Supabase Storage).
- **Display:** Each attachment shows as a row: file icon (based on type), filename, file size, and a delete `✕` button.
- Clicking an image attachment opens a lightbox preview.
- Clicking a video/audio attachment opens the browser's native player.
- Files are uploaded to Supabase Storage under `/{user_id}/attachments/{script_id}/`.
- These are **reference files** — b-roll ideas, visual inspo, audio clips — not embedded in the script text.

### 6.7 Stats Bar

A fixed footer bar at the bottom of the editor:

```
📊 124 words · 687 characters · ~0:37 estimated duration
```

- **Word count** — Standard word count of the script body.
- **Character count** — Total characters (useful for caption limits on platforms).
- **Estimated duration** — Calculated at ~150 words per minute (typical short-form speaking pace). Displayed as `M:SS`.
- Stats update in real-time as the user types.

---

## 7. Folders & Tags

### 7.1 Folders

- Folders are flat (no nesting in MVP).
- Created and managed from the sidebar or from Settings.
- A script can belong to **one folder** or no folder.
- Clicking a folder in the sidebar filters the dashboard to show only scripts in that folder. The status tabs and sort controls still apply within the folder view.
- Folder examples: "iPhone Tips Series", "Reaction Videos", "Tutorials".

**Sidebar display:**

```
📁 Folders
   iPhone Tips (12)
   Reactions (5)
   Tutorials (8)
   Uncategorized (3)
```

- Counts reflect total scripts in each folder (across all statuses).
- "Uncategorized" appears if any scripts have no folder assigned.

### 7.2 Tags

- Tags are user-created, colored labels.
- A script can have **multiple tags**.
- Tags are created inline (from the editor tag picker) or managed in Settings.
- Each tag has a name and a color (chosen from a preset palette of 10–12 colors).
- Clicking a tag in the sidebar filters the dashboard to that tag. Status tabs and sort controls still apply.

**Sidebar display:**

```
🏷 Tags
   🟡 Apple News (7)
   🔵 Hot Take (4)
   🟢 Tutorial (9)
   🔴 Trending (2)
```

### 7.3 Combined Filtering

- Folder and tag filtering are **independent dimensions**. You can be inside a folder AND filter by tag, plus apply a status tab.
- The URL reflects the current filter state for bookmarkability.

---

## 8. Hook Templates

### 8.1 Purpose

Short-form content lives or dies on the hook. ScriptPad lets the user save reusable hook templates — proven opening lines or structures they can quickly insert into any script.

### 8.2 Hook Templates Page (`/hooks`)

A simple list view of all saved hook templates.

```
┌──────────────────────────────────────────────────────┐
│  Hook Templates                        [+ New Hook]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  "Here's something Apple doesn't want you to know…"  │
│  Created Mar 15, 2026                    [Edit] [✕]  │
│                                                      │
│  "Stop scrolling — this changes everything."         │
│  Created Mar 10, 2026                    [Edit] [✕]  │
│                                                      │
│  "I tested [X] for 30 days. Here's what happened."   │
│  Created Feb 28, 2026                    [Edit] [✕]  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Each template has:**

- **Title** (optional — can just be the hook text itself).
- **Body** — The actual hook text. Plain text. 1–3 lines typically.

### 8.3 Inserting a Hook Template

From the Script Editor, the user types `/hook` to open the slash command menu. This presents a searchable list of saved hook templates. Selecting one inserts the hook text at the cursor position in the editor.

The inserted text is **copied, not linked** — editing the hook in the script does not change the template, and vice versa.

---

## 9. Duplicate Script (Nice to Have)

Available from the script editor's More menu (⋯) and from the right-click context menu on a script card.

**Behavior:**

- Creates an exact copy of the script (title, body, tags, folder, notes).
- The duplicate's title is prefixed: "Copy of [Original Title]".
- Status is reset to **Idea** regardless of the original's status.
- Post date is cleared.
- Attachments are NOT duplicated (to save storage). The user can re-upload if needed.
- The user is navigated to the new duplicate's editor after creation.

---

## 10. Design System

### 10.1 Visual Direction

**Dark mode is the default and only theme in MVP.**

- **Background:** Very dark gray, not pure black. `#0F0F0F` to `#1A1A1A` range.
- **Surface (cards, modals, sidebar):** Slightly elevated. `#1E1E1E` to `#252525`.
- **Text:** Off-white primary `#E5E5E5`, muted secondary `#9CA3AF`.
- **Accent:** A single vibrant accent color for CTAs, active states, and interactive elements. Suggested: electric blue `#3B82F6` or teal `#14B8A6`. Configurable later.
- **Borders:** Subtle, `#2E2E2E` to `#333333`. Used sparingly.

**Typography:**

- **Headings / UI:** A clean sans-serif. Suggested: `"DM Sans"` or `"General Sans"`.
- **Editor body text:** A slightly warmer, readable font. Suggested: `"Satoshi"` or `"Plus Jakarta Sans"`. Larger size (16–18px) for comfortable writing.
- **Monospace (stats, counts):** `"JetBrains Mono"` or `"Fira Code"`.

### 10.2 Spacing & Layout

- **Base unit:** 4px grid.
- **Card gap:** 16px.
- **Content padding:** 24px on desktop, 16px on mobile.
- **Sidebar width:** 260px (collapsible to icon-only 64px).
- **Editor max-width:** 720px, centered. The writing area should never stretch too wide — it should feel focused, like a document.

### 10.3 Motion

- **Card hover:** Subtle lift (`translateY(-2px)`) with a soft shadow increase. 150ms ease.
- **Status badge transitions:** Color cross-fade on change. 200ms.
- **Modal open:** Fade in + slight scale up from 0.95 to 1. 200ms ease-out.
- **FAB:** Gentle pulse animation on first load (once) to draw attention. Subtle scale on hover.
- **Save indicator:** Fade transition between "Saving..." and "Saved ✓".

### 10.4 Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Desktop | ≥1024px | Sidebar visible + 3-column card grid |
| Tablet | 768–1023px | Sidebar collapsed (icon-only) + 2-column grid |
| Mobile | <768px | Sidebar hidden (hamburger menu) + 1-column grid |

---

## 11. Onboarding

### 11.1 First-Time Experience

On first login, the user sees:

1. **A quick 3-step tooltip tour** highlighting:
   - The quick capture FAB: "Capture ideas instantly with this button."
   - The status tabs: "Filter scripts by status — Idea, Writing, Ready, Posted."
   - The search bar: "Search across all your scripts and tags."

2. **A pre-loaded sample script** titled "Welcome to ScriptPad" in "Idea" status. The script body walks through the editor features: formatting, slash commands, section dividers. It includes a sample tag ("Tutorial") and a sample hook template pre-loaded.

The user can delete the sample script at any time. The tooltip tour can be dismissed and won't reappear.

---

## 12. Keyboard Shortcuts (Global)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | Open Quick Capture modal |
| `Cmd/Ctrl + K` | Focus search bar |
| `Cmd/Ctrl + B` | Bold (in editor) |
| `Cmd/Ctrl + I` | Italic (in editor) |
| `Cmd/Ctrl + U` | Underline (in editor) |
| `Cmd/Ctrl + Shift + D` | Insert section divider (in editor) |
| `Cmd/Ctrl + S` | Force save (in editor — also auto-saves) |
| `Escape` | Close modal / Dismiss slash menu / Back to dashboard |

---

## 13. Technical Architecture

### 13.1 Frontend

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── FAB.tsx
│   ├── dashboard/
│   │   ├── ScriptCard.tsx
│   │   ├── StatusTabs.tsx
│   │   ├── SortControls.tsx
│   │   └── SearchBar.tsx
│   ├── editor/
│   │   ├── ScriptEditor.tsx (TipTap instance)
│   │   ├── MetadataRow.tsx
│   │   ├── NotesField.tsx
│   │   ├── AttachmentPanel.tsx
│   │   ├── StatsBar.tsx
│   │   ├── FloatingToolbar.tsx
│   │   └── SlashMenu.tsx
│   ├── modals/
│   │   ├── QuickCaptureModal.tsx
│   │   ├── DeleteConfirmModal.tsx
│   │   └── TagPickerPopover.tsx
│   ├── hooks-templates/
│   │   ├── HookTemplateList.tsx
│   │   └── HookTemplateForm.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── TagChip.tsx
│       ├── Toast.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useScripts.ts
│   ├── useTags.ts
│   ├── useFolders.ts
│   ├── useSearch.ts
│   └── useAutoSave.ts
├── lib/
│   ├── supabase.ts
│   ├── editor-extensions.ts (TipTap config)
│   └── utils.ts (word count, duration calc, date formatting)
├── pages/
│   ├── Dashboard.tsx
│   ├── ScriptEditorPage.tsx
│   ├── HookTemplatesPage.tsx
│   └── SettingsPage.tsx
└── styles/
    └── globals.css (Tailwind + CSS variables)
```

### 13.2 Database (Supabase / PostgreSQL)

**Row Level Security (RLS):** Enabled on all tables. All queries filter by `auth.uid() = user_id`. This ensures multi-user readiness from day one.

**Indexes:**

- `scripts.user_id` + `scripts.status` (compound — for filtered dashboard queries)
- `scripts.user_id` + `scripts.created_at` (for default sort)
- `scripts.user_id` + `scripts.updated_at` (for "last edited" sort)
- `scripts.user_id` + `scripts.post_date` (for scheduled sort)
- Full-text search index on `scripts.title` and `scripts.body` (using PostgreSQL `tsvector`)

**Storage Buckets:**

- `attachments` — Private bucket. Folder structure: `/{user_id}/{script_id}/filename.ext`.

### 13.3 Auth

- Supabase Auth with email/password.
- Magic link (passwordless) as a secondary option.
- Single user for MVP, but the auth layer supports unlimited users.

---

## 14. API / Data Operations

### 14.1 Scripts

| Operation | Method | Notes |
|-----------|--------|-------|
| List all scripts (with filters) | `GET` | Supports: `status`, `folder_id`, `tag`, `search`, `sort_by`, `sort_order` |
| Get single script | `GET` | Includes tags, folder, attachments |
| Create script (Quick Capture) | `POST` | Minimum: `title`. Sets `status: idea`. |
| Update script | `PATCH` | Any field. Auto-save calls this. |
| Update script status | `PATCH` | Dedicated status change. |
| Duplicate script | `POST` | Copies all fields, resets status/date. |
| Delete script | `DELETE` | Soft delete preferred (add `deleted_at`). |

### 14.2 Tags

| Operation | Method |
|-----------|--------|
| List user's tags | `GET` |
| Create tag | `POST` |
| Update tag (name/color) | `PATCH` |
| Delete tag | `DELETE` |
| Add tag to script | `POST` |
| Remove tag from script | `DELETE` |

### 14.3 Folders

| Operation | Method |
|-----------|--------|
| List user's folders | `GET` |
| Create folder | `POST` |
| Rename folder | `PATCH` |
| Delete folder | `DELETE` (scripts become uncategorized) |

### 14.4 Hook Templates

| Operation | Method |
|-----------|--------|
| List hook templates | `GET` |
| Create hook template | `POST` |
| Update hook template | `PATCH` |
| Delete hook template | `DELETE` |

### 14.5 Attachments

| Operation | Method |
|-----------|--------|
| Upload attachment | `POST` (multipart, to Supabase Storage) |
| List attachments for script | `GET` |
| Delete attachment | `DELETE` (removes from Storage + DB) |

---

## 15. MVP Scope Summary

### In Scope (Must Ship)

- [x] Dashboard with script cards (newest first default)
- [x] Status tabs (All, Idea, Writing, Ready, Posted)
- [x] Sort controls (Post Date, Created, Last Edited)
- [x] Full-text search + tag search
- [x] Quick Capture FAB (title + notes → Idea status)
- [x] Script Editor with clean, Notion-like writing
- [x] Bold / Italic / Underline formatting
- [x] Section dividers
- [x] Slash commands (/divider, /hook, /date, /note)
- [x] Floating selection toolbar
- [x] Post date field (date label only, no time)
- [x] Notes field per script
- [x] Media attachments (file upload)
- [x] Word count + character count + estimated duration
- [x] Folders (flat)
- [x] Tags (colored, multi-per-script)
- [x] Hook Templates (save + insert via slash command)
- [x] Dark mode (default and only theme)
- [x] Onboarding (tooltip tour + sample script)
- [x] Auto-save
- [x] Responsive layout (desktop, tablet, mobile)
- [x] Auth (email + magic link)

### Out of Scope (Post-MVP)

- [ ] Light mode / theme toggle
- [ ] Calendar view for scheduled scripts
- [ ] Push notifications / reminders
- [ ] Platform integration (auto-post to TikTok, YouTube, etc.)
- [ ] Platform field on scripts
- [ ] Multi-user / team features
- [ ] AI-powered slash commands (/rewrite, /expand, etc.)
- [ ] Drag-to-reorder lines in editor
- [ ] Script analytics (views, engagement tracking)
- [ ] Export to PDF / text
- [ ] Keyboard shortcut customization
- [ ] Offline support / PWA
- [ ] Version history for scripts
- [ ] Custom templates beyond hooks (full script templates)
- [ ] Public sharing / collaboration links

---

## 16. Open Questions for Development

1. **Editor choice finalization:** TipTap is recommended, but should we prototype with a simpler textarea + custom parser first to validate the UX before investing in TipTap configuration?
2. **Computed fields:** Should word_count, char_count, and estimated_duration be computed on the client only (displayed in real-time) or also stored in the DB (for potential future sorting/filtering by duration)?
3. **Soft delete vs. hard delete:** Spec recommends soft delete (`deleted_at` column) for safety. Confirm this approach — it means we need a "Trash" view or auto-purge after 30 days.
4. **Full-text search:** PostgreSQL `tsvector` is sufficient for MVP. Should we plan for Supabase's full-text search or a future Algolia/Typesense integration for richer results?
5. **File upload limits:** 50MB per file is suggested. Is this sufficient for video reference clips, or should it be higher?
