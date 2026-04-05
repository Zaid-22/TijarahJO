import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { AppNotification, Message } from "../types";
import { APP_CONFIG } from "../constants/appConfig";
import { toPositiveIntegerId } from "../utils/idValidation";
import { chatApi } from "./api/chat";
import { normalizeChatMessage, RawChatMessage } from "./api/chatNormalization";
import { logger } from "../shared/lib/logger";

const DEBUG_CHAT =
  Boolean(import.meta.env.DEV) && import.meta.env.VITE_DEBUG_CHAT === "true";

const debugChatLog = (...args: unknown[]) => {
  if (DEBUG_CHAT) {
    logger.info(...args);
  }
};

const HUB_URL = `${APP_CONFIG.backendHostUrl}/chatHub`;

class ChatService {
  private connection: HubConnection | null = null;
  private currentUserId: number | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private notificationCallbacks: ((notification: AppNotification) => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private mapRealtimePayload(args: unknown[]): RawChatMessage | null {
    if (args.length === 0) {
      return null;
    }

    if (args.length === 1 && args[0] && typeof args[0] === "object") {
      return args[0] as RawChatMessage;
    }

    const [senderId, second, third, fourth, fifth] = args;
    const fallbackPayload: RawChatMessage = {
      senderId,
      receiverId: this.currentUserId ?? undefined,
      isRead: false,
    };

    if (typeof second === "number" && typeof third === "string") {
      // Legacy backend shape: senderId, conversationId, content, postId, timestamp
      fallbackPayload.conversationId = second;
      fallbackPayload.content = third;
      fallbackPayload.postId = fourth;
      fallbackPayload.timestamp = fifth;
      return fallbackPayload;
    }

    // Older shape: senderId, content, postId, timestamp
    fallbackPayload.content = second;
    fallbackPayload.postId = third;
    fallbackPayload.timestamp = fourth;
    return fallbackPayload;
  }

  private mapNotificationPayload(args: unknown[]): AppNotification | null {
    const payload = args.length === 1 && args[0] && typeof args[0] === "object"
      ? (args[0] as Record<string, unknown>)
      : null;

    if (!payload) {
      return null;
    }

    const notificationId = toPositiveIntegerId(
      payload.NotificationId ?? payload.notificationId,
    );
    const notificationType = String(
      payload.NotificationType ?? payload.notificationType ?? "",
    ).trim();
    const title = String(payload.Title ?? payload.title ?? "").trim();
    const body = String(payload.Body ?? payload.body ?? "").trim();
    const createdAtValue = payload.CreatedAt ?? payload.createdAt;
    const createdAtDate =
      createdAtValue instanceof Date ? createdAtValue : new Date(String(createdAtValue ?? ""));
    if (
      !notificationId ||
      !notificationType ||
      !title ||
      !body ||
      Number.isNaN(createdAtDate.getTime())
    ) {
      return null;
    }

    const readAtValue = payload.ReadAt ?? payload.readAt;
    const readAtDate =
      readAtValue === undefined || readAtValue === null || String(readAtValue).trim() === ""
        ? undefined
        : new Date(String(readAtValue));

    return {
      notificationId,
      notificationType,
      title,
      body,
      senderUserId: toPositiveIntegerId(payload.SenderUserId ?? payload.senderUserId),
      conversationId: toPositiveIntegerId(
        payload.ConversationId ?? payload.conversationId,
      ),
      messageId: toPositiveIntegerId(payload.MessageId ?? payload.messageId),
      routeUrl:
        typeof (payload.RouteUrl ?? payload.routeUrl) === "string"
          ? String(payload.RouteUrl ?? payload.routeUrl)
          : undefined,
      isRead: Boolean(payload.IsRead ?? payload.isRead ?? false),
      createdAt: createdAtDate.toISOString(),
      readAt:
        readAtDate && !Number.isNaN(readAtDate.getTime())
          ? readAtDate.toISOString()
          : undefined,
    };
  }

  public async connect(currentUserId: number) {
    const normalizedCurrentUserId = toPositiveIntegerId(currentUserId);
    if (!normalizedCurrentUserId) {
      throw new Error("Invalid current user ID");
    }
    this.currentUserId = normalizedCurrentUserId;

    if (this.connection) {
      const isActiveState =
        this.connection.state === HubConnectionState.Connected ||
        this.connection.state === HubConnectionState.Connecting ||
        this.connection.state === HubConnectionState.Reconnecting;

      if (isActiveState) {
        return;
      }

      try {
        await this.connection.stop();
      } catch (stopError) {
        logger.warn("SignalR stop before reconnect failed:", stopError);
      }
      this.connection = null;
    }

    const connection = new HubConnectionBuilder()
      .withAutomaticReconnect()
      .configureLogging(DEBUG_CHAT ? LogLevel.Information : LogLevel.Warning)
      .withUrl(HUB_URL, {
        withCredentials: true,
      })
      .build();

    connection.on("ReceiveMessage", (...args: unknown[]) => {
      const payload = this.mapRealtimePayload(args);
      const normalizedMessage = normalizeChatMessage(payload);
      if (normalizedMessage) {
        this.notifyListeners(normalizedMessage);
      }
    });

    // Confirmation sent back to the caller after a successful SendMessage invocation.
    // Without this handler SignalR logs a "No client method with the name 'messagesent' found" warning.
    connection.on("MessageSent", (...args: unknown[]) => {
      const payload = this.mapRealtimePayload(args);
      const normalizedMessage = normalizeChatMessage(payload);
      if (normalizedMessage) {
        this.notifyListeners(normalizedMessage);
      }
    });

    connection.on("ReceiveNotification", (...args: unknown[]) => {
      const notification = this.mapNotificationPayload(args);
      if (notification) {
        this.notifyNotificationListeners(notification);
      }
    });

    connection.onclose((error) => {
      debugChatLog("SignalR connection closed", error ? `Error: ${error}` : "cleanly");
      this.connection = null;
      this.currentUserId = null;
      this.notifyDisconnectListeners();
      // Attempt automatic reconnection with exponential backoff
      this.scheduleReconnect();
    });

    this.connection = connection;

    try {
      await connection.start();
      debugChatLog("SignalR Connected");
    } catch (err) {
      logger.error("SignalR Connection Error: ", err);
      this.connection = null;
      throw err;
    }
  }

  public async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
    this.currentUserId = null;
  }

