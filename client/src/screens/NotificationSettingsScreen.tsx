import { useState } from "react";
import { ArrowLeft, Bell, Mail } from "lucide-react";
import { Toggle } from "../components/Toggle";
export function NotificationSettingsScreen({ settings, onBack, onSave }: {
 settings?: { pushEnabled: boolean; emailEnabled: boolean; reminderFrequency: string; quietHoursStart?: string; quietHoursEnd?: string };
 onBack: () => void;
 onSave: (settings: { pushEnabled?: boolean; emailEnabled?: boolean; reminderFrequency?: string }) => void;
}) {
 const [pushEnabled, setPushEnabled] = useState(settings?.pushEnabled ?? true);
 const [emailEnabled, setEmailEnabled] = useState(settings?.emailEnabled ?? false);
 const [reminderFrequency, setReminderFrequency] = useState(settings?.reminderFrequency ?? "24h");

 return (
 <div  className="max-w-md mx-auto px-5 pt-12 space-y-5">
 <div className="flex items-center gap-3">
 <button onClick={onBack}
 className="w-10 h-10 rounded-2xl bg-card/30 border border-border flex items-center justify-center">
 <ArrowLeft size={20} />
 </button>
 <div className="flex-1">
 <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
 <p className="text-sm text-muted-foreground">Paramètres des alertes</p>
 </div>
 <button onClick={() => onSave({ pushEnabled, emailEnabled, reminderFrequency })}
 className="text-sm text-primary font-semibold px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
 Sauver
 </button>
 </div>

 {/* Push & Email */}
 <div className="glass-card-enhanced rounded-[1.25rem] p-5 space-y-4">
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Canaux</p>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Bell size={18} className="text-primary" /></div>
 <div>
 <p className="text-sm font-semibold">Notifications push</p>
 <p className="text-[11px] text-muted-foreground">Alertes en temps réel</p>
 </div>
 </div>
 <Toggle enabled={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} />
 </div>
 <div className="h-px bg-muted/30" />
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><Mail size={18} className="text-blue-400" /></div>
 <div>
 <p className="text-sm font-semibold">Notifications email</p>
 <p className="text-[11px] text-muted-foreground">Résumé par email</p>
 </div>
 </div>
 <Toggle enabled={emailEnabled} onToggle={() => setEmailEnabled(!emailEnabled)} />
 </div>
 </div>

 {/* Reminder Frequency */}
 <div className="glass-card-enhanced rounded-[1.25rem] p-5 space-y-3">
 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fréquence des rappels</p>
 {[
 { id: "24h", label: "Quotidien", desc: "Tous les jours" },
 { id: "3days", label: "Tous les 3 jours", desc: "Rappel régulier" },
 { id: "7days", label: "Hebdomadaire", desc: "Une fois par semaine" },
 ].map(opt => (
 <button key={opt.id} onClick={() => setReminderFrequency(opt.id)}
 className={`w-full p-4 rounded-2xl border text-left transition-all hover:bg-card/50 flex items-center gap-3 ${reminderFrequency === opt.id ? "bg-primary/10 border-primary/30" : "bg-card/30 border-border"}`}>
 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${reminderFrequency === opt.id ? "border-primary" : "border-muted-foreground/30"}`}>
 {reminderFrequency === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
 </div>
 <div>
 <p className="text-sm font-semibold">{opt.label}</p>
 <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
 </div>
 </button>
 ))}
 </div>

 <div className="h-8" />
 </div>
 );
}
