import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { AppNotification, ChatReadReceipt, Message } from "../types";
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
  private requestedUserId: number | null = null;
  private lastKnownUserId: number | null = null;
  private intentionalDisconnect = false;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private readReceiptCallbacks: ((receipt: ChatReadReceipt) => void)[] = [];
  private notificationCallbacks: ((notification: AppNotification) => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTransition: Promise<void> = Promise.resolve();

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

  private mapReadReceiptPayload(args: unknown[]): ChatReadReceipt | null {
    const payload = args.length === 1 && args[0] && typeof args[0] === "object"
      ? (args[0] as Record<string, unknown>)
      : null;

    if (!payload) {
      return null;
    }

    const conversationId = toPositiveIntegerId(
      payload.ConversationId ?? payload.conversationId,
    );
    const readerUserId = toPositiveIntegerId(
      payload.ReaderUserId ?? payload.readerUserId,
    );
    const lastReadMessageId = toPositiveIntegerId(
      payload.LastReadMessageId ?? payload.lastReadMessageId,
    );

    if (!conversationId || !readerUserId || !lastReadMessageId) {
      return null;
    }

    return {
      conversationId,
      readerUserId,
      lastReadMessageId,
    };
  }

  public connect(currentUserId: number): Promise<void> {
    const normalizedCurrentUserId = toPositiveIntegerId(currentUserId);
    if (!normalizedCurrentUserId) {
      return Promise.reject(new Error("Invalid current user ID"));
    }

    if (this.requestedUserId !== normalizedCurrentUserId && this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Change send eligibility immediately. A queued identity transition must
    // never leave the previous account able to send while it waits to run.
    this.requestedUserId = normalizedCurrentUserId;

    const transition = this.connectionTransition.then(() =>
      this.connectInternal(normalizedCurrentUserId),
    );
    this.connectionTransition = transition.catch(() => undefined);
    return transition;
  }

  private async connectInternal(normalizedCurrentUserId: number): Promise<void> {
    if (this.requestedUserId !== normalizedCurrentUserId) {
      return;
    }

    const connectionBelongsToRequestedUser = this.currentUserId === normalizedCurrentUserId;

    if (this.connection) {
      const isActiveState =
        this.connection.state === HubConnectionState.Connected ||
        this.connection.state === HubConnectionState.Connecting ||
        this.connection.state === HubConnectionState.Reconnecting;

      if (isActiveState && connectionBelongsToRequestedUser) {
        return;
      }

      const previousConnection = this.connection;
      this.intentionalDisconnect = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.detachRealtimeHandlers(previousConnection);
      this.connection = null;
      this.currentUserId = null;
      this.lastKnownUserId = null;
      try {
        await previousConnection.stop();
      } catch (stopError) {
        logger.warn("SignalR stop before reconnect failed:", stopError);
        throw new Error("Could not disconnect the previous chat session.");
      }
    }

    if (this.requestedUserId !== normalizedCurrentUserId) {
      return;
    }

    this.currentUserId = normalizedCurrentUserId;
    this.lastKnownUserId = normalizedCurrentUserId;
    this.intentionalDisconnect = false;

    const connection = new HubConnectionBuilder()
      .withAutomaticReconnect()
      .configureLogging(DEBUG_CHAT ? LogLevel.Information : LogLevel.Warning)
      .withUrl(HUB_URL, {
        withCredentials: true,
      })
      .build();

    connection.on("ReceiveMessage", (...args: unknown[]) => {
      if (!this.isActiveConnection(connection, normalizedCurrentUserId)) {
        return;
      }
      const payload = this.mapRealtimePayload(args);
      const normalizedMessage = normalizeChatMessage(payload);
      if (normalizedMessage) {
        this.notifyListeners(normalizedMessage);
      }
    });

    // Confirmation sent back to the caller after a successful SendMessage invocation.
    // Without this handler SignalR logs a "No client method with the name 'messagesent' found" warning.
    connection.on("MessageSent", (...args: unknown[]) => {
      if (!this.isActiveConnection(connection, normalizedCurrentUserId)) {
        return;
      }
      const payload = this.mapRealtimePayload(args);
      const normalizedMessage = normalizeChatMessage(payload);
      if (normalizedMessage) {
        this.notifyListeners(normalizedMessage);
      }
    });

    connection.on("ReceiveNotification", (...args: unknown[]) => {
      if (!this.isActiveConnection(connection, normalizedCurrentUserId)) {
        return;
      }
      const notification = this.mapNotificationPayload(args);
      if (notification) {
        this.notifyNotificationListeners(notification);
      }
    });

    connection.on("MessagesRead", (...args: unknown[]) => {
      if (!this.isActiveConnection(connection, normalizedCurrentUserId)) {
        return;
      }
      const receipt = this.mapReadReceiptPayload(args);
      if (receipt) {
        this.notifyReadReceiptListeners(receipt);
      }
    });

    connection.onclose((error) => {
      if (this.connection !== connection) {
        return;
      }
      debugChatLog("SignalR connection closed", error ? `Error: ${error}` : "cleanly");
      this.connection = null;
      this.currentUserId = null;
      this.notifyDisconnectListeners();
      // Attempt automatic reconnection with exponential backoff
      if (!this.intentionalDisconnect && this.lastKnownUserId) {
        this.scheduleReconnect();
      }
    });

    this.connection = connection;

    try {
      await connection.start();
      if (this.requestedUserId !== normalizedCurrentUserId) {
        return;
      }
      this.reconnectAttempt = 0;
      debugChatLog("SignalR Connected");
    } catch (err) {
      logger.error("SignalR Connection Error: ", err);
      if (this.connection === connection) {
        this.connection = null;
        this.currentUserId = null;
      }
      throw err;
    }
  }

  public disconnect(): Promise<void> {
    // Disable all sends immediately, even if another transition is in flight.
    this.requestedUserId = null;
    this.intentionalDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const transition = this.connectionTransition.then(() =>
      this.disconnectInternal(),
    );
    this.connectionTransition = transition.catch(() => undefined);
    return transition;
  }

  private async disconnectInternal(): Promise<void> {
    this.intentionalDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connection) {
      const previousConnection = this.connection;
      this.detachRealtimeHandlers(previousConnection);
      this.connection = null;
      this.currentUserId = null;
      this.lastKnownUserId = null;
      await previousConnection.stop();
    }
    this.currentUserId = null;
    this.lastKnownUserId = null;
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

    if (!this.currentUserId || this.currentUserId !== this.requestedUserId) {
      throw new Error("Current user is not connected");
    }
    const sendingUserId = this.currentUserId;

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
      if (this.currentUserId !== sendingUserId || this.requestedUserId !== sendingUserId) {
        throw new Error("The active account changed before the message was sent.");
      }
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

  public onMessagesRead(callback: (receipt: ChatReadReceipt) => void) {
    this.readReceiptCallbacks.push(callback);
    return () => {
      this.readReceiptCallbacks = this.readReceiptCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  private notifyReadReceiptListeners(receipt: ChatReadReceipt) {
    this.readReceiptCallbacks.forEach((cb) => cb(receipt));
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

  private isActiveConnection(
    connection: HubConnection,
    connectionUserId: number,
  ): boolean {
    return (
      this.connection === connection &&
      this.currentUserId === connectionUserId &&
      this.requestedUserId === connectionUserId
    );
  }

  private detachRealtimeHandlers(connection: HubConnection) {
    connection.off("ReceiveMessage");
    connection.off("MessageSent");
    connection.off("ReceiveNotification");
    connection.off("MessagesRead");
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.intentionalDisconnect) {
      debugChatLog("Reconnect skipped — intentional disconnect.");
      return;
    }
    if (this.reconnectAttempt >= 5) {
      debugChatLog("Max reconnection attempts reached, giving up.");
      return;
    }
    const userId = this.lastKnownUserId;
    if (!userId || this.requestedUserId !== userId) {
      debugChatLog("Reconnect skipped — no previous user context.");
      return;
    }
    const delayMs = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 30000);
    this.reconnectAttempt++;
    debugChatLog(`Scheduling reconnect attempt ${this.reconnectAttempt} in ${delayMs}ms`);
    this.reconnectTimer = setTimeout(async () => {
      if (this.intentionalDisconnect || this.requestedUserId !== userId) {
        return;
      }
      try {
        debugChatLog("Attempting SignalR reconnection...");
        await this.connect(userId);
        debugChatLog("SignalR reconnection succeeded.");
      } catch (err) {
        debugChatLog("Reconnection failed:", err);
        this.scheduleReconnect();
      }
    }, delayMs);
  }
}

export const chatService = new ChatService();
