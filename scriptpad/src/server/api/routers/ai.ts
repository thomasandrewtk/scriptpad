import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

/**
 * AI router — provides LLM-powered features.
 * Currently stubs; Phase 5 implements real API calls.
 * All features are optional — the app works without AI_API_KEY configured.
 */
export const aiRouter = createTRPCRouter({
  /**
   * Punch Up — rewrite selected text to be more engaging.
   * Stub: returns a placeholder until AI is wired up in Phase 5.
   */
  punchUp: protectedProcedure
    .input(
      z.object({
        selectedText: z.string().min(1).max(2000),
        context: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Phase 5: Real LLM call here
      // For now, return a placeholder
      return {
        rewritten: `[AI Punch Up] ${input.selectedText}`,
        isPlaceholder: true,
      };
    }),

  /**
   * Score Hook — AI-powered hook analysis with suggestions.
   * Stub: returns placeholder until AI is wired up in Phase 5.
   */
  scoreHook: protectedProcedure
    .input(
      z.object({
        hookText: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ input }) => {
      // Phase 5: Real LLM call here
      return {
        score: 50,
        suggestions: [
          "AI scoring will be available when AI_API_KEY is configured",
        ],
        isPlaceholder: true,
      };
    }),
});
