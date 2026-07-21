import { memo } from "react";

export const BalanceCardSkeleton = memo(function BalanceCardSkeleton() {
  return (
    <div className="skeleton rounded-3xl h-48 w-full" />
  );
});

export const ExpenseCardSkeleton = memo(function ExpenseCardSkeleton() {
  return (
    <div className="glass-card-enhanced rounded-[1.25rem] p-4 flex items-center gap-3">
      <div className="skeleton skeleton-circle w-11 h-11 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton skeleton-text w-3/4" />
        <div className="skeleton skeleton-text w-1/2" />
      </div>
      <div className="skeleton skeleton-text-lg w-16" />
    </div>
  );
});

export const PaymentCardSkeleton = memo(function PaymentCardSkeleton() {
  return (
    <div className="glass-card-enhanced rounded-[1.25rem] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton skeleton-circle w-10 h-10" />
          <div className="skeleton skeleton-circle w-10 h-10" />
        </div>
        <div className="skeleton skeleton-text w-16 h-6 rounded-full" />
      </div>
      <div className="skeleton skeleton-text-lg w-24" />
      <div className="flex gap-2">
        <div className="skeleton h-10 flex-1 rounded-xl" />
        <div className="skeleton h-10 flex-1 rounded-xl" />
      </div>
    </div>
  );
});

export const ListSkeleton = memo(function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <ExpenseCardSkeleton key={i} />
      ))}
    </div>
  );
});

export const StatsSkeleton = memo(function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-24 rounded-[1.25rem]" />
        <div className="skeleton h-24 rounded-[1.25rem]" />
      </div>
      <div className="skeleton h-48 rounded-[1.25rem]" />
      <div className="skeleton h-48 rounded-[1.25rem]" />
    </div>
  );
});

export const TabContentSkeleton = memo(function TabContentSkeleton() {
  return (
    <div className="max-w-md mx-auto px-5 pt-16 space-y-4">
      <div className="skeleton skeleton-text-lg w-40" />
      <div className="skeleton h-40 rounded-3xl" />
      <ListSkeleton count={3} />
    </div>
  );
});

BalanceCardSkeleton.displayName = "BalanceCardSkeleton";
ExpenseCardSkeleton.displayName = "ExpenseCardSkeleton";
PaymentCardSkeleton.displayName = "PaymentCardSkeleton";
ListSkeleton.displayName = "ListSkeleton";
StatsSkeleton.displayName = "StatsSkeleton";
TabContentSkeleton.displayName = "TabContentSkeleton";
