import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { Message } from "../types";
import { APP_CONFIG } from "../constants/appConfig";
import { toPositiveIntegerId } from "../utils/idValidation";
import { chatApi } from "./api/chat";
import { normalizeChatMessage } from "./api/chatNormalization";
import { logger } from "../shared/lib/logger";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;
const DEBUG_CHAT =
  Boolean(import.meta.env.DEV) && import.meta.env.VITE_DEBUG_CHAT === "true";

const debugChatLog = (...args: unknown[]) => {
  if (DEBUG_CHAT) {
    logger.info(...args);
  }
};

const normalizedApiBase = API_BASE_URL.replace(/\/+$/, "");
const hubBaseUrl = normalizedApiBase.endsWith("/api")
  ? normalizedApiBase.slice(0, -4)
  : normalizedApiBase;
const HUB_URL = `${hubBaseUrl}/chatHub`;

class ChatService {
  private connection: HubConnection | null = null;
  private currentUserId: number | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];

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

    connection.on(
      "ReceiveMessage",
      (senderId, content, postId, timestamp) => {
        const normalizedMessage = normalizeChatMessage({
          senderId,
          receiverId: this.currentUserId,
          content,
          postId,
          timestamp,
          isRead: false,
        });
        if (normalizedMessage) {
          this.notifyListeners(normalizedMessage);
        }
      },
    );

    connection.onclose(() => {
      this.connection = null;
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
  ): Promise<Message> {
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

    const localEchoMessage: Message = {
      senderId: this.currentUserId,
      receiverId: normalizedReceiverId,
      content: trimmedContent,
      postId: normalizedPostId,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

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
        normalizedPostId,
      );
      return localEchoMessage;
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
}

export const chatService = new ChatService();
