declare module "web-push" {
  interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }
  interface PushSubscription {
    endpoint: string;
    keys?: { p256dh: string; auth: string };
    expirationTime?: number | null;
  }
  interface NotificationPayload {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    silent?: boolean;
    timestamp?: number;
    vibrate?: number[];
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
    [key: string]: any;
  }
  function generateVAPIDKeys(): VapidKeys;
  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  function sendNotification(subscription: PushSubscription, payload: string | Buffer, options?: any): Promise<void>;
  function generateRequestDetails(subscription: PushSubscription, payload: string | Buffer, options?: any): { endpoint: string; method: string; headers: Record<string, string>; body: Buffer };
}
