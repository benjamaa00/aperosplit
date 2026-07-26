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

  // ── Drag state ──
  const dragState = useRef({
    dragging: false,
    startX: 0,
    tabPositions: [] as { tab: Tab; cx: number; left: number; width: number }[],
    dragPillX: 0,
    dragPillW: 0,
    hasMoved: false,
    hoveredTab: null as Tab | null,
  });
  const [dragPill, setDragPill] = useState<{ left: number; width: number; active: boolean; hoverTab: Tab | null }>({
    left: 0, width: 0, active: false, hoverTab: null,
  });

  // Measure active tab pill position
  useEffect(() => {
    if (dragPill.active) return; // don't override during drag
    if (!activeTab || !tabRefs.current.has(activeTab)) return;
    const el = tabRefs.current.get(activeTab)!;
    const nav = navRef.current;
    if (!el || !nav) return;
    const e = el.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    setPill({ left: e.left - n.left, width: e.width, ready: true });
  }, [activeTab, dragPill.active]);

  const switchTab = useCallback((tab: Tab) => {
    if (!onTabChange) return;
    haptics.light();
    onTabChange(tab);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [onTabChange]);

  const handleFab = useCallback(() => {
    haptics.medium();
    onAddExpense?.();
  }, [onAddExpense]);

  // ── Pointer drag on nav bar — liquid glass slide gesture ──
  const getTabPositions = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return [];
    const nRect = nav.getBoundingClientRect();
    const positions: { tab: Tab; cx: number; left: number; width: number }[] = [];
    NAV_TABS.forEach(({ id }) => {
      const el = tabRefs.current.get(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      positions.push({
        tab: id,
        cx: r.left + r.width / 2 - nRect.left,
        left: r.left - nRect.left,
        width: r.width,
      });
    });
    return positions;
  }, []);

  const findNearestTab = useCallback((x: number) => {
    const positions = dragState.current.tabPositions;
    let best = positions[0];
    let bestDist = Infinity;
    for (const p of positions) {
      const dist = Math.abs(x - p.cx);
      if (dist < bestDist) { bestDist = dist; best = p; }
    }
    return best;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ignore right-click or non-primary
    if (e.button !== 0) return;
    // Ignore if they tapped the FAB
    const target = e.target as HTMLElement;
    if (target.closest(".nav-fab") || target.closest("button[aria-label='Ajouter une dépense']")) return;

    const nav = navRef.current;
    if (!nav) return;
    const nRect = nav.getBoundingClientRect();
    const x = e.clientX - nRect.left;

    const positions = getTabPositions();
    if (positions.length === 0) return;

    dragState.current = {
      dragging: true,
      startX: e.clientX,
      tabPositions: positions,
      dragPillX: pill.left,
      dragPillW: pill.width,
      hasMoved: false,
      hoveredTab: null,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getTabPositions, pill.left, pill.width]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.dragging) return;

    const dx = Math.abs(e.clientX - ds.startX);
    if (dx < 8 && !ds.hasMoved) return; // dead zone
    ds.hasMoved = true;

    const nav = navRef.current;
    if (!nav) return;
    const nRect = nav.getBoundingClientRect();
    const x = e.clientX - nRect.left;

    const nearest = findNearestTab(x);
    if (!nearest) return;

    // Smooth pill follow finger
    const pillLeft = x - nearest.width / 2;
    const clamped = Math.max(0, Math.min(nRect.width - nearest.width, pillLeft));

    if (nearest.tab !== ds.hoveredTab) {
      ds.hoveredTab = nearest.tab;
      haptics.light();
    }

    ds.dragPillX = clamped;
    ds.dragPillW = nearest.width;
    setDragPill({ left: clamped, width: nearest.width, active: true, hoverTab: nearest.tab });
  }, [findNearestTab]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds.dragging) return;
    ds.dragging = false;

    const nav = navRef.current;
    if (!nav) return;
    const nRect = nav.getBoundingClientRect();
    const x = e.clientX - nRect.left;

    const target = ds.hasMoved ? findNearestTab(x) : ds.tabPositions.find(p => p.tab === activeTab);

    setDragPill({ left: 0, width: 0, active: false, hoverTab: null });

    if (target && ds.hasMoved) {
      switchTab(target.tab);
    }
  }, [findNearestTab, switchTab, activeTab]);

  const handlePointerCancel = useCallback(() => {
    dragState.current.dragging = false;
    setDragPill({ left: 0, width: 0, active: false, hoverTab: null });
  }, []);

  // Choose which pill state to show
  const showPill = dragPill.active
    ? { left: dragPill.left, width: dragPill.width, ready: true }
    : pill;

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="h-screen flex flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden"
          >
            <div className="min-h-full">
              {children}
            </div>

            {/* ── Liquid Glass Nav — sticky bottom, in-flow, draggable ── */}
            {activeTab && onTabChange && (
              <div
                className="sticky bottom-0 z-50 px-3 pointer-events-none"
                style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))" }}
              >
                <nav
                  data-tutorial="tab-bar"
                  className="pointer-events-auto mx-auto max-w-md relative rounded-[28px] overflow-visible touch-none select-none"
                  style={{ height: "72px" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                >
                  {/* ═══ Liquid Glass Surface ═══ */}
                  <div
                    ref={navRef}
                    className="absolute inset-0 rounded-[28px]"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.03) 100%)",
                      backdropFilter: "blur(26px) saturate(155%) brightness(103%)",
                      WebkitBackdropFilter: "blur(26px) saturate(155%) brightness(103%)",
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
                    <GridTab
                      id="home" label="Accueil"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={1}
                      highlight={dragPill.active && dragPill.hoverTab === "home"}
                    />
                    <GridTab
                      id="balances" label="Soldes"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={2}
                      highlight={dragPill.active && dragPill.hoverTab === "balances"}
                    />
                    {/* Column 3: FAB */}
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
                    <GridTab
                      id="history" label="Historique"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={4}
                      highlight={dragPill.active && dragPill.hoverTab === "history"}
                    />
                    <GridTab
                      id="profile" label="Profil"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={5}
                      highlight={dragPill.active && dragPill.hoverTab === "profile"}
                    />
                  </div>

                  {/* ── Active capsule pill ── */}
                  {showPill.ready && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 rounded-[16px] nav-pill pointer-events-none ${
                        dragPill.active
                          ? "transition-none"
                          : "transition-all duration-[280ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      }`}
                      style={{
                        left: showPill.left,
                        width: showPill.width,
                        height: "34px",
                        background: dragPill.active
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.09)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: dragPill.active
                          ? "inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 18px rgba(0,0,0,0.15)"
                          : "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 14px rgba(0,0,0,0.12)",
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
  id, label, activeTab, onSwitch, tabRefs, col, highlight,
}: {
  id: Tab; label: string; activeTab: Tab;
  onSwitch: (tab: Tab) => void;
  tabRefs: React.MutableRefObject<Map<Tab, HTMLDivElement>>;
  col: number;
  highlight?: boolean;
}) => {
  const isActive = activeTab === id;
  const Icon = TAB_ICONS[id];
  const lit = isActive || highlight;

  return (
    <div
      ref={(el) => { if (el) tabRefs.current.set(id, el); }}
      className="flex items-center justify-center"
      style={{ gridColumn: col }}
    >
      <div
        className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] px-1 py-1 rounded-2xl transition-all duration-[180ms] ease-out select-none ${
          lit ? "text-white" : "text-white/50"
        }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <Icon
          size={21}
          strokeWidth={lit ? 2 : 1.5}
          className={`transition-all duration-[180ms] ${lit ? "drop-shadow-[0_0_5px_rgba(128,80,240,0.45)]" : ""}`}
        />
        <span className={`text-[10px] font-medium tracking-wide leading-none transition-opacity duration-[180ms] ${lit ? "opacity-100" : "opacity-50"}`}>
          {label}
        </span>
      </div>
    </div>
  );
});

GridTab.displayName = "GridTab";

export { AppShell };
