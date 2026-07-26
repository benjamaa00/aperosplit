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

const NAV_STORAGE_KEY = "equilibra_nav_offset";
const LONG_PRESS_MS = 420;

interface AppShellProps {
  children: ReactNode;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onAddExpense?: () => void;
}

const AppShell = memo(({ children, activeTab, onTabChange, onAddExpense }: AppShellProps) => {
  const tabRefs = useRef<Map<Tab, HTMLButtonElement>>(new Map());
  const navRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  // ── Drag state ──
  const [navOffset, setNavOffset] = useState(() => {
    try {
      const saved = sessionStorage.getItem(NAV_STORAGE_KEY);
      return saved ? Math.max(-120, Math.min(0, parseInt(saved, 10) || 0)) : 0;
    } catch { return 0; }
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    active: false,
    startY: 0,
    startOffset: 0,
    longPressTimer: 0,
    moved: false,
  });

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

  // ── Long-press → drag handlers ──
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const d = dragRef.current;
    d.startY = e.clientY;
    d.startOffset = navOffset;
    d.moved = false;
    d.longPressTimer = window.setTimeout(() => {
      d.active = true;
      setIsDragging(true);
      haptics.medium();
    }, LONG_PRESS_MS);
  }, [navOffset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) {
      const dy = Math.abs(e.clientY - d.startY);
      if (dy > 8) clearTimeout(d.longPressTimer);
      return;
    }
    d.moved = true;
    const dy = e.clientY - d.startY;
    const maxUp = -140;
    const maxDown = 0;
    const next = Math.max(maxUp, Math.min(maxDown, d.startOffset + dy));
    setNavOffset(next);
    sessionStorage.setItem(NAV_STORAGE_KEY, String(next));
  }, []);

  const handlePointerUp = useCallback(() => {
    const d = dragRef.current;
    clearTimeout(d.longPressTimer);
    if (d.active) {
      d.active = false;
      setIsDragging(false);
    }
  }, []);

  useEffect(() => {
    return () => clearTimeout(dragRef.current.longPressTimer);
  }, []);

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="flex flex-col h-[100dvh] h-screen overflow-hidden">
          {/* ── Scrollable content area ── */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
            {children}
          </div>

          {/* ── Floating nav bar — Apple fluid glass, draggable ── */}
          {activeTab && onTabChange && (
            <nav
              ref={outerRef}
              data-tutorial="tab-bar"
              className="shrink-0 z-40 pointer-events-none"
              style={{ transform: `translateY(${navOffset}px)` }}
            >
              <div
                className={`flex justify-center px-5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1.5 pointer-events-auto select-none ${isDragging ? "transition-none" : "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div className="relative">

                  {/* ═══ Glass Island — Apple fluid glass ═══ */}
                  <div
                    ref={navRef}
                    className={`relative flex items-center gap-1 rounded-[34px] px-2 py-2 transition-shadow duration-300 ${
                      isDragging
                        ? "shadow-[0_24px_80px_rgba(0,0,0,0.50)]"
                        : "shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
                    }`}
                    style={{
                      /* Apple fluid glass: very transparent, thin blur */
                      background: "rgba(30,30,40,0.35)",
                      backdropFilter: "saturate(180%) blur(22px)",
                      WebkitBackdropFilter: "saturate(180%) blur(22px)",
                    }}
                  >
                    {/* Inner highlight — thin top edge (Apple signature) */}
                    <div
                      className="absolute inset-0 rounded-[34px] pointer-events-none"
                      style={{
                        boxShadow: "inset 0 0.5px 0 0 rgba(255,255,255,0.12), inset 0 0 0 0.33px rgba(255,255,255,0.04)",
                      }}
                    />

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
                            className={`transition-all duration-[250ms] ${isActive ? "drop-shadow-[0_0_6px_rgba(128,80,240,0.5)]" : ""}`}
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
                            className={`transition-all duration-[250ms] ${isActive ? "drop-shadow-[0_0_6px_rgba(128,80,240,0.5)]" : ""}`}
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
                        className="absolute top-1.5 bottom-1.5 rounded-2xl bg-white/[0.06] nav-pill pointer-events-none"
                        style={{
                          left: pill.left,
                          width: pill.width,
                          boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 0 12px rgba(128,80,240,0.10)",
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
                    <div className="absolute -inset-4 rounded-full bg-purple-500/12 blur-2xl nav-fab-glow pointer-events-none" />

                    {/* Button body — more transparent glass */}
                    <div
                      className="relative w-[68px] h-[68px] rounded-full flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-[0.9]"
                      style={{
                        background: "linear-gradient(135deg, rgba(128,80,240,0.82) 0%, rgba(109,74,255,0.88) 50%, rgba(80,50,200,0.92) 100%)",
                        backdropFilter: "saturate(150%) blur(8px)",
                        WebkitBackdropFilter: "saturate(150%) blur(8px)",
                        boxShadow: "0 4px 20px rgba(109,74,255,0.35)",
                      }}
                    >
                      {/* Glass highlight */}
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.18),inset_0_-0.5px_0_0_rgba(0,0,0,0.12)] pointer-events-none" />
                      <Plus size={26} strokeWidth={2.5} className="relative z-10 text-white" />
                    </div>
                  </button>

                  {/* Ambient glow under island — very subtle */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-4 bg-purple-500/[0.04] blur-xl rounded-full pointer-events-none" />
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
