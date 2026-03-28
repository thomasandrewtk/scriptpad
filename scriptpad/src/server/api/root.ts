import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { scriptsRouter } from "./routers/scripts";
import { tagsRouter } from "./routers/tags";
import { foldersRouter } from "./routers/folders";
import { hookTemplatesRouter } from "./routers/hookTemplates";
import { userRouter } from "./routers/user";
import { aiRouter } from "./routers/ai";

/**
 * Primary router for the ScriptPad tRPC API.
 */
export const appRouter = createTRPCRouter({
  scripts: scriptsRouter,
  tags: tagsRouter,
  folders: foldersRouter,
  hookTemplates: hookTemplatesRouter,
  user: userRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
