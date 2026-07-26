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

interface AppShellProps {
  children: ReactNode;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onAddExpense?: () => void;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

const AppShell = memo(({ children, activeTab, onTabChange, onAddExpense }: AppShellProps) => {
  const tabRefs = useRef<Map<Tab, HTMLDivElement>>(new Map());
  const barRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, ready: false });

  // ── Drag state ──
  const drag = useRef({
    active: false,
    startX: 0,
    hasMoved: false,
    columns: [] as { tab: Tab; cx: number; left: number; width: number }[],
    currentX: 0, targetX: 0,
    currentW: 0, targetW: 0,
    hoveredTab: null as Tab | null,
    highlightX: 0.5, targetHighlightX: 0.5,
  });

  const [dragUI, setDragUI] = useState({
    active: false, left: 0, width: 0, highlightX: 0.5, hoverTab: null as Tab | null,
  });

  const measurePill = useCallback((tab: Tab) => {
    const el = tabRefs.current.get(tab);
    const bar = barRef.current;
    if (!el || !bar) return null;
    const er = el.getBoundingClientRect();
    const br = bar.getBoundingClientRect();
    return { left: er.left - br.left, width: er.width };
  }, []);

  useEffect(() => {
    if (dragUI.active) return;
    if (!activeTab) return;
    const m = measurePill(activeTab);
    if (m) setPillStyle({ left: m.left, width: m.width, ready: true });
  }, [activeTab, dragUI.active, measurePill]);

  useEffect(() => {
    if (!drag.current.active) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const d = drag.current;
      d.currentX = lerp(d.currentX, d.targetX, 0.24);
      d.currentW = lerp(d.currentW, d.targetW, 0.24);
      d.highlightX = lerp(d.highlightX, d.targetHighlightX, 0.16);
      setDragUI({
        active: true, left: d.currentX, width: d.currentW,
        highlightX: d.highlightX, hoverTab: d.hoveredTab,
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

  const getColumns = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return [];
    const br = bar.getBoundingClientRect();
    const tabs: Tab[] = ["home", "balances", "history", "profile"];
    return tabs.map((tab) => {
      const el = tabRefs.current.get(tab);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { tab, cx: r.left + r.width / 2 - br.left, left: r.left - br.left, width: r.width };
    }).filter(Boolean) as { tab: Tab; cx: number; left: number; width: number }[];
  }, []);

  const findNearest = useCallback((x: number) => {
    const cols = drag.current.columns;
    let best = cols[0];
    let bestD = Infinity;
    for (const c of cols) {
      const d = Math.abs(x - c.cx);
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest(".nav-fab")) return;
    const bar = barRef.current;
    if (!bar) return;
    const br = bar.getBoundingClientRect();
    const x = e.clientX - br.left;

    const d = drag.current;
    d.active = true;
    d.startX = e.clientX;
    d.hasMoved = false;
    d.columns = getColumns();
    const m = measurePill(activeTab || "home");
    d.currentX = m ? m.left : 0;
    d.targetX = d.currentX;
    d.currentW = m ? m.width : 52;
    d.targetW = d.currentW;
    d.highlightX = x / br.width;
    d.targetHighlightX = x / br.width;
    d.hoveredTab = null;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getColumns, measurePill, activeTab]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = Math.abs(e.clientX - d.startX);
    if (dx < 6 && !d.hasMoved) return;
    d.hasMoved = true;

    const bar = barRef.current;
    if (!bar) return;
    const br = bar.getBoundingClientRect();
    const x = e.clientX - br.left;

    const nearest = findNearest(x);
    if (!nearest) return;

    d.targetX = x - nearest.width / 2;
    d.targetW = nearest.width;
    d.targetHighlightX = x / br.width;

    if (nearest.tab !== d.hoveredTab) {
      d.hoveredTab = nearest.tab;
      haptics.light();
    }
  }, [findNearest]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;

    const bar = barRef.current;
    if (!bar) return;
    const br = bar.getBoundingClientRect();
    const x = e.clientX - br.left;

    const target = d.hasMoved ? findNearest(x) : d.columns.find(c => c.tab === activeTab);
    setDragUI({ active: false, left: 0, width: 0, highlightX: 0.5, hoverTab: null });
    if (target && d.hasMoved) switchTab(target.tab);
  }, [findNearest, switchTab, activeTab]);

  const handlePointerCancel = useCallback(() => {
    drag.current.active = false;
    setDragUI({ active: false, left: 0, width: 0, highlightX: 0.5, hoverTab: null });
  }, []);

