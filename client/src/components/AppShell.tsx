import { memo, useRef, useEffect, useState, useCallback, type ReactNode } from "react";
import { Home, Scale, History, User, Plus, type LucideIcon } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { haptics } from "../utils/haptics";
import type { Tab } from "../types";

interface AppShellProps {
  children: ReactNode;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onAddExpense?: () => void;
}

const AppShell = memo(({ children, activeTab, onTabChange, onAddExpense }: AppShellProps) => {
  const tabRefs = useRef<Map<Tab, HTMLButtonElement>>(new Map());
  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    if (!activeTab || !tabRefs.current.has(activeTab)) return;
    const el = tabRefs.current.get(activeTab)!;
    const nav = navRef.current;
    if (!el || !nav) return;
    const e = el.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    setPill({ left: e.left - n.left, width: e.width, ready: true });
  }, [activeTab]);

  const switchTab = useCallback((tab: Tab) => {
    if (!onTabChange) return;
    haptics.light();
    onTabChange(tab);
  }, [onTabChange]);

  const handleFab = useCallback(() => {
    haptics.medium();
    onAddExpense?.();
  }, [onAddExpense]);

  return (
    <ErrorBoundary>
      <TooltipProvider>
        {/* ── Content scrolls behind the fixed nav ── */}
        <div
          className="min-h-screen overflow-y-auto scrollbar-hidden"
          style={{ paddingBottom: activeTab ? "calc(110px + env(safe-area-inset-bottom, 0px))" : undefined }}
        >
          {children}
        </div>

        {/* ── Liquid Glass Navigation Bar — fixed, CSS Grid ── */}
        {activeTab && onTabChange && (
          <nav
            data-tutorial="tab-bar"
            className="fixed left-4 right-4 z-50"
            style={{ bottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}
          >
            {/* ── Glass bar surface ── */}
            <div
              ref={navRef}
              className="relative mx-auto max-w-md rounded-[32px] overflow-visible"
              style={{
                height: "74px",
                background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035))",
                backdropFilter: "blur(24px) saturate(150%)",
                WebkitBackdropFilter: "blur(24px) saturate(150%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 14px 38px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
              }}
            >
              {/* ── 5-column Grid ── */}
              <div
                className="grid h-full items-center px-1"
                style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
              >
                {/* ── Column 1: Accueil ── */}
                <TabButton
                  id="home"
                  label="Accueil"
                  activeTab={activeTab}
                  onSwitch={switchTab}
                  tabRefs={tabRefs}
                  gridCol={1}
                />

                {/* ── Column 2: Soldes ── */}
                <TabButton
                  id="balances"
                  label="Soldes"
                  activeTab={activeTab}
                  onSwitch={switchTab}
                  tabRefs={tabRefs}
                  gridCol={2}
                />

                {/* ── Column 3: Add button (center) ── */}
                <div className="flex items-center justify-center" style={{ gridColumn: 3 }}>
                  <button
                    onClick={handleFab}
                    className="nav-fab group cursor-pointer relative -top-3"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    aria-label="Ajouter une dépense"
                  >
                    {/* Breathing glow */}
                    <div
                      className="absolute -inset-3 rounded-full blur-xl nav-fab-glow pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, rgba(126,87,255,0.20) 0%, rgba(92,54,220,0.08) 60%, transparent 100%)",
                      }}
                    />
                    {/* Button body — Liquid Glass violet lens */}
                    <div
                      className="relative w-[62px] h-[62px] rounded-full flex items-center justify-center transition-transform duration-[250ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-[0.94]"
                      style={{
                        background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.30), rgba(126,87,255,0.72) 42%, rgba(92,54,220,0.76) 100%)",
                        backdropFilter: "blur(22px) saturate(180%)",
                        WebkitBackdropFilter: "blur(22px) saturate(180%)",
                        border: "1px solid rgba(255,255,255,0.22)",
                        boxShadow: "0 10px 30px rgba(91,61,220,0.38), inset 0 1px 0 rgba(255,255,255,0.30)",
                      }}
                    >
                      <Plus size={24} strokeWidth={2.5} className="relative z-10 text-white" />
                    </div>
                  </button>
                </div>

                {/* ── Column 4: Historique ── */}
                <TabButton
                  id="history"
                  label="Historique"
                  activeTab={activeTab}
                  onSwitch={switchTab}
                  tabRefs={tabRefs}
                  gridCol={4}
                />

                {/* ── Column 5: Profil ── */}
                <TabButton
                  id="profile"
                  label="Profil"
                  activeTab={activeTab}
                  onSwitch={switchTab}
                  tabRefs={tabRefs}
                  gridCol={5}
                />
              </div>

              {/* ── Active capsule pill ── */}
              {pill.ready && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 rounded-[18px] nav-pill pointer-events-none transition-all duration-[300ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{
                    left: pill.left,
                    width: pill.width,
                    height: "36px",
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 6px 18px rgba(0,0,0,0.16)",
                  }}
                />
              )}
            </div>
          </nav>
        )}
      </TooltipProvider>
    </ErrorBoundary>
  );
});

// ── Tab button sub-component ──
const TabButton = memo(({
  id, label, activeTab, onSwitch, tabRefs, gridCol,
}: {
  id: Tab;
  label: string;
  activeTab: Tab;
  onSwitch: (tab: Tab) => void;
  tabRefs: React.MutableRefObject<Map<Tab, HTMLButtonElement>>;
  gridCol: number;
}) => {
  const isActive = activeTab === id;
  const Icon = TAB_ICONS[id];

  return (
    <div className="flex items-center justify-center" style={{ gridColumn: gridCol }}>
      <button
        ref={(el) => { if (el) tabRefs.current.set(id, el); }}
        data-tutorial={`tab-${id}`}
        onClick={() => onSwitch(id)}
        aria-label={label}
        className={`flex flex-col items-center justify-center gap-1 min-w-[52px] px-2 py-1 rounded-2xl transition-all duration-[250ms] ease-out cursor-pointer ${
          isActive ? "text-white" : "text-white/55"
        }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <Icon
          size={22}
          strokeWidth={isActive ? 2 : 1.5}
          className={`transition-all duration-[250ms] ${isActive ? "drop-shadow-[0_0_6px_rgba(128,80,240,0.5)]" : ""}`}
        />
        <span className={`text-[11px] font-medium tracking-wide transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-55"}`}>
          {label}
        </span>
      </button>
    </div>
  );
});

TabButton.displayName = "TabButton";

// ── Icon lookup ──
const TAB_ICONS: Record<Tab, LucideIcon> = {
  home: Home,
  expenses: Home,
  balances: Scale,
  stats: Scale,
  history: History,
  profile: User,
};

AppShell.displayName = "AppShell";

export { AppShell };
