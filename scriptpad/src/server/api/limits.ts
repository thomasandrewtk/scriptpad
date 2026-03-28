/**
 * Per-user resource limits for the free tier.
 *
 * These protect Supabase free-tier DB storage (500 MB)
 * and Vercel free-tier serverless invocations.
 */
export const USER_LIMITS = {
  /** Maximum scripts per user (including all statuses, excluding soft-deleted) */
  MAX_SCRIPTS: 50,

  /** Maximum tags per user */
  MAX_TAGS: 20,

  /** Maximum folders per user */
  MAX_FOLDERS: 10,

  /** Maximum hook templates per user */
  MAX_HOOK_TEMPLATES: 25,

  /** Maximum script body size in characters (~100 KB of JSON at worst) */
  MAX_BODY_LENGTH: 100_000,

  /** Maximum notes length per script */
  MAX_NOTES_LENGTH: 10_000,
} as const;
