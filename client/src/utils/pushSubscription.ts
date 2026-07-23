const PUSH_API_KEY = "equilibra_push_subscription";

export async function subscribeToPush(
  vapidPublicKey: string,
  memberId: string
): Promise<{ endpoint: string; p256dh: string; auth: string } | null> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });
    const json = sub.toJSON();
    if (!json.keys || !json.endpoint) return null;
    const subscription = {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh || '',
      auth: json.keys.auth || '',
    };
    try { sessionStorage.setItem(PUSH_API_KEY, JSON.stringify(subscription)); } catch {}
    return subscription;
  } catch (err) {
    console.warn("[Push] Subscribe failed:", err);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<string | null> {
  try {
    if (!('serviceWorker' in navigator)) return null;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return null;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    try { sessionStorage.removeItem(PUSH_API_KEY); } catch {}
    return endpoint;
  } catch {
    return null;
  }
}

export async function getCurrentPushSubscription(): Promise<{ endpoint: string; p256dh: string; auth: string } | null> {
  try {
    if (!('serviceWorker' in navigator)) return null;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return null;
    const json = sub.toJSON();
    if (!json.keys || !json.endpoint) return null;
    return { endpoint: json.endpoint, p256dh: json.keys.p256dh || '', auth: json.keys.auth || '' };
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
