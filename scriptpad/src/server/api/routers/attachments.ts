import { TRPCError } from "@trpc/server";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { mediaAttachments, scripts } from "~/server/db/schema";

export const attachmentsRouter = createTRPCRouter({
  /**
   * List attachments for a specific script.
   */
  listByScript: protectedProcedure
    .input(z.object({ scriptId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
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

      return ctx.db
        .select()
        .from(mediaAttachments)
        .where(eq(mediaAttachments.scriptId, input.scriptId))
        .orderBy(desc(mediaAttachments.uploadedAt));
    }),

  /**
   * Create attachment metadata (after client uploads file to Supabase Storage).
   */
  create: protectedProcedure
    .input(
      z.object({
        scriptId: z.string().uuid(),
        fileUrl: z.string().url(),
        fileName: z.string().min(1).max(500),
        fileType: z.string().min(1).max(100),
        fileSizeBytes: z.number().int().positive(),
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

      const [attachment] = await ctx.db
        .insert(mediaAttachments)
        .values({
          scriptId: input.scriptId,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSizeBytes: input.fileSizeBytes,
        })
        .returning();

      return attachment!;
    }),

  /**
   * Delete an attachment (removes metadata from DB).
   * Note: The caller should also delete the file from Supabase Storage.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get attachment and verify ownership through the script
      const attachment = await ctx.db.query.mediaAttachments.findFirst({
        where: eq(mediaAttachments.id, input.id),
      });

      if (!attachment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attachment not found",
        });
      }

      // Verify script ownership
      const script = await ctx.db.query.scripts.findFirst({
        where: and(
          eq(scripts.id, attachment.scriptId),
          eq(scripts.userId, userId),
        ),
      });

      if (!script) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attachment not found",
        });
      }

      await ctx.db
        .delete(mediaAttachments)
        .where(eq(mediaAttachments.id, input.id));

      return { success: true, fileUrl: attachment.fileUrl };
    }),
});
