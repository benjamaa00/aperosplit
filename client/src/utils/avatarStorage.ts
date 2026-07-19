const AVATARS_KEY = "equilibra_avatars";

function getAvatarStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AVATARS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAvatarStore(store: Record<string, string>) {
  try {
    localStorage.setItem(AVATARS_KEY, JSON.stringify(store));
  } catch {}
}

export function storePhotoAvatar(memberId: string, dataUrl: string): string {
  const store = getAvatarStore();
  store[memberId] = dataUrl;
  saveAvatarStore(store);
  return `photo:${memberId}`;
}

export function resolveAvatar(avatar: string): string {
  if (avatar.startsWith("photo:")) {
    const memberId = avatar.slice(6);
    const store = getAvatarStore();
    return store[memberId] || "👤";
  }
  if (avatar.startsWith("data:")) {
    return avatar;
  }
  return avatar || "👤";
}

export function migrateAvatar(memberId: string, avatar: string): string {
  if (avatar && avatar.startsWith("data:")) {
    storePhotoAvatar(memberId, avatar);
    return `photo:${memberId}`;
  }
  return avatar;
}

export function removePhotoAvatar(memberId: string) {
  const store = getAvatarStore();
  delete store[memberId];
  saveAvatarStore(store);
}

export function isPhotoAvatar(avatar: string): boolean {
  return avatar.startsWith("photo:");
}
