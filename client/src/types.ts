export interface Member {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  status?: string;
  userId?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  category: string;
  categoryEmoji: string;
  date: number;
  participants: string[];
  photoUrl?: string;
  status?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
}

export interface PendingPayment {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  originalAmount?: number;
  status: "pending" | "accepted" | "refused" | "resent" | "in_progress" | "completed" | "late" | "disputed" | "paid";
  response?: "accepted" | "refused";
  expenseId?: string;
  createdAt: number;
  respondedAt?: number;
  completedAt?: number;
  confirmedBy?: string;
  comment?: string;
  attemptCount?: number;
  disputeHistory?: Array<{ timestamp: number; comment: string; reportedBy: string }>;
  isGroupRequest?: boolean;
  groupId?: string;
  notificationSent: boolean;
  notificationCount: number;
  requestNote?: string;
  acceptNote?: string;
  paidAt?: number;
  confirmedAt?: number;
  disputeNote?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

export interface GroupCategory {
  id: string;
  name: string;
  emoji: string;
  isDefault: boolean;
}

export type Screen = "identity" | "lock" | "main" | "register" | "invite" | "access" | "groups" | "groupSettings" | "members" | "notifications" | "notificationSettings" | "reports" | "settings";
export type Tab = "home" | "expenses" | "balances" | "stats" | "history" | "profile";
