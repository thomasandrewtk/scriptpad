import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
  /**
   * Get the authenticated user's preferences.
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { preferences: true },
    });

    return (user?.preferences ?? {}) as Record<string, unknown>;
  }),

  /**
   * Merge partial JSON into the user's existing preferences.
   */
  updatePreferences: protectedProcedure
    .input(z.record(z.string(), z.unknown()))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [updated] = await ctx.db
        .update(users)
        .set({
          preferences: sql`COALESCE(${users.preferences}, '{}'::jsonb) || ${JSON.stringify(input)}::jsonb`,
        })
        .where(eq(users.id, userId))
        .returning({ preferences: users.preferences });

      return (updated?.preferences ?? {}) as Record<string, unknown>;
    }),
});
