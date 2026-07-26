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
        {/* ── Content scrolls behind the fixed nav ── */}
        <div className="min-h-screen overflow-y-auto scrollbar-hidden" style={{ paddingBottom: activeTab ? "calc(88px + env(safe-area-inset-bottom, 0px) + 16px)" : undefined }}>
          {children}
        </div>

        {/* ── Liquid Glass Navigation Bar — fixed at bottom ── */}
        {activeTab && onTabChange && (
          <nav
            data-tutorial="tab-bar"
            className="fixed left-3 right-3 z-50 pointer-events-none"
            style={{ bottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="pointer-events-auto">
              <div
                ref={navRef}
                className="relative flex items-center gap-1 rounded-[32px] px-2 py-2 mx-auto max-w-md"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.045))",
                  backdropFilter: "blur(28px) saturate(160%) contrast(105%)",
                  WebkitBackdropFilter: "blur(28px) saturate(160%) contrast(105%)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.04)",
                }}
              >
                {/* ── Left tabs: Accueil, Soldes ── */}
                {navTabs.slice(0, 2).map(({ id, Icon, label }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      ref={(el) => { if (el) tabRefs.current.set(id, el); }}
                      data-tutorial={`tab-${id}`}
                      onClick={() => switchTab(id)}
                      aria-label={label}
                      className={`relative z-10 flex flex-col items-center gap-px min-w-[52px] px-2 py-1.5 rounded-2xl transition-all duration-[250ms] ease-out cursor-pointer ${
                        isActive ? "text-white" : "text-white/55"
                      }`}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 2 : 1.5}
                        className={`transition-all duration-[250ms] ${isActive ? "drop-shadow-[0_0_6px_rgba(128,80,240,0.5)]" : ""}`}
                      />
                      <span className={`text-[11px] font-medium tracking-wide transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-55"}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}

                {/* Center spacer for FAB */}
                <div className="w-16 shrink-0" />

                {/* ── Right tabs: Historique, Profil ── */}
                {navTabs.slice(2).map(({ id, Icon, label }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      ref={(el) => { if (el) tabRefs.current.set(id, el); }}
                      data-tutorial={`tab-${id}`}
                      onClick={() => switchTab(id)}
                      aria-label={label}
                      className={`relative z-10 flex flex-col items-center gap-px min-w-[52px] px-2 py-1.5 rounded-2xl transition-all duration-[250ms] ease-out cursor-pointer ${
                        isActive ? "text-white" : "text-white/55"
                      }`}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 2 : 1.5}
                        className={`transition-all duration-[250ms] ${isActive ? "drop-shadow-[0_0_6px_rgba(128,80,240,0.5)]" : ""}`}
                      />
                      <span className={`text-[11px] font-medium tracking-wide transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-55"}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}

                {/* ── Active capsule pill ── */}
                {pill.ready && (
                  <div
                    className="absolute top-1.5 bottom-1.5 rounded-2xl nav-pill pointer-events-none transition-all duration-[300ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{
                      left: pill.left,
                      width: pill.width,
                      background: "rgba(255,255,255,0.10)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 6px 18px rgba(0,0,0,0.16)",
                    }}
                  />
                )}
              </div>

              {/* ═══ Central FAB — Liquid Glass violet lens ═══ */}
              <button
                onClick={handleFab}
                className="absolute left-1/2 -translate-x-1/2 -top-4 nav-fab group cursor-pointer"
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label="Ajouter une dépense"
              >
                {/* Breathing glow */}
                <div className="absolute -inset-3 rounded-full blur-xl nav-fab-glow pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(126,87,255,0.20) 0%, rgba(92,54,220,0.08) 60%, transparent 100%)" }}
                />

                {/* Button body */}
                <div
                  className="relative w-[66px] h-[66px] rounded-full flex items-center justify-center transition-transform duration-[250ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-[0.94]"
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
          </nav>
        )}
      </TooltipProvider>
    </ErrorBoundary>
  );
});

AppShell.displayName = "AppShell";

export { AppShell };