  const showPill = dragUI.active
    ? { left: dragUI.left, width: dragUI.width, ready: true }
    : pillStyle;

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="relative min-h-[100dvh]" style={{ background: "var(--background, #08080D)" }}>
          {/* ── Scroll container — content scrolls here, behind the nav ── */}
          <div
            ref={scrollRef}
            className="h-[100dvh] overflow-y-auto overflow-x-hidden scrollbar-hidden"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorY: "contain",
              paddingBottom: "calc(110px + env(safe-area-inset-bottom, 10px))",
            }}
          >
            {children}
          </div>

          {/* ── Scroll edge gradient — subtle contrast behind nav ── */}
          {activeTab && onTabChange && <div className="bottom-nav-scroll-edge" />}

          {/* ── Liquid Glass Nav — fixed, sibling of scroll container ── */}
          {activeTab && onTabChange && (
            <nav
              ref={barRef}
              data-tutorial="tab-bar"
              className="bottom-nav"
              style={{ height: "74px" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            >
              {/* ═══ Drag refraction highlight ═══ */}
              {dragUI.active && (
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                  style={{
                    zIndex: 1,
                    borderRadius: "inherit",
                  }}
                >
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: `${dragUI.highlightX * 100}%`,
                      width: "100px",
                      transform: "translateX(-50%)",
                      background: "radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)",
                    }}
                  />
                </div>
              )}

              {/* ═══ Content grid ═══ */}
              <div
                className="bottom-nav-content"
                style={{ height: "100%" }}
              >
                <GridTab
                  id="home" label="Accueil" col={1}
                  activeTab={activeTab} onSwitch={switchTab}
                  tabRefs={tabRefs}
                  highlight={dragUI.active && dragUI.hoverTab === "home"}
                />
                <GridTab
                  id="balances" label="Soldes" col={2}
                  activeTab={activeTab} onSwitch={switchTab}
                  tabRefs={tabRefs}
                  highlight={dragUI.active && dragUI.hoverTab === "balances"}
                />
                {/* Col 3: FAB */}
                <div className="flex items-center justify-center" style={{ gridColumn: 3 }}>
                  <button
                    onClick={handleFab}
                    className="nav-fab group cursor-pointer relative"
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      transform: "translateY(-14px)",
                    }}
                    aria-label="Ajouter une dépense"
                  >
                    <div
                      className="absolute -inset-2.5 rounded-full blur-lg nav-fab-glow pointer-events-none"
                      style={{ background: "radial-gradient(circle, rgba(126,87,255,0.16) 0%, rgba(92,54,220,0.04) 60%, transparent 100%)" }}
                    />
                    <div
                      className="relative w-[62px] h-[62px] rounded-full flex items-center justify-center transition-transform duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-[0.92]"
                      style={{
                        background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.28), rgba(126,87,255,0.70) 40%, rgba(92,54,220,0.74) 100%)",
                        backdropFilter: "blur(18px) saturate(185%)",
                        WebkitBackdropFilter: "blur(18px) saturate(185%)",
                        border: "1px solid rgba(255,255,255,0.20)",
                        boxShadow: "0 8px 28px rgba(91,61,220,0.38), inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.08)",
                      }}
                    >
                      <Plus size={22} strokeWidth={2.4} className="relative z-10 text-white" />
                    </div>
                  </button>
                </div>
                <GridTab
                  id="history" label="Historique" col={4}
                  activeTab={activeTab} onSwitch={switchTab}
                  tabRefs={tabRefs}
                  highlight={dragUI.active && dragUI.hoverTab === "history"}
                />
                <GridTab
                  id="profile" label="Profil" col={5}
                  activeTab={activeTab} onSwitch={switchTab}
                  tabRefs={tabRefs}
                  highlight={dragUI.active && dragUI.hoverTab === "profile"}
                />
              </div>

              {/* ═══ Active indicator pill ═══ */}
              {showPill.ready && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 rounded-[18px] nav-pill pointer-events-none ${
                    dragUI.active ? "transition-none" : "transition-all duration-[300ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  }`}
                  style={{
                    left: showPill.left,
                    width: showPill.width,
                    height: "36px",
                    background: dragUI.active
                      ? "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.07) 100%)"
                      : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: dragUI.active
                      ? "inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 16px rgba(0,0,0,0.14)"
                      : "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 12px rgba(0,0,0,0.10)",
                  }}
                />
              )}
            </nav>
          )}
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
});

AppShell.displayName = "AppShell";

const GridTab = memo(({
  id, label, col, activeTab, onSwitch, tabRefs, highlight,
}: {
  id: Tab; label: string; col: number;
  activeTab: Tab; onSwitch: (tab: Tab) => void;
  tabRefs: React.MutableRefObject<Map<Tab, HTMLDivElement>>;
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
      <button
        onClick={() => onSwitch(id)}
        aria-label={label}
        className="flex flex-col items-center justify-center gap-1 min-w-[50px] px-1 py-1 cursor-pointer select-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <Icon
          size={22}
          strokeWidth={lit ? 2 : 1.5}
          className={`transition-all duration-[220ms] ${lit ? "text-white drop-shadow-[0_0_5px_rgba(128,80,240,0.40)]" : "text-white/45"}`}
        />
        <span
          className={`text-[11px] font-medium tracking-wide leading-none transition-opacity duration-[220ms] ${lit ? "text-white opacity-100" : "text-white/45 opacity-60"}`}
        >
          {label}
        </span>
      </button>
    </div>
  );
});

GridTab.displayName = "GridTab";

export { AppShell };
