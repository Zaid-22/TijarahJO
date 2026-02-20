import { AppNotification } from "../../types";
import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";

type RawNotification = {
  NotificationId?: unknown;
  notificationId?: unknown;
  NotificationType?: unknown;
  notificationType?: unknown;
  Title?: unknown;
  title?: unknown;
  Body?: unknown;
  body?: unknown;
  SenderUserId?: unknown;
  senderUserId?: unknown;
  ConversationId?: unknown;
  conversationId?: unknown;
  MessageId?: unknown;
  messageId?: unknown;
  RouteUrl?: unknown;
  routeUrl?: unknown;
  IsRead?: unknown;
  isRead?: unknown;
  CreatedAt?: unknown;
  createdAt?: unknown;
  ReadAt?: unknown;
  readAt?: unknown;
};

type UnreadCountPayload = {
  UnreadCount?: unknown;
  unreadCount?: unknown;
};

type MarkAllReadPayload = {
  UpdatedCount?: unknown;
  updatedCount?: unknown;
};

type PushConfigPayload = {
  Enabled?: unknown;
  enabled?: unknown;
  PublicKey?: unknown;
  publicKey?: unknown;
};

type PushSubscriptionJson = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

function toIsoTimestamp(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeNotification(payload: RawNotification | null | undefined): AppNotification | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const notificationId = toPositiveIntegerId(payload.NotificationId ?? payload.notificationId);
  const notificationType = String(
    payload.NotificationType ?? payload.notificationType ?? "",
  ).trim();
  const title = String(payload.Title ?? payload.title ?? "").trim();
  const body = String(payload.Body ?? payload.body ?? "").trim();
  const createdAt = toIsoTimestamp(payload.CreatedAt ?? payload.createdAt);

  if (!notificationId || !notificationType || !title || !body || !createdAt) {
    return null;
  }

  return {
    notificationId,
    notificationType,
    title,
    body,
    senderUserId: toPositiveIntegerId(payload.SenderUserId ?? payload.senderUserId),
    conversationId: toPositiveIntegerId(payload.ConversationId ?? payload.conversationId),
    messageId: toPositiveIntegerId(payload.MessageId ?? payload.messageId),
    routeUrl: typeof (payload.RouteUrl ?? payload.routeUrl) === "string"
      ? String(payload.RouteUrl ?? payload.routeUrl)
      : undefined,
    isRead: Boolean(payload.IsRead ?? payload.isRead ?? false),
    createdAt,
    readAt: toIsoTimestamp(payload.ReadAt ?? payload.readAt),
  };
}

export const notificationsApi = {
  getNotifications: async (params?: {
    take?: number;
    unreadOnly?: boolean;
  }): Promise<AppNotification[]> => {
    const take = Math.min(100, Math.max(1, params?.take ?? 25));
    const unreadOnly = params?.unreadOnly ?? false;
    const response = await apiRequest<RawNotification[]>(
      `/notifications?take=${take}&unreadOnly=${unreadOnly ? "true" : "false"}`,
      {
        method: "GET",
      },
    );

    if (!response.success || !Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .map((payload) => normalizeNotification(payload))
      .filter((notification): notification is AppNotification => notification !== null);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiRequest<UnreadCountPayload>("/notifications/unread-count", {
      method: "GET",
    });

    if (!response.success || !response.data) {
      return 0;
    }

    const unreadCount = Number(response.data.UnreadCount ?? response.data.unreadCount ?? 0);
    return Number.isFinite(unreadCount) && unreadCount > 0 ? Math.floor(unreadCount) : 0;
  },

  markAsRead: async (notificationId: number): Promise<boolean> => {
    const normalizedId = toPositiveIntegerId(notificationId);
    if (!normalizedId) {
      return false;
    }

    const response = await apiRequest<{ success?: boolean; Success?: boolean }>(
      `/notifications/${normalizedId}/read`,
      {
        method: "PUT",
      },
    );

    if (!response.success) {
      return false;
    }

    return Boolean(response.data?.success ?? response.data?.Success ?? false);
  },

  markAllAsRead: async (): Promise<number> => {
    const response = await apiRequest<MarkAllReadPayload>("/notifications/read-all", {
      method: "PUT",
    });

    if (!response.success || !response.data) {
      return 0;
    }

    const updatedCount = Number(response.data.UpdatedCount ?? response.data.updatedCount ?? 0);
    return Number.isFinite(updatedCount) && updatedCount > 0 ? Math.floor(updatedCount) : 0;
  },

  getPushConfig: async (): Promise<{ enabled: boolean; publicKey: string }> => {
    const response = await apiRequest<PushConfigPayload>("/notifications/push-config", {
      method: "GET",
    });

    if (!response.success || !response.data) {
      return {
        enabled: false,
        publicKey: "",
      };
    }

    return {
      enabled: Boolean(response.data.Enabled ?? response.data.enabled ?? false),
      publicKey: String(response.data.PublicKey ?? response.data.publicKey ?? ""),
    };
  },

  upsertPushSubscription: async (
    subscription: PushSubscriptionJson,
    userAgent?: string,
  ): Promise<boolean> => {
    const endpoint = subscription.endpoint?.trim() ?? "";
    const p256dh = subscription.keys?.p256dh?.trim() ?? "";
    const auth = subscription.keys?.auth?.trim() ?? "";
    if (!endpoint || !p256dh || !auth) {
      return false;
    }

    const response = await apiRequest<{ success?: boolean; Success?: boolean }>(
      "/notifications/push-subscriptions",
      {
        method: "POST",
        body: JSON.stringify({
          Endpoint: endpoint,
          Keys: {
            P256dh: p256dh,
            Auth: auth,
          },
          UserAgent: userAgent ?? "",
        }),
      },
    );

    if (!response.success) {
      return false;
    }

    return Boolean(response.data?.success ?? response.data?.Success ?? false);
  },

  removePushSubscription: async (endpoint: string): Promise<boolean> => {
    const normalizedEndpoint = endpoint.trim();
    if (!normalizedEndpoint) {
      return false;
    }

    const response = await apiRequest<{ success?: boolean; Success?: boolean }>(
      "/notifications/push-subscriptions",
      {
        method: "DELETE",
        body: JSON.stringify({
          Endpoint: normalizedEndpoint,
        }),
      },
    );

    if (!response.success) {
      return false;
    }

    return Boolean(response.data?.success ?? response.data?.Success ?? false);
  },
};
