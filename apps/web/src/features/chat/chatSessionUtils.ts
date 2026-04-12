export type ChatLocationState = {
  fromPath?: string;
  chatListPath?: string;
};

export type PersistedChatReturnState = {
  chatUserId: string;
  returnPath: string;
};

export interface ChatSummary {
  userId: number;
  displayName: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  isRead: boolean;
}

export function readPersistedChatReturnState(): PersistedChatReturnState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.sessionStorage.getItem("chat:return-path");
  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as {
      chatUserId?: unknown;
      returnPath?: unknown;
    };

    return typeof parsedValue.chatUserId === "string" &&
      parsedValue.chatUserId.trim().length > 0 &&
      typeof parsedValue.returnPath === "string" &&
      parsedValue.returnPath.startsWith("/")
      ? {
          chatUserId: parsedValue.chatUserId,
          returnPath: parsedValue.returnPath,
        }
      : null;
  } catch {
    return null;
  }
}

export function clearPersistedChatReturnPath() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem("chat:return-path");
}