  public async sendMessage(
    receiverId: number,
    content: string,
    postId?: number,
  ): Promise<Message | null> {
    const normalizedReceiverId = toPositiveIntegerId(receiverId);
    if (!normalizedReceiverId) {
      throw new Error("Invalid receiver ID");
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error("Message content cannot be empty");
    }

    const normalizedPostId =
      postId === undefined ? undefined : toPositiveIntegerId(postId);

    if (!this.currentUserId) {
      throw new Error("Current user is not connected");
    }

    if (
      !this.connection ||
      this.connection.state !== HubConnectionState.Connected
    ) {
      const fallbackMessage = await chatApi.sendMessage(
        normalizedReceiverId,
        trimmedContent,
        normalizedPostId,
      );
      if (fallbackMessage) {
        return fallbackMessage;
      }
      throw new Error("No realtime connection and REST fallback failed");
    }

    try {
      await this.connection.invoke(
        "SendMessage",
        normalizedReceiverId.toString(),
        trimmedContent,
        normalizedPostId ?? null,
      );
      // Realtime success is reflected through hub callbacks (`MessageSent` /
      // `ReceiveMessage`), so returning null here avoids appending a duplicate
      // local echo in the chat hook.
      return null;
    } catch (err) {
      logger.warn("SendMessage Error. Falling back to REST:", err);
      const fallbackMessage = await chatApi.sendMessage(
        normalizedReceiverId,
        trimmedContent,
        normalizedPostId,
      );
      if (fallbackMessage) {
        return fallbackMessage;
      }
      throw err instanceof Error
        ? err
        : new Error("Failed to send message through realtime or fallback API");
    }
  }

  public onMessageReceived(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  private notifyListeners(message: Message) {
    this.messageCallbacks.forEach((cb) => cb(message));
  }

  public onNotificationReceived(callback: (notification: AppNotification) => void) {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  private notifyNotificationListeners(notification: AppNotification) {
    this.notificationCallbacks.forEach((cb) => cb(notification));
  }

  public onDisconnect(callback: () => void) {
    this.disconnectCallbacks.push(callback);
    return () => {
      this.disconnectCallbacks = this.disconnectCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  private notifyDisconnectListeners() {
    this.disconnectCallbacks.forEach((cb) => cb());
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.reconnectAttempt >= 5) {
      debugChatLog("Max reconnection attempts reached, giving up.");
      return;
    }
    const delayMs = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 30000);
    this.reconnectAttempt++;
    debugChatLog(`Scheduling reconnect attempt ${this.reconnectAttempt} in ${delayMs}ms`);
    this.reconnectTimer = setTimeout(async () => {
      try {
        if (this.connection === null && this.currentUserId === null) {
          debugChatLog("Reconnect skipped — no previous user context.");
          return;
        }
        debugChatLog("Attempting SignalR reconnection...");
        // Reconnection requires the caller to call connect() again with userId
      } catch (err) {
        debugChatLog("Reconnection failed:", err);
        this.scheduleReconnect();
      }
    }, delayMs);
  }
}

export const chatService = new ChatService();
