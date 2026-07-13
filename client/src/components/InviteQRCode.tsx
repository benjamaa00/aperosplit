import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy, Check } from "lucide-react";

export function InviteQRCode({ shareUrl, groupName }: { shareUrl: string; groupName: string }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const inviteLink = `${window.location.origin}?invite=${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rejoins ${groupName}`,
          text: "Rejoins mon groupe Équilibra pour partager les dépenses !",
          url: inviteLink,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold text-sm mb-3 text-foreground">Inviter des membres</h3>

        <div className="flex gap-2 mb-4">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary py-2 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-all"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copié !" : "Copier le lien"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 text-blue-400 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500/20 transition-all"
          >
            <Share2 size={16} />
            Partager
          </button>
        </div>

        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted/80 transition-all"
        >
          {showQR ? "Masquer le QR code" : "Afficher le QR code"}
        </button>
      </div>

      {showQR && (
        <div className="glass-card border border-border rounded-2xl p-4 flex justify-center">
          <QRCodeSVG value={inviteLink} size={200} level="H" includeMargin={true} />
        </div>
      )}

      <div className="glass-card border border-border rounded-2xl p-4">
        <div className="text-xs text-muted-foreground mb-2">Lien d'invitation :</div>
        <div className="text-xs text-foreground break-all font-mono bg-muted/50 p-2 rounded">{inviteLink}</div>
      </div>
    </div>
  );
}
