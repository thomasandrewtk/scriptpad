import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { folders, scripts } from "~/server/db/schema";

export const foldersRouter = createTRPCRouter({
  /**
   * List all folders for the authenticated user, with script counts.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userFolders = await ctx.db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId))
      .orderBy(folders.sortOrder, folders.name);

    // Get script counts per folder (excluding soft-deleted)
    const folderCounts = await ctx.db
      .select({
        folderId: scripts.folderId,
        count: sql<number>`count(*)::int`,
      })
      .from(scripts)
      .where(
        and(
          eq(scripts.userId, userId),
          isNull(scripts.deletedAt),
        ),
      )
      .groupBy(scripts.folderId);

    const countMap: Record<string, number> = {};
    let uncategorizedCount = 0;

    for (const row of folderCounts) {
      if (row.folderId) {
        countMap[row.folderId] = row.count;
      } else {
        uncategorizedCount = row.count;
      }
    }

    return {
      folders: userFolders.map((folder) => ({
        ...folder,
        scriptCount: countMap[folder.id] ?? 0,
      })),
      uncategorizedCount,
    };
  }),

  /**
   * Create a new folder.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get the max sort order to append at end
      const maxOrder = await ctx.db
        .select({ max: sql<number>`coalesce(max(${folders.sortOrder}), 0)` })
        .from(folders)
        .where(eq(folders.userId, userId));

      const [folder] = await ctx.db
        .insert(folders)
        .values({
          userId,
          name: input.name,
          sortOrder: (maxOrder[0]?.max ?? 0) + 1,
        })
        .returning();

      return folder!;
    }),

  /**
   * Rename a folder.
   */
  rename: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [updated] = await ctx.db
        .update(folders)
        .set({ name: input.name })
        .where(and(eq(folders.id, input.id), eq(folders.userId, userId)))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Folder not found",
        });
      }

      return updated;
    }),

  /**
   * Delete a folder. Scripts in this folder become uncategorized (folderId = null).
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Set scripts in this folder to uncategorized
      await ctx.db
        .update(scripts)
        .set({ folderId: null })
        .where(
          and(eq(scripts.folderId, input.id), eq(scripts.userId, userId)),
        );

      // Delete the folder
      const [deleted] = await ctx.db
        .delete(folders)
        .where(and(eq(folders.id, input.id), eq(folders.userId, userId)))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Folder not found",
        });
      }

      return { success: true };
    }),
});
