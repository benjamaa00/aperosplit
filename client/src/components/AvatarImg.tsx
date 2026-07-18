import { useState } from "react";
import { resolveAvatar } from "../utils/avatarStorage";

export function AvatarImg({ avatar, size = "text-3xl" }: { avatar: string; size?: string }) {
  const [imgError, setImgError] = useState(false);
  const resolved = resolveAvatar(avatar || "👤");

  if (resolved.startsWith("data:") && !imgError) {
    return (
      <img
        src={resolved}
        alt=""
        onError={() => setImgError(true)}
        className={`${size} w-[1em] h-[1em] rounded-full object-cover inline-block align-middle`}
      />
    );
  }

  return <span className={size}>{resolved || "👤"}</span>;
}
