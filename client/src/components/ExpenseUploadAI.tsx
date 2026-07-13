import React, { useState } from "react";
import { Upload, X, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ExtractedData {
  amount: number | null;
  date: string | null;
  category: string | null;
}

export function ExpenseUploadAI({
  onExtractComplete,
}: {
  onExtractComplete: (data: ExtractedData) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);

  const uploadMutation = trpc.equilibra.uploadReceiptPhoto.useMutation();
  const analyzeMutation = trpc.equilibra.analyzeReceiptPhoto.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1] || "";

        const uploadResult = await uploadMutation.mutateAsync({
          fileData: base64Data,
          fileName: file.name,
        });

        if (uploadResult.success && uploadResult.url) {
          setPreview(uploadResult.url);

          setAnalyzing(true);
          try {
            const analysisResult = await analyzeMutation.mutateAsync({
              imageUrl: uploadResult.url,
            });

            if (analysisResult.success) {
              const data: ExtractedData = {
                amount: analysisResult.amount,
                date: analysisResult.date,
                category: analysisResult.category,
              };
              setExtracted(data);
              onExtractComplete(data);
            }
          } finally {
            setAnalyzing(false);
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Receipt" className="w-full rounded-lg max-h-48 object-cover" />
          <button
            onClick={() => {
              setPreview(null);
              setExtracted(null);
            }}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
          <Upload size={24} className="text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Cliquez pour ajouter une photo de reçu</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || analyzing}
            className="hidden"
          />
        </label>
      )}

      {analyzing && (
        <div className="flex items-center gap-2 text-primary text-sm">
          <Loader2 size={16} className="animate-spin" />
          Analyse de la photo en cours...
        </div>
      )}

      {extracted && (
        <div className="glass-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Check size={16} />
            <span className="font-semibold text-sm text-foreground">Informations extraites</span>
          </div>

          {extracted.amount !== null && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Montant</div>
              <div className="text-lg font-semibold text-primary">{extracted.amount.toFixed(2)} €</div>
            </div>
          )}

          {extracted.date !== null && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Date</div>
              <div className="text-sm text-foreground">{extracted.date}</div>
            </div>
          )}

          {extracted.category !== null && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Catégorie</div>
              <div className="text-sm text-foreground">{extracted.category}</div>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Vous pouvez modifier ces informations avant de créer la dépense
          </div>
        </div>
      )}
    </div>
  );
}
