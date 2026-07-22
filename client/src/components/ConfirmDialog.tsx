import { useEffect } from "react";
import { AlertTriangle, Trash2, RotateCcw, LogOut, X } from "lucide-react";
import { haptics } from "../utils/haptics";

interface ConfirmDialogProps {
 open: boolean;
 onClose: () => void;
 onConfirm: () => void;
 title: string;
 description: string;
 confirmLabel?: string;
 cancelLabel?: string;
 variant?: "danger" | "warning" | "info";
 icon?: "trash" | "reset" | "logout" | "warning";
}

const iconMap = {
 trash: Trash2,
 reset: RotateCcw,
 logout: LogOut,
 warning: AlertTriangle,
};

const variantStyles = {
 danger: {
 bg: "bg-red-500/10",
 border: "border-red-500/20",
 icon: "text-red-400",
 iconBg: "bg-red-500/15",
 btn: "bg-red-500 hover:bg-red-600 text-white",
 },
 warning: {
 bg: "bg-orange-500/10",
 border: "border-orange-500/20",
 icon: "text-orange-400",
 iconBg: "bg-orange-500/15",
 btn: "bg-orange-500 hover:bg-orange-600 text-white",
 },
 info: {
 bg: "bg-primary/10",
 border: "border-primary/20",
 icon: "text-primary",
 iconBg: "bg-primary/15",
 btn: "bg-primary hover:bg-primary/90 text-primary-foreground",
 },
};

export function ConfirmDialog({
 open,
 onClose,
 onConfirm,
 title,
 description,
 confirmLabel = "Confirmer",
 cancelLabel = "Annuler",
 variant = "danger",
 icon = "warning",
}: ConfirmDialogProps) {
 const styles = variantStyles[variant];
 const Icon = iconMap[icon];

 useEffect(() => {
 if (open) haptics.warning();
 }, [open]);

 return (
 <>
 {open && (
 <div
 
 
 
 className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
 onClick={onClose}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl"
 >
 {/* Close button */}
 <button
 onClick={onClose}
 className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
 >
 <X size={14} />
 </button>

 {/* Icon */}
 <div className={`w-14 h-14 rounded-2xl ${styles.iconBg} flex items-center justify-center mx-auto mb-4`}>
 <Icon size={24} className={styles.icon} />
 </div>

 {/* Content */}
 <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
 <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
 {description}
 </p>

 {/* Buttons */}
 <div className="flex gap-3">
 <button
 onClick={() => { haptics.light(); onClose(); }}
 className="flex-1 bg-muted/30 text-foreground font-semibold py-3 rounded-2xl text-sm hover:bg-muted/50 transition-colors"
 >
 {cancelLabel}
 </button>
 <button
 onClick={() => { haptics.success(); onConfirm(); onClose(); }}
 className={`flex-1 ${styles.btn} font-semibold py-3 rounded-2xl text-sm transition-colors`}
 >
 {confirmLabel}
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 );
}
