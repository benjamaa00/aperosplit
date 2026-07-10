import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { timingSafeEqual } from "node:crypto";
import { ENV } from "./env";
import { parse as parseCookieHeader } from "cookie";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export function isValidGroupAccessKey(supplied: unknown): boolean {
  const expected = ENV.groupAccessPin;
  if (!expected || typeof supplied !== "string") return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function hasGroupAccess(ctx: TrpcContext): boolean {
  const headerKey = ctx.req.headers["x-app-access-key"];
  const cookies = parseCookieHeader(ctx.req.headers.cookie ?? "");
  return isValidGroupAccessKey(headerKey) || isValidGroupAccessKey(cookies.aperosplit_access);
}

export const groupProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!hasGroupAccess(ctx)) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "APEROSPLIT_ACCESS_REQUIRED" });
    }
    return next({ ctx });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
