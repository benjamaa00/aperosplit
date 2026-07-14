import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TrpcContext } from "../_core/context";

vi.mock("../db", () => ({
  getOrCreateGroup: vi.fn().mockResolvedValue({ id: "equilibra-fixed-group" }),
  getGroupData: vi.fn().mockResolvedValue(null),
  addMembers: vi.fn().mockResolvedValue(true),
  addExpense: vi.fn().mockResolvedValue(true),
  deleteExpense: vi.fn().mockResolvedValue(true),
  addPendingPayment: vi.fn().mockResolvedValue("pay_abc123"),
  confirmPayment: vi.fn().mockResolvedValue(true),
  refusePayment: vi.fn().mockResolvedValue(true),
  addHistoryEntry: vi.fn().mockResolvedValue(true),
  updateGroupShareUrl: vi.fn().mockResolvedValue(true),
  updateMemberBiometric: vi.fn().mockResolvedValue(true),
  createGroup: vi.fn().mockResolvedValue({ id: "grp_new" }),
  listGroupsForMember: vi.fn().mockResolvedValue([]),
  joinGroupByPin: vi.fn().mockResolvedValue({ success: true }),
  joinGroupByInvite: vi.fn().mockResolvedValue({ success: true }),
  approveMember: vi.fn().mockResolvedValue(true),
  refuseMember: vi.fn().mockResolvedValue(true),
  expelMember: vi.fn().mockResolvedValue(true),
  changeMemberRole: vi.fn().mockResolvedValue(true),
  generateInviteToken: vi.fn().mockResolvedValue({ token: "tok_123" }),
  createExpenseCategory: vi.fn().mockResolvedValue({ id: "cat_1" }),
  deleteExpenseCategory: vi.fn().mockResolvedValue(true),
  addNotification: vi.fn().mockResolvedValue(true),
  markNotificationRead: vi.fn().mockResolvedValue(true),
  markAllNotificationsRead: vi.fn().mockResolvedValue(true),
  getNotificationSettings: vi.fn().mockResolvedValue({}),
  updateNotificationSettings: vi.fn().mockResolvedValue(true),
  updateGroupSettings: vi.fn().mockResolvedValue(true),
  resendPaymentRequest: vi.fn().mockResolvedValue(true),
  cancelPaymentRequest: vi.fn().mockResolvedValue(true),
  disputePayment: vi.fn().mockResolvedValue(true),
  markAsPaid: vi.fn().mockResolvedValue(true),
  confirmReceipt: vi.fn().mockResolvedValue(true),
  reportNotReceived: vi.fn().mockResolvedValue(true),
  getGroupStats: vi.fn().mockResolvedValue({ totalExpenses: 0, totalSettlements: 0 }),
  exportExpensesCSV: vi.fn().mockResolvedValue("id,amount\n"),
  getDb: vi.fn().mockResolvedValue({ query: vi.fn().mockResolvedValue({ rows: [] }) }),
}));

vi.mock("../_core/env", () => ({
  ENV: { groupAccessPin: "test-pin-1234" },
}));

vi.mock("../../server/storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "receipts/test.jpg", url: "https://example.com/test.jpg" }),
}));

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ amount: 42.5, date: "2025-01-15", category: "Restaurant" }) } }],
  }),
}));

import { equilibraRouter } from "./equilibra";
import {
  addExpense as dbAddExpense,
  deleteExpense as dbDeleteExpense,
  addPendingPayment,
  confirmPayment as dbConfirmPayment,
  refusePayment as dbRefusePayment,
  addHistoryEntry,
  addNotification,
  resendPaymentRequest as dbResendPaymentRequest,
  markAsPaid as dbMarkAsPaid,
} from "../db";

const VALID_KEY = "test-pin-1234";

