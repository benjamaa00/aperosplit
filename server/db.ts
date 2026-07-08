import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import {
  groups,
  expenses,
  settlements,
  pendingPayments,
  history,
  InsertExpense,
  InsertSettlement,
  InsertHistory,
  InsertPendingPayment,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Equilibra Groupe queries
// Note: Members are stored in the groups.shareUrl field as JSON since we hit the table limit.
// The shareUrl field is repurposed to store serialized member data.

export async function getOrCreateGroup(groupId: string, groupName: string = "Équilibra") {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const existing = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (existing.length > 0) return existing[0];

    await db.insert(groups).values({ id: groupId, name: groupName });
    return { id: groupId, name: groupName, shareUrl: null, createdAt: new Date(), updatedAt: new Date() };
  } catch (error) {
    console.error("[Database] Failed to get or create group:", error);
    return undefined;
  }
}

export async function getGroupData(groupId: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const [groupData, expensesData, settlementsData, pendingData, historyData] = await Promise.all([
      db.select().from(groups).where(eq(groups.id, groupId)).limit(1),
      db.select().from(expenses).where(eq(expenses.groupId, groupId)),
      db.select().from(settlements).where(eq(settlements.groupId, groupId)),
      db.select().from(pendingPayments).where(eq(pendingPayments.groupId, groupId)),
      db.select().from(history).where(eq(history.groupId, groupId)),
    ]);

    return {
      group: groupData[0] || null,
      expenses: expensesData,
      settlements: settlementsData,
      pending: pendingData,
      history: historyData,
    };
  } catch (error) {
    console.error("[Database] Failed to get group data:", error);
    return null;
  }
}

export async function addMembers(groupId: string, membersList: Array<{ id: string; name: string; avatar: string }>) {
  // Members are stored as JSON in the group's shareUrl field
  const db = await getDb();
  if (!db) return false;

  try {
    const membersJson = JSON.stringify(membersList);
    await db.update(groups).set({ shareUrl: membersJson }).where(eq(groups.id, groupId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to add members:", error);
    return false;
  }
}

export async function addExpense(expense: InsertExpense) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(expenses).values(expense);
    return true;
  } catch (error) {
    console.error("[Database] Failed to add expense:", error);
    return false;
  }
}

export async function deleteExpense(expenseId: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(expenses).where(eq(expenses.id, expenseId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete expense:", error);
    return false;
  }
}

export async function addPendingPayment(payment: InsertPendingPayment) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(pendingPayments).values(payment);
    return true;
  } catch (error) {
    console.error("[Database] Failed to add pending payment:", error);
    return false;
  }
}

export async function confirmPayment(paymentId: string, settlement: InsertSettlement, historyEntry: InsertHistory) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(pendingPayments).where(eq(pendingPayments.id, paymentId));
    await db.insert(settlements).values(settlement);
    await db.insert(history).values(historyEntry);
    return true;
  } catch (error) {
    console.error("[Database] Failed to confirm payment:", error);
    return false;
  }
}

export async function refusePayment(paymentId: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(pendingPayments).where(eq(pendingPayments.id, paymentId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to refuse payment:", error);
    return false;
  }
}

export async function addHistoryEntry(entry: InsertHistory) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(history).values(entry);
    return true;
  } catch (error) {
    console.error("[Database] Failed to add history entry:", error);
    return false;
  }
}

export async function updateGroupShareUrl(groupId: string, shareUrl: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(groups).set({ shareUrl }).where(eq(groups.id, groupId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update group share URL:", error);
    return false;
  }
}

export async function updateMemberBiometric(memberId: string, credentialId: string, enabled: boolean) {
  // Biometric data is stored client-side via localStorage/WebAuthn
  // This is a no-op on the server since members table doesn't exist
  return true;
}
