import { memo } from "react";

export const LoadingSpinner = memo(function LoadingSpinner({
 size = 20,
 className = ""
}: {
 size?: number;
 className?: string;
}) {
 return (
 <svg
 className={`animate-spin ${className}`}
 width={size}
 height={size}
 viewBox="0 0 24 24"
 fill="none"
 >
 <circle
 cx="12"
 cy="12"
 r="10"
 stroke="currentColor"
 strokeWidth="2.5"
 opacity="0.2"
 />
 <path
 d="M12 2a10 10 0 0 1 10 10"
 stroke="currentColor"
 strokeWidth="2.5"
 strokeLinecap="round"
 />
 </svg>
 );
});

LoadingSpinner.displayName = "LoadingSpinner";
