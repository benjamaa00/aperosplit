import { readStorage, writeStorage, getStorage, updateStorage } from "./jsonStorage";

// JSON Storage Implementation (no database required)

export async function getDb() {
  // Return null since we're using JSON storage
  return null;
}

export async function upsertUser(user: any): Promise<void> {
  // Not needed for JSON storage
  console.warn("[JSON Storage] upsertUser not implemented");
}

export async function getUserByOpenId(openId: string) {
  // Not needed for JSON storage
  console.warn("[JSON Storage] getUserByOpenId not implemented");
  return undefined;
}

// Group operations
export async function getOrCreateGroup(groupId: string) {
  const data = readStorage();
  return { id: groupId, shareUrl: JSON.stringify(data.members) };
}

export async function getGroupData(groupId: string) {
  const data = readStorage();
  return {
    group: { id: groupId, shareUrl: JSON.stringify(data.members) },
    expenses: data.expenses,
    settlements: [], // Not used in current implementation
    pending: data.pendingPayments,
    history: data.completedPayments,
  };
}

export async function addMembers(groupId: string, members: any[]) {
  const currentMembers = getStorage("members");
  updateStorage("members", members);
  return true;
}

export async function addExpense(expense: any) {
  const expenses = getStorage("expenses");
  expenses.push(expense);
  updateStorage("expenses", expenses);
  return true;
}

export async function deleteExpense(expenseId: string) {
  const expenses = getStorage("expenses");
  const filtered = expenses.filter((e: any) => e.id !== expenseId);
  updateStorage("expenses", filtered);
  return true;
}

export async function addPendingPayment(payment: any) {
  const pendingPayments = getStorage("pendingPayments");
  pendingPayments.push(payment);
  updateStorage("pendingPayments", pendingPayments);
  return true;
}

export async function confirmPayment(paymentId: string, fromId: string, toId: string, amount: string) {
  const pendingPayments = getStorage("pendingPayments");
  const completedPayments = getStorage("completedPayments");
  
  // Find and update pending payment
  const paymentIndex = pendingPayments.findIndex((p: any) => p.id === paymentId);
  if (paymentIndex === -1) return false;
  
  const payment = pendingPayments[paymentIndex];
  payment.status = "completed";
  payment.respondedAt = new Date().toISOString();
  
  // Move to completed
  pendingPayments.splice(paymentIndex, 1);
  completedPayments.unshift(payment);
  
  updateStorage("pendingPayments", pendingPayments);
  updateStorage("completedPayments", completedPayments);
  
  return true;
}

export async function refusePayment(paymentId: string) {
  const pendingPayments = getStorage("pendingPayments");
  const paymentIndex = pendingPayments.findIndex((p: any) => p.id === paymentId);
  if (paymentIndex === -1) return false;
  
  pendingPayments[paymentIndex].status = "refused";
  pendingPayments[paymentIndex].respondedAt = new Date().toISOString();
  
  updateStorage("pendingPayments", pendingPayments);
  return true;
}

export async function addHistoryEntry(entry: any) {
  const history = getStorage("completedPayments");
  history.push(entry);
  updateStorage("completedPayments", history);
  return true;
}

export async function updateGroupShareUrl(groupId: string, shareUrl: string) {
  // Members are stored in shareUrl
  const members = JSON.parse(shareUrl);
  updateStorage("members", members);
  return true;
}

export async function updateMemberBiometric(memberId: string, enabled: boolean) {
  const biometricEnabled = getStorage("biometricEnabled");
  biometricEnabled[memberId] = enabled;
  updateStorage("biometricEnabled", biometricEnabled);
  return true;
}
