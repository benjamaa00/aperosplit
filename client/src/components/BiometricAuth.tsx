import React, { useState } from "react";
import { Fingerprint, Lock, Unlock } from "lucide-react";

export function BiometricAuth({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (!enabled) {
        // Register biometric
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: "Équilibra" },
            user: {
              id: new Uint8Array(16),
              name: "user@equilibra.local",
              displayName: "Utilisateur",
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            timeout: 60000,
            attestation: "direct",
          },
        });

        if (credential) {
          onToggle();
        }
      } else {
        // Disable biometric
        onToggle();
      }
    } catch (error) {
      console.error("Biometric error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Fingerprint size={20} className="text-emerald-400" />
          <div>
            <div className="font-semibold text-sm">Biométrie</div>
            <div className="text-xs text-slate-500">{enabled ? "Activée" : "Désactivée"}</div>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            enabled
              ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
              : "bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30"
          }`}
        >
          {loading ? "..." : enabled ? "Désactiver" : "Activer"}
        </button>
      </div>
    </div>
  );
}
