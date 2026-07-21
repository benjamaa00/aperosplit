import { useState, useRef, useEffect } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useHaptic } from "../hooks/useHaptic";

export function AccessScreen({ onSubmit }: { onSubmit: (code: string) => void }) {
 const [code, setCode] = useState("");
 const [loading, setLoading] = useState(false);
 const haptic = useHaptic();
 const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

 const handleSubmit = () => {
 if (code.trim()) {
 setLoading(true);
 haptic("success");
 timerRef.current = setTimeout(() => {
 onSubmit(code.trim());
 setLoading(false);
 }, 300);
 } else {
 haptic("error");
 toast.error("Veuillez entrer le code confidentiel");
 }
 };

 return (
 <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl" />
 <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl" />
 </div>

 <div  className="text-center mb-12 relative z-10">
 <div
 initial={{ scale: 0.8, opacity: 0 }}
 
 
 className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10"
 >
 <Shield size={28} className="text-primary" />
 </div>
 <h1 className="text-3xl font-bold tracking-tight mb-2">Équilibra</h1>
 <p className="text-muted-foreground text-sm">Entrez le code confidentiel</p>
 </div>

 <div
 
 
 
 className="w-full max-w-xs relative z-10 space-y-4"
 >
 <input
 type="password"
 value={code}
 onChange={(e) => setCode(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
 placeholder="Code confidentiel"
 className="w-full px-6 py-4 rounded-2xl bg-card/50 border border-border focus:border-primary/30 focus:bg-card focus:shadow-xl focus:shadow-primary/5 transition-all duration-300 text-center text-lg font-semibold tracking-widest"
 maxLength={20}
 autoFocus
 />
 <button
 onClick={handleSubmit}
 disabled={loading || !code.trim()}
 className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl disabled:opacity-50"
 >
 {loading ? "Vérification..." : "Accéder"}
 </button>
 </div>
 </div>
 );
}
