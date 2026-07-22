import { useState, useEffect, useRef } from "react";
import { Fingerprint, Check } from "lucide-react";
import type { Member } from "../types";
import { useHaptic } from "../hooks/useHaptic";
import { AvatarImg } from "../components/AvatarImg";

export function LockScreen({ member, onUnlock, onSkip, onSwitchIdentity }: { member: Member; onUnlock: () => void; onSkip: () => void; onSwitchIdentity?: () => void }) {
 const [authenticating, setAuthenticating] = useState(false);
 const [authStatus, setAuthStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
 const haptic = useHaptic();
 const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 useEffect(() => {
 return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
 }, []);

 const handleUnlock = async () => {
 haptic("medium");
 setAuthenticating(true);
 setAuthStatus("scanning");
 try {
 await onUnlock();
 } catch {
 haptic("error");
 setAuthStatus("error");
 setAuthenticating(false);
 }
 timeoutRef.current = setTimeout(() => {
 setAuthenticating(prev => {
 if (prev) {
 haptic("error");
 setAuthStatus("error");
 return false;
 }
 return false;
 });
 }, 3000);
 };

 // Auto-trigger biometric on mount
 useEffect(() => {
 const timer = setTimeout(() => {
 handleUnlock();
 }, 500);
 return () => clearTimeout(timer);
 }, []);

 return (
 <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl" />
 <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl" />
 </div>

 <div  className="text-center relative z-10">
 {/* Avatar with ring animation */}
 <div className="relative mb-8">
 {/* Scanning ring */}
 <div
 
 
 className="absolute inset-0 rounded-full border-2 border-primary/30"
 style={{ width: "140px", height: "140px", margin: "-10px" }}
 />
 
 {/* Inner glow */}
 <div
 
 
 className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
 />

 {/* Success checkmark */}
 
 {authStatus === "success" && (
 <div
 className="absolute inset-0 flex items-center justify-center"
 >
 <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
 <Check size={40} className="text-white" />
 </div>
 </div>
 )}
 

 {/* Avatar */}
 <div
 
 
 className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-sm"
 >
 <AvatarImg avatar={member.avatar} size="text-6xl" />
 </div>
 </div>

 {/* Name and status */}
 <div
 
 
 
 >
 <h2 className="text-2xl font-bold mb-2 tracking-tight">{member.name}</h2>
 <p
 key={authStatus}
 
 
 className={`text-sm font-medium mb-10 ${
 authStatus === "success" ? "text-emerald-400" : 
 authStatus === "error" ? "text-destructive" : 
 "text-muted-foreground"
 }`}
 >
 {authStatus === "scanning" && "Vérification biométrique..."}
 {authStatus === "success" && "Authentification réussie"}
 {authStatus === "error" && "Échec de l'authentification"}
 {authStatus === "idle" && "Utilisez Face ID ou Touch ID"}
 </p>
 </div>

 {/* Biometric button */}
 <button
 onClick={handleUnlock}
 disabled={authenticating}
 className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/60 hover:shadow-primary/40 transition-all duration-300"
 >
 {/* Button glow */}
 <div
 
 
 className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
 />
 
 <Fingerprint 
 size={44} 
 className={`text-primary relative z-10 ${
 authStatus === "scanning" ? "animate-pulse" : ""
 }`}
 />
 </button>

 {/* Skip button */}
 <button
 onClick={onSkip}
 className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline font-medium mb-4"
 >
 Continuer sans biométrie
 </button>

 {/* Switch identity button */}
 {onSwitchIdentity && (
 <button
 onClick={onSwitchIdentity}
 className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline font-medium"
 >
 Changer de compte
 </button>
 )}
 </div>
 </div>
 );
}
