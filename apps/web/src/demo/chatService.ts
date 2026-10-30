import type { Message, ChatReadReceipt, AppNotification } from "../types";
import { demoRequest } from "./api";

export class DemoChatService {
  private owner: number | null = null;
  private listeners = new Set<(message: Message) => void>();
  private notifications = new Set<(notification: AppNotification) => void>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  async connect(owner: number) { if (owner !== this.owner) await this.disconnect(); this.owner = owner; }
  async disconnect() { this.owner = null; this.timers.forEach(clearTimeout); this.timers.clear(); }
  async sendMessage(receiverId: number, content: string, postId?: number): Promise<Message | null> {
    const owner = this.owner;
    if (!owner) throw new Error("Choose a demo account first.");
    const response = await demoRequest<Message>("/chat/send", { method: "POST", body: JSON.stringify({ ReceiverId: receiverId, Content: content, PostId: postId }) });
    if (!response.success) throw new Error(response.error.message);
    const timer = setTimeout(async () => {
      this.timers.delete(timer);
      if (this.owner !== owner) return;
      const reply = await demoRequest<Message>("/chat/demo-reply", { method: "POST", body: JSON.stringify({ messageId: response.data.messageId }) });
      if (reply.success && this.owner === owner) {
        this.listeners.forEach(callback => callback(reply.data));
        this.notifications.forEach(callback => callback({ notificationId: reply.data.messageId ?? 0, notificationType: "MESSAGE",
          title: "Demo reply", body: reply.data.content, senderUserId: reply.data.senderId, isRead: false, createdAt: reply.data.timestamp, routeUrl: "/chat" }));
      }
    }, 900);
    this.timers.add(timer);
    return response.data;
  }
  onMessageReceived(callback: (message: Message) => void) { this.listeners.add(callback); return () => { this.listeners.delete(callback); }; }
  onNotificationReceived(callback: (notification: AppNotification) => void) { this.notifications.add(callback); return () => { this.notifications.delete(callback); }; }
  onMessagesRead(_callback: (receipt: ChatReadReceipt) => void) { return () => undefined; }
  onDisconnect(_callback: () => void) { return () => undefined; }
}
