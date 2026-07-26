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

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

const AppShell = memo(({ children, activeTab, onTabChange, onAddExpense }: AppShellProps) => {
  const tabRefs = useRef<Map<Tab, HTMLDivElement>>(new Map());
  const navRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  // ── Drag state (ref for rAF, no state lag) ──
  const drag = useRef({
    active: false,
    startX: 0,
    hasMoved: false,
    positions: [] as { tab: Tab; cx: number; left: number; width: number }[],
    // Smooth pill tracking
    currentX: 0,
    targetX: 0,
    currentW: 0,
    targetW: 0,
    hoveredTab: null as Tab | null,
    // Refraction highlight position (0-1 normalized)
    highlightX: 0.5,
    targetHighlightX: 0.5,
    pressed: false,
  });

  const [dragUI, setDragUI] = useState({
    active: false, left: 0, width: 0, highlightX: 0.5, hoverTab: null as Tab | null, pressed: false,
  });

  // Measure active tab pill position
  useEffect(() => {
    if (dragUI.active) return;
    if (!activeTab || !tabRefs.current.has(activeTab)) return;
    const el = tabRefs.current.get(activeTab)!;
    const nav = navRef.current;
    if (!el || !nav) return;
    const e = el.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    setPill({ left: e.left - n.left, width: e.width, ready: true });
  }, [activeTab, dragUI.active]);

  // ── rAF loop for smooth pill interpolation during drag ──
  useEffect(() => {
    if (!drag.current.active) return;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      const d = drag.current;

      // Lerp pill position (0.22 = smooth but responsive)
      d.currentX = lerp(d.currentX, d.targetX, 0.22);
      d.currentW = lerp(d.currentW, d.targetW, 0.22);
      d.highlightX = lerp(d.highlightX, d.targetHighlightX, 0.15);

      setDragUI({
        active: true,
        left: d.currentX,
        width: d.currentW,
        highlightX: d.highlightX,
        hoverTab: d.hoveredTab,
        pressed: d.pressed,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [dragUI.active]);

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

  // ── Get tab positions from DOM ──
  const getTabPositions = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return [];
    const nRect = nav.getBoundingClientRect();
    return NAV_TABS.map(({ id }) => {
      const el = tabRefs.current.get(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        tab: id,
        cx: r.left + r.width / 2 - nRect.left,
        left: r.left - nRect.left,
        width: r.width,
      };
    }).filter(Boolean) as { tab: Tab; cx: number; left: number; width: number }[];
  }, []);

  const findNearest = useCallback((x: number) => {
    const ps = drag.current.positions;
    let best = ps[0];
    let bestD = Infinity;
    for (const p of ps) {
      const d = Math.abs(x - p.cx);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }, []);

  // ── Pointer handlers ──
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest(".nav-fab") || t.closest("button[aria-label='Ajouter une dépense']")) return;

    const nav = navRef.current;
    if (!nav) return;
    const nRect = nav.getBoundingClientRect();
    const x = e.clientX - nRect.left;

    const d = drag.current;
    d.active = true;
    d.startX = e.clientX;
    d.hasMoved = false;
    d.positions = getTabPositions();
    d.currentX = pill.left;
    d.targetX = pill.left;
    d.currentW = pill.width;
    d.targetW = pill.width;
    d.highlightX = x / nRect.width;
    d.targetHighlightX = x / nRect.width;
    d.pressed = true;
    d.hoveredTab = null;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getTabPositions, pill.left, pill.width]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;

    const dx = Math.abs(e.clientX - d.startX);
    if (dx < 6 && !d.hasMoved) return;
    d.hasMoved = true;

    const nav = navRef.current;
    if (!nav) return;
    const nRect = nav.getBoundingClientRect();
    const x = e.clientX - nRect.left;

    const nearest = findNearest(x);
    if (!nearest) return;

    // Target position for lerp (no snap, smooth follow)
    const pillLeft = x - nearest.width / 2;
    const clamped = Math.max(0, Math.min(nRect.width - nearest.width, pillLeft));

    d.targetX = clamped;
    d.targetW = nearest.width;
    d.targetHighlightX = x / nRect.width;

    if (nearest.tab !== d.hoveredTab) {
      d.hoveredTab = nearest.tab;
      haptics.light();
    }
  }, [findNearest]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    d.pressed = false;

    const nav = navRef.current;
    if (!nav) return;
    const nRect = nav.getBoundingClientRect();
    const x = e.clientX - nRect.left;

    const target = d.hasMoved ? findNearest(x) : d.positions.find(p => p.tab === activeTab);

    setDragUI({ active: false, left: 0, width: 0, highlightX: 0.5, hoverTab: null, pressed: false });

    if (target && d.hasMoved) {
      switchTab(target.tab);
    }
  }, [findNearest, switchTab, activeTab]);

  const handlePointerCancel = useCallback(() => {
    drag.current.active = false;
    drag.current.pressed = false;
    setDragUI({ active: false, left: 0, width: 0, highlightX: 0.5, hoverTab: null, pressed: false });
  }, []);

  const showPill = dragUI.active
    ? { left: dragUI.left, width: dragUI.width, ready: true }
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

            {/* ── Liquid Glass Nav ── */}
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
                  {/* ═══ Layer 1: Glass body ═══ */}
                  <div
                    ref={navRef}
                    className="absolute inset-0 rounded-[28px]"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.03) 100%)",
                      backdropFilter: "blur(28px) saturate(160%) brightness(104%)",
                      WebkitBackdropFilter: "blur(28px) saturate(160%) brightness(104%)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow: [
                        "0 14px 44px rgba(0,0,0,0.30)",
                        "0 2px 8px rgba(0,0,0,0.14)",
                        "inset 0 1px 0 rgba(255,255,255,0.18)",
                        "inset 0 -1px 0 rgba(255,255,255,0.06)",
                        "inset 0 0 24px rgba(255,255,255,0.03)",
                      ].join(", "),
                      transition: dragUI.pressed
                        ? "box-shadow 120ms ease, border-color 120ms ease"
                        : "box-shadow 280ms ease, border-color 280ms ease",
                      borderColor: dragUI.pressed ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.14)",
                    }}
                  />

                  {/* ═══ Layer 2: Refraction highlight — follows finger ═══ */}
                  {dragUI.active && (
                    <div
                      className="absolute inset-0 rounded-[28px] pointer-events-none overflow-hidden"
                      style={{ zIndex: 1 }}
                    >
                      <div
                        className="absolute top-0 h-full"
                        style={{
                          left: `${dragUI.highlightX * 100}%`,
                          width: "120px",
                          transform: "translateX(-50%)",
                          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)",
                          transition: "none",
                        }}
                      />
                      {/* Prismatic edge shimmer */}
                      <div
                        className="absolute top-0 h-full"
                        style={{
                          left: `${dragUI.highlightX * 100 - 4}%`,
                          width: "8px",
                          background: "linear-gradient(180deg, rgba(180,160,255,0.12), rgba(120,200,255,0.08), rgba(180,160,255,0.12))",
                          filter: "blur(3px)",
                        }}
                      />
                      <div
                        className="absolute top-0 h-full"
                        style={{
                          left: `${dragUI.highlightX * 100 + 4}%`,
                          width: "8px",
                          background: "linear-gradient(180deg, rgba(255,180,200,0.08), rgba(255,200,160,0.06), rgba(255,180,200,0.08))",
                          filter: "blur(3px)",
                        }}
                      />
                    </div>
                  )}

                  {/* ═══ Layer 3: Top highlight band ═══ */}
                  <div
                    className="absolute top-0 left-[8%] right-[8%] h-[1px] rounded-full pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.20) 30%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.20) 70%, transparent)",
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
                      highlight={dragUI.active && dragUI.hoverTab === "home"}
                    />
                    <GridTab
                      id="balances" label="Soldes"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={2}
                      highlight={dragUI.active && dragUI.hoverTab === "balances"}
                    />
                    {/* FAB */}
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
                          className="relative w-[60px] h-[60px] rounded-full flex items-center justify-center transition-transform duration-[250ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-[0.92]"
                          style={{
                            background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.30), rgba(126,87,255,0.72) 40%, rgba(92,54,220,0.76) 100%)",
                            backdropFilter: "blur(20px) saturate(180%)",
                            WebkitBackdropFilter: "blur(20px) saturate(180%)",
                            border: "1px solid rgba(255,255,255,0.22)",
                            boxShadow: "0 10px 32px rgba(91,61,220,0.40), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.10)",
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
                      highlight={dragUI.active && dragUI.hoverTab === "history"}
                    />
                    <GridTab
                      id="profile" label="Profil"
                      activeTab={activeTab} onSwitch={switchTab}
                      tabRefs={tabRefs} col={5}
                      highlight={dragUI.active && dragUI.hoverTab === "profile"}
                    />
                  </div>

                  {/* ── Active capsule pill ── */}
                  {showPill.ready && (
                    <div
                      ref={pillRef}
                      className={`absolute top-1/2 -translate-y-1/2 rounded-[16px] nav-pill pointer-events-none ${
                        dragUI.active
                          ? "transition-none"
                          : "transition-all duration-[300ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      }`}
                      style={{
                        left: showPill.left,
                        width: showPill.width,
                        height: dragUI.active ? "36px" : "34px",
                        background: dragUI.active
                          ? "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.08) 100%)"
                          : "rgba(255,255,255,0.09)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        boxShadow: dragUI.active
                          ? "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.04), 0 6px 20px rgba(0,0,0,0.16)"
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
          className={`transition-all duration-[180ms] ${lit ? "drop-shadow-[0_0_6px_rgba(128,80,240,0.50)]" : ""}`}
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
