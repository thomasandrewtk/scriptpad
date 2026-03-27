import { TRPCError } from "@trpc/server";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { hookTemplates } from "~/server/db/schema";

export const hookTemplatesRouter = createTRPCRouter({
  /**
   * List all hook templates for the authenticated user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    return ctx.db
      .select()
      .from(hookTemplates)
      .where(eq(hookTemplates.userId, userId))
      .orderBy(desc(hookTemplates.createdAt));
  }),

  /**
   * Create a new hook template.
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().max(255).optional(),
        body: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [template] = await ctx.db
        .insert(hookTemplates)
        .values({
          userId,
          title: input.title ?? null,
          body: input.body,
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
        title: z.string().max(255).optional(),
        body: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.body !== undefined) updateData.body = input.body;

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
