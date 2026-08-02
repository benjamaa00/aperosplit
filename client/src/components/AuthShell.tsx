import { type ReactNode } from "react";
import { motion, MotionConfig } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export const AUTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const AUTH_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: AUTH_EASE } },
};

const AUTH_CONTAINER_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--app-bg, var(--background))" }} />
      <motion.div
        className="absolute -right-24 -top-28 h-[26rem] w-[26rem] rounded-full"
        style={{ background: "var(--primary)", opacity: 0.12, filter: "blur(110px)" }}
        animate={{ x: [0, -36, 22, 0], y: [0, 30, -18, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -left-24 h-[24rem] w-[24rem] rounded-full"
        style={{ background: "var(--primary)", opacity: 0.08, filter: "blur(120px)" }}
        animate={{ x: [0, 30, -24, 0], y: [0, -24, 18, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}

interface AuthHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export function AuthHeader({ icon: Icon, title, subtitle }: AuthHeaderProps) {
  return (
    <motion.div variants={AUTH_ITEM_VARIANTS} className="mb-9 text-center">
      <motion.div
        className="relative mx-auto mb-5"
        style={{ width: "4.25rem", height: "4.25rem" }}
        initial={{ opacity: 0, scale: 0.65 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <div className="auth-icon-glow" />
        <div className="auth-icon-tile">
          <Icon size={26} strokeWidth={2.2} className="relative z-10 text-primary" />
        </div>
      </motion.div>
      <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </motion.div>
  );
}

interface AuthShellProps {
  children: ReactNode;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  flow?: boolean;
}

export function AuthShell({ children, icon, title, subtitle, footer, flow }: AuthShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-dvh w-full overflow-hidden">
        <AuthBackdrop />
        <div
          className={`relative z-10 mx-auto flex w-full max-w-sm flex-col px-6 ${
            flow ? "pt-6" : "justify-center py-10"
          } pb-[max(2rem,env(safe-area-inset-bottom,0px))]`}
        >
          <motion.div
            className={flow ? "flex flex-1 flex-col" : "flex flex-col"}
            initial="hidden"
            animate="show"
            variants={AUTH_CONTAINER_VARIANTS}
          >
            {icon && title ? (
              <AuthHeader icon={icon} title={title} subtitle={subtitle} />
            ) : null}
            {children}
          </motion.div>
          {footer ? (
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5, ease: AUTH_EASE }}
            >
              {footer}
            </motion.div>
          ) : null}
        </div>
      </div>
    </MotionConfig>
  );
}
