import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Équilibra Groupe - Shared group data
export const groups = mysqlTable("groups", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  shareUrl: text("shareUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

export const members = mysqlTable("members", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 10 }).notNull(),
  credentialId: text("credentialId"),
  biometricEnabled: text("biometricEnabled").default("false"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

export const expenses = mysqlTable("expenses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  payerId: varchar("payerId", { length: 64 }).notNull(),
  participants: json("participants").$type<string[]>().notNull(),
  photoUrl: text("photoUrl"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export const settlements = mysqlTable("settlements", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  fromId: varchar("fromId", { length: 64 }).notNull(),
  toId: varchar("toId", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Settlement = typeof settlements.$inferSelect;
export type InsertSettlement = typeof settlements.$inferInsert;

export const pendingPayments = mysqlTable("pending_payments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  fromId: varchar("fromId", { length: 64 }).notNull(),
  fromName: varchar("fromName", { length: 255 }).notNull(),
  toId: varchar("toId", { length: 64 }).notNull(),
  toName: varchar("toName", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "refused"]).default("pending").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PendingPayment = typeof pendingPayments.$inferSelect;
export type InsertPendingPayment = typeof pendingPayments.$inferInsert;

export const history = mysqlTable("history", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  authorId: varchar("authorId", { length: 64 }),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  fromId: varchar("fromId", { length: 64 }),
  toId: varchar("toId", { length: 64 }),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type History = typeof history.$inferSelect;
export type InsertHistory = typeof history.$inferInsert;