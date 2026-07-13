import { useMemo } from "react";

interface AvatarDisplayProps {
  avatar: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-lg",
  md: "w-12 h-12 text-2xl",
  lg: "w-16 h-16 text-3xl",
  xl: "w-24 h-24 text-5xl",
};

function isImageUrl(str: string): boolean {
  return str.startsWith("data:") || str.startsWith("http") || str.startsWith("/");
}

export function AvatarDisplay({ avatar, size = "md", className = "" }: AvatarDisplayProps) {
  const isImage = useMemo(() => isImageUrl(avatar), [avatar]);
  const sizeClass = SIZE_CLASSES[size];

  if (isImage) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shrink-0 ${className}`}>
        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shrink-0 ${className}`}>
      <span>{avatar}</span>
    </div>
  );
}
