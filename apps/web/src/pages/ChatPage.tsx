import { useState, useEffect } from "react";
import { ChatList } from "../features/chat/components/ChatList";
import { ChatWindow } from "../features/chat/components/ChatWindow";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toPositiveIntegerId } from "../utils/idValidation";
import { resolveUserDisplayName } from "../utils/userDisplayName";
import { logger } from "../shared/lib/logger";

interface ChatSummary {
  userId: number;
  displayName: string;
  lastMessage: string;
  timestamp: string;
  isRead: boolean;
}

export function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();

  const initialSelectedUserId = toPositiveIntegerId(userId);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    initialSelectedUserId ?? null,
  );
  const [selectedDisplayName, setSelectedDisplayName] = useState("");
  const [userDisplayNamesById, setUserDisplayNamesById] = useState<Record<number, string>>(
    {},
  );
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function fetchChats() {
      if (!isAuthenticated || !user?.id) {
        setChats([]);
        setUserDisplayNamesById({});
        setIsLoadingChats(false);
        return;
      }

      setIsLoadingChats(true);
      try {
        const currentUserId = toPositiveIntegerId(user.id);
        if (!currentUserId) {
          setChats([]);
          return;
        }

        const recentMessages = await api.chat.getRecentChats();

        const sortedRecentMessages = [...recentMessages].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        const chatsByUser = new Map<number, ChatSummary>();
        sortedRecentMessages.forEach((message) => {
          const otherUser =
            message.senderId === currentUserId
              ? message.receiverId
              : message.senderId;

          if (
            !otherUser ||
            otherUser === currentUserId ||
            chatsByUser.has(otherUser)
          ) {
            return;
          }

          chatsByUser.set(otherUser, {
            userId: otherUser,
            displayName: `User ${otherUser}`,
            lastMessage: message.content,
            timestamp: message.timestamp,
            isRead:
              message.senderId === currentUserId ? true : Boolean(message.isRead),
          });
        });

        const otherUserIds = Array.from(chatsByUser.keys());
        const namesById: Record<number, string> = {};

        await Promise.all(
          otherUserIds.map(async (otherUserId) => {
            const userData = await api.users.getUser(String(otherUserId));
            namesById[otherUserId] = resolveUserDisplayName(
              userData as Record<string, unknown> | null | undefined,
              otherUserId,
            );
          }),
        );

        setUserDisplayNamesById(namesById);
        setChats(
          Array.from(chatsByUser.values()).map((chat) => ({
            ...chat,
            displayName: namesById[chat.userId] || chat.displayName,
          })),
        );
      } catch (error) {
        logger.warn("Failed to load chats", error);
        setChats([]);
        setUserDisplayNamesById({});
      } finally {
        setIsLoadingChats(false);
      }
    }

    fetchChats();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!userId) {
      setSelectedUserId(null);
      return;
    }

    const parsedUserId = toPositiveIntegerId(userId);
    setSelectedUserId(parsedUserId ?? null);
  }, [userId]);

  useEffect(() => {
    if (selectedUserId === null) {
      setSelectedDisplayName("");
      return;
    }

    const cachedName = userDisplayNamesById[selectedUserId];
    if (cachedName) {
      setSelectedDisplayName(cachedName);
      return;
    }

    setSelectedDisplayName(`User ${selectedUserId}`);

    let isCancelled = false;
    (async () => {
      const userData = await api.users.getUser(String(selectedUserId));
      if (isCancelled) {
        return;
      }

      const resolvedName = resolveUserDisplayName(
        userData as Record<string, unknown> | null | undefined,
        selectedUserId,
      );
      setSelectedDisplayName(resolvedName);
      setUserDisplayNamesById((prev) => ({
        ...prev,
        [selectedUserId]: resolvedName,
      }));
    })();

    return () => {
      isCancelled = true;
    };
  }, [selectedUserId, userDisplayNamesById]);

  const handleSelectUser = (id: number) => {
    const normalizedUserId = toPositiveIntegerId(id);
    if (!normalizedUserId) {
      return;
    }

    setSelectedUserId(normalizedUserId);
    setSelectedDisplayName(
      userDisplayNamesById[normalizedUserId] || `User ${normalizedUserId}`,
    );
    navigate(`/chat/${normalizedUserId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 text-center mt-10">
        <p>Please login to view your messages.</p>
        <button
          onClick={() => navigate("/")}
          className="text-blue-600 underline"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-80px)] mt-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Chat List - Hidden on mobile if chat selected */}
        <div
          className={`h-full ${isMobile && selectedUserId ? "hidden" : "block"} md:col-span-1`}
        >
          {isLoadingChats ? (
            <div className="flex justify-center p-10">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <ChatList
              chats={chats}
              selectedUserId={selectedUserId}
              onSelectUser={handleSelectUser}
            />
          )}
        </div>

        {/* Chat Window - Hidden on mobile if no chat selected */}
        <div
          className={`h-full ${isMobile && !selectedUserId ? "hidden" : "block"} md:col-span-2`}
        >
          {selectedUserId ? (
            <ChatWindow
              otherUserId={selectedUserId}
              otherDisplayName={selectedDisplayName || `User ${selectedUserId}`}
              currentUser={{ id: user?.id || "", name: user?.name || "Me" }}
              onBack={() => {
                setSelectedUserId(null);
                navigate("/chat");
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
