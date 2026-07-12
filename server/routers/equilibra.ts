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
} from "../db";

const GROUP_ID = "equilibra-fixed-group";

export const equilibraRouter = router({
  // Initialize group with members
  initGroup: groupProcedure
    .input(
      z.object({
        members: z.array(
          z.object({
            id: z.string().min(1).max(128),
            name: z.string().trim().min(1).max(80),
            avatar: z.string().min(1).max(32),
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

  // Get all group data
  getGroupData: groupProcedure.query(async () => {
    const data = await getGroupData(GROUP_ID);
    if (!data) return null;

    // Members are stored as JSON in group.shareUrl
    let membersData: Array<{ id: string; name: string; avatar: string }> = [];
    if (data.group?.shareUrl) {
      try { membersData = JSON.parse(data.group.shareUrl); } catch { /* ignore */ }
    }

    return {
      members: membersData,
      expenses: data.expenses.map((e) => ({
        ...e,
        amount: parseFloat(e.amount as unknown as string),
      })),
      settlements: data.settlements ? data.settlements.map((s: any) => ({
        ...s,
        amount: parseFloat(s.amount as unknown as string),
      })) : [],
      pending: data.pending.map((p) => ({
        ...p,
        amount: parseFloat(p.amount as unknown as string),
      })),
      history: data.history.map((h) => ({
        ...h,
        amount: h.amount ? parseFloat(h.amount as unknown as string) : null,
      })),
      shareUrl: data.group?.shareUrl || "",
    };
  }),

  // Add expense
  addExpense: groupProcedure
    .input(
      z.object({
        description: z.string().trim().min(1).max(255),
        amount: z.number().positive().max(1_000_000),
        category: z.string().trim().min(1).max(64),
        payerId: z.string().min(1).max(128),
        participants: z.array(z.string().min(1).max(128)).min(1).max(20),
        photoUrl: z.string().max(2048).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const expenseId = `exp_${randomUUID()}`;

      const success = await addExpense({
        id: expenseId,
        groupId: GROUP_ID,
        description: input.description,
        amount: input.amount.toString() as unknown as string,
        category: input.category,
        payerId: input.payerId,
        participants: input.participants,
        photoUrl: input.photoUrl || null,
        date: new Date(),
      });

      if (success) {
        const historyId = `h_${randomUUID()}`;
        await addHistoryEntry({
          id: historyId,
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

  // Delete expense
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
        const historyId = `h_${randomUUID()}`;
        await addHistoryEntry({
          id: historyId,
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

  // Request payment (NEW SYSTEM)
  requestPayment: groupProcedure
    .input(
      z.object({
        fromId: z.string().min(1).max(128),
        fromName: z.string().trim().min(1).max(80),
        toId: z.string().min(1).max(128),
        toName: z.string().trim().min(1).max(80),
        amount: z.number().positive().max(1_000_000),
        originalAmount: z.number().positive().max(1_000_000).optional(),
        expenseId: z.string().min(1).max(128),
        isGroupRequest: z.boolean().optional(),
        groupId: z.string().optional(),
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
      });

      return { success: true, paymentId: storedPaymentId };
    }),

  // Confirm payment
  confirmPayment: groupProcedure
    .input(
      z.object({
        paymentId: z.string(),
        fromId: z.string(),
        toId: z.string(),
        amount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await confirmPayment(
        input.paymentId,
        input.fromId,
        input.toId,
        input.amount.toString()
      );

      return { success };
    }),

  // Refuse payment
  refusePayment: groupProcedure
    .input(
      z.object({
        paymentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await refusePayment(input.paymentId);
      return { success };
    }),

  // Update share URL
  updateShareUrl: groupProcedure
    .input(
      z.object({
        shareUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await updateGroupShareUrl(GROUP_ID, input.shareUrl);
      return { success };
    }),

  // Update member biometric
  updateMemberBiometric: groupProcedure
    .input(
      z.object({
        memberId: z.string(),
        credentialId: z.string().optional(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await updateMemberBiometric(
        input.memberId,
        input.enabled
      );
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
    .input(
      z.object({
        imageUrl: z.string().min(1).max(2048),
      })
    )
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
                {
                  type: "text",
                  text: "Please analyze this receipt and extract the total amount, date, and category.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: input.imageUrl,
                    detail: "high",
                  },
                },
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
                  amount: {
                    type: ["number", "null"],
                    description: "The total amount from the receipt",
                  },
                  date: {
                    type: ["string", "null"],
                    description: "The date in YYYY-MM-DD format",
                  },
                  category: {
                    type: ["string", "null"],
                    description: "The category of the expense",
                  },
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
        return {
          success: true,
          amount: extracted.amount,
          date: extracted.date,
          category: extracted.category,
        };
      } catch (error) {
        console.error("[AI] Receipt analysis failed:", error);
        return { success: false, error: "Analysis failed" };
      }
    }),
});
