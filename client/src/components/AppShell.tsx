import { memo, useRef, useEffect, useState, useCallback, type ReactNode } from "react";
import { Home, Scale, MessageCircle, User, type LucideIcon } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { haptics } from "../utils/haptics";
import type { Tab } from "../types";

const TAB_ICONS: Record<Tab, LucideIcon> = {
  home: Home,
  expenses: Home,
  balances: Scale,
  stats: Scale,
  history: Scale,
  messages: MessageCircle,
  profile: User,
};

const NAV_TABS: Tab[] = ["home", "balances", "messages", "profile"];

interface AppShellProps {
  children: ReactNode;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

function clamp(v: number, min: number, max: number) { return v < min ? min : v > max ? max : v; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

const AppShell = memo(({ children, activeTab, onTabChange }: AppShellProps) => {
  const tabRefs = useRef<Map<Tab, HTMLDivElement>>(new Map());
  const barRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, ready: true });

  const drag = useRef({
    active: false,
    startX: 0,
    hasMoved: false,
    sourceTab: null as Tab | null,
    sourceLeft: 0,
    sourceWidth: 0,
    columns: [] as { tab: Tab; cx: number; left: number; width: number }[],
    pillLeft: 0,
    pillWidth: 0,
    targetLeft: 0,
    targetWidth: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
    highlightX: 0.5,
    hoveredTab: null as Tab | null,
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

  const startDragLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    let alive = true;
    const tick = () => {
      if (!alive || !drag.current.active) return;
      const d = drag.current;

      d.pillLeft = lerp(d.pillLeft, d.targetLeft, 0.32);
      d.pillWidth = lerp(d.pillWidth, d.targetWidth, 0.22);
      d.highlightX = lerp(d.highlightX, d.highlightX, 0.16);

      if (Math.abs(d.pillLeft - d.targetLeft) < 0.5 && Math.abs(d.pillWidth - d.targetWidth) < 0.5) {
        d.pillLeft = d.targetLeft;
        d.pillWidth = d.targetWidth;
      }

      setDragUI({
        active: true,
        left: d.pillLeft,
        width: d.pillWidth,
        highlightX: d.highlightX,
        hoverTab: d.hoveredTab,
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  const switchTab = useCallback((tab: Tab) => {
    if (!onTabChange) return;
    haptics.light();
    onTabChange(tab);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [onTabChange]);

  const getColumns = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return [];
    const br = bar.getBoundingClientRect();
    return NAV_TABS.map((tab) => {
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
    const bar = barRef.current;
    if (!bar) return;
    const br = bar.getBoundingClientRect();
    const x = e.clientX - br.left;

    const d = drag.current;
    d.active = true;
    d.startX = e.clientX;
    d.lastX = e.clientX;
    d.lastTime = performance.now();
    d.hasMoved = false;
    d.velocity = 0;
    d.columns = getColumns();
    const m = measurePill(activeTab || "home");
    d.sourceTab = activeTab || "home";
    d.sourceLeft = m ? m.left : 0;
    d.sourceWidth = m ? m.width : 52;
    d.pillLeft = d.sourceLeft;
    d.pillWidth = d.sourceWidth;
    d.targetLeft = d.sourceLeft;
    d.targetWidth = d.sourceWidth;
    d.highlightX = x / br.width;
    d.hoveredTab = null;

    startDragLoop();
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

    const now = performance.now();
    const dt = now - d.lastTime;
    if (dt > 0) {
      d.velocity = (e.clientX - d.lastX) / dt;
    }
    d.lastX = e.clientX;
    d.lastTime = now;

    d.highlightX = clamp(x / br.width, 0, 1);

    const nearest = findNearest(x);
    if (!nearest) return;

    const pillW = nearest.width;
    const pillX = clamp(x - pillW / 2, 0, br.width - pillW);

    d.targetLeft = pillX;
    d.targetWidth = pillW;

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
          {/* ── Scroll container ── */}
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

          {activeTab && onTabChange && <div className="bottom-nav-scroll-edge" />}

          {/* ── Liquid Glass Nav ── */}
          {activeTab && onTabChange && (
            <nav
              ref={barRef}
              data-tutorial="tab-bar"
              className="bottom-nav"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            >
              {/* Content grid */}
              <div className="bottom-nav-content" style={{ height: "100%" }}>
                {NAV_TABS.map((tab, i) => (
                  <GridTab
                    key={tab}
                    id={tab}
                    label={tab === "home" ? "Accueil" : tab === "balances" ? "Soldes" : tab === "messages" ? "Messages" : "Profil"}
                    col={i + 1}
                    activeTab={activeTab}
                    onSwitch={switchTab}
                    tabRefs={tabRefs}
                    highlight={dragUI.active && dragUI.hoverTab === tab}
                  />
                ))}
              </div>

              {/* Active indicator pill */}
              {showPill.ready && (
                <div
                  className="nav-pill"
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: showPill.left,
                    width: showPill.width,
                    height: "36px",
                    borderRadius: "18px",
                    pointerEvents: "none",
                    zIndex: 3,
                    transition: dragUI.active ? "none" : "left 320ms cubic-bezier(0.34,1.56,0.64,1), width 320ms cubic-bezier(0.34,1.56,0.64,1)",
                    background: dragUI.active
                      ? "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)"
                      : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    boxShadow: dragUI.active
                      ? "inset 0 1px 0 rgba(255,255,255,0.16), 0 4px 18px rgba(0,0,0,0.16)"
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
          className="transition-all duration-[200ms]"
          style={{
            color: lit ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.40)",
            filter: lit ? "drop-shadow(0 0 6px rgba(128,80,240,0.45))" : "none",
          }}
        />
        <span
          className="text-[11px] font-medium tracking-wide leading-none transition-opacity duration-[200ms]"
          style={{
            color: lit ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.40)",
            opacity: lit ? 1 : 0.6,
          }}
        >
          {label}
        </span>
      </button>
    </div>
  );
});

GridTab.displayName = "GridTab";

export { AppShell };
