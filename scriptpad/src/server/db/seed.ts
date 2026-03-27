import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
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
import postgres from "postgres";

// ─── Inline schema (avoids importing next-auth/adapters) ─────────────────────

const createTable = pgTableCreator((name) => `scriptpad_${name}`);

const scriptStatusEnum = pgEnum("script_status", [
  "idea",
  "writing",
  "ready",
  "posted",
]);

const users = createTable("user", (d) => ({
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

const scripts = createTable("script", (d) => ({
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
  folderId: d.uuid(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  deletedAt: d.timestamp({ withTimezone: true }),
}));

const tags = createTable("tag", (d) => ({
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
}));

const scriptTags = createTable(
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
  (t) => [primaryKey({ columns: [t.scriptId, t.tagId] })],
);

const hookTemplates = createTable("hook_template", (d) => ({
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
}));

// ─── Seed ────────────────────────────────────────────────────────────────────

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:password@localhost:5432/scriptpad";

async function seed() {
  const conn = postgres(DATABASE_URL);
  const db = drizzle(conn);

  console.log("🌱 Seeding database...");

  // Create the default user (Thomas / DailyDrivr)
  const hashedPassword = await bcrypt.hash("scriptpad123", 12);
  const userId = crypto.randomUUID();

  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      name: "Thomas",
      email: "thomas@dailydrivr.com",
      hashedPassword,
      emailVerified: new Date(),
      preferences: { onboardingComplete: false },
    })
    .onConflictDoNothing()
    .returning();

  if (!user) {
    console.log("⚠️  User already exists, skipping seed.");
    await conn.end();
    return;
  }

  console.log(`✅ Created user: ${user.email}`);

  // Create a sample tag
  const [tutorialTag] = await db
    .insert(tags)
    .values({
      userId: user.id,
      name: "Tutorial",
      color: "#10B981",
    })
    .returning();

  console.log(`✅ Created tag: ${tutorialTag!.name}`);

  // Create a sample hook template
  const [hookTemplate] = await db
    .insert(hookTemplates)
    .values({
      userId: user.id,
      title: "Secret Reveal",
      body: "Here's something most people don't know…",
    })
    .returning();

  console.log(`✅ Created hook template: ${hookTemplate!.title}`);

  // Create the welcome script (onboarding)
  const welcomeBody = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Welcome to ScriptPad! This is your space to capture ideas, write scripts, and keep your content organized.",
          },
        ],
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [{ type: "bold" }],
            text: "Quick tips to get started:",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Use the + button in the bottom-right corner to quickly capture a new idea. Just type a title and optional notes — it takes seconds.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "In the editor, select text to see the floating toolbar for ",
          },
          {
            type: "text",
            marks: [{ type: "bold" }],
            text: "bold",
          },
          { type: "text", text: ", " },
          {
            type: "text",
            marks: [{ type: "italic" }],
            text: "italic",
          },
          { type: "text", text: ", and " },
          {
            type: "text",
            marks: [{ type: "underline" }],
            text: "underline",
          },
          { type: "text", text: " formatting." },
        ],
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Type / at the start of a line to open slash commands. Try /divider for a section break, /hook to insert a saved hook template, or /date to stamp today's date.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Move scripts through your workflow: Idea → Writing → Ready → Posted. Use folders and tags to stay organized. You've got this! 🎬",
          },
        ],
      },
    ],
  };

  const welcomePlainText =
    "Welcome to ScriptPad! This is your space to capture ideas, write scripts, and keep your content organized. Quick tips to get started: Use the + button in the bottom-right corner to quickly capture a new idea. Just type a title and optional notes — it takes seconds. In the editor, select text to see the floating toolbar for bold, italic, and underline formatting. Type / at the start of a line to open slash commands. Try /divider for a section break, /hook to insert a saved hook template, or /date to stamp today's date. Move scripts through your workflow: Idea → Writing → Ready → Posted. Use folders and tags to stay organized. You've got this! 🎬";

  const wordCount = welcomePlainText
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = welcomePlainText.length;
  const estimatedDurationSeconds = Math.round((wordCount / 150) * 60);

  const [welcomeScript] = await db
    .insert(scripts)
    .values({
      userId: user.id,
      title: "Welcome to ScriptPad",
      body: welcomeBody,
      bodyPlainText: welcomePlainText,
      status: "idea",
      wordCount,
      charCount,
      estimatedDurationSeconds,
      notes:
        "This is a sample script to help you get familiar with ScriptPad. Feel free to edit or delete it!",
    })
    .returning();

  console.log(`✅ Created welcome script: ${welcomeScript!.title}`);

  // Tag the welcome script with "Tutorial"
  await db.insert(scriptTags).values({
    scriptId: welcomeScript!.id,
    tagId: tutorialTag!.id,
  });

  console.log("✅ Tagged welcome script with 'Tutorial'");

  console.log("\n🎉 Seed complete!");
  console.log(`   Email: ${user.email}`);
  console.log("   Password: scriptpad123");

  await conn.end();
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
