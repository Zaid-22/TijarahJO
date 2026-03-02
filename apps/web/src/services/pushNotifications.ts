import { api } from "./api";
import { logger } from "../shared/lib/logger";

const PUSH_SERVICE_WORKER_PATH = "/notifications-sw.js";

export type PushNotificationErrorCode =
  | "UNSUPPORTED"
  | "CONFIG_DISABLED"
  | "PERMISSION_DENIED"
  | "REGISTRATION_FAILED"
  | "SUBSCRIPTION_INVALID"
  | "SYNC_FAILED"
  | "UNKNOWN";

export type PushNotificationActionResult =
  | { success: true }
  | { success: false; code: PushNotificationErrorCode };

export type PushNotificationStatus = {
  supported: boolean;
  configEnabled: boolean;
  subscribed: boolean;
};

function hasPushNotificationSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function toUint8Array(base64UrlValue: string): Uint8Array {
  const padded = base64UrlValue.padEnd(
    base64UrlValue.length + ((4 - (base64UrlValue.length % 4)) % 4),
    "=",
  );
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    result[index] = binary.charCodeAt(index);
  }

  return result;
}

function toPushServerKey(base64UrlValue: string): Uint8Array<ArrayBuffer> {
  const source = toUint8Array(base64UrlValue);
  const buffer = new ArrayBuffer(source.byteLength);
  const result = new Uint8Array(buffer);
  result.set(source);
  return result;
}

async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      PUSH_SERVICE_WORKER_PATH,
      { scope: "/" },
    );
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    logger.warn("[pushNotifications] Failed to register service worker", error);
    return null;
  }
}

function toSubscriptionPayload(subscription: PushSubscription): {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
} | null {
  const json = subscription.toJSON();
  const endpoint = String(json.endpoint ?? subscription.endpoint ?? "").trim();
  const p256dh = String(json.keys?.p256dh ?? "").trim();
  const auth = String(json.keys?.auth ?? "").trim();
  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    keys: {
      p256dh,
      auth,
    },
  };
}

export async function getPushNotificationStatus(): Promise<PushNotificationStatus> {
  if (!hasPushNotificationSupport()) {
    return {
      supported: false,
      configEnabled: false,
      subscribed: false,
    };
  }

  const config = await api.notifications.getPushConfig();
  if (!config.enabled || !config.publicKey.trim()) {
    return {
      supported: true,
      configEnabled: false,
      subscribed: false,
    };
  }

  try {
    const subscription = await getExistingPushSubscription();
    return {
      supported: true,
      configEnabled: true,
      subscribed: subscription !== null,
    };
  } catch (error) {
    logger.warn("[pushNotifications] Failed to inspect subscription state", error);
    return {
      supported: true,
      configEnabled: true,
      subscribed: false,
    };
  }
}

export async function enablePushNotifications(): Promise<PushNotificationActionResult> {
  if (!hasPushNotificationSupport()) {
    return { success: false, code: "UNSUPPORTED" };
  }

  const config = await api.notifications.getPushConfig();
  const publicKey = config.publicKey.trim();
  if (!config.enabled || !publicKey) {
    return { success: false, code: "CONFIG_DISABLED" };
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return { success: false, code: "PERMISSION_DENIED" };
  }

  const registration = await registerPushServiceWorker();
  if (!registration) {
    return { success: false, code: "REGISTRATION_FAILED" };
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toPushServerKey(publicKey),
      });
    } catch (error) {
      logger.warn("[pushNotifications] Failed to create push subscription", error);
      return { success: false, code: "REGISTRATION_FAILED" };
    }
  }

  const payload = toSubscriptionPayload(subscription);
  if (!payload) {
    return { success: false, code: "SUBSCRIPTION_INVALID" };
  }

  const synced = await api.notifications.upsertPushSubscription(payload, navigator.userAgent);
  if (!synced) {
    return { success: false, code: "SYNC_FAILED" };
  }

  return { success: true };
}

export async function disablePushNotifications(): Promise<PushNotificationActionResult> {
  if (!hasPushNotificationSupport()) {
    return { success: false, code: "UNSUPPORTED" };
  }

  try {
    const subscription = await getExistingPushSubscription();
    if (!subscription) {
      return { success: true };
    }

    const endpoint = subscription.endpoint.trim();
    if (!endpoint) {
      return { success: false, code: "SUBSCRIPTION_INVALID" };
    }

    const removed = await api.notifications.removePushSubscription(endpoint);
    const unsubscribed = await subscription.unsubscribe();
    if (!removed || !unsubscribed) {
      return { success: false, code: "SYNC_FAILED" };
    }

    return { success: true };
  } catch (error) {
    logger.warn("[pushNotifications] Failed to disable push notifications", error);
    return { success: false, code: "UNKNOWN" };
  }
}
