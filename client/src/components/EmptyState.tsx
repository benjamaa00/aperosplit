import { memo } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = memo(function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <div className="empty-state-glow" />
        <Icon size={28} strokeWidth={1.75} className="relative z-10" />
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-description">{description}</p>
      {action && (
        <button onClick={action.onClick} className="empty-state-action">
          {action.label}
        </button>
      )}
    </div>
  );
});

EmptyState.displayName = "EmptyState";
