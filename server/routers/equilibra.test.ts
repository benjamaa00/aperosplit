import { describe, expect, it } from "vitest";
import type { TrpcContext } from "../_core/context";
import { hasGroupAccess } from "../_core/trpc";
import { equilibraRouter } from "./equilibra";

function context(accessKey?: string): TrpcContext {
  return {
    user: null,
    req: { headers: accessKey ? { "x-app-access-key": accessKey } : {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AperoSplit group access", () => {
  it("rejects protected operations without the shared access key", async () => {
    const caller = equilibraRouter.createCaller(context());
    await expect(caller.getGroupData()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "APEROSPLIT_ACCESS_REQUIRED",
    });
  });

  it("uses a timing-safe exact comparison for the access key", () => {
    expect(hasGroupAccess(context("wrong"))).toBe(false);
    expect(hasGroupAccess(context(process.env.GROUP_ACCESS_PIN))).toBe(true);
  });
});
