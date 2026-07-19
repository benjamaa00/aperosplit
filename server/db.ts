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
  // Validate connection string format
  if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    console.warn("[DB] Invalid DATABASE_URL format, falling back to JSON storage");
    useJsonStorage = true;
    return null;
  }
  try {
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
  } catch (error) {
    console.warn("[DB] Failed to create database pool, falling back to JSON storage:", error);
    useJsonStorage = true;
    return null;
  }
}

let initialization: Promise<void> | undefined;

export function initializeDatabase(): Promise<void> {
  initialization ??= (async () => {
    const dbPool = getPool();
    if (!dbPool) {
      console.log("[DB] Skipping database initialization (using JSON storage)");
      return;
    }
    try {
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
          pin_code VARCHAR(32),
          require_approval BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS group_members (
          id VARCHAR(128) PRIMARY KEY,
          group_id VARCHAR(128) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          avatar TEXT NOT NULL,
          role VARCHAR(16) NOT NULL DEFAULT 'member',
          status VARCHAR(16) NOT NULL DEFAULT 'active',
          user_id VARCHAR(128),
          biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          credential_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
          category_emoji VARCHAR(8),
          status VARCHAR(16) NOT NULL DEFAULT 'validated',
          is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
          recurrence_interval VARCHAR(16),
          recurrence_end_date TIMESTAMPTZ,
          validated_by VARCHAR(128),
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
          original_amount NUMERIC(12,2),
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          expense_id VARCHAR(128),
          notification_count INTEGER NOT NULL DEFAULT 1,
          attempt_count INTEGER NOT NULL DEFAULT 1,
          is_group_request BOOLEAN NOT NULL DEFAULT FALSE,
          request_group_id VARCHAR(128),
          request_note TEXT,
          accept_note TEXT,
          paid_at TIMESTAMPTZ,
          confirmed_at TIMESTAMPTZ,
          dispute_note TEXT,
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
        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(128) PRIMARY KEY,
          group_id VARCHAR(128) REFERENCES groups(id) ON DELETE CASCADE,
          member_id VARCHAR(128) NOT NULL,
          type VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          read BOOLEAN NOT NULL DEFAULT FALSE,
          data JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS notifications_member_idx ON notifications(member_id, read, created_at DESC);
        CREATE TABLE IF NOT EXISTS payment_comments (
          id VARCHAR(128) PRIMARY KEY,
          payment_id VARCHAR(128) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
          member_id VARCHAR(128) NOT NULL,
          member_name VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS payment_comments_idx ON payment_comments(payment_id, created_at);
        CREATE TABLE IF NOT EXISTS notification_settings (
          id VARCHAR(128) PRIMARY KEY,
          member_id VARCHAR(128) NOT NULL,
          group_id VARCHAR(128) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          reminder_frequency VARCHAR(16) DEFAULT '24h',
          quiet_hours_start VARCHAR(5),
          quiet_hours_end VARCHAR(5),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(member_id, group_id)
        );
        CREATE TABLE IF NOT EXISTS two_factor_auth (
          id VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          secret VARCHAR(255) NOT NULL,
          enabled BOOLEAN NOT NULL DEFAULT FALSE,
          verified BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS sessions_user_idx ON user_sessions(user_id, expires_at);
        CREATE TABLE IF NOT EXISTS expense_categories (
          id VARCHAR(128) PRIMARY KEY,
          group_id VARCHAR(128) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          name VARCHAR(64) NOT NULL,
          emoji VARCHAR(8) NOT NULL,
          is_default BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS group_invites (
          id VARCHAR(128) PRIMARY KEY,
          group_id VARCHAR(128) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
          token VARCHAR(128) UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ,
          max_uses INTEGER,
          used_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await dbPool.query(`
        DO $$ BEGIN
          ALTER TABLE groups ADD COLUMN IF NOT EXISTS pin_code VARCHAR(32);
          ALTER TABLE groups ADD COLUMN IF NOT EXISTS require_approval BOOLEAN NOT NULL DEFAULT FALSE;
        EXCEPTION WHEN duplicate_column THEN null; END $$;
        DO $$ BEGIN
          ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'member';
          ALTER TABLE group_members ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'active';
          ALTER TABLE group_members ADD COLUMN IF NOT EXISTS user_id VARCHAR(128);
          ALTER TABLE group_members ADD COLUMN IF NOT EXISTS credential_id TEXT;
          ALTER TABLE group_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        EXCEPTION WHEN duplicate_column THEN null; END $$;
        DO $$ BEGIN
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'validated';
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurrence_interval VARCHAR(16);
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMPTZ;
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS validated_by VARCHAR(128);
          ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_emoji VARCHAR(8);
        EXCEPTION WHEN duplicate_column THEN null; END $$;
        DO $$ BEGIN
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12,2);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_group_request BOOLEAN NOT NULL DEFAULT FALSE;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS request_group_id VARCHAR(128);
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS request_note TEXT;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS accept_note TEXT;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS dispute_note TEXT;
        EXCEPTION WHEN duplicate_column THEN null; END $$;
      `);

      // Migrate avatar column to TEXT for photo data URLs
      try {
        await pool!.query(`ALTER TABLE group_members ALTER COLUMN avatar TYPE TEXT`);
      } catch {}
      // Add comment column to payments if missing
      try {
        await pool!.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS comment TEXT`);
      } catch {}
    } catch (error) {
      console.error("[DB] Database initialization failed, switching to JSON storage:", error);
      useJsonStorage = true;
      pool = undefined;
      initialization = undefined;
    }
  })().catch(error => {
    console.error("[DB] Database initialization error:", error);
    useJsonStorage = true;
    pool = undefined;
    initialization = undefined;
    throw error;
  });
  return initialization;
}

async function ready() {
  const dbPool = getPool();
  if (!dbPool) return null;
  try {
    await initializeDatabase();
    return dbPool;
  } catch (error) {
    console.error("[DB] Database ready check failed, using JSON storage:", error);
    useJsonStorage = true;
    pool = undefined;
    initialization = undefined;
    return null;
  }
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
  const [group, members, expenses, payments, history, categories, notifications] = await Promise.all([
    db.query(`SELECT id, name, share_url AS "shareUrl", pin_code AS "pinCode", require_approval AS "requireApproval" FROM groups WHERE id = $1`, [groupId]),
    db.query(`SELECT id, name, avatar, role, status, user_id AS "userId", biometric_enabled AS "biometricEnabled", credential_id AS "credentialId", joined_at AS "joinedAt" FROM group_members WHERE group_id = $1 ORDER BY joined_at`, [groupId]),
    db.query(`SELECT id, group_id AS "groupId", description, amount, category, payer_id AS "payerId", participants, photo_url AS "photoUrl", category_emoji AS "categoryEmoji", status, is_recurring AS "isRecurring", recurrence_interval AS "recurrenceInterval", recurrence_end_date AS "recurrenceEndDate", validated_by AS "validatedBy", date, created_at AS "createdAt" FROM expenses WHERE group_id = $1 ORDER BY date`, [groupId]),
    db.query(`SELECT id, group_id AS "groupId", from_id AS "fromId", from_name AS "fromName", to_id AS "toId", to_name AS "toName", amount, original_amount AS "originalAmount", status, expense_id AS "expenseId", notification_count AS "notificationCount", attempt_count AS "attemptCount", is_group_request AS "isGroupRequest", request_group_id AS "requestGroupId", request_note AS "requestNote", accept_note AS "acceptNote", paid_at AS "paidAt", confirmed_at AS "confirmedAt", dispute_note AS "disputeNote", date, responded_at AS "respondedAt", created_at AS "createdAt" FROM payments WHERE group_id = $1 ORDER BY created_at DESC`, [groupId]),
    db.query(`SELECT id, group_id AS "groupId", type, author_id AS "authorId", description, amount, from_id AS "fromId", to_id AS "toId", date FROM activity_history WHERE group_id = $1 ORDER BY date DESC LIMIT 200`, [groupId]),
    db.query(`SELECT id, name, emoji, is_default AS "isDefault" FROM expense_categories WHERE group_id = $1 ORDER BY is_default DESC, name`, [groupId]),
    db.query(`SELECT id, type, title, message, read, data, created_at AS "createdAt" FROM notifications WHERE member_id IN (SELECT id FROM group_members WHERE group_id = $1) ORDER BY created_at DESC LIMIT 50`, [groupId]),
  ]);
  const memberList = members.rows;
  return {
    group: { ...group.rows[0], shareUrl: JSON.stringify(memberList) },
    members: memberList,
    expenses: expenses.rows,
    settlements: [],
    pending: payments.rows.filter(payment => ["pending", "late", "accepted", "in_progress", "disputed", "paid"].includes(payment.status)),
    history: [
      ...payments.rows.filter(payment => ["completed","refused"].includes(payment.status)),
      ...history.rows,
    ],
    categories: categories.rows,
    notifications: notifications.rows,
  };
}

export async function addMembers(groupId: string, members: Array<{ id: string; name: string; avatar: string; role?: string; status?: string }>) {
  const db = await ready();
  if (!db) {
    updateStorage("members", members);
    return true;
  }
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO groups (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [groupId]);
    for (const member of members) {
      await client.query(
        `INSERT INTO group_members (id, group_id, name, avatar, role, status) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar`,
        [member.id, groupId, member.name, member.avatar, member.role || "member", member.status || "active"],
      );
    }
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
    `INSERT INTO expenses (id, group_id, description, amount, category, payer_id, participants, photo_url, category_emoji, is_recurring, recurrence_interval, recurrence_end_date, date)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13)`,
    [expense.id, expense.groupId, expense.description, expense.amount, expense.category, expense.payerId, JSON.stringify(expense.participants), expense.photoUrl, expense.categoryEmoji || null, expense.isRecurring || false, expense.recurrenceInterval || null, expense.recurrenceEndDate || null, expense.date],
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
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET notification_count = payments.notification_count + 1`,
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

export async function refusePayment(paymentId: string, comment?: string) {
  const db = await ready();
  if (!db) {
    const pendingPayments = getStorage("pendingPayments");
    const paymentIndex = pendingPayments.findIndex((p: any) => p.id === paymentId);
    if (paymentIndex === -1) return false;
    pendingPayments[paymentIndex].status = "refused";
    pendingPayments[paymentIndex].respondedAt = new Date().toISOString();
    pendingPayments[paymentIndex].comment = comment || null;
    updateStorage("pendingPayments", pendingPayments);
    return true;
  }
  return (await db.query(`UPDATE payments SET status = 'refused', responded_at = NOW(), comment = $2 WHERE id = $1 AND status = 'pending'`, [paymentId, comment || null])).rowCount === 1;
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
  try {
    const members = JSON.parse(shareUrl);
    if (!Array.isArray(members)) return false;
    return addMembers(groupId, members);
  } catch {
    return false;
  }
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

export async function updateMemberProfile(memberId: string, name: string, avatar: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(`UPDATE group_members SET name = $2, avatar = $3 WHERE id = $1`, [memberId, name, avatar])).rowCount === 1;
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

export async function createGroup(groupId: string, name: string, pinCode?: string, requireApproval?: boolean) {
  const db = await ready();
  if (!db) return { id: groupId, name, shareUrl: "[]" };
  await db.query(
    `INSERT INTO groups (id, name, pin_code, require_approval) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pin_code = COALESCE(EXCLUDED.pin_code, groups.pin_code), require_approval = EXCLUDED.require_approval, updated_at = NOW()`,
    [groupId, name, pinCode ?? null, requireApproval ?? false]
  );
  const result = await db.query(`SELECT id, name, share_url AS "shareUrl", pin_code AS "pinCode", require_approval AS "requireApproval" FROM groups WHERE id = $1`, [groupId]);
  return result.rows[0];
}

export async function listGroupsForMember(memberId: string) {
  const db = await ready();
  if (!db) return [];
  const result = await db.query(
    `SELECT g.id, g.name, g.created_at AS "createdAt"
     FROM groups g
     INNER JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.id = $1 AND gm.status = 'active'
     ORDER BY g.created_at DESC`,
    [memberId]
  );
  return result.rows;
}

export async function joinGroupByPin(groupId: string, pinCode: string, member: { id: string; name: string; avatar: string }) {
  const db = await ready();
  if (!db) return { success: true, requiresApproval: false };
  const groupResult = await db.query(`SELECT id, pin_code AS "pinCode", require_approval AS "requireApproval" FROM groups WHERE id = $1`, [groupId]);
  const group = groupResult.rows[0];
  if (!group) return { success: false, error: "Group not found" };
  if (group.pinCode && group.pinCode !== pinCode) return { success: false, error: "Invalid PIN" };
  const status = group.requireApproval ? "pending" : "active";
  await db.query(
    `INSERT INTO group_members (id, group_id, name, avatar, role, status) VALUES ($1, $2, $3, $4, 'member', $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar`,
    [member.id, groupId, member.name, member.avatar, status]
  );
  return { success: true, requiresApproval: group.requireApproval };
}

export async function joinGroupByInvite(token: string, member: { id: string; name: string; avatar: string }) {
  const db = await ready();
  if (!db) return { success: false, error: "Not available in offline mode" };
  const inviteResult = await db.query(
    `SELECT id, group_id AS "groupId", max_uses AS "maxUses", used_count AS "usedCount", expires_at AS "expiresAt" FROM group_invites WHERE token = $1`,
    [token]
  );
  const invite = inviteResult.rows[0];
  if (!invite) return { success: false, error: "Invalid invite link" };
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return { success: false, error: "Invite link expired" };
  if (invite.maxUses && invite.usedCount >= invite.maxUses) return { success: false, error: "Invite link has been used up" };
  const groupResult = await db.query(`SELECT require_approval AS "requireApproval" FROM groups WHERE id = $1`, [invite.groupId]);
  const group = groupResult.rows[0];
  const status = group?.requireApproval ? "pending" : "active";
  await db.query(
    `INSERT INTO group_members (id, group_id, name, avatar, role, status) VALUES ($1, $2, $3, $4, 'member', $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar`,
    [member.id, invite.groupId, member.name, member.avatar, status]
  );
  await db.query(`UPDATE group_invites SET used_count = used_count + 1 WHERE id = $1`, [invite.id]);
  return { success: true, groupId: invite.groupId, requiresApproval: group?.requireApproval };
}

export async function approveMember(memberId: string, approvedBy: string) {
  const db = await ready();
  if (!db) return false;
  const result = await db.query(
    `UPDATE group_members SET status = 'active', joined_at = NOW() WHERE id = $1 AND status = 'pending'`,
    [memberId]
  );
  if (result.rowCount === 1) {
    const memberInfo = await db.query(`SELECT group_id AS "groupId", name FROM group_members WHERE id = $1`, [memberId]);
    if (memberInfo.rows[0]) {
      await addHistoryEntry({
        id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        groupId: memberInfo.rows[0].groupId,
        type: "member_approved",
        authorId: approvedBy,
        description: `${memberInfo.rows[0].name} a été approuvé`,
        date: new Date(),
      });
    }
    return true;
  }
  return false;
}

export async function refuseMember(memberId: string, refusedBy: string) {
  const db = await ready();
  if (!db) return false;
  const memberInfo = await db.query(`SELECT group_id AS "groupId", name FROM group_members WHERE id = $1 AND status = 'pending'`, [memberId]);
  if (memberInfo.rows[0]) {
    await db.query(`DELETE FROM group_members WHERE id = $1 AND status = 'pending'`, [memberId]);
    await addHistoryEntry({
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      groupId: memberInfo.rows[0].groupId,
      type: "member_refused",
      authorId: refusedBy,
      description: `${memberInfo.rows[0].name} a été refusé`,
      date: new Date(),
    });
    return true;
  }
  return false;
}

export async function expelMember(memberId: string, expelledBy: string) {
  const db = await ready();
  if (!db) return false;
  const memberInfo = await db.query(`SELECT group_id AS "groupId", name FROM group_members WHERE id = $1 AND status = 'active'`, [memberId]);
  if (memberInfo.rows[0]) {
    const groupId = memberInfo.rows[0].groupId;
    await db.query(`DELETE FROM expenses WHERE payer_id = $1 AND group_id = $2`, [memberId, groupId]);
    await db.query(`DELETE FROM group_members WHERE id = $1`, [memberId]);
    await addHistoryEntry({
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      groupId,
      type: "member_expelled",
      authorId: expelledBy,
      description: `${memberInfo.rows[0].name} a été expulsé du groupe`,
      date: new Date(),
    });
    return true;
  }
  return false;
}

export async function leaveGroup(memberId: string) {
  const db = await ready();
  if (!db) return false;
  const memberInfo = await db.query(`SELECT group_id AS "groupId", name, role FROM group_members WHERE id = $1 AND status = 'active'`, [memberId]);
  if (memberInfo.rows[0]) {
    if (memberInfo.rows[0].role === "admin") return { error: "L'admin ne peut pas quitter le groupe. Transférez d'abord le rôle admin." };
    const groupId = memberInfo.rows[0].groupId;
    await db.query(`DELETE FROM expenses WHERE payer_id = $1 AND group_id = $2`, [memberId, groupId]);
    await db.query(`DELETE FROM group_members WHERE id = $1`, [memberId]);
    await addHistoryEntry({
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      groupId,
      type: "member_left",
      authorId: memberId,
      description: `${memberInfo.rows[0].name} a quitté le groupe`,
      date: new Date(),
    });
    return true;
  }
  return false;
}

export async function changeMemberRole(memberId: string, newRole: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(`UPDATE group_members SET role = $2 WHERE id = $1 AND status = 'active'`, [memberId, newRole])).rowCount === 1;
}

export async function generateInviteToken(groupId: string, expiresAt?: Date, maxUses?: number) {
  const db = await ready();
  if (!db) return { token: `invite_${Date.now()}`, url: "" };
  const token = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.query(
    `INSERT INTO group_invites (id, group_id, token, expires_at, max_uses) VALUES ($1, $2, $3, $4, $5)`,
    [id, groupId, token, expiresAt ?? null, maxUses ?? null]
  );
  return { token, url: token };
}

export async function validateInviteToken(token: string) {
  const db = await ready();
  if (!db) return { valid: false, error: "Offline mode" };
  const result = await db.query(
    `SELECT gi.id, gi.group_id AS "groupId", gi.expires_at AS "expiresAt", gi.max_uses AS "maxUses", gi.used_count AS "usedCount",
            g.name AS "groupName"
     FROM group_invites gi
     JOIN groups g ON g.id = gi.group_id
     WHERE gi.token = $1`,
    [token]
  );
  const invite = result.rows[0];
  if (!invite) return { valid: false, error: "Lien d'invitation invalide" };
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return { valid: false, error: "Lien d'invitation expiré" };
  if (invite.maxUses && invite.usedCount >= invite.maxUses) return { valid: false, error: "Lien d'invitation épuisé" };
  return { valid: true, groupName: invite.groupName || "Équilibra" };
}

export async function createExpenseCategory(groupId: string, name: string, emoji: string, isDefault?: boolean) {
  const db = await ready();
  if (!db) return { id: `cat_${Date.now()}`, name, emoji };
  const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.query(
    `INSERT INTO expense_categories (id, group_id, name, emoji, is_default) VALUES ($1, $2, $3, $4, $5)`,
    [id, groupId, name, emoji, isDefault ?? false]
  );
  return { id, name, emoji };
}

export async function deleteExpenseCategory(categoryId: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(`DELETE FROM expense_categories WHERE id = $1 AND is_default = FALSE`, [categoryId])).rowCount === 1;
}

export async function addNotification(memberId: string, groupId: string, type: string, title: string, message: string, data?: any) {
  const db = await ready();
  if (!db) return true;
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.query(
    `INSERT INTO notifications (id, group_id, member_id, type, title, message, data) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, groupId, memberId, type, title, message, data ? JSON.stringify(data) : null]
  );
  return true;
}

export async function markNotificationRead(notificationId: string) {
  const db = await ready();
  if (!db) return true;
  await db.query(`UPDATE notifications SET read = TRUE WHERE id = $1`, [notificationId]);
  return true;
}

export async function markAllNotificationsRead(memberId: string) {
  const db = await ready();
  if (!db) return true;
  await db.query(`UPDATE notifications SET read = TRUE WHERE member_id = $1 AND read = FALSE`, [memberId]);
  return true;
}

export async function getNotificationSettings(memberId: string, groupId: string) {
  const db = await ready();
  if (!db) return { pushEnabled: true, emailEnabled: false, reminderFrequency: "24h" };
  const result = await db.query(
    `SELECT push_enabled AS "pushEnabled", email_enabled AS "emailEnabled", reminder_frequency AS "reminderFrequency", quiet_hours_start AS "quietHoursStart", quiet_hours_end AS "quietHoursEnd" FROM notification_settings WHERE member_id = $1 AND group_id = $2`,
    [memberId, groupId]
  );
  return result.rows[0] || { pushEnabled: true, emailEnabled: false, reminderFrequency: "24h" };
}

export async function updateNotificationSettings(memberId: string, groupId: string, settings: { pushEnabled?: boolean; emailEnabled?: boolean; reminderFrequency?: string; quietHoursStart?: string; quietHoursEnd?: string }) {
  const db = await ready();
  if (!db) return true;
  const id = `ns_${memberId}_${groupId}`;
  await db.query(
    `INSERT INTO notification_settings (id, member_id, group_id, push_enabled, email_enabled, reminder_frequency, quiet_hours_start, quiet_hours_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (member_id, group_id) DO UPDATE SET
       push_enabled = COALESCE(EXCLUDED.push_enabled, notification_settings.push_enabled),
       email_enabled = COALESCE(EXCLUDED.email_enabled, notification_settings.email_enabled),
       reminder_frequency = COALESCE(EXCLUDED.reminder_frequency, notification_settings.reminder_frequency),
       quiet_hours_start = COALESCE(EXCLUDED.quiet_hours_start, notification_settings.quiet_hours_start),
       quiet_hours_end = COALESCE(EXCLUDED.quiet_hours_end, notification_settings.quiet_hours_end)`,
    [id, memberId, groupId, settings.pushEnabled ?? true, settings.emailEnabled ?? false, settings.reminderFrequency ?? "24h", settings.quietHoursStart ?? null, settings.quietHoursEnd ?? null]
  );
  return true;
}

export async function updateGroupSettings(groupId: string, settings: { name?: string; pinCode?: string | null; requireApproval?: boolean }) {
  const db = await ready();
  if (!db) return true;
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (settings.name !== undefined) { updates.push(`name = $${idx++}`); values.push(settings.name); }
  if (settings.pinCode !== undefined) { updates.push(`pin_code = $${idx++}`); values.push(settings.pinCode); }
  if (settings.requireApproval !== undefined) { updates.push(`require_approval = $${idx++}`); values.push(settings.requireApproval); }
  if (updates.length === 0) return true;
  updates.push(`updated_at = NOW()`);
  values.push(groupId);
  await db.query(`UPDATE groups SET ${updates.join(', ')} WHERE id = $${idx}`, values);
  return true;
}

export async function refundExpensePayment(paymentId: string, note?: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(
    `UPDATE payments SET status = 'pending', request_note = COALESCE($2, request_note), responded_at = NULL WHERE id = $1 AND status IN ('refused', 'disputed')`,
    [paymentId, note ?? null]
  )).rowCount === 1;
}

export async function resendPaymentRequest(paymentId: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(
    `UPDATE payments SET status = 'pending', attempt_count = attempt_count + 1, responded_at = NULL WHERE id = $1 AND status IN ('pending', 'refused', 'late')`,
    [paymentId]
  )).rowCount === 1;
}

export async function cancelPaymentRequest(paymentId: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(
    `DELETE FROM payments WHERE id = $1 AND status = 'pending'`,
    [paymentId]
  )).rowCount === 1;
}

export async function disputePayment(paymentId: string, note: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(
    `UPDATE payments SET status = 'disputed', dispute_note = $2, responded_at = NOW() WHERE id = $1 AND status = 'completed'`,
    [paymentId, note]
  )).rowCount === 1;
}

export async function markAsPaid(paymentId: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(
    `UPDATE payments SET status = 'paid', paid_at = NOW() WHERE id = $1 AND status IN ('pending', 'late', 'accepted', 'disputed')`,
    [paymentId]
  )).rowCount === 1;
}

export async function confirmReceipt(paymentId: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(
    `UPDATE payments SET status = 'completed', confirmed_at = NOW(), responded_at = NOW() WHERE id = $1 AND status IN ('accepted', 'paid', 'disputed')`,
    [paymentId]
  )).rowCount === 1;
}

export async function reportNotReceived(paymentId: string, note: string) {
  const db = await ready();
  if (!db) return false;
  return (await db.query(
    `UPDATE payments SET status = 'disputed', dispute_note = $2, responded_at = NOW() WHERE id = $1 AND status IN ('accepted', 'paid')`,
    [paymentId, note]
  )).rowCount === 1;
}

export async function addPaymentComment(paymentId: string, memberId: string, memberName: string, content: string) {
  const db = await ready();
  if (!db) return { id: `comment_${Date.now()}`, paymentId, memberId, memberName, content, createdAt: new Date().toISOString() };
  const id = `comment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.query(
    `INSERT INTO payment_comments (id, payment_id, member_id, member_name, content) VALUES ($1, $2, $3, $4, $5)`,
    [id, paymentId, memberId, memberName, content],
  );
  return { id, paymentId, memberId, memberName, content, createdAt: new Date().toISOString() };
}

export async function getPaymentComments(paymentId: string) {
  const db = await ready();
  if (!db) return [];
  const result = await db.query(
    `SELECT id, payment_id AS "paymentId", member_id AS "memberId", member_name AS "memberName", content, created_at AS "createdAt" FROM payment_comments WHERE payment_id = $1 ORDER BY created_at ASC`,
    [paymentId],
  );
  return result.rows;
}

export async function getGroupStats(groupId: string, month?: string) {
  const db = await ready();
  if (!db) return { totalExpenses: 0, totalCount: 0, byCategory: [], byMember: [], monthly: [] };

  const monthFilter = month ? `AND date_trunc('month', date) = $2` : '';
  const params = month ? [groupId, month] : [groupId];

  const [totalResult, byCategory, byMember, monthly] = await Promise.all([
    db.query(`SELECT COALESCE(SUM(amount), 0) AS "totalExpenses", COUNT(*) AS "totalCount" FROM expenses WHERE group_id = $1 ${monthFilter}`, params),
    db.query(`SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE group_id = $1 ${monthFilter} GROUP BY category ORDER BY total DESC`, params),
    db.query(`SELECT payer_id AS "memberId", COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE group_id = $1 ${monthFilter} GROUP BY payer_id ORDER BY total DESC`, params),
    db.query(`SELECT to_char(date, 'YYYY-MM') AS month, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE group_id = $1 GROUP BY to_char(date, 'YYYY-MM') ORDER BY month DESC LIMIT 12`, [groupId]),
  ]);

  return {
    totalExpenses: parseFloat(totalResult.rows[0]?.totalExpenses || "0"),
    totalCount: parseInt(totalResult.rows[0]?.totalCount || "0"),
    byCategory: byCategory.rows,
    byMember: byMember.rows,
    monthly: monthly.rows,
  };
}

export async function exportExpensesCSV(groupId: string) {
  const db = await ready();
  if (!db) return "";
  const result = await db.query(
    `SELECT description, amount, category, payer_id AS "payerId", participants, date, created_at AS "createdAt" FROM expenses WHERE group_id = $1 ORDER BY date`,
    [groupId]
  );
  const header = "Description,Montant,Categorie,Payeur,Participants,Date\n";
  const rows = result.rows.map((r: any) =>
    `"${String(r.description).replace(/"/g, '""')}",${r.amount},"${r.category}","${r.payerId}","${JSON.stringify(r.participants)}","${r.date}"`
  ).join("\n");
  return header + rows;
}

export async function resetAllGroupData(groupId: string) {
  const db = await ready();
  if (!db) {
    updateStorage("expenses", []);
    updateStorage("members", []);
    updateStorage("pendingPayments", []);
    updateStorage("completedPayments", []);
    return true;
  }
  await db.query(`DELETE FROM expenses WHERE group_id = $1`, [groupId]);
  await db.query(`DELETE FROM payment_comments WHERE payment_id IN (SELECT id FROM payments WHERE group_id = $1)`, [groupId]);
  await db.query(`DELETE FROM payments WHERE group_id = $1`, [groupId]);
  await db.query(`DELETE FROM activity_history WHERE group_id = $1`, [groupId]);
  await db.query(`DELETE FROM notifications WHERE group_id = $1`, [groupId]);
  await db.query(`DELETE FROM notification_settings WHERE group_id = $1`, [groupId]);
  await db.query(`DELETE FROM expense_categories WHERE group_id = $1 AND is_default = FALSE`, [groupId]);
  await db.query(`DELETE FROM group_invites WHERE group_id = $1`, [groupId]);
  await db.query(`UPDATE groups SET share_url = NULL WHERE id = $1`, [groupId]);
  return true;
}
