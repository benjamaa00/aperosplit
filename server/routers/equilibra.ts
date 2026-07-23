import { z } from "zod";
import { groupProcedure, groupAdminProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";
import { randomUUID } from "node:crypto";
import { ENV } from "../_core/env";
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
  updateMemberBiometric as dbUpdateMemberBiometric,
  createGroup,
  listGroupsForMember,
  joinGroupByPin,
  joinGroupByInvite,
  approveMember,
  refuseMember,
  expelMember,
  changeMemberRole,
  generateInviteToken,
  validateInviteToken,
  getGroupCategories,
  createGroupCategory,
  updateGroupCategory,
  deleteGroupCategory,
  archiveGroupCategory,
  createSubcategory as dbCreateSubcategory,
  updateSubcategory as dbUpdateSubcategory,
  deleteSubcategory as dbDeleteSubcategory,
  seedDefaultCategories,
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
  addPaymentComment as dbAddPaymentComment,
  getPaymentComments as dbGetPaymentComments,
  updateMemberProfile as dbUpdateMemberProfile,
  savePushSubscription,
  removePushSubscription,
  sendPushToMember,
  sendPushToGroup,
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
    };
  }),

  addExpense: groupProcedure
    .input(
      z.object({
        id: z.string().max(128).optional(),
        description: z.string().trim().min(1).max(255),
        amount: z.number().positive().max(1_000_000),
        category: z.string().trim().min(1).max(64),
        categoryEmoji: z.string().max(8).optional(),
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
      const expenseId = input.id || `exp_${randomUUID()}`;
      const success = await addExpense({
        id: expenseId,
        groupId: GROUP_ID,
        description: input.description,
        amount: input.amount.toString(),
        category: input.category,
        categoryEmoji: input.categoryEmoji || null,
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
        id: z.string().max(128).optional(),
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
      const paymentId = input.id || `pay_${randomUUID()}`;
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
    .input(z.object({ paymentId: z.string(), fromId: z.string(), comment: z.string().optional() }))
    .mutation(async ({ input }) => {
      const success = await refusePayment(input.paymentId, input.comment);
      if (success) {
        await addNotification(input.fromId, GROUP_ID, "payment_refused",
          "Demande refusée",
          `Votre demande de paiement a été refusée${input.comment ? ` : ${input.comment}` : ""}`,
          { paymentId: input.paymentId }
        );
      }
      return { success };
    }),

  cancelPaymentRequest: groupProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await cancelPaymentRequest(input.paymentId);
      return { success };
    }),

  resendPaymentRequest: groupProcedure
    .input(z.object({ paymentId: z.string(), toId: z.string(), amount: z.number() }))
    .mutation(async ({ input }) => {
      const success = await resendPaymentRequest(input.paymentId);
      if (success) {
        await addNotification(input.toId, GROUP_ID, "payment_reminder",
          "Rappel de paiement",
          `Nouveau rappel : vous devez ${input.amount.toFixed(2)} €`,
          { paymentId: input.paymentId }
        );
      }
      return { success };
    }),

  markAsPaid: groupProcedure
    .input(z.object({ paymentId: z.string(), fromId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await markAsPaid(input.paymentId);
      if (success) {
        await addNotification(input.fromId, GROUP_ID, "payment_marked_paid",
          "Paiement effectué",
          "Le débiteur a marqué le paiement comme effectué",
          { paymentId: input.paymentId }
        );
      }
      return { success };
    }),

  confirmReceipt: groupProcedure
    .input(z.object({ paymentId: z.string(), toId: z.string(), fromId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await confirmReceipt(input.paymentId);
      if (success) {
        await addNotification(input.toId, GROUP_ID, "receipt_confirmed",
          "Paiement confirmé",
          `${input.fromId ? "Le créancier a confirmé" : "Confirmé"} avoir reçu le paiement`,
          { paymentId: input.paymentId }
        );
      }
      return { success };
    }),

  reportNotReceived: groupProcedure
    .input(z.object({ paymentId: z.string(), note: z.string().min(1).max(500), toId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await reportNotReceived(input.paymentId, input.note);
      if (success) {
        await addNotification(input.toId, GROUP_ID, "payment_disputed",
          "Litige ouvert",
          `Un litige a été ouvert pour un paiement : ${input.note}`,
          { paymentId: input.paymentId }
        );
      }
      return { success };
    }),

  disputePayment: groupProcedure
    .input(z.object({ paymentId: z.string(), note: z.string().min(1).max(500), fromId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const success = await disputePayment(input.paymentId, input.note);
      if (success && input.fromId) {
        await addNotification(input.fromId, GROUP_ID, "payment_disputed",
          "Litige ouvert",
          `Un litige a été ouvert : ${input.note}`,
          { paymentId: input.paymentId }
        );
      }
      return { success };
    }),

  addPaymentComment: groupProcedure
    .input(z.object({ paymentId: z.string(), memberId: z.string(), memberName: z.string(), content: z.string().min(1).max(500), fromId: z.string().optional(), toId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const comment = await dbAddPaymentComment(input.paymentId, input.memberId, input.memberName, input.content);
      if (input.fromId && input.toId) {
        const notifyId = input.fromId === input.memberId ? input.toId : input.fromId;
        await addNotification(notifyId, GROUP_ID, "payment_comment",
          "Nouveau commentaire",
          `${input.memberName} a commenté sur un paiement`,
          { paymentId: input.paymentId }
        );
      }
      return { comment };
    }),

  getPaymentComments: groupProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      const comments = await dbGetPaymentComments(input.paymentId);
      return { comments };
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
      const success = await dbUpdateMemberBiometric(input.memberId, input.enabled);
      return { success };
    }),

  updateMemberProfile: groupProcedure
    .input(z.object({ memberId: z.string().min(1).max(128), name: z.string().trim().min(1).max(80), avatar: z.string().min(1).max(50000) }))
    .mutation(async ({ input }) => {
      const success = await dbUpdateMemberProfile(input.memberId, input.name, input.avatar);
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

  joinGroupByPin: publicProcedure
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

  joinGroupByInvite: publicProcedure
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
      if (result.success) {
        return { ...result, accessPin: ENV.groupAccessPin || undefined };
      }
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

  validateInvite: publicProcedure
    .input(z.object({ token: z.string().min(1).max(128) }))
    .query(async ({ input }) => {
      return await validateInviteToken(input.token);
    }),

  addMemberDirect: groupProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      name: z.string().trim().min(1).max(80),
      avatar: z.string().min(1).max(50000).optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return { success: false, error: "Le serveur demarre, reessayez dans quelques secondes" };

      const memberResult = await db.query(`SELECT role FROM group_members WHERE id = $1`, [input.memberId]);
      if (!memberResult.rows[0] || memberResult.rows[0].role !== "admin") {
        return { success: false, error: "Seuls les administrateurs peuvent ajouter des membres" };
      }

      const newMemberId = `member_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const avatar = input.avatar || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%236366f1"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="36" font-family="sans-serif">${input.name.charAt(0).toUpperCase()}</text></svg>`)}`;
      await addMembers(GROUP_ID, [{ id: newMemberId, name: input.name, avatar, role: "member", status: "active" }]);
      return { success: true, memberId: newMemberId, accessPin: ENV.groupAccessPin || undefined };
    }),

  getGroupAccessPin: groupAdminProcedure
    .input(z.object({ memberId: z.string().min(1).max(128) }))
    .query(async () => {
      return { pin: ENV.groupAccessPin || "" };
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

  getCategories: groupProcedure.query(async () => {
    await seedDefaultCategories(GROUP_ID, "system");
    const categories = await getGroupCategories(GROUP_ID);
    return { categories };
  }),

  createCategory: groupAdminProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      name: z.string().trim().min(1).max(64),
      emoji: z.string().min(1).max(8),
      icon: z.string().max(32).optional(),
      color: z.string().max(16).optional(),
      sortOrder: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      const { memberId, ...data } = input;
      const category = await createGroupCategory(GROUP_ID, data, memberId);
      return { success: true, category };
    }),

  updateCategory: groupAdminProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      categoryId: z.string().min(1).max(128),
      name: z.string().trim().min(1).max(64).optional(),
      emoji: z.string().min(1).max(8).optional(),
      icon: z.string().max(32).optional(),
      color: z.string().max(16).optional(),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { memberId, categoryId, ...data } = input;
      const success = await updateGroupCategory(categoryId, data);
      return { success };
    }),

  archiveCategory: groupAdminProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      categoryId: z.string().min(1).max(128),
    }))
    .mutation(async ({ input }) => {
      const success = await archiveGroupCategory(input.categoryId);
      return { success };
    }),

  deleteCategory: groupAdminProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      categoryId: z.string().min(1).max(128),
    }))
    .mutation(async ({ input }) => {
      const success = await deleteGroupCategory(input.categoryId);
      return { success };
    }),

  createSubcategory: groupAdminProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      categoryId: z.string().min(1).max(128),
      name: z.string().trim().min(1).max(64),
      emoji: z.string().max(8).optional(),
      sortOrder: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      const { memberId, categoryId, ...data } = input;
      const subcategory = await dbCreateSubcategory(categoryId, GROUP_ID, data);
      return { success: true, subcategory };
    }),

  updateSubcategory: groupAdminProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      subcategoryId: z.string().min(1).max(128),
      name: z.string().trim().min(1).max(64).optional(),
      emoji: z.string().max(8).optional(),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { memberId, subcategoryId, ...data } = input;
      const success = await dbUpdateSubcategory(subcategoryId, data);
      return { success };
    }),

  deleteSubcategory: groupAdminProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      subcategoryId: z.string().min(1).max(128),
    }))
    .mutation(async ({ input }) => {
      const success = await dbDeleteSubcategory(input.subcategoryId);
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

  getVapidPublicKey: publicProcedure.query(() => {
    return { publicKey: ENV.vapidPublicKey || "" };
  }),

  subscribePush: groupProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      subscription: z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
      }),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await savePushSubscription(input.memberId, GROUP_ID, input.subscription, input.userAgent);
      await updateNotificationSettings(input.memberId, GROUP_ID, { pushEnabled: true });
      return { success: true };
    }),

  unsubscribePush: groupProcedure
    .input(z.object({
      memberId: z.string().min(1).max(128),
      endpoint: z.string(),
    }))
    .mutation(async ({ input }) => {
      await removePushSubscription(input.memberId, input.endpoint);
      await updateNotificationSettings(input.memberId, GROUP_ID, { pushEnabled: false });
      return { success: true };
    }),
});
