import React, { useState } from "react";
import { Fingerprint } from "lucide-react";

export function BiometricAuth({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (!enabled) {
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
        onToggle();
      }
    } catch (error) {
      console.error("Biometric error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Fingerprint size={20} className="text-primary" />
          <div>
            <div className="font-semibold text-sm text-foreground">Biométrie</div>
            <div className="text-xs text-muted-foreground">{enabled ? "Activée" : "Désactivée"}</div>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            enabled
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          {loading ? "..." : enabled ? "Désactiver" : "Activer"}
        </button>
      </div>
    </div>
  );
}
