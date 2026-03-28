import { TRPCError } from "@trpc/server";
import { and, desc, eq, asc, isNull, ilike, or, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  scripts,
  scriptTags,
  tags,
  folders,
} from "~/server/db/schema";
import { USER_LIMITS } from "~/server/api/limits";

const scriptStatusSchema = z.enum(["idea", "writing", "ready", "posted"]);

export const scriptsRouter = createTRPCRouter({
  /**
   * List scripts with filtering, sorting, and search.
   * Always filters by authenticated user and excludes soft-deleted scripts.
   */
  list: protectedProcedure
    .input(
      z.object({
        status: scriptStatusSchema.optional(),
        folderId: z.string().uuid().optional(),
        tagId: z.string().uuid().optional(),
        search: z.string().optional(),
        sortBy: z
          .enum(["createdAt", "updatedAt", "postDate"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Build where conditions
      const conditions = [
        eq(scripts.userId, userId),
        isNull(scripts.deletedAt),
      ];

      if (input.status) {
        conditions.push(eq(scripts.status, input.status));
      }

      if (input.folderId) {
        conditions.push(eq(scripts.folderId, input.folderId));
      }

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(scripts.title, searchTerm),
            ilike(scripts.bodyPlainText, searchTerm),
          )!,
        );
      }

      // If filtering by tag, get script IDs that have the tag first
      let tagFilterScriptIds: string[] | undefined;
      if (input.tagId) {
        const taggedScripts = await ctx.db
          .select({ scriptId: scriptTags.scriptId })
          .from(scriptTags)
          .where(eq(scriptTags.tagId, input.tagId));

        tagFilterScriptIds = taggedScripts.map((ts) => ts.scriptId);

        if (tagFilterScriptIds.length === 0) {
          return [];
        }

        conditions.push(inArray(scripts.id, tagFilterScriptIds));
      }

      // Build sort
      const sortColumn =
        input.sortBy === "updatedAt"
          ? scripts.updatedAt
          : input.sortBy === "postDate"
            ? scripts.postDate
            : scripts.createdAt;

      const orderBy =
        input.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      const results = await ctx.db
        .select()
        .from(scripts)
        .where(and(...conditions))
        .orderBy(orderBy);

      // Fetch tags for all returned scripts
      const scriptIds = results.map((s) => s.id);
      let scriptTagsMap: Record<
        string,
        { id: string; name: string; color: string }[]
      > = {};

      if (scriptIds.length > 0) {
        const allTags = await ctx.db
          .select({
            scriptId: scriptTags.scriptId,
            tagId: tags.id,
            tagName: tags.name,
            tagColor: tags.color,
          })
          .from(scriptTags)
          .innerJoin(tags, eq(scriptTags.tagId, tags.id))
          .where(inArray(scriptTags.scriptId, scriptIds));

        for (const row of allTags) {
          if (!scriptTagsMap[row.scriptId]) {
            scriptTagsMap[row.scriptId] = [];
          }
          scriptTagsMap[row.scriptId]!.push({
            id: row.tagId,
            name: row.tagName,
            color: row.tagColor,
          });
        }
      }

      // Fetch folder names
      const folderIds = [
        ...new Set(results.map((s) => s.folderId).filter(Boolean)),
      ] as string[];
      let foldersMap: Record<string, string> = {};

      if (folderIds.length > 0) {
        const folderRows = await ctx.db
          .select({ id: folders.id, name: folders.name })
          .from(folders)
          .where(inArray(folders.id, folderIds));

        for (const f of folderRows) {
          foldersMap[f.id] = f.name;
        }
      }

      return results.map((script) => ({
        ...script,
        tags: scriptTagsMap[script.id] ?? [],
        folderName: script.folderId
          ? (foldersMap[script.folderId] ?? null)
          : null,
      }));
    }),

  /**
   * Get a single script by ID with full details (tags, folder, attachments).
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const script = await ctx.db.query.scripts.findFirst({
        where: and(
          eq(scripts.id, input.id),
          eq(scripts.userId, userId),
          isNull(scripts.deletedAt),
        ),
      });

      if (!script) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Script not found",
        });
      }

      // Get tags
      const scriptTagRows = await ctx.db
        .select({
          tagId: tags.id,
          tagName: tags.name,
          tagColor: tags.color,
        })
        .from(scriptTags)
        .innerJoin(tags, eq(scriptTags.tagId, tags.id))
        .where(eq(scriptTags.scriptId, script.id));

      // Get folder
      let folder: { id: string; name: string } | null = null;
      if (script.folderId) {
        const folderRow = await ctx.db.query.folders.findFirst({
          where: eq(folders.id, script.folderId),
        });
        if (folderRow) {
          folder = { id: folderRow.id, name: folderRow.name };
        }
      }

      return {
        ...script,
        tags: scriptTagRows.map((t) => ({
          id: t.tagId,
          name: t.tagName,
          color: t.tagColor,
        })),
        folder,
      };
    }),

  /**
   * Create a new script (Quick Capture).
   * Minimum: title. Sets status to "idea".
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        notes: z.string().optional(),
        status: scriptStatusSchema.default("idea"),
        folderId: z.string().uuid().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Enforce per-user script limit
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(scripts)
        .where(and(eq(scripts.userId, userId), isNull(scripts.deletedAt)));

      if ((countResult?.count ?? 0) >= USER_LIMITS.MAX_SCRIPTS) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You've reached the limit of ${USER_LIMITS.MAX_SCRIPTS} scripts. Delete some scripts to create new ones.`,
        });
      }

      const [script] = await ctx.db
        .insert(scripts)
        .values({
          userId,
          title: input.title,
          notes: input.notes ?? null,
          status: input.status,
          folderId: input.folderId ?? null,
        })
        .returning();

      return script!;
    }),

  /**
   * Update a script (auto-save, metadata changes, etc.).
   * Recomputes word count, char count, and duration on body changes.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        body: z.any().optional(),
        bodyPlainText: z.string().optional(),
        status: scriptStatusSchema.optional(),
        postDate: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        folderId: z.string().uuid().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership
      const existing = await ctx.db.query.scripts.findFirst({
        where: and(
          eq(scripts.id, input.id),
          eq(scripts.userId, userId),
          isNull(scripts.deletedAt),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Script not found",
        });
      }

      // Enforce body size limit
      if (input.bodyPlainText !== undefined && input.bodyPlainText.length > USER_LIMITS.MAX_BODY_LENGTH) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: `Script body exceeds the maximum of ${USER_LIMITS.MAX_BODY_LENGTH.toLocaleString()} characters.`,
        });
      }

      if (input.notes !== undefined && input.notes !== null && input.notes.length > USER_LIMITS.MAX_NOTES_LENGTH) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: `Notes exceed the maximum of ${USER_LIMITS.MAX_NOTES_LENGTH.toLocaleString()} characters.`,
        });
      }

      // Build update object
      const updateData: Record<string, unknown> = {};

      if (input.title !== undefined) updateData.title = input.title;
      if (input.body !== undefined) updateData.body = input.body;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.folderId !== undefined) updateData.folderId = input.folderId;

      if (input.postDate !== undefined) {
        updateData.postDate = input.postDate
          ? new Date(input.postDate)
          : null;
      }

      // If body plain text was provided, compute stats
      if (input.bodyPlainText !== undefined) {
        updateData.bodyPlainText = input.bodyPlainText;
        const words = input.bodyPlainText
          .split(/\s+/)
          .filter((w) => w.length > 0);
        updateData.wordCount = words.length;
        updateData.charCount = input.bodyPlainText.length;
        updateData.estimatedDurationSeconds = Math.round(
          (words.length / 150) * 60,
        );
      }

      const [updated] = await ctx.db
        .update(scripts)
        .set(updateData)
        .where(and(eq(scripts.id, input.id), eq(scripts.userId, userId)))
        .returning();

      return updated!;
    }),

  /**
   * Update script status (dedicated endpoint for quick status changes).
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: scriptStatusSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [updated] = await ctx.db
        .update(scripts)
        .set({ status: input.status })
        .where(
          and(
            eq(scripts.id, input.id),
            eq(scripts.userId, userId),
            isNull(scripts.deletedAt),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Script not found",
        });
      }

      return updated;
    }),

  /**
   * Duplicate a script.
   * Copies title, body, tags, folder, notes. Resets status to "idea", clears post date.
   * Attachments are NOT duplicated.
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Enforce per-user script limit
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(scripts)
        .where(and(eq(scripts.userId, userId), isNull(scripts.deletedAt)));

      if ((countResult?.count ?? 0) >= USER_LIMITS.MAX_SCRIPTS) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You've reached the limit of ${USER_LIMITS.MAX_SCRIPTS} scripts. Delete some scripts to create new ones.`,
        });
      }

      const original = await ctx.db.query.scripts.findFirst({
        where: and(
          eq(scripts.id, input.id),
          eq(scripts.userId, userId),
          isNull(scripts.deletedAt),
        ),
      });

      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Script not found",
        });
      }

      // Create the duplicate
      const [duplicate] = await ctx.db
        .insert(scripts)
        .values({
          userId,
          title: `Copy of ${original.title}`,
          body: original.body,
          bodyPlainText: original.bodyPlainText,
          status: "idea",
          postDate: null,
          notes: original.notes,
          wordCount: original.wordCount,
          charCount: original.charCount,
          estimatedDurationSeconds: original.estimatedDurationSeconds,
          folderId: original.folderId,
        })
        .returning();

      // Copy tags
      const originalTags = await ctx.db
        .select()
        .from(scriptTags)
        .where(eq(scriptTags.scriptId, original.id));

      if (originalTags.length > 0) {
        await ctx.db.insert(scriptTags).values(
          originalTags.map((t) => ({
            scriptId: duplicate!.id,
            tagId: t.tagId,
          })),
        );
      }

      return duplicate!;
    }),

  /**
   * Soft delete a script.
   */
  softDelete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [deleted] = await ctx.db
        .update(scripts)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(scripts.id, input.id),
            eq(scripts.userId, userId),
            isNull(scripts.deletedAt),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Script not found",
        });
      }

      return { success: true };
    }),

  /**
   * Get counts per status for the dashboard tabs.
   */
  statusCounts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const results = await ctx.db
      .select({
        status: scripts.status,
        count: sql<number>`count(*)::int`,
      })
      .from(scripts)
      .where(and(eq(scripts.userId, userId), isNull(scripts.deletedAt)))
      .groupBy(scripts.status);

    const counts: Record<string, number> = {
      idea: 0,
      writing: 0,
      ready: 0,
      posted: 0,
    };

    for (const row of results) {
      counts[row.status] = row.count;
    }

    return {
      ...counts,
      all: Object.values(counts).reduce((a, b) => a + b, 0),
    };
  }),
});
