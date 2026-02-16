import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { Message } from "../types";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5033/api";

const normalizedApiBase = API_BASE_URL.replace(/\/+$/, "");
const hubBaseUrl = normalizedApiBase.endsWith("/api")
  ? normalizedApiBase.slice(0, -4)
  : normalizedApiBase;
const HUB_URL = `${hubBaseUrl}/chatHub`;

class ChatService {
  private connection: HubConnection | null = null;
  private connectionToken: string | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];

  public async connect(token: string) {
    if (this.connection) {
      const hasSameToken = this.connectionToken === token;
      const isActiveState =
        this.connection.state === HubConnectionState.Connected ||
        this.connection.state === HubConnectionState.Connecting ||
        this.connection.state === HubConnectionState.Reconnecting;

      if (hasSameToken && isActiveState) {
        return;
      }

      try {
        await this.connection.stop();
      } catch (stopError) {
        console.warn("SignalR stop before reconnect failed:", stopError);
      }
      this.connection = null;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.on(
      "ReceiveMessage",
      (senderId, content, postId, timestamp) => {
        const parsedSenderId = Number.parseInt(String(senderId), 10);
        if (Number.isNaN(parsedSenderId)) {
          return;
        }

        const parsedPostId =
          postId === null || postId === undefined
            ? undefined
            : Number.parseInt(String(postId), 10);

        const msg: Message = {
          senderId: parsedSenderId,
          receiverId: 0, // Current user is receiver
          content,
          postId: Number.isNaN(parsedPostId) ? undefined : parsedPostId,
          timestamp,
          isRead: false,
        };
        this.notifyListeners(msg);
      },
    );

    connection.on(
      "MessageSent",
      (_receiverId, _content, _postId, _timestamp) => {
        // Confirmation for sender
        // Could notify listeners too to update UI immediately
      },
    );

    connection.onclose(() => {
      this.connection = null;
      this.connectionToken = null;
    });

    this.connection = connection;

    try {
      await connection.start();
      this.connectionToken = token;
      console.log("SignalR Connected");
    } catch (err) {
      console.error("SignalR Connection Error: ", err);
      this.connection = null;
      this.connectionToken = null;
      throw err;
    }
  }

  public async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
    this.connectionToken = null;
  }

  public async sendMessage(
    receiverId: number,
    content: string,
    postId?: number,
  ) {
    if (!this.connection) throw new Error("No connection");
    try {
      await this.connection.invoke(
        "SendMessage",
        receiverId.toString(),
        content,
        postId,
      );
    } catch (err) {
      console.error("SendMessage Error: ", err);
      throw err;
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
