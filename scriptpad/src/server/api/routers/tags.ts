import { TRPCError } from "@trpc/server";
import { and, eq, sql, inArray, isNull } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tags, scriptTags, scripts } from "~/server/db/schema";
import { USER_LIMITS } from "~/server/api/limits";

export const tagsRouter = createTRPCRouter({
  /**
   * List all tags for the authenticated user, with script counts.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userTags = await ctx.db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(tags.name);

    if (userTags.length === 0) return [];

    // Get script counts per tag (excluding soft-deleted scripts)
    const tagIds = userTags.map((t) => t.id);
    const counts = await ctx.db
      .select({
        tagId: scriptTags.tagId,
        count: sql<number>`count(*)::int`,
      })
      .from(scriptTags)
      .innerJoin(scripts, eq(scriptTags.scriptId, scripts.id))
      .where(
        and(
          inArray(scriptTags.tagId, tagIds),
          isNull(scripts.deletedAt),
        ),
      )
      .groupBy(scriptTags.tagId);

    const countMap: Record<string, number> = {};
    for (const c of counts) {
      countMap[c.tagId] = c.count;
    }

    return userTags.map((tag) => ({
      ...tag,
      scriptCount: countMap[tag.id] ?? 0,
    }));
  }),

  /**
   * Create a new tag.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .default("#3B82F6"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Enforce per-user tag limit
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(tags)
        .where(eq(tags.userId, userId));

      if ((countResult?.count ?? 0) >= USER_LIMITS.MAX_TAGS) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You've reached the limit of ${USER_LIMITS.MAX_TAGS} tags. Delete some tags to create new ones.`,
        });
      }

      // Check for duplicate name
      const existing = await ctx.db.query.tags.findFirst({
        where: and(eq(tags.userId, userId), eq(tags.name, input.name)),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A tag with this name already exists",
        });
      }

      const [tag] = await ctx.db
        .insert(tags)
        .values({
          userId,
          name: input.name,
          color: input.color,
        })
        .returning();

      return tag!;
    }),

  /**
   * Update a tag (name and/or color).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.color !== undefined) updateData.color = input.color;

      const [updated] = await ctx.db
        .update(tags)
        .set(updateData)
        .where(and(eq(tags.id, input.id), eq(tags.userId, userId)))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found",
        });
      }

      return updated;
    }),

  /**
   * Delete a tag. Cascade removes script_tags associations.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [deleted] = await ctx.db
        .delete(tags)
        .where(and(eq(tags.id, input.id), eq(tags.userId, userId)))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found",
        });
      }

      return { success: true };
    }),

  /**
   * Add a tag to a script.
   */
  addToScript: protectedProcedure
    .input(
      z.object({
        scriptId: z.string().uuid(),
        tagId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify ownership of both script and tag
      const [script, tag] = await Promise.all([
        ctx.db.query.scripts.findFirst({
          where: and(
            eq(scripts.id, input.scriptId),
            eq(scripts.userId, userId),
          ),
        }),
        ctx.db.query.tags.findFirst({
          where: and(eq(tags.id, input.tagId), eq(tags.userId, userId)),
        }),
      ]);

      if (!script || !tag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Script or tag not found",
        });
      }

      await ctx.db
        .insert(scriptTags)
        .values({
          scriptId: input.scriptId,
          tagId: input.tagId,
        })
        .onConflictDoNothing();

      return { success: true };
    }),

  /**
   * Remove a tag from a script.
   */
  removeFromScript: protectedProcedure
    .input(
      z.object({
        scriptId: z.string().uuid(),
        tagId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify script ownership
      const script = await ctx.db.query.scripts.findFirst({
        where: and(
          eq(scripts.id, input.scriptId),
          eq(scripts.userId, userId),
        ),
      });

      if (!script) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Script not found",
        });
      }

      await ctx.db
        .delete(scriptTags)
        .where(
          and(
            eq(scriptTags.scriptId, input.scriptId),
            eq(scriptTags.tagId, input.tagId),
          ),
        );

      return { success: true };
    }),
});
