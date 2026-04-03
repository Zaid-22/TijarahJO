import { cn } from "@/shared/ui/utils";
import type { Language } from "../../../types";
import { resolveAvatarSrc, getAvatarInitial } from "../../../shared/lib/avatar";

interface ChatListProps {
  chats: {
    userId: number;
    displayName: string;
    avatar?: string;
    lastMessage: string;
    timestamp: string;
    isRead: boolean;
  }[];
  selectedUserId: number | null;
  onSelectUser: (userId: number) => void;
  language?: Language;
}

export function ChatList({
  chats,
  selectedUserId,
  onSelectUser,
  language = "en",
}: ChatListProps) {
  const labels = {
    messages: language === "ar" ? "الرسائل" : "Messages",
    noConversations:
      language === "ar" ? "لا توجد محادثات." : "No conversations found.",
    openChatWith: (name: string) =>
      language === "ar" ? `فتح محادثة مع ${name}` : `Open chat with ${name}`,
  };
  const dateLocale = language === "ar" ? "ar-JO" : "en-US";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-md backdrop-blur-sm">
      <div className="border-b border-border/60 bg-gradient-to-r from-muted/70 via-muted/50 to-transparent px-4 py-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {labels.messages}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background/30 to-transparent">
        {chats.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {labels.noConversations}
          </div>
        ) : (
          chats.map((chat) => (
            <button
              type="button"
              key={chat.userId}
              onClick={() => onSelectUser(chat.userId)}
              className={cn(
                "group flex w-full items-center border-b border-border/40 px-4 py-3 transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "text-start",
                selectedUserId === chat.userId
                  ? "bg-primary/10"
                  : "",
              )}
              aria-label={labels.openChatWith(chat.displayName)}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/60 overflow-hidden",
                  resolveAvatarSrc(chat.avatar)
                    ? "bg-transparent text-foreground"
                    : "bg-muted text-muted-foreground font-medium text-lg transition-colors group-hover:text-foreground",
                  "me-3",
                )}
              >
                {resolveAvatarSrc(chat.avatar) ? (
                  <img
                    src={resolveAvatarSrc(chat.avatar)!}
                    alt={chat.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getAvatarInitial(chat.displayName)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <h4
                    className={cn(
                      "truncate text-sm",
                      !chat.isRead
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {chat.displayName}
                  </h4>
                  <span
                    className={cn(
                      "whitespace-nowrap text-xs text-muted-foreground",
                      "ms-2",
                    )}
                  >
                    {new Date(chat.timestamp).toLocaleTimeString(dateLocale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: language !== "ar",
                    })}
                  </span>
                </div>
                <p
                  className={cn(
                    "truncate text-sm",
                    !chat.isRead
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {chat.lastMessage}
                </p>
              </div>
              {!chat.isRead && (
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full bg-primary",
                    "ms-2",
                  )}
                ></div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
