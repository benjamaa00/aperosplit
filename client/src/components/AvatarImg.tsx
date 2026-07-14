import { resolveAvatar } from "../utils/avatarStorage";

export function AvatarImg({ avatar, size = "text-3xl" }: { avatar: string; size?: string }) {
  const resolved = resolveAvatar(avatar);

  if (resolved.startsWith("data:")) {
    return <img src={resolved} alt="" className={`${size} w-[1em] h-[1em] rounded-full object-cover inline-block align-middle`} />;
  }

  return <span className={size}>{resolved}</span>;
}
