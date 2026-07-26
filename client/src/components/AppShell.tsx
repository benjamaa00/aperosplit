import { memo, useRef, useEffect, useState, useCallback, type ReactNode } from "react";
import { Home, Scale, History, User, Plus, type LucideIcon } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { haptics } from "../utils/haptics";
import type { Tab } from "../types";

const TAB_ICONS: Record<Tab, LucideIcon> = {
  home: Home,
  expenses: Home,
  balances: Scale,
  stats: Scale,
  history: History,
  profile: User,
};

const NAV_TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Accueil" },
  { id: "balances", label: "Soldes" },
  { id: "history", label: "Historique" },
  { id: "profile", label: "Profil" },
];

interface AppShellProps {
  children: ReactNode;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onAddExpense?: () => void;
}

const AppShell = memo(({ children, activeTab, onTabChange, onAddExpense }: AppShellProps) => {
  const tabRefs = useRef<Map<Tab, HTMLDivElement>>(new Map());
  const navRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  // Measure active tab pill position
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
    // Scroll to top when switching tabs
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [onTabChange]);

  const handleFab = useCallback(() => {
    haptics.medium();
    onAddExpense?.();
  }, [onAddExpense]);

  return (
    <ErrorBoundary>
      <TooltipProvider>
        {/* ── Full-screen scroll container ── */}
        <div className="h-screen flex flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden"
          >
            {/* ── Page content ── */}
            <div className="min-h-full">
              {children}
            </div>

            {/* ── Liquid Glass Nav — sticky bottom, in-flow, NOT fixed ── */}
            {activeTab && onTabChange && (
              <div
                className="sticky bottom-0 z-50 px-3 pointer-events-none"
                style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))" }}
              >
                <nav
                  data-tutorial="tab-bar"
                  className="pointer-events-auto mx-auto max-w-md relative rounded-[28px] overflow-visible"
                  style={{
                    height: "72px",
                  }}
                >
                  {/* ═══ Liquid Glass Surface — multi-layer ═══ */}
                  <div
                    ref={navRef}
                    className="absolute inset-0 rounded-[28px]"
                    style={{
                      /* Layer 1: Base glass */
                      background: "linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.03) 100%)",
                      backdropFilter: "blur(26px) saturate(155%) brightness(103%)",
                      WebkitBackdropFilter: "blur(26px) saturate(155%) brightness(103%)",
                      /* Layer 2: Border + shadow */
                      border: "1px solid rgba(255,255,255,0.13)",
                      boxShadow: [
                        "0 12px 40px rgba(0,0,0,0.28)",
                        "0 2px 8px rgba(0,0,0,0.12)",
                        "inset 0 1px 0 rgba(255,255,255,0.16)",
                        "inset 0 -0.5px 0 rgba(255,255,255,0.05)",
                        "inset 0 0 20px rgba(255,255,255,0.03)",
                      ].join(", "),
                    }}
                  />

                  {/* ── 5-column Grid ── */}
                  <div
                    className="relative z-10 grid h-full items-center px-1"
                    style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
                  >
                    {/* Column 1 */}
                    <GridTab
                      id="home" label="Accueil"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={1}
                    />
                    {/* Column 2 */}
                    <GridTab
                      id="balances" label="Soldes"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={2}
                    />
                    {/* Column 3: Center FAB */}
                    <div className="flex items-center justify-center" style={{ gridColumn: 3 }}>
                      <button
                        onClick={handleFab}
                        className="nav-fab group cursor-pointer relative -top-3"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                        aria-label="Ajouter une dépense"
                      >
                        <div
                          className="absolute -inset-3 rounded-full blur-xl nav-fab-glow pointer-events-none"
                          style={{ background: "radial-gradient(circle, rgba(126,87,255,0.18) 0%, rgba(92,54,220,0.06) 60%, transparent 100%)" }}
                        />
                        <div
                          className="relative w-[60px] h-[60px] rounded-full flex items-center justify-center transition-transform duration-[250ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-[0.94]"
                          style={{
                            background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.28), rgba(126,87,255,0.68) 40%, rgba(92,54,220,0.72) 100%)",
                            backdropFilter: "blur(18px) saturate(170%)",
                            WebkitBackdropFilter: "blur(18px) saturate(170%)",
                            border: "1px solid rgba(255,255,255,0.20)",
                            boxShadow: "0 8px 28px rgba(91,61,220,0.35), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.10)",
                          }}
                        >
                          <Plus size={22} strokeWidth={2.5} className="relative z-10 text-white" />
                        </div>
                      </button>
                    </div>
                    {/* Column 4 */}
                    <GridTab
                      id="history" label="Historique"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={4}
                    />
                    {/* Column 5 */}
                    <GridTab
                      id="profile" label="Profil"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={5}
                    />
                  </div>

                  {/* ── Active capsule pill ── */}
                  {pill.ready && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded-[16px] nav-pill pointer-events-none transition-all duration-[280ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      style={{
                        left: pill.left,
                        width: pill.width,
                        height: "34px",
                        background: "rgba(255,255,255,0.09)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 14px rgba(0,0,0,0.12)",
                      }}
                    />
                  )}
                </nav>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
});

AppShell.displayName = "AppShell";

// ── Grid tab button ──
const GridTab = memo(({
  id, label, activeTab, onSwitch, tabRefs, col,
}: {
  id: Tab; label: string; activeTab: Tab;
  onSwitch: (tab: Tab) => void;
  tabRefs: React.MutableRefObject<Map<Tab, HTMLDivElement>>;
  col: number;
}) => {
  const isActive = activeTab === id;
  const Icon = TAB_ICONS[id];

  return (
    <div
      ref={(el) => { if (el) tabRefs.current.set(id, el); }}
      className="flex items-center justify-center"
      style={{ gridColumn: col }}
    >
      <button
        onClick={() => onSwitch(id)}
        aria-label={label}
        className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] px-1 py-1 rounded-2xl transition-all duration-[220ms] ease-out cursor-pointer select-none ${
          isActive ? "text-white" : "text-white/50"
        }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <Icon
          size={21}
          strokeWidth={isActive ? 2 : 1.5}
          className={`transition-all duration-[220ms] ${isActive ? "drop-shadow-[0_0_5px_rgba(128,80,240,0.45)]" : ""}`}
        />
        <span className={`text-[10px] font-medium tracking-wide leading-none transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-50"}`}>
          {label}
        </span>
      </button>
    </div>
  );
});

GridTab.displayName = "GridTab";

export { AppShell };