function ctx(accessKey?: string): TrpcContext {
  return {
    user: null,
    req: {
      headers: accessKey ? { "x-app-access-key": accessKey } : {},
    } as unknown as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function authed() {
  return equilibraRouter.createCaller(ctx(VALID_KEY));
}

function unauthed() {
  return equilibraRouter.createCaller(ctx());
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Access Control ───────────────────────────────────────────────────

describe("access control", () => {
  it("rejects all procedures without access key", async () => {
    const caller = unauthed();

    await expect(caller.getGroupData()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.addExpense({
        description: "Test", amount: 10, category: "Food",
        payerId: "u1", participants: ["u1"],
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.requestPayment({
        fromId: "u1", fromName: "A", toId: "u2", toName: "B", amount: 5,
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.confirmPayment({ paymentId: "pay_x", fromId: "u1", toId: "u2", amount: 5 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.refusePayment({ paymentId: "pay_x", fromId: "u1" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.deleteExpense({
        expenseId: "exp_x", description: "Test", amount: 10, authorId: "u1",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("accepts valid access key", async () => {
    const caller = authed();
    await expect(caller.getGroupData()).resolves.toBeDefined();
  });
});

// ─── addExpense ──────────────────────────────────────────────────────

describe("addExpense", () => {
  it("creates expense and history entry with correct IDs", async () => {
    const caller = authed();
    const result = await caller.addExpense({
      description: "Dinner", amount: 85.5, category: "Restaurant",
      payerId: "alice", participants: ["alice", "bob"],
    });

    expect(result.success).toBe(true);
    expect(result.expenseId).toMatch(/^exp_/);

    expect(dbAddExpense).toHaveBeenCalledOnce();
    const expenseArg = (dbAddExpense as any).mock.calls[0][0];
    expect(expenseArg).toMatchObject({
      groupId: "equilibra-fixed-group",
      description: "Dinner",
      amount: "85.5",
      category: "Restaurant",
      payerId: "alice",
      participants: ["alice", "bob"],
      status: "validated",
    });
    expect(expenseArg.id).toMatch(/^exp_/);
    expect(expenseArg.date).toBeInstanceOf(Date);

    expect(addHistoryEntry).toHaveBeenCalledOnce();
    const histArg = (addHistoryEntry as any).mock.calls[0][0];
    expect(histArg).toMatchObject({
      type: "expense_added",
      authorId: "alice",
      description: "Dinner",
      amount: "85.5",
    });
    expect(histArg.id).toMatch(/^h_/);
  });

  it("does not create history entry when DB addExpense fails", async () => {
    (dbAddExpense as any).mockResolvedValueOnce(false);
    const caller = authed();

    const result = await caller.addExpense({
      description: "Failed", amount: 10, category: "Misc",
      payerId: "u1", participants: ["u1"],
    });

    expect(result.success).toBe(false);
    expect(addHistoryEntry).not.toHaveBeenCalled();
  });

  it("rejects negative amount", async () => {
    const caller = authed();
    await expect(
      caller.addExpense({
        description: "Test", amount: -5, category: "Food",
        payerId: "u1", participants: ["u1"],
      })
    ).rejects.toThrow();
  });

  it("rejects zero amount", async () => {
    const caller = authed();
    await expect(
      caller.addExpense({
        description: "Test", amount: 0, category: "Food",
        payerId: "u1", participants: ["u1"],
      })
    ).rejects.toThrow();
  });

  it("rejects empty description", async () => {
    const caller = authed();
    await expect(
      caller.addExpense({
        description: "", amount: 10, category: "Food",
        payerId: "u1", participants: ["u1"],
      })
    ).rejects.toThrow();
  });

  it("rejects empty participants array", async () => {
    const caller = authed();
    await expect(
      caller.addExpense({
        description: "Test", amount: 10, category: "Food",
        payerId: "u1", participants: [],
      })
    ).rejects.toThrow();
  });

  it("rejects missing category", async () => {
    const caller = authed();
    await expect(
      caller.addExpense({
        description: "Test", amount: 10, category: "",
        payerId: "u1", participants: ["u1"],
      })
    ).rejects.toThrow();
  });

  it("passes optional recurring fields", async () => {
    const caller = authed();
    await caller.addExpense({
      description: "Rent", amount: 1200, category: "Housing",
      payerId: "u1", participants: ["u1", "u2"],
      isRecurring: true,
      recurrenceInterval: "monthly",
      recurrenceEndDate: "2026-12-31",
    });

    const expenseArg = (dbAddExpense as any).mock.calls[0][0];
    expect(expenseArg).toMatchObject({
      isRecurring: true,
      recurrenceInterval: "monthly",
      recurrenceEndDate: "2026-12-31",
    });
  });

  it("defaults status to validated when omitted", async () => {
    const caller = authed();
    await caller.addExpense({
      description: "Test", amount: 10, category: "Food",
      payerId: "u1", participants: ["u1"],
    });

    const expenseArg = (dbAddExpense as any).mock.calls[0][0];
    expect(expenseArg.status).toBe("validated");
  });
});

// ─── deleteExpense ───────────────────────────────────────────────────

describe("deleteExpense", () => {
  it("deletes expense and creates history entry", async () => {
    const caller = authed();
    const result = await caller.deleteExpense({
      expenseId: "exp_123", description: "Lunch", amount: 25, authorId: "bob",
    });

    expect(result.success).toBe(true);
    expect(dbDeleteExpense).toHaveBeenCalledWith("exp_123");

    expect(addHistoryEntry).toHaveBeenCalledOnce();
    const histArg = (addHistoryEntry as any).mock.calls[0][0];
    expect(histArg).toMatchObject({
      type: "expense_deleted",
      authorId: "bob",
      description: "Lunch",
      amount: "25",
    });
  });

  it("does not create history when deleteExpense fails", async () => {
    (dbDeleteExpense as any).mockResolvedValueOnce(false);
    const caller = authed();

    const result = await caller.deleteExpense({
      expenseId: "exp_bad", description: "X", amount: 10, authorId: "u1",
    });

    expect(result.success).toBe(false);
    expect(addHistoryEntry).not.toHaveBeenCalled();
  });

  it("rejects empty expenseId", async () => {
    const caller = authed();
    await expect(
      caller.deleteExpense({
        expenseId: "", description: "Test", amount: 10, authorId: "u1",
      })
    ).rejects.toThrow();
  });
});

// ─── requestPayment ──────────────────────────────────────────────────

describe("requestPayment", () => {
  it("creates payment with correct ID and sends notification", async () => {
    const caller = authed();
    const result = await caller.requestPayment({
      fromId: "alice",
      fromName: "Alice",
      toId: "bob",
      toName: "Bob",
      amount: 50,
    });

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe("pay_abc123");

    expect(addPendingPayment).toHaveBeenCalledOnce();
    const payArg = (addPendingPayment as any).mock.calls[0][0];
    expect(payArg).toMatchObject({
      groupId: "equilibra-fixed-group",
      fromId: "alice",
      fromName: "Alice",
      toId: "bob",
      toName: "Bob",
      amount: "50",
      originalAmount: "50",
      status: "pending",
    });
    expect(payArg.id).toMatch(/^pay_/);

    expect(addNotification).toHaveBeenCalledOnce();
    expect(addNotification).toHaveBeenCalledWith(
      "bob",
      "equilibra-fixed-group",
      "payment_request",
      expect.any(String),
      expect.stringContaining("50.00"),
      expect.objectContaining({ paymentId: "pay_abc123", fromId: "alice", amount: 50 })
    );
  });

  it("passes expenseId when provided", async () => {
    const caller = authed();
    await caller.requestPayment({
      fromId: "u1", fromName: "A", toId: "u2", toName: "B",
      amount: 30, expenseId: "exp_linked",
    });

    const payArg = (addPendingPayment as any).mock.calls[0][0];
    expect(payArg.expenseId).toBe("exp_linked");
  });

  it("uses originalAmount fallback to amount", async () => {
    const caller = authed();
    await caller.requestPayment({
      fromId: "u1", fromName: "A", toId: "u2", toName: "B",
      amount: 40, originalAmount: 50,
    });

    const payArg = (addPendingPayment as any).mock.calls[0][0];
    expect(payArg.originalAmount).toBe("50");
  });

  it("rejects negative amount", async () => {
    const caller = authed();
    await expect(
      caller.requestPayment({
        fromId: "u1", fromName: "A", toId: "u2", toName: "B", amount: -10,
      })
    ).rejects.toThrow();
  });

  it("rejects missing fromId", async () => {
    const caller = authed();
    await expect(
      caller.requestPayment({
        fromId: "", fromName: "A", toId: "u2", toName: "B", amount: 10,
      })
    ).rejects.toThrow();
  });

  it("rejects missing toId", async () => {
    const caller = authed();
    await expect(
      caller.requestPayment({
        fromId: "u1", fromName: "A", toId: "", toName: "B", amount: 10,
      })
    ).rejects.toThrow();
  });
});

// ─── confirmPayment ──────────────────────────────────────────────────

describe("confirmPayment", () => {
  it("confirms payment and sends notification on success", async () => {
    const caller = authed();
    const result = await caller.confirmPayment({
      paymentId: "pay_xyz", fromId: "alice", toId: "bob", amount: 25,
    });

    expect(result.success).toBe(true);
    expect(dbConfirmPayment).toHaveBeenCalledWith("pay_xyz", "alice", "bob", "25");

    expect(addNotification).toHaveBeenCalledOnce();
    expect(addNotification).toHaveBeenCalledWith(
      "alice",
      "equilibra-fixed-group",
      "payment_accepted",
      expect.any(String),
      expect.stringContaining("25.00"),
      { paymentId: "pay_xyz" }
    );
  });

  it("does not send notification when confirmation fails", async () => {
    (dbConfirmPayment as any).mockResolvedValueOnce(false);
    const caller = authed();

    const result = await caller.confirmPayment({
      paymentId: "pay_fail", fromId: "u1", toId: "u2", amount: 10,
    });

    expect(result.success).toBe(false);
    expect(addNotification).not.toHaveBeenCalled();
  });

  it("rejects non-string paymentId", async () => {
    const caller = authed();
    // z.string() accepts empty strings but rejects non-strings
    await expect(
      // @ts-expect-error testing invalid input
      caller.confirmPayment({ paymentId: 123, fromId: "u1", toId: "u2", amount: 10 })
    ).rejects.toThrow();
  });
});

// ─── refusePayment ───────────────────────────────────────────────────

describe("refusePayment", () => {
  it("refuses payment and returns success", async () => {
    const caller = authed();
    const result = await caller.refusePayment({ paymentId: "pay_ref", fromId: "u1", comment: "Too expensive" });

    expect(result.success).toBe(true);
    expect(dbRefusePayment).toHaveBeenCalledWith("pay_ref", "Too expensive");
  });

  it("returns false when DB refusePayment fails", async () => {
    (dbRefusePayment as any).mockResolvedValueOnce(false);
    const caller = authed();

    const result = await caller.refusePayment({ paymentId: "pay_bad", fromId: "u1" });
    expect(result.success).toBe(false);
  });

  it("rejects non-string paymentId", async () => {
    const caller = authed();
    await expect(
      // @ts-expect-error testing invalid input
      caller.refusePayment({ paymentId: 123, fromId: "u1" })
    ).rejects.toThrow();
  });
});

// ─── initGroup ───────────────────────────────────────────────────────

describe("initGroup", () => {
  it("creates group and adds members", async () => {
    const caller = authed();
    const result = await caller.initGroup({
      members: [{ id: "u1", name: "Alice", avatar: "😎" }],
    });

    expect(result.success).toBe(true);
  });
});

// ─── cancelPaymentRequest ────────────────────────────────────────────

describe("cancelPaymentRequest", () => {
  it("cancels payment", async () => {
    const caller = authed();
    const result = await caller.cancelPaymentRequest({ paymentId: "pay_cancel" });
    expect(result.success).toBe(true);
  });

  it("rejects non-string paymentId", async () => {
    const caller = authed();
    await expect(
      // @ts-expect-error testing invalid input
      caller.cancelPaymentRequest({ paymentId: 123 })
    ).rejects.toThrow();
  });
});

// ─── markAsPaid ──────────────────────────────────────────────────────

describe("markAsPaid", () => {
  it("marks payment as paid and notifies creditor", async () => {
    const caller = authed();
    const result = await caller.markAsPaid({ paymentId: "pay_paid", fromId: "u1" });
    expect(result.success).toBe(true);
    expect(addNotification).toHaveBeenCalledWith(
      "u1",
      "equilibra-fixed-group",
      "payment_marked_paid",
      expect.any(String),
      expect.any(String),
      { paymentId: "pay_paid" }
    );
  });
});

// ─── resendPaymentRequest ────────────────────────────────────────────

describe("resendPaymentRequest", () => {
  it("resends and notifies debtor", async () => {
    const caller = authed();
    const result = await caller.resendPaymentRequest({ paymentId: "pay_resend", toId: "u2", amount: 25 });
    expect(result.success).toBe(true);
    expect(dbResendPaymentRequest).toHaveBeenCalledWith("pay_resend");
    expect(addNotification).toHaveBeenCalledWith(
      "u2",
      "equilibra-fixed-group",
      "payment_reminder",
      expect.any(String),
      expect.stringContaining("25.00"),
      { paymentId: "pay_resend" }
    );
  });
});

// ─── confirmReceipt ──────────────────────────────────────────────────

describe("confirmReceipt", () => {
  it("confirms receipt", async () => {
    const caller = authed();
    const result = await caller.confirmReceipt({ paymentId: "pay_rcpt", toId: "u2" });
    expect(result.success).toBe(true);
  });
});

// ─── disputePayment / reportNotReceived ──────────────────────────────

describe("disputePayment", () => {
  it("disputes with note", async () => {
    const caller = authed();
    const result = await caller.disputePayment({ paymentId: "pay_d", note: "Wrong amount" });
    expect(result.success).toBe(true);
  });

  it("rejects empty note", async () => {
    const caller = authed();
    await expect(
      caller.disputePayment({ paymentId: "pay_d", note: "" })
    ).rejects.toThrow();
  });
});

describe("reportNotReceived", () => {
  it("reports with note", async () => {
    const caller = authed();
    const result = await caller.reportNotReceived({ paymentId: "pay_r", note: "Never got it", toId: "u2" });
    expect(result.success).toBe(true);
  });
});

// ─── createCategory / deleteCategory ─────────────────────────────────

describe("createCategory", () => {
  it("creates category with name and emoji", async () => {
    const caller = authed();
    const result = await caller.createCategory({ name: "Food", emoji: "🍔" });
    expect(result.success).toBe(true);
    expect(result.category).toEqual({ id: "cat_1" });
  });
});

describe("deleteCategory", () => {
  it("deletes by ID", async () => {
    const caller = authed();
    const result = await caller.deleteCategory({ categoryId: "cat_del" });
    expect(result.success).toBe(true);
  });
});

// ─── markAllNotificationsRead ────────────────────────────────────────

describe("markAllNotificationsRead", () => {
  it("marks all notifications read for member", async () => {
    const caller = authed();
    const result = await caller.markAllNotificationsRead({ memberId: "u1" });
    expect(result.success).toBe(true);
  });
});
