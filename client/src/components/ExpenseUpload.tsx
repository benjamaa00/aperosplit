import React, { useState } from "react";
import { Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function ExpenseUpload({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadMutation = trpc.equilibra.uploadReceiptPhoto.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1] || "";

        const result = await uploadMutation.mutateAsync({
          fileData: base64Data,
          fileName: file.name,
        });

        if (result.success && result.url) {
          setPreview(result.url);
          onUploadSuccess(result.url);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Receipt" className="w-full rounded-lg max-h-48 object-cover" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-lg p-6 cursor-pointer hover:border-emerald-400 transition-colors">
          <Upload size={24} className="text-slate-500 mb-2" />
          <span className="text-sm text-slate-400">Cliquez pour ajouter une photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
