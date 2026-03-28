import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
  /**
   * Register a new user with email and password.
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters"),
        name: z.string().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedEmail = input.email.trim().toLowerCase();

      // Check for existing user
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, normalizedEmail),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(input.password, 12);
      const id = crypto.randomUUID();

      await ctx.db.insert(users).values({
        id,
        email: normalizedEmail,
        name: input.name ?? null,
        hashedPassword,
      });

      return { success: true };
    }),

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
