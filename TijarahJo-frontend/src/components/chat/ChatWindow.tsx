import { useState, useEffect, useRef } from "react";
import { useChat } from "../../hooks/useChat";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, User } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { api } from "../../services/api";

interface ChatWindowProps {
  otherUserId: number;
  otherDisplayName: string;
  currentUser: { id: string; name: string };
  onBack: () => void;
  postId?: number; // Optional context
}

export function ChatWindow({
  otherUserId,
  otherDisplayName,
  currentUser,
  onBack,
  postId,
}: ChatWindowProps) {
  const { messages, isLoading, sendMessage } = useChat(otherUserId);
  const [inputText, setInputText] = useState("");
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    let isCancelled = false;

    const refreshPresence = async () => {
      try {
        const isOnline = await api.chat.getPresence(otherUserId);
        if (!isCancelled) {
          setIsOtherUserOnline(isOnline);
        }
      } catch {
        if (!isCancelled) {
          setIsOtherUserOnline(false);
        }
      }
    };

    refreshPresence();
    const intervalId = window.setInterval(refreshPresence, 15000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [otherUserId]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText, postId);
      setInputText("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-2 md:hidden"
        >
          ←
        </Button>
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 mr-3">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {otherDisplayName}
          </h3>
          <p
            className={cn(
              "text-xs",
              isOtherUserOnline
                ? "text-green-500"
                : "text-gray-500 dark:text-gray-400",
            )}
          >
            {isOtherUserOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {isLoading && (
            <p className="text-center text-gray-500">Loading messages...</p>
          )}
          {!isLoading && messages.length === 0 && (
            <p className="text-center text-gray-400 mt-10">
              No messages yet. Say hi!
            </p>
          )}
          {messages.map((msg, idx) => {
            const isMe = msg.senderId.toString() === currentUser.id;
            return (
              <div
                key={idx}
                className={cn(
                  "flex w-full mb-2",
                  isMe ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] px-4 py-2 rounded-2xl text-sm",
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none",
                  )}
                >
                  <p>{msg.content}</p>
                  <span
                    className={cn(
                      "text-[10px] block mt-1 opacity-70",
                      isMe
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-white dark:bg-gray-800"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
