import { memo } from "react";
interface PageTransitionProps {
 children: React.ReactNode;
 className?: string;
}

export const PageTransition = memo(function PageTransition({ children, className = "" }: PageTransitionProps) {
 return (
 <div
 className={className}
 >
 {children}
 </div>
 );
});

PageTransition.displayName = "PageTransition";
