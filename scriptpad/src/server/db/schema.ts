import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * Multi-project schema prefix for Drizzle ORM.
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `scriptpad_${name}`);

// ─── Enums ───────────────────────────────────────────────────────────────────

export const scriptStatusEnum = pgEnum("script_status", [
  "idea",
  "writing",
  "ready",
  "posted",
]);

// ─── Auth Tables (NextAuth / Drizzle Adapter) ────────────────────────────────

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d.timestamp({ mode: "date", withTimezone: true }),
  image: d.varchar({ length: 255 }),
  hashedPassword: d.text(),
  preferences: d.jsonb().$type<Record<string, unknown>>().default({}),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  scripts: many(scripts),
  tags: many(tags),
  folders: many(folders),
  hookTemplates: many(hookTemplates),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d
      .varchar({ length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ─── Application Tables ──────────────────────────────────────────────────────

export const folders = createTable(
  "folder",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    name: d.varchar({ length: 255 }).notNull(),
    sortOrder: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("folder_user_id_idx").on(t.userId)],
);

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  scripts: many(scripts),
}));

export const scripts = createTable(
  "script",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    title: d.varchar({ length: 500 }).notNull(),
    body: d.jsonb().$type<Record<string, unknown>>(),
    bodyPlainText: d.text().default(""),
    status: scriptStatusEnum().notNull().default("idea"),
    postDate: d.timestamp({ mode: "date", withTimezone: true }),
    notes: d.text(),
    wordCount: d.integer().notNull().default(0),
    charCount: d.integer().notNull().default(0),
    estimatedDurationSeconds: d.integer().notNull().default(0),
    folderId: d.uuid().references(() => folders.id, { onDelete: "set null" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    index("script_user_status_idx").on(t.userId, t.status),
    index("script_user_created_idx").on(t.userId, t.createdAt),
    index("script_user_updated_idx").on(t.userId, t.updatedAt),
    index("script_user_postdate_idx").on(t.userId, t.postDate),
    index("script_user_folder_idx").on(t.userId, t.folderId),
    index("script_deleted_idx").on(t.deletedAt),
  ],
);

export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  user: one(users, { fields: [scripts.userId], references: [users.id] }),
  folder: one(folders, {
    fields: [scripts.folderId],
    references: [folders.id],
  }),
  scriptTags: many(scriptTags),
  mediaAttachments: many(mediaAttachments),
}));

export const tags = createTable(
  "tag",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    name: d.varchar({ length: 100 }).notNull(),
    color: d.varchar({ length: 7 }).notNull().default("#3B82F6"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("tag_user_id_idx").on(t.userId)],
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  scriptTags: many(scriptTags),
}));

export const scriptTags = createTable(
  "script_tag",
  (d) => ({
    scriptId: d
      .uuid()
      .notNull()
      .references(() => scripts.id, { onDelete: "cascade" }),
    tagId: d
      .uuid()
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  }),
  (t) => [
    primaryKey({ columns: [t.scriptId, t.tagId] }),
    index("script_tag_script_idx").on(t.scriptId),
    index("script_tag_tag_idx").on(t.tagId),
  ],
);

export const scriptTagsRelations = relations(scriptTags, ({ one }) => ({
  script: one(scripts, {
    fields: [scriptTags.scriptId],
    references: [scripts.id],
  }),
  tag: one(tags, { fields: [scriptTags.tagId], references: [tags.id] }),
}));

export const mediaAttachments = createTable(
  "media_attachment",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    scriptId: d
      .uuid()
      .notNull()
      .references(() => scripts.id, { onDelete: "cascade" }),
    fileUrl: d.text().notNull(),
    fileName: d.varchar({ length: 500 }).notNull(),
    fileType: d.varchar({ length: 100 }).notNull(),
    fileSizeBytes: d.integer().notNull(),
    uploadedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("attachment_script_id_idx").on(t.scriptId)],
);

export const mediaAttachmentsRelations = relations(
  mediaAttachments,
  ({ one }) => ({
    script: one(scripts, {
      fields: [mediaAttachments.scriptId],
      references: [scripts.id],
    }),
  }),
);

export const hookTemplates = createTable(
  "hook_template",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    title: d.varchar({ length: 255 }),
    body: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("hook_template_user_id_idx").on(t.userId)],
);

export const hookTemplatesRelations = relations(hookTemplates, ({ one }) => ({
  user: one(users, {
    fields: [hookTemplates.userId],
    references: [users.id],
  }),
}));
