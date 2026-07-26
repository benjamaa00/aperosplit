import { memo, useRef, useEffect, useState, useCallback, type ReactNode } from "react";
import { Home, Scale, History, User, Plus } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { haptics } from "../utils/haptics";
import type { Tab } from "../types";

const navTabs = [
  { id: "home" as Tab, Icon: Home, label: "Accueil" },
  { id: "balances" as Tab, Icon: Scale, label: "Soldes" },
  { id: "history" as Tab, Icon: History, label: "Historique" },
  { id: "profile" as Tab, Icon: User, label: "Profil" },
];

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
        <div className="flex flex-col h-[100dvh] h-screen overflow-hidden">
          {/* ── Scrollable content area ── */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
            {children}
          </div>

          {/* ── Floating nav bar — in-flow, not fixed ── */}
          {activeTab && onTabChange && (
            <nav data-tutorial="tab-bar" className="shrink-0 z-40 pointer-events-none">
              <div className="flex justify-center px-5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1.5 pointer-events-auto">
                <div className="relative">

                  {/* ═══ Glass Island ═══ */}
                  <div
                    ref={navRef}
                    className="relative flex items-center gap-1 bg-[rgba(18,18,28,0.72)] backdrop-blur-[28px] rounded-[34px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] px-2 py-2"
                  >
                    {/* Inner highlight + subtle border */}
                    <div className="absolute inset-0 rounded-[34px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_0_0_0.5px_rgba(255,255,255,0.04)] pointer-events-none" />

                    {/* ── Left tabs: Home, Balances ── */}
                    {navTabs.slice(0, 2).map(({ id, Icon, label }) => {
                      const isActive = activeTab === id;
                      return (
                        <button
                          key={id}
                          ref={(el) => { if (el) tabRefs.current.set(id, el); }}
                          data-tutorial={`tab-${id}`}
                          onClick={() => switchTab(id)}
                          aria-label={label}
                          className={`relative z-10 flex flex-col items-center gap-px min-w-[52px] px-2 py-1.5 rounded-2xl transition-all duration-[250ms] ease-out ${
                            isActive ? "text-white" : "text-white/40 active:text-white/60"
                          }`}
                        >
                          <Icon
                            size={20}
                            strokeWidth={isActive ? 2 : 1.5}
                            className={`transition-all duration-[250ms] ${isActive ? "drop-shadow-[0_0_8px_rgba(128,80,240,0.6)]" : ""}`}
                          />
                          <span className={`text-[9px] font-medium tracking-wide transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-55"}`}>
                            {label}
                          </span>
                        </button>
                      );
                    })}

                    {/* Center spacer for FAB */}
                    <div className="w-16 shrink-0" />

                    {/* ── Right tabs: History, Profile ── */}
                    {navTabs.slice(2).map(({ id, Icon, label }) => {
                      const isActive = activeTab === id;
                      return (
                        <button
                          key={id}
                          ref={(el) => { if (el) tabRefs.current.set(id, el); }}
                          data-tutorial={`tab-${id}`}
                          onClick={() => switchTab(id)}
                          aria-label={label}
                          className={`relative z-10 flex flex-col items-center gap-px min-w-[52px] px-2 py-1.5 rounded-2xl transition-all duration-[250ms] ease-out ${
                            isActive ? "text-white" : "text-white/40 active:text-white/60"
                          }`}
                        >
                          <Icon
                            size={20}
                            strokeWidth={isActive ? 2 : 1.5}
                            className={`transition-all duration-[250ms] ${isActive ? "drop-shadow-[0_0_8px_rgba(128,80,240,0.6)]" : ""}`}
                          />
                          <span className={`text-[9px] font-medium tracking-wide transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-55"}`}>
                            {label}
                          </span>
                        </button>
                      );
                    })}

                    {/* ── Animated Pill ── */}
                    {pill.ready && (
                      <div
                        className="absolute top-1.5 bottom-1.5 rounded-2xl bg-white/[0.07] nav-pill pointer-events-none"
                        style={{
                          left: pill.left,
                          width: pill.width,
                          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 0 14px rgba(128,80,240,0.12)",
                        }}
                      />
                    )}
                  </div>

                  {/* ═══ Center FAB ═══ */}
                  <button
                    onClick={handleFab}
                    className="absolute left-1/2 -translate-x-1/2 -top-5 nav-fab group"
                    aria-label="Ajouter une dépense"
                  >
                    {/* Breathing glow halo */}
                    <div className="absolute -inset-4 rounded-full bg-purple-500/15 blur-2xl nav-fab-glow pointer-events-none" />

                    {/* Button body */}
                    <div className="relative w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[rgba(128,80,240,0.92)] via-[rgba(109,74,255,0.96)] to-[rgba(80,50,200,1)] shadow-[0_8px_32px_rgba(109,74,255,0.45)] flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-[0.9]">
                      {/* Glass highlight */}
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),inset_0_-1px_0_0_rgba(0,0,0,0.15)] pointer-events-none" />
                      <Plus size={26} strokeWidth={2.5} className="relative z-10 text-white" />
                    </div>
                  </button>

                  {/* Ambient glow under island */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2/3 h-6 bg-purple-500/[0.08] blur-2xl rounded-full pointer-events-none" />
                </div>
              </div>
            </nav>
          )}
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
});

AppShell.displayName = "AppShell";

export { AppShell };
