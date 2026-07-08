import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";
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
  initGroup: publicProcedure
    .input(
      z.object({
        members: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            avatar: z.string(),
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
  getGroupData: publicProcedure.query(async () => {
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
      settlements: data.settlements.map((s) => ({
        ...s,
        amount: parseFloat(s.amount as unknown as string),
      })),
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
  addExpense: publicProcedure
    .input(
      z.object({
        description: z.string(),
        amount: z.number(),
        category: z.string(),
        payerId: z.string(),
        participants: z.array(z.string()),
        photoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const expenseId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
        const historyId = `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
  deleteExpense: publicProcedure
    .input(
      z.object({
        expenseId: z.string(),
        description: z.string(),
        amount: z.number(),
        authorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await deleteExpense(input.expenseId);

      if (success) {
        const historyId = `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

  // Request payment
  requestPayment: publicProcedure
    .input(
      z.object({
        fromId: z.string(),
        fromName: z.string(),
        toId: z.string(),
        toName: z.string(),
        amount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const success = await addPendingPayment({
        id: paymentId,
        groupId: GROUP_ID,
        fromId: input.fromId,
        fromName: input.fromName,
        toId: input.toId,
        toName: input.toName,
        amount: input.amount.toString(),
        status: "pending",
        date: new Date(),
      });

      return { success, paymentId };
    }),

  // Confirm payment
  confirmPayment: publicProcedure
    .input(
      z.object({
        paymentId: z.string(),
        fromId: z.string(),
        toId: z.string(),
        amount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const settlementId = `settle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const historyId = `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const success = await confirmPayment(
        input.paymentId,
        {
          id: settlementId,
          groupId: GROUP_ID,
          fromId: input.fromId,
          toId: input.toId,
          amount: input.amount.toString(),
          date: new Date(),
        },
        {
          id: historyId,
          groupId: GROUP_ID,
          type: "settlement_confirmed",
          authorId: input.toId,
          fromId: input.fromId,
          toId: input.toId,
          amount: input.amount.toString(),
          date: new Date(),
        }
      );

      return { success };
    }),

  // Refuse payment
  refusePayment: publicProcedure
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
  updateShareUrl: publicProcedure
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
  updateMemberBiometric: publicProcedure
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
        input.credentialId || "",
        input.enabled
      );
      return { success };
    }),

  uploadReceiptPhoto: publicProcedure
    .input(
      z.object({
        fileData: z.string(),
        fileName: z.string(),
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

  analyzeReceiptPhoto: publicProcedure
    .input(
      z.object({
        imageUrl: z.string(),
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
