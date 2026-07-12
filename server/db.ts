import pg from "pg";
import { readStorage, writeStorage, getStorage, updateStorage, clearAllStorage } from "./jsonStorage";
import type { User } from "./drizzle/schema";

const { Pool } = pg;
let pool: InstanceType<typeof Pool> | undefined;
let useJsonStorage = false;

function getPool() {
  if (useJsonStorage) return null;
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[DB] DATABASE_URL not configured, falling back to JSON storage");
    useJsonStorage = true;
    return null;
  }
  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: /localhost|127\.0\.0\.1/.test(connectionString)
      ? undefined
      : { rejectUnauthorized: false },
  });
  return pool;
}

let initialization: Promise<void> | undefined;

export function initializeDatabase(): Promise<void> {
  initialization ??= (async () => {
    const dbPool = getPool();
    if (!dbPool) {
      console.log("[DB] Skipping database initialization (using JSON storage)");
      return;
    }
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id BIGSERIAL PRIMARY KEY,
        open_id VARCHAR(128) UNIQUE NOT NULL,
        name TEXT,
        email VARCHAR(320),
        login_method VARCHAR(64),
        role VARCHAR(16) NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_signed_in TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS groups (
        id VARCHAR(128) PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT 'AperoSplit',
        share_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS group_members (
        id VARCHAR(128) PRIMARY KEY,
        group_id VARCHAR(128) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(32) NOT NULL,
        biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(128) PRIMARY KEY,
        group_id VARCHAR(128) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        category VARCHAR(64) NOT NULL,
        payer_id VARCHAR(128) NOT NULL,
        participants JSONB NOT NULL,
        photo_url TEXT,
        date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS expenses_group_date_idx ON expenses(group_id, date DESC);
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(128) PRIMARY KEY,
        group_id VARCHAR(128) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        from_id VARCHAR(128) NOT NULL,
        from_name VARCHAR(255) NOT NULL,
        to_id VARCHAR(128) NOT NULL,
        to_name VARCHAR(255) NOT NULL,
        amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','refused','completed')),
        expense_id VARCHAR(128),
        notification_count INTEGER NOT NULL DEFAULT 1,
        date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        responded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS payments_group_status_idx ON payments(group_id, status);
      CREATE TABLE IF NOT EXISTS activity_history (
        id VARCHAR(128) PRIMARY KEY,
        group_id VARCHAR(128) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        type VARCHAR(64) NOT NULL,
        author_id VARCHAR(128),
        description TEXT,
        amount NUMERIC(12,2),
        from_id VARCHAR(128),
        to_id VARCHAR(128),
        date TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  })().catch(error => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

async function ready() {
  const dbPool = getPool();
  if (!dbPool) return null;
  await initializeDatabase();
  return dbPool;
}

export async function getDb() {
  return ready();
}

export async function upsertUser(user: any): Promise<void> {
  const db = await ready();
  if (!db) {
    console.warn("[DB] upsertUser not implemented in JSON storage");
    return;
  }
  await db.query(
    `INSERT INTO app_users (open_id, name, email, login_method, last_signed_in)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (open_id) DO UPDATE SET
       name = EXCLUDED.name,
       email = EXCLUDED.email,
       login_method = EXCLUDED.login_method,
       last_signed_in = NOW(),
       updated_at = NOW()`,
    [user.openId, user.name ?? null, user.email ?? null, user.loginMethod ?? null],
  );
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await ready();
  if (!db) return undefined;
  const result = await db.query(`SELECT * FROM app_users WHERE open_id = $1`, [openId]);
  const row = result.rows[0];
  if (!row) return undefined;
  return {
    id: Number(row.id),
    openId: row.open_id,
    name: row.name,
    email: row.email,
    loginMethod: row.login_method,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSignedIn: row.last_signed_in,
  } as User;
}

export async function getOrCreateGroup(groupId: string) {
  const db = await ready();
  if (!db) {
    const data = readStorage();
    return { id: groupId, shareUrl: JSON.stringify(data.members) };
  }
  await db.query(`INSERT INTO groups (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [groupId]);
  const result = await db.query(`SELECT id, share_url AS "shareUrl" FROM groups WHERE id = $1`, [groupId]);
  return result.rows[0];
}

export async function getGroupData(groupId: string) {
  const db = await ready();
  if (!db) {
    const data = readStorage();
    return {
      group: { id: groupId, shareUrl: JSON.stringify(data.members) },
      expenses: data.expenses,
      settlements: [],
      pending: data.pendingPayments,
      history: data.completedPayments,
    };
  }
  await getOrCreateGroup(groupId);
  const [group, members, expenses, payments, history] = await Promise.all([
    db.query(`SELECT id, share_url AS "shareUrl" FROM groups WHERE id = $1`, [groupId]),
    db.query(`SELECT id, name, avatar FROM group_members WHERE group_id = $1 ORDER BY created_at`, [groupId]),
    db.query(`SELECT id, group_id AS "groupId", description, amount, category, payer_id AS "payerId", participants, photo_url AS "photoUrl", date, created_at AS "createdAt" FROM expenses WHERE group_id = $1 ORDER BY date`, [groupId]),
    db.query(`SELECT id, group_id AS "groupId", from_id AS "fromId", from_name AS "fromName", to_id AS "toId", to_name AS "toName", amount, status, expense_id AS "expenseId", notification_count AS "notificationCount", date, responded_at AS "respondedAt", created_at AS "createdAt" FROM payments WHERE group_id = $1 ORDER BY created_at DESC`, [groupId]),
    db.query(`SELECT id, group_id AS "groupId", type, author_id AS "authorId", description, amount, from_id AS "fromId", to_id AS "toId", date FROM activity_history WHERE group_id = $1 ORDER BY date DESC LIMIT 200`, [groupId]),
  ]);
  const memberList = members.rows;
  return {
    group: { ...group.rows[0], shareUrl: JSON.stringify(memberList) },
    expenses: expenses.rows,
    settlements: [],
    pending: payments.rows.filter(payment => payment.status !== "completed"),
    history: [
      ...payments.rows.filter(payment => payment.status === "completed"),
      ...history.rows,
    ],
  };
}

export async function addMembers(groupId: string, members: Array<{ id: string; name: string; avatar: string }>) {
  const db = await ready();
  if (!db) {
    updateStorage("members", members);
    return true;
  }
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO groups (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [groupId]);
    const ids = members.map(member => member.id);
    if (ids.length === 0) {
      await client.query(`DELETE FROM group_members WHERE group_id = $1`, [groupId]);
    } else {
      await client.query(`DELETE FROM group_members WHERE group_id = $1 AND NOT (id = ANY($2::text[]))`, [groupId, ids]);
      for (const member of members) {
        await client.query(
          `INSERT INTO group_members (id, group_id, name, avatar) VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar`,
          [member.id, groupId, member.name, member.avatar],
        );
      }
    }
    await client.query(`UPDATE groups SET share_url = $2, updated_at = NOW() WHERE id = $1`, [groupId, JSON.stringify(members)]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function addExpense(expense: any) {
  const db = await ready();
  if (!db) {
    const expenses = getStorage("expenses");
    expenses.push(expense);
    updateStorage("expenses", expenses);
    return true;
  }
  await db.query(
    `INSERT INTO expenses (id, group_id, description, amount, category, payer_id, participants, photo_url, date)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)`,
    [expense.id, expense.groupId, expense.description, expense.amount, expense.category, expense.payerId, JSON.stringify(expense.participants), expense.photoUrl, expense.date],
  );
  return true;
}

export async function deleteExpense(expenseId: string) {
  const db = await ready();
  if (!db) {
    const expenses = getStorage("expenses");
    const filtered = expenses.filter((e: any) => e.id !== expenseId);
    updateStorage("expenses", filtered);
    return true;
  }
  return (await db.query(`DELETE FROM expenses WHERE id = $1`, [expenseId])).rowCount === 1;
}

export async function addPendingPayment(payment: any) {
  const db = await ready();
  if (!db) {
    const pendingPayments = getStorage("pendingPayments");
    pendingPayments.push(payment);
    updateStorage("pendingPayments", pendingPayments);
    return payment.id;
  }
  const existing = await db.query(
    `UPDATE payments
     SET notification_count = notification_count + 1
     WHERE id = (
       SELECT id FROM payments
       WHERE group_id = $1 AND from_id = $2 AND to_id = $3 AND amount = $4
         AND expense_id IS NOT DISTINCT FROM $5 AND status IN ('pending','accepted')
       ORDER BY created_at DESC LIMIT 1
     )
     RETURNING id`,
    [payment.groupId, payment.fromId, payment.toId, payment.amount, payment.expenseId ?? null],
  );
  if (existing.rows[0]?.id) return existing.rows[0].id as string;
  await db.query(
    `INSERT INTO payments (id, group_id, from_id, from_name, to_id, to_name, amount, status, expense_id, date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [payment.id, payment.groupId, payment.fromId, payment.fromName, payment.toId, payment.toName, payment.amount, payment.status, payment.expenseId ?? null, payment.date],
  );
  return payment.id as string;
}

export async function confirmPayment(paymentId: string, fromId: string, toId: string, _amount: string) {
  const db = await ready();
  if (!db) {
    const pendingPayments = getStorage("pendingPayments");
    const completedPayments = getStorage("completedPayments");
    const paymentIndex = pendingPayments.findIndex((p: any) => p.id === paymentId);
    if (paymentIndex === -1) return false;
    const payment = pendingPayments[paymentIndex];
    payment.status = "completed";
    payment.respondedAt = new Date().toISOString();
    pendingPayments.splice(paymentIndex, 1);
    completedPayments.unshift(payment);
    updateStorage("pendingPayments", pendingPayments);
    updateStorage("completedPayments", completedPayments);
    return true;
  }
  const result = await db.query(
    `UPDATE payments SET
       status = CASE WHEN status = 'pending' THEN 'accepted' WHEN status = 'accepted' THEN 'completed' ELSE status END,
       responded_at = NOW()
     WHERE id = $1 AND from_id = $2 AND to_id = $3 AND status IN ('pending','accepted')`,
    [paymentId, fromId, toId],
  );
  return result.rowCount === 1;
}

export async function refusePayment(paymentId: string) {
  const db = await ready();
  if (!db) {
    const pendingPayments = getStorage("pendingPayments");
    const paymentIndex = pendingPayments.findIndex((p: any) => p.id === paymentId);
    if (paymentIndex === -1) return false;
    pendingPayments[paymentIndex].status = "refused";
    pendingPayments[paymentIndex].respondedAt = new Date().toISOString();
    updateStorage("pendingPayments", pendingPayments);
    return true;
  }
  return (await db.query(`UPDATE payments SET status = 'refused', responded_at = NOW() WHERE id = $1 AND status = 'pending'`, [paymentId])).rowCount === 1;
}

export async function addHistoryEntry(entry: any) {
  const db = await ready();
  if (!db) {
    const history = getStorage("completedPayments");
    history.push(entry);
    updateStorage("completedPayments", history);
    return true;
  }
  await db.query(
    `INSERT INTO activity_history (id, group_id, type, author_id, description, amount, from_id, to_id, date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [entry.id, entry.groupId, entry.type, entry.authorId ?? null, entry.description ?? null, entry.amount ?? null, entry.fromId ?? null, entry.toId ?? null, entry.date ?? new Date()],
  );
  return true;
}

export async function updateGroupShareUrl(groupId: string, shareUrl: string) {
  const members = JSON.parse(shareUrl);
  if (!Array.isArray(members)) return false;
  return addMembers(groupId, members);
}

export async function updateMemberBiometric(memberId: string, enabled: boolean) {
  const db = await ready();
  if (!db) {
    const biometricEnabled = getStorage("biometricEnabled");
    biometricEnabled[memberId] = enabled;
    updateStorage("biometricEnabled", biometricEnabled);
    return true;
  }
  return (await db.query(`UPDATE group_members SET biometric_enabled = $2 WHERE id = $1`, [memberId, enabled])).rowCount === 1;
}

export async function clearAllData() {
  const db = await ready();
  if (!db) {
    clearAllStorage();
    return true;
  }
  await db.query(`TRUNCATE activity_history, payments, expenses RESTART IDENTITY`);
  return true;
}
