import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

export const groups = mysqlTable("groups", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  shareUrl: text("shareUrl"),
  pinCode: varchar("pinCode", { length: 32 }),
  requireApproval: boolean("requireApproval").default(false).notNull(),
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
  role: varchar("role", { length: 16 }).default("member").notNull(),
  status: varchar("status", { length: 16 }).default("active").notNull(),
  userId: varchar("userId", { length: 128 }),
  credentialId: text("credentialId"),
  biometricEnabled: text("biometricEnabled").default("false"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
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
  status: varchar("status", { length: 16 }).default("validated").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurrenceInterval: varchar("recurrenceInterval", { length: 16 }),
  recurrenceEndDate: timestamp("recurrenceEndDate"),
  validatedBy: varchar("validatedBy", { length: 64 }),
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
  originalAmount: decimal("originalAmount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  expenseId: varchar("expenseId", { length: 128 }),
  notificationCount: int("notificationCount").default(1),
  attemptCount: int("attemptCount").default(1),
  isGroupRequest: boolean("isGroupRequest").default(false),
  requestGroupId: varchar("requestGroupId", { length: 128 }),
  requestNote: text("requestNote"),
  acceptNote: text("acceptNote"),
  paidAt: timestamp("paidAt"),
  confirmedAt: timestamp("confirmedAt"),
  disputeNote: text("disputeNote"),
  date: timestamp("date").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
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

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }),
  memberId: varchar("memberId", { length: 64 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  data: json("data"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const notificationSettings = mysqlTable("notification_settings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  memberId: varchar("memberId", { length: 64 }).notNull(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  pushEnabled: boolean("pushEnabled").default(true).notNull(),
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
  reminderFrequency: varchar("reminderFrequency", { length: 16 }).default("24h"),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }),
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

export const expenseCategories = mysqlTable("expense_categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  emoji: varchar("emoji", { length: 8 }).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

export const groupInvites = mysqlTable("group_invites", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt"),
  maxUses: int("maxUses"),
  usedCount: int("usedCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupInvite = typeof groupInvites.$inferSelect;
export type InsertGroupInvite = typeof groupInvites.$inferInsert;
