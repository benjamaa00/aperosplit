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

function findMemberId(obj: any): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  if (typeof obj.memberId === "string" && obj.memberId) return obj.memberId;
  if (typeof obj.json?.memberId === "string" && obj.json.memberId) return obj.json.memberId;
  if (typeof obj.input?.memberId === "string" && obj.input.memberId) return obj.input.memberId;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (v && typeof v === "object") {
      const found = findMemberId(v);
      if (found) return found;
    }
  }
  return undefined;
}

export const groupAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!hasGroupAccess(ctx)) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "APEROSPLIT_ACCESS_REQUIRED" });
    }

    let rawBody: any = {};
    try {
      rawBody = ctx.req.body ? (typeof ctx.req.body === "string" ? JSON.parse(ctx.req.body) : ctx.req.body) : {};
    } catch {}
    const memberId = findMemberId(rawBody);
    if (!memberId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "memberId is required for admin check" });
    }

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    const result = await db.query(`SELECT role FROM group_members WHERE id = $1`, [memberId]);
    const member = result.rows[0];
    if (!member || member.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({ ctx });
  }),
);
