import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";

interface TextAreaPromptProps {
 open: boolean;
 onClose: () => void;
 onConfirm: (value: string) => void;
 title: string;
 description?: string;
 placeholder?: string;
 confirmLabel?: string;
 maxLength?: number;
}

export function TextAreaPrompt({
 open,
 onClose,
 onConfirm,
 title,
 description,
 placeholder = "",
 confirmLabel = "Envoyer",
 maxLength = 500,
}: TextAreaPromptProps) {
 const [value, setValue] = useState("");
 const textareaRef = useRef<HTMLTextAreaElement>(null);

 useEffect(() => {
 if (open) {
 setValue("");
 const timer = setTimeout(() => textareaRef.current?.focus(), 100);
 return () => clearTimeout(timer);
 }
 }, [open]);

 const handleSubmit = () => {
 if (value.trim()) {
 onConfirm(value.trim());
 onClose();
 }
 };

 return (
 <>
 {open && (
 <div
 className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
 onClick={onClose}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl"
 >
 <button
 onClick={onClose}
 className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
 >
 <X size={14} />
 </button>

 <h3 className="text-lg font-bold text-center mb-1">{title}</h3>
 {description && (
 <p className="text-sm text-muted-foreground text-center mb-4">{description}</p>
 )}

 <textarea
 ref={textareaRef}
 value={value}
 onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
 placeholder={placeholder}
 rows={3}
 className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all mb-1"
 />
 <p className="text-[10px] text-muted-foreground text-right mb-4">
 {value.length}/{maxLength}
 </p>

 <div className="flex gap-3">
 <button
 onClick={onClose}
 className="flex-1 bg-muted/30 text-foreground font-semibold py-3 rounded-2xl text-sm hover:bg-muted/50 transition-colors"
 >
 Annuler
 </button>
 <button
 onClick={handleSubmit}
 disabled={!value.trim()}
 className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-2xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
 >
 <Send size={14} />
 {confirmLabel}
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 );
}
