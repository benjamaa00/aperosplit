import { useState } from "react";
import { X } from "lucide-react";
import { resolveAvatar } from "../utils/avatarStorage";

export function AvatarImg({ avatar, size = "text-3xl" }: { avatar: string; size?: string }) {
  const [imgError, setImgError] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const resolved = resolveAvatar(avatar || "👤");

  if (resolved.startsWith("data:") && !imgError) {
    return (
      <>
        <img
          src={resolved}
          alt=""
          onError={() => setImgError(true)}
          onClick={() => setLightbox(true)}
          className={`${size} w-[1em] h-[1em] rounded-full object-cover inline-block align-middle cursor-pointer hover:opacity-90 transition-opacity`}
        />
        {lightbox && (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10"
            >
              <X size={20} className="text-white" />
            </button>
            <img
              src={resolved}
              alt=""
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  if (imgError && resolved.startsWith("data:")) {
    return <span className={`${size} w-[1em] h-[1em] rounded-full bg-primary/20 text-primary inline-flex items-center justify-center align-middle text-[0.6em] font-semibold`}>?</span>;
  }

  return <span className={size}>{resolved || "👤"}</span>;
}
