import { memo } from "react";

export const BalanceCardSkeleton = memo(function BalanceCardSkeleton() {
  return (
    <div className="rounded-3xl h-48 w-full skeleton overflow-hidden">
      <div className="p-6 space-y-3">
        <div className="skeleton-text w-20 opacity-30" />
        <div className="skeleton-text-lg w-32 opacity-30" />
        <div className="skeleton-text w-40 opacity-30 mt-2" />
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <div className="skeleton-text w-24 opacity-30" />
            <div className="skeleton-text w-16 opacity-30 mt-1" />
          </div>
          <div>
            <div className="skeleton-text w-20 opacity-30" />
            <div className="skeleton-text w-16 opacity-30 mt-1" />
          </div>
        </div>
      </div>
    </div>
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
        <div className="flex items-center gap-2">
          <div className="skeleton skeleton-circle w-10 h-10" />
          <div className="skeleton w-5 h-[2px]" />
          <div className="skeleton skeleton-circle w-10 h-10" />
        </div>
        <div className="skeleton skeleton-text w-16 h-6 rounded-full" />
      </div>
      <div className="skeleton skeleton-text-lg w-24" />
      <div className="skeleton skeleton-text w-full" />
      <div className="flex gap-2">
        <div className="skeleton h-10 flex-1 rounded-xl" />
        <div className="skeleton h-10 flex-1 rounded-xl" />
      </div>
    </div>
  );
});

export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="max-w-md mx-auto px-5 pt-16 space-y-5">
      {/* Greeting */}
      <div className="space-y-2">
        <div className="skeleton skeleton-text w-24" />
        <div className="skeleton skeleton-text-lg w-40" />
      </div>
      <BalanceCardSkeleton />
      {/* Budget */}
      <div className="glass-card-enhanced rounded-[1.25rem] p-4 space-y-3">
        <div className="flex justify-between">
          <div className="skeleton skeleton-text w-28" />
          <div className="skeleton skeleton-text w-12" />
        </div>
        <div className="skeleton h-3 rounded-full" />
        <div className="skeleton skeleton-text w-36" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card-enhanced rounded-[1.25rem] p-4 space-y-2">
          <div className="skeleton skeleton-text w-20" />
          <div className="skeleton skeleton-text-lg w-16" />
        </div>
        <div className="glass-card-enhanced rounded-[1.25rem] p-4 space-y-2">
          <div className="skeleton skeleton-text w-16" />
          <div className="skeleton skeleton-text-lg w-12" />
        </div>
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
    <div className="max-w-md mx-auto px-5 pt-16 space-y-5">
      <div className="skeleton skeleton-text-lg w-36" />
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card-enhanced rounded-[1.25rem] p-4 space-y-2">
          <div className="skeleton skeleton-text w-20" />
          <div className="skeleton skeleton-text-lg w-16" />
        </div>
        <div className="glass-card-enhanced rounded-[1.25rem] p-4 space-y-2">
          <div className="skeleton skeleton-text w-16" />
          <div className="skeleton skeleton-text-lg w-12" />
        </div>
      </div>
      <div className="glass-card-enhanced rounded-[1.25rem] p-4 space-y-3">
        <div className="skeleton skeleton-text w-32" />
        <div className="skeleton h-40 w-full rounded-xl" />
      </div>
      <div className="glass-card-enhanced rounded-[1.25rem] p-4 space-y-3">
        <div className="skeleton skeleton-text w-28" />
        <div className="skeleton h-40 w-full rounded-xl" />
      </div>
    </div>
  );
});

export const ProfileSkeleton = memo(function ProfileSkeleton() {
  return (
    <div className="max-w-md mx-auto px-5 pt-16 space-y-5">
      <div className="skeleton skeleton-text-lg w-32" />
      <div className="glass-card-enhanced rounded-[1.25rem] p-6 flex flex-col items-center gap-3">
        <div className="skeleton skeleton-circle w-20 h-20" />
        <div className="skeleton skeleton-text-lg w-28" />
        <div className="skeleton skeleton-text w-20" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="glass-card-enhanced rounded-[1.25rem] p-4 flex items-center gap-3">
            <div className="skeleton skeleton-circle w-10 h-10" />
            <div className="skeleton skeleton-text flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
});

export const TabContentSkeleton = memo(function TabContentSkeleton() {
  return <DashboardSkeleton />;
});

BalanceCardSkeleton.displayName = "BalanceCardSkeleton";
ExpenseCardSkeleton.displayName = "ExpenseCardSkeleton";
PaymentCardSkeleton.displayName = "PaymentCardSkeleton";
DashboardSkeleton.displayName = "DashboardSkeleton";
ListSkeleton.displayName = "ListSkeleton";
StatsSkeleton.displayName = "StatsSkeleton";
ProfileSkeleton.displayName = "ProfileSkeleton";
TabContentSkeleton.displayName = "TabContentSkeleton";
