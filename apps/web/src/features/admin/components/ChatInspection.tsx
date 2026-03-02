/* eslint-disable jsx-a11y/control-has-associated-label */
import { useEffect, useState } from "react";
import { MessageCircle, Eye, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import { Input } from "../../../shared/ui/input";
import { api } from "../../../services/api";
import {
  AdminConversationListResult,
  AdminConversationDetail,
} from "../../../services/api/admin";
import { logger } from "../../../shared/lib/logger";

export function ChatInspection() {
  const [convResult, setConvResult] = useState<AdminConversationListResult>({
    conversations: [],
    totalCount: 0,
  });
  const [selectedConversation, setSelectedConversation] =
    useState<AdminConversationDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const fetchConversations = async (currentPage: number) => {
    try {
      setIsLoading(true);
      const result = await api.admin.getConversations(currentPage, 50);
      setConvResult(result);
    } catch (error) {
      logger.warn("[ChatInspection] Failed to fetch conversations", error);
      toast.error("Failed to fetch conversations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchConversations(page);
  }, [page]);

  const handleViewMessages = async (conversationId: number) => {
    try {
      setIsLoadingMessages(true);
      const detail = await api.admin.getConversationMessages(conversationId);
      setSelectedConversation(detail);
    } catch (error) {
      logger.warn("[ChatInspection] Failed to fetch messages", error);
      toast.error("Failed to fetch messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const filteredConversations = convResult.conversations.filter(
    (c) =>
      c.user1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user2Name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ─── Message Thread View ───
  if (selectedConversation) {
    const conv = selectedConversation.conversation;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to conversations"
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Conversation #{conv.conversationID}
          </h1>
          <Badge variant="outline">
            {conv.user1Name} ↔ {conv.user2Name}
          </Badge>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedConversation.messages.length} messages · Read-only view
            </span>
            {conv.postID && (
              <Badge variant="secondary">Post #{conv.postID}</Badge>
            )}
          </div>

          <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
            {selectedConversation.messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No messages in this conversation.
              </p>
            ) : (
              selectedConversation.messages.map((msg) => {
                const isUser1 = msg.senderID === conv.user1ID;
                return (
                  <div
                    key={msg.messageID}
                    className={`flex ${isUser1 ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                        isUser1
                          ? "bg-muted text-foreground rounded-bl-sm"
                          : "bg-primary text-primary-foreground rounded-br-sm"
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {msg.senderName}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isUser1
                            ? "text-muted-foreground"
                            : "text-primary-foreground/70"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleString()}
                        {msg.isRead ? " · Read" : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Conversation List View ───
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Chat Inspection
          </h1>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user name..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted text-muted-foreground sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">
                  ID
                </th>
                <th scope="col" className="px-6 py-3">
                  User 1
                </th>
                <th scope="col" className="px-6 py-3">
                  User 2
                </th>
                <th scope="col" className="px-6 py-3">
                  Post
                </th>
                <th scope="col" className="px-6 py-3">
                  Messages
                </th>
                <th scope="col" className="px-6 py-3">
                  Last Activity
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : filteredConversations.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No conversations found.
                  </td>
                </tr>
              ) : (
                filteredConversations.map((conv) => (
                  <tr
                    key={conv.conversationID}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">
                      {conv.conversationID}
                    </td>
                    <td className="px-6 py-4">{conv.user1Name}</td>
                    <td className="px-6 py-4">{conv.user2Name}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {conv.postID ? `#${conv.postID}` : "–"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{conv.messageCount}</Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {conv.lastMessageAt
                        ? new Date(conv.lastMessageAt).toLocaleString()
                        : "–"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View Messages"
                        aria-label={`View messages for conversation ${conv.conversationID}`}
                        disabled={isLoadingMessages}
                        onClick={() => handleViewMessages(conv.conversationID)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Total: {convResult.totalCount} conversations
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm font-medium">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={convResult.conversations.length < 50 || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
