import { TRPCError } from "@trpc/server";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { hookTemplates, tags } from "~/server/db/schema";

export const hookTemplatesRouter = createTRPCRouter({
  /**
   * List all hook templates for the authenticated user, with their associated tag.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const rows = await ctx.db
      .select({
        id: hookTemplates.id,
        userId: hookTemplates.userId,
        body: hookTemplates.body,
        tagId: hookTemplates.tagId,
        createdAt: hookTemplates.createdAt,
        tagName: tags.name,
        tagColor: tags.color,
      })
      .from(hookTemplates)
      .leftJoin(tags, eq(hookTemplates.tagId, tags.id))
      .where(eq(hookTemplates.userId, userId))
      .orderBy(desc(hookTemplates.createdAt));

    return rows;
  }),

  /**
   * Create a new hook template.
   */
  create: protectedProcedure
    .input(
      z.object({
        body: z.string().min(1),
        tagId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [template] = await ctx.db
        .insert(hookTemplates)
        .values({
          userId,
          body: input.body,
          tagId: input.tagId ?? null,
        })
        .returning();

      return template!;
    }),

  /**
   * Update a hook template.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        body: z.string().min(1).optional(),
        tagId: z.string().uuid().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const updateData: Record<string, unknown> = {};
      if (input.body !== undefined) updateData.body = input.body;
      if (input.tagId !== undefined) updateData.tagId = input.tagId;

      const [updated] = await ctx.db
        .update(hookTemplates)
        .set(updateData)
        .where(
          and(
            eq(hookTemplates.id, input.id),
            eq(hookTemplates.userId, userId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Hook template not found",
        });
      }

      return updated;
    }),

  /**
   * Delete a hook template.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [deleted] = await ctx.db
        .delete(hookTemplates)
        .where(
          and(
            eq(hookTemplates.id, input.id),
            eq(hookTemplates.userId, userId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Hook template not found",
        });
      }

      return { success: true };
    }),
});
