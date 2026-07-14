import { motion } from "framer-motion";
import { Inbox, Receipt, Users, BarChart3, History, Wallet } from "lucide-react";

const iconMap = {
  inbox: Inbox,
  receipt: Receipt,
  users: Users,
  chart: BarChart3,
  history: History,
  wallet: Wallet,
};

interface EmptyStateProps {
  icon?: keyof typeof iconMap;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mb-5"
      >
        <Icon size={36} className="text-muted-foreground/40" />
      </motion.div>
      <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed">
        {description}
      </p>
      {action && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
          className="mt-5 bg-primary/10 text-primary font-semibold px-6 py-2.5 rounded-2xl text-sm border border-primary/20 hover:bg-primary/15 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
