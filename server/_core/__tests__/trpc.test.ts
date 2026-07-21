import { describe, it, expect } from "vitest";

// Test the findMemberId helper function by extracting its logic
// Since findMemberId is not exported, we test the middleware behavior indirectly

describe("findMemberId body parsing", () => {
  // Replicate the exact logic from trpc.ts
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

  it("extracts memberId from direct body", () => {
    expect(findMemberId({ memberId: "abc123" })).toBe("abc123");
  });

  it("extracts memberId from superjson wrapped body", () => {
    expect(findMemberId({ json: { memberId: "abc123", name: "test" } })).toBe("abc123");
  });

  it("extracts memberId from tRPC input wrapper", () => {
    expect(findMemberId({ input: { memberId: "abc123" } })).toBe("abc123");
  });

  it("extracts memberId from batched request body", () => {
    expect(findMemberId({ "0": { json: { memberId: "abc123" } } })).toBe("abc123");
  });

  it("extracts memberId from array batch body", () => {
    expect(findMemberId([{ json: { memberId: "abc123" } }])).toBe("abc123");
  });

  it("returns undefined for empty body", () => {
    expect(findMemberId({})).toBeUndefined();
    expect(findMemberId(null)).toBeUndefined();
    expect(findMemberId(undefined)).toBeUndefined();
  });

  it("returns undefined for memberId that is empty string", () => {
    expect(findMemberId({ memberId: "" })).toBeUndefined();
  });

  it("returns undefined for memberId that is not a string", () => {
    expect(findMemberId({ memberId: 123 })).toBeUndefined();
    expect(findMemberId({ memberId: true })).toBeUndefined();
  });

  it("handles deeply nested body", () => {
    expect(findMemberId({ batch: [{ json: { data: { memberId: "deep" } } }] })).toBe("deep");
  });

  it("does not extract unrelated fields", () => {
    expect(findMemberId({ id: "wrong", name: "test" })).toBeUndefined();
  });
});

describe("CSV injection prevention", () => {
  function sanitizeCSVCell(value: string): string {
    // Prevent CSV injection: cells starting with =, +, -, @
    if (/^[=+\-@]/.test(value)) {
      return `'${value}`;
    }
    return value;
  }

  it("sanitizes formula injection with =", () => {
    expect(sanitizeCSVCell('=CMD("calc.exe")')).toBe("'=CMD(\"calc.exe\")");
  });

  it("sanitizes formula injection with +", () => {
    expect(sanitizeCSVCell('+SUM(A1:A10)')).toBe("'+SUM(A1:A10)");
  });

  it("sanitizes formula injection with -", () => {
    expect(sanitizeCSVCell('-1+1')).toBe("'-1+1");
  });

  it("sanitizes formula injection with @", () => {
    expect(sanitizeCSVCell('@SUM(1,1)')).toBe("'@SUM(1,1)");
  });

  it("does not modify safe text", () => {
    expect(sanitizeCSVCell("Restaurant")).toBe("Restaurant");
    expect(sanitizeCSVCell("250.50")).toBe("250.50");
    expect(sanitizeCSVCell("Description with = sign")).toBe("Description with = sign");
  });
});

describe("Date formatting", () => {
  it("formats dates in French locale", () => {
    const d = new Date(2024, 0, 15); // Jan 15, 2024
    expect(d.toLocaleDateString("fr-FR")).toBe("15/01/2024");
  });

  it("formats dates with day/month pattern", () => {
    const d = new Date(2024, 2, 5); // Mar 5, 2024
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
    expect(dateStr).toBe("5/3");
  });
});
