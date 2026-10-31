import type { DemoRequest } from "./types";
import { DemoError, requireUser } from "./store";

export function chat({ state, path, method, body }: DemoRequest): unknown {
  if (!path.startsWith("/chat/")) return undefined;
  const user = requireUser(state);
  const own = state.messages.filter(m => m.senderId === user.Id || m.receiverId === user.Id);
  if (path === "/chat/recent" && method === "GET") return own;
  if (/^\/chat\/history\/\d+$/.test(path) && method === "GET") {
    const other = Number(path.split("/")[3]);
    return own.filter(m => m.senderId === other || m.receiverId === other);
  }
  if (/^\/chat\/presence\/\d+$/.test(path) && method === "GET") return { isOnline: false, statusText: "Demo conversation · simulated replies" };
  if (path === "/chat/send" && method === "POST") {
    const receiver = Number(body.ReceiverId);
    if (!state.users.some(u => u.Id === receiver) || receiver === user.Id) throw new DemoError("HTTP_400", "Select a different demo account.");
    const content = String(body.Content ?? "").trim();
    if (!content) throw new DemoError("HTTP_400", "Write a message first.");
    const message = { messageId: state.nextId++, senderId: user.Id, receiverId: receiver,
      conversationId: Math.min(user.Id, receiver) * 10 + Math.max(user.Id, receiver),
      postId: Number(body.PostId) || undefined, content, timestamp: new Date().toISOString(), isRead: false };
    state.messages.push(message);
    return message;
  }
  if (path === "/chat/demo-reply" && method === "POST") {
    const original = state.messages.find(m => m.messageId === Number(body.messageId) && m.senderId === user.Id);
    if (!original) throw new DemoError("HTTP_404", "Conversation changed.");
    const reply = { ...original, messageId: state.nextId++, senderId: original.receiverId, receiverId: user.Id,
      content: "Demo reply: Thanks for your interest! You can explore this conversation, but no message is sent to a real seller. / رد تجريبي: شكراً لاهتمامك!", timestamp: new Date().toISOString() };
    state.messages.push(reply);
    state.notifications.push({ notificationId: state.nextId++, ownerId: user.Id, notificationType: "MESSAGE",
      title: "Demo reply", body: reply.content, senderUserId: reply.senderId, conversationId: reply.conversationId,
      routeUrl: "/chat", isRead: false, createdAt: reply.timestamp });
    return reply;
  }
  return undefined;
}
