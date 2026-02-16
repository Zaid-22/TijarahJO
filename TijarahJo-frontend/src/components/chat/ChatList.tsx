// import React from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
// import { Message } from "../../types";

interface ChatListProps {
  chats: {
    userId: number;
    userName: string;
    lastMessage: string;
    timestamp: string;
    isRead: boolean;
  }[];
  selectedUserId: number | null;
  onSelectUser: (userId: number) => void;
}

export function ChatList({
  chats,
  selectedUserId,
  onSelectUser,
}: ChatListProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
          Messages
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations found.
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.userId}
              onClick={() => onSelectUser(chat.userId)}
              className={cn(
                "flex items-center p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50",
                selectedUserId === chat.userId
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "",
              )}
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4
                    className={cn(
                      "font-medium truncate",
                      !chat.isRead
                        ? "text-gray-900 dark:text-white font-bold"
                        : "text-gray-700 dark:text-gray-300",
                    )}
                  >
                    {chat.userName}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap ml-2">
                    {new Date(chat.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm truncate",
                    !chat.isRead
                      ? "text-gray-900 dark:text-white font-medium"
                      : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {chat.lastMessage}
                </p>
              </div>
              {!chat.isRead && (
                <div className="w-3 h-3 bg-blue-600 rounded-full ml-2"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
