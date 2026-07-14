import { z } from "zod";
import { groupProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";
import { randomUUID } from "node:crypto";
import {
  getOrCreateGroup,
  getGroupData,
  addMembers,
  addExpense,
  deleteExpense,
  addPendingPayment,
  confirmPayment,
  refusePayment,
  addHistoryEntry,
  updateGroupShareUrl,
  updateMemberBiometric,
  createGroup,
  listGroupsForMember,
  joinGroupByPin,
  joinGroupByInvite,
  approveMember,
  refuseMember,
  expelMember,
  changeMemberRole,
  generateInviteToken,
  createExpenseCategory,
  deleteExpenseCategory,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationSettings,
  updateNotificationSettings,
  updateGroupSettings,
  resendPaymentRequest,
  cancelPaymentRequest,
  disputePayment,
  markAsPaid,
  confirmReceipt,
  reportNotReceived,
  getGroupStats,
  exportExpensesCSV,
  leaveGroup,
} from "../db";

const GROUP_ID = "equilibra-fixed-group";

export const equilibraRouter = router({
  initGroup: groupProcedure
    .input(
      z.object({
        members: z.array(
          z.object({
            id: z.string().min(1).max(128),
            name: z.string().trim().min(1).max(80),
            avatar: z.string().min(1).max(50000),
            role: z.enum(["admin", "member"]).optional(),
            status: z.enum(["active", "pending"]).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const group = await getOrCreateGroup(GROUP_ID);
      if (!group) return { success: false };
      const success = await addMembers(GROUP_ID, input.members);
      return { success };
    }),

  getGroupData: groupProcedure.query(async () => {
    const data = await getGroupData(GROUP_ID);
    if (!data) return null;
    let membersData: Array<{ id: string; name: string; avatar: string; role?: string; status?: string }> = [];
    if (data.group?.shareUrl) {
      try { membersData = JSON.parse(data.group.shareUrl); } catch { /* ignore */ }
    }
    return {
      members: data.members || membersData,
      expenses: data.expenses.map((e: any) => ({
        ...e,
        amount: parseFloat(e.amount as unknown as string),
      })),
      settlements: data.settlements ? data.settlements.map((s: any) => ({
        ...s,
        amount: parseFloat(s.amount as unknown as string),
      })) : [],
      pending: data.pending.map((p: any) => ({
        ...p,
        amount: parseFloat(p.amount as unknown as string),
        originalAmount: p.originalAmount ? parseFloat(p.originalAmount as unknown as string) : undefined,
      })),
      history: data.history.map((h: any) => ({
        ...h,
        amount: h.amount ? parseFloat(h.amount as unknown as string) : null,
      })),
      shareUrl: data.group?.shareUrl || "",
      pinCode: data.group?.pinCode || null,
      requireApproval: data.group?.requireApproval || false,
      categories: data.categories || [],
      notifications: data.notifications || [],
    };
  }),

  addExpense: groupProcedure
    .input(
      z.object({
        description: z.string().trim().min(1).max(255),
        amount: z.number().positive().max(1_000_000),
        category: z.string().trim().min(1).max(64),
        payerId: z.string().min(1).max(128),
        participants: z.array(z.string().min(1).max(128)).min(1).max(20),
        photoUrl: z.string().max(2048).optional(),
        status: z.enum(["pending", "validated", "refused"]).optional(),
        isRecurring: z.boolean().optional(),
        recurrenceInterval: z.enum(["weekly", "monthly", "yearly"]).optional(),
        recurrenceEndDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const expenseId = `exp_${randomUUID()}`;
      const success = await addExpense({
        id: expenseId,
        groupId: GROUP_ID,
        description: input.description,
        amount: input.amount.toString(),
        category: input.category,
        payerId: input.payerId,
        participants: input.participants,
        photoUrl: input.photoUrl || null,
        status: input.status || "validated",
        isRecurring: input.isRecurring || false,
        recurrenceInterval: input.recurrenceInterval || null,
        recurrenceEndDate: input.recurrenceEndDate || null,
        validatedBy: null,
        date: new Date(),
      });
      if (success) {
        await addHistoryEntry({
          id: `h_${randomUUID()}`,
          groupId: GROUP_ID,
          type: "expense_added",
          authorId: input.payerId,
          description: input.description,
          amount: input.amount.toString(),
          date: new Date(),
        });
      }
      return { success, expenseId };
    }),

  deleteExpense: groupProcedure
    .input(
      z.object({
        expenseId: z.string().min(1).max(128),
        description: z.string().trim().min(1).max(255),
        amount: z.number().positive().max(1_000_000),
        authorId: z.string().min(1).max(128),
      })
    )
    .mutation(async ({ input }) => {
      const success = await deleteExpense(input.expenseId);
      if (success) {
        await addHistoryEntry({
          id: `h_${randomUUID()}`,
          groupId: GROUP_ID,
          type: "expense_deleted",
          authorId: input.authorId,
          description: input.description,
          amount: input.amount.toString(),
          date: new Date(),
        });
      }
      return { success };
    }),

  requestPayment: groupProcedure
    .input(
      z.object({
        fromId: z.string().min(1).max(128),
        fromName: z.string().trim().min(1).max(80),
        toId: z.string().min(1).max(128),
        toName: z.string().trim().min(1).max(80),
        amount: z.number().positive().max(1_000_000),
        originalAmount: z.number().positive().max(1_000_000).optional(),
        expenseId: z.string().optional(),
        isGroupRequest: z.boolean().optional(),
        groupId: z.string().optional(),
        requestNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const paymentId = `pay_${randomUUID()}`;
      const storedPaymentId = await addPendingPayment({
        id: paymentId,
        groupId: GROUP_ID,
        fromId: input.fromId,
        fromName: input.fromName,
        toId: input.toId,
        toName: input.toName,
        amount: input.amount.toString(),
        originalAmount: input.originalAmount?.toString() || input.amount.toString(),
        status: "pending",
        expenseId: input.expenseId,
        date: new Date(),
        attemptCount: "1",
        isGroupRequest: input.isGroupRequest ? "true" : "false",
        requestGroupId: input.groupId || null,
        requestNote: input.requestNote || null,
      });
      await addNotification(input.toId, GROUP_ID, "payment_request",
        "Nouvelle demande de remboursement",
        `${input.fromName} vous demande ${input.amount.toFixed(2)} €`,
        { paymentId: storedPaymentId, fromId: input.fromId, amount: input.amount }
      );
      return { success: true, paymentId: storedPaymentId };
    }),

  confirmPayment: groupProcedure
    .input(z.object({ paymentId: z.string(), fromId: z.string(), toId: z.string(), amount: z.number() }))
    .mutation(async ({ input }) => {
      const success = await confirmPayment(input.paymentId, input.fromId, input.toId, input.amount.toString());
      if (success) {
        await addNotification(input.fromId, GROUP_ID, "payment_accepted",
          "Demande acceptée",
          `Votre demande de ${input.amount.toFixed(2)} € a été acceptée`,
          { paymentId: input.paymentId }
        );
      }
      return { success };
    }),

  refusePayment: groupProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await refusePayment(input.paymentId);
      return { success };
    }),

  cancelPaymentRequest: groupProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await cancelPaymentRequest(input.paymentId);
      return { success };
    }),

  resendPaymentRequest: groupProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await resendPaymentRequest(input.paymentId);
      return { success };
    }),

  markAsPaid: groupProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await markAsPaid(input.paymentId);
      return { success };
    }),

  confirmReceipt: groupProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await confirmReceipt(input.paymentId);
      return { success };
    }),

  reportNotReceived: groupProcedure
    .input(z.object({ paymentId: z.string(), note: z.string().min(1).max(500) }))
    .mutation(async ({ input }) => {
      const success = await reportNotReceived(input.paymentId, input.note);
      return { success };
    }),

  disputePayment: groupProcedure
    .input(z.object({ paymentId: z.string(), note: z.string().min(1).max(500) }))
    .mutation(async ({ input }) => {
      const success = await disputePayment(input.paymentId, input.note);
      return { success };
    }),

  updateShareUrl: groupProcedure
    .input(z.object({ shareUrl: z.string() }))
    .mutation(async ({ input }) => {
      const success = await updateGroupShareUrl(GROUP_ID, input.shareUrl);
      return { success };
    }),

  updateMemberBiometric: groupProcedure
    .input(z.object({ memberId: z.string(), credentialId: z.string().optional(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const success = await updateMemberBiometric(input.memberId, input.enabled);
      return { success };
    }),

  uploadReceiptPhoto: groupProcedure
    .input(
      z.object({
        fileData: z.string().min(1).max(7_000_000),
        fileName: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9._-]+$/),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = Buffer.from(input.fileData, "base64");
        const { key, url } = await storagePut(
          `receipts/${Date.now()}_${input.fileName}`,
          buffer,
          "image/jpeg"
        );
        return { success: true, url, key };
      } catch (error) {
        console.error("[Upload] Receipt photo upload failed:", error);
        return { success: false, error: "Upload failed" };
      }
    }),

  analyzeReceiptPhoto: groupProcedure
    .input(z.object({ imageUrl: z.string().min(1).max(2048) }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert at extracting information from receipts. Extract the amount, date, and category from the receipt image. Return a JSON object with fields: amount (number), date (YYYY-MM-DD), category (string). If you cannot extract a field, set it to null.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Please analyze this receipt and extract the total amount, date, and category." },
                { type: "image_url", image_url: { url: input.imageUrl, detail: "high" } },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "receipt_info",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  amount: { type: ["number", "null"], description: "The total amount from the receipt" },
                  date: { type: ["string", "null"], description: "The date in YYYY-MM-DD format" },
                  category: { type: ["string", "null"], description: "The category of the expense" },
                },
                required: ["amount", "date", "category"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          return { success: false, error: "No response from AI" };
        }
        const extracted = JSON.parse(content);
        return { success: true, amount: extracted.amount, date: extracted.date, category: extracted.category };
      } catch (error) {
        console.error("[AI] Receipt analysis failed:", error);
        return { success: false, error: "Analysis failed" };
      }
    }),

  createGroup: groupProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(100),
        pinCode: z.string().min(4).max(32).optional(),
        requireApproval: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const groupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const group = await createGroup(groupId, input.name, input.pinCode, input.requireApproval);
      return { success: true, group };
    }),

  joinGroupByPin: groupProcedure
    .input(
      z.object({
        groupId: z.string().min(1).max(128),
        pinCode: z.string().min(1).max(32),
        memberId: z.string().min(1).max(128),
        memberName: z.string().trim().min(1).max(80),
        memberAvatar: z.string().min(1).max(50000),
      })
    )
    .mutation(async ({ input }) => {
      const result = await joinGroupByPin(input.groupId, input.pinCode, {
        id: input.memberId, name: input.memberName, avatar: input.memberAvatar,
      });
      return result;
    }),

  joinGroupByInvite: groupProcedure
    .input(
      z.object({
        token: z.string().min(1).max(128),
        memberId: z.string().min(1).max(128),
        memberName: z.string().trim().min(1).max(80),
        memberAvatar: z.string().min(1).max(50000),
      })
    )
    .mutation(async ({ input }) => {
      const result = await joinGroupByInvite(input.token, {
        id: input.memberId, name: input.memberName, avatar: input.memberAvatar,
      });
      return result;
    }),

  generateInvite: groupProcedure
    .input(
      z.object({
        expiresHours: z.number().min(1).max(720).optional(),
        maxUses: z.number().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const expiresAt = input.expiresHours ? new Date(Date.now() + input.expiresHours * 3600_000) : undefined;
      const result = await generateInviteToken(GROUP_ID, expiresAt, input.maxUses);
      return result;
    }),

  approveMember: groupProcedure
    .input(z.object({ memberId: z.string(), approvedBy: z.string() }))
    .mutation(async ({ input }) => {
      const success = await approveMember(input.memberId, input.approvedBy);
      return { success };
    }),

  refuseMember: groupProcedure
    .input(z.object({ memberId: z.string(), refusedBy: z.string() }))
    .mutation(async ({ input }) => {
      const success = await refuseMember(input.memberId, input.refusedBy);
      return { success };
    }),

  expelMember: groupProcedure
    .input(z.object({ memberId: z.string(), expelledBy: z.string() }))
    .mutation(async ({ input }) => {
      const success = await expelMember(input.memberId, input.expelledBy);
      return { success };
    }),

  changeMemberRole: groupProcedure
    .input(z.object({ memberId: z.string(), role: z.enum(["admin", "member"]) }))
    .mutation(async ({ input }) => {
      const success = await changeMemberRole(input.memberId, input.role);
      return { success };
    }),

  leaveMember: groupProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await leaveGroup(input.memberId);
      return result;
    }),

  updateGroupSettings: groupProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(100).optional(),
        pinCode: z.string().min(4).max(32).nullable().optional(),
        requireApproval: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await updateGroupSettings(GROUP_ID, input);
      return { success };
    }),

  createCategory: groupProcedure
    .input(z.object({ name: z.string().trim().min(1).max(64), emoji: z.string().min(1).max(8) }))
    .mutation(async ({ input }) => {
      const category = await createExpenseCategory(GROUP_ID, input.name, input.emoji);
      return { success: true, category };
    }),

  deleteCategory: groupProcedure
    .input(z.object({ categoryId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await deleteExpenseCategory(input.categoryId);
      return { success };
    }),

  getNotifications: groupProcedure
    .input(z.object({ memberId: z.string() }).optional())
    .query(async ({ input }) => {
      if (!input?.memberId) return [];
      const db = await (await import("../db")).getDb();
      if (!db) return [];
      const result = await db.query(
        `SELECT id, type, title, message, read, data, created_at AS "createdAt" FROM notifications WHERE member_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [input.memberId]
      );
      return result.rows;
    }),

  markNotificationRead: groupProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await markNotificationRead(input.notificationId);
      return { success };
    }),

  markAllNotificationsRead: groupProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await markAllNotificationsRead(input.memberId);
      return { success };
    }),

  getNotificationSettings: groupProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ input }) => {
      const settings = await getNotificationSettings(input.memberId, GROUP_ID);
      return settings;
    }),

  updateNotificationSettings: groupProcedure
    .input(
      z.object({
        memberId: z.string(),
        pushEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        reminderFrequency: z.string().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { memberId, ...settings } = input;
      const success = await updateNotificationSettings(memberId, GROUP_ID, settings);
      return { success };
    }),

  getGroupStats: groupProcedure
    .input(z.object({ month: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const stats = await getGroupStats(GROUP_ID, input?.month);
      return stats;
    }),

  exportCSV: groupProcedure
    .mutation(async () => {
      const csv = await exportExpensesCSV(GROUP_ID);
      return { success: true, csv };
    }),

  resetAllData: groupProcedure
    .mutation(async () => {
      const { resetAllGroupData } = await import("../db");
      const success = await resetAllGroupData(GROUP_ID);
      return { success };
    }),
});
