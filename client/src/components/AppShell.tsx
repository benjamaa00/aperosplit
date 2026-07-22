import { memo, useRef, useEffect, useState, type ReactNode } from "react";
import { Home, Receipt, Scale, History, BarChart3, User } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { haptics } from "../utils/haptics";
import type { Tab } from "../types";

const navTabs: { id: Tab; Icon: typeof Home; label: string; tutorial?: string }[] = [
 { id: "home", Icon: Home, label: "Accueil" },
 { id: "expenses", Icon: Receipt, label: "Dépenses", tutorial: "tab-expenses" },
 { id: "balances", Icon: Scale, label: "Soldes", tutorial: "tab-balances" },
 { id: "history", Icon: History, label: "Historique" },
 { id: "stats", Icon: BarChart3, label: "Stats", tutorial: "tab-stats" },
 { id: "profile", Icon: User, label: "Profil", tutorial: "tab-profile" },
];

interface AppShellProps {
 children: ReactNode;
 activeTab?: Tab;
 onTabChange?: (tab: Tab) => void;
}

const AppShell = memo(({ children, activeTab, onTabChange }: AppShellProps) => {
 const tabRefs = useRef<Map<Tab, HTMLButtonElement>>(new Map());
 const navRef = useRef<HTMLDivElement>(null);
 const [pill, setPill] = useState({ left: 0, width: 0 });

 useEffect(() => {
 if (!activeTab || !tabRefs.current.has(activeTab)) return;
 const el = tabRefs.current.get(activeTab)!;
 const navEl = navRef.current;
 if (!el || !navEl) return;
 const elRect = el.getBoundingClientRect();
 const navRect = navEl.getBoundingClientRect();
 setPill({
 left: elRect.left - navRect.left,
 width: elRect.width,
 });
 }, [activeTab]);

 const handleTabChange = (tab: Tab) => {
 if (onTabChange) {
 haptics.light();
 onTabChange(tab);
 }
 };

 return (
 <ErrorBoundary>
 <TooltipProvider>
 {children}
 {activeTab && onTabChange && (
 <nav data-tutorial="tab-bar" className="fixed bottom-0 inset-x-0 z-40">
 <div className="absolute inset-0 bg-card/70 backdrop-blur-2xl" />
 <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
 <div className="absolute inset-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]" />
 <div
 ref={navRef}
 className="max-w-md mx-auto relative flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
 >
 <div
 className="absolute top-1 h-8 rounded-full bg-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
 
 
 />
 {navTabs.map(({ id, Icon, label, tutorial }) => {
 const isActive = activeTab === id;
 return (
 <button
 key={id}
 ref={(el) => {
 if (el) tabRefs.current.set(id, el);
 }}
  data-tutorial={tutorial}
 onClick={() => handleTabChange(id)}
 aria-label={label}
 className={`relative z-10 flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors duration-200 ${
 isActive
 ? "text-primary font-semibold"
 : "text-muted-foreground"
 }`}
 >
 <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
 <span className="text-[10px] font-medium">{label}</span>
 </button>
 );
 })}
 </div>
 </nav>
 )}
 </TooltipProvider>
 </ErrorBoundary>
 );
});

AppShell.displayName = "AppShell";

export { AppShell };
