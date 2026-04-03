import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useChat } from "../hooks/useChat";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { ImagePlus, Loader2, Send, X, Download, Flag } from "lucide-react";
import { ScrollArea } from "../../../shared/ui/scroll-area";
import { cn } from "@/shared/ui/utils";
import { api } from "../../../services/api";
import type { ChatPresence, Language } from "../../../types";
import { usePrefersReducedMotion } from "../../../shared/hooks/usePrefersReducedMotion";
import { parseChatMessageContent } from "../chatMessageContent";
import { resolveAvatarSrc, getAvatarInitial } from "../../../shared/lib/avatar";

interface ChatWindowProps {
  otherUserId: number;
  otherDisplayName: string;
  otherUserAvatar?: string;
  currentUser: { id: string; name: string };
  onBack: () => void;
  postId?: number; // Optional context
  language?: Language;
}

export function ChatWindow({
  otherUserId,
  otherDisplayName,
  otherUserAvatar,
  currentUser,
  onBack,
  postId,
  language = "en",
}: ChatWindowProps) {
  const { messages, isLoading, error, sendMessage, sendImageMessage } = useChat(otherUserId);
  const [inputText, setInputText] = useState("");
  const [presence, setPresence] = useState<ChatPresence>({ isOnline: false });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const labels = {
    back: language === "ar" ? "العودة" : "Back",
    online: language === "ar" ? "متصل" : "Online",
    offline: language === "ar" ? "غير متصل" : "Offline",
    lastSeen: language === "ar" ? "آخر ظهور" : "Last seen",
    loadingMessages:
      language === "ar" ? "جارٍ تحميل الرسائل..." : "Loading messages...",
    noMessages:
      language === "ar" ? "لا توجد رسائل بعد. ابدأ التحية!" : "No messages yet. Say hi!",
    typeMessage:
      language === "ar"
        ? "اكتب رسالة أو أضف تعليقًا للصورة..."
        : "Type a message or add a caption...",
    sendMessage:
      language === "ar" ? "إرسال الرسالة" : "Send message",
    attachImage:
      language === "ar" ? "إرفاق صورة" : "Attach image",
    removeImage:
      language === "ar" ? "إزالة الصورة" : "Remove image",
    imageMessage:
      language === "ar" ? "صورة" : "Image",
    sending:
      language === "ar" ? "جارٍ الإرسال..." : "Sending...",
  };
  const dateTimeLocale = language === "ar" ? "ar-JO" : "en-US";

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const clearSelectedImage = () => {
    if (selectedImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImageFile(null);
    setSelectedImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Auto-scroll inside the chat viewport only (prevents window/page jump).
  useEffect(() => {
    const viewport = chatBodyRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLDivElement | null;
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [messages, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  useEffect(() => {
    let isCancelled = false;

    const refreshPresence = async () => {
      try {
        const isOnline = await api.chat.getPresence(otherUserId);
        if (!isCancelled) {
          setPresence(isOnline);
        }
      } catch {
        if (!isCancelled) {
          setPresence({ isOnline: false });
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

  const handleImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    if (selectedImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImageFile(file);
    setSelectedImagePreview(URL.createObjectURL(file));
  };

  const handleSend = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput && !selectedImageFile) {
      return;
    }

    setIsSending(true);
    let sent = false;

    if (selectedImageFile) {
      sent = await sendImageMessage(selectedImageFile, trimmedInput || undefined, postId);
      if (sent) {
        setInputText("");
        clearSelectedImage();
      }
    } else {
      sent = await sendMessage(trimmedInput, postId);
      if (sent) {
        setInputText("");
      }
    }

    setIsSending(false);
  };
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  const handleSendClick = () => {
    void handleSend();
  };

  const presenceLabel = presence.isOnline
    ? labels.online
    : presence.lastSeenAtUtc
      ? `${labels.lastSeen} ${new Date(presence.lastSeenAtUtc).toLocaleString(dateTimeLocale)}`
      : labels.offline;
  const canSend = (inputText.trim().length > 0 || Boolean(selectedImageFile)) && !isSending;

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-md backdrop-blur-sm relative z-10">
        {/* Header */}
        <div className="flex items-center border-b border-border/60 bg-gradient-to-r from-muted/70 via-muted/50 to-transparent p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className={`md:hidden me-2`}
            aria-label={labels.back}
          >
            ←
          </Button>
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border border-border/60 overflow-hidden",
              resolveAvatarSrc(otherUserAvatar) 
                ? "bg-transparent text-foreground" 
                : "bg-primary/10 text-primary font-medium text-lg",
              "me-3",
            )}
          >
            {resolveAvatarSrc(otherUserAvatar) ? (
              <img 
                src={resolveAvatarSrc(otherUserAvatar)!} 
                alt={otherDisplayName} 
                className="h-full w-full object-cover" 
              />
            ) : (
              getAvatarInitial(otherDisplayName)
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {otherDisplayName}
            </h3>
            <p
              className={cn(
                "text-sm",
                presence.isOnline
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {presence.statusText || presenceLabel}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatBodyRef} className="min-h-0 flex-1">
          <ScrollArea className="h-full px-4 py-4">
            <div className="space-y-4">
              {isLoading && (
                <p className="text-center text-muted-foreground">{labels.loadingMessages}</p>
              )}
              {!isLoading && messages.length === 0 && (
                <p className="mt-10 text-center text-muted-foreground">
                  {labels.noMessages}
                </p>
              )}
              {messages.map((msg) => {
                const parsedContent = parseChatMessageContent(msg.content);
                const isMe = msg.senderId.toString() === currentUser.id;
                const messageKey =
                  typeof msg.messageId === "number"
                    ? `msg-${msg.messageId}`
                    : `msg-${msg.senderId}-${msg.receiverId}-${msg.postId ?? "none"}-${msg.timestamp}-${msg.content}`;

                return (
                  <div
                    key={messageKey}
                    className={cn(
                      "mb-2 flex w-full",
                      isMe ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                        isMe
                          ? "rounded-tr-md bg-primary text-primary-foreground"
                          : "rounded-tl-md border border-border/60 bg-muted/65 text-foreground",
                      )}
                    >
                      {parsedContent.type === "image" ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setFullscreenImage(parsedContent.imageUrl)}
                            className="block w-full cursor-zoom-in overflow-hidden transition-opacity hover:opacity-90 rounded-xl"
                            title={language === "ar" ? "اضغط لعرض الصورة" : "Click to view full image"}
                          >
                            <img
                              src={parsedContent.imageUrl}
                              alt={parsedContent.caption || labels.imageMessage}
                              className="max-h-72 w-full object-cover"
                              loading="lazy"
                            />
                          </button>
                          {parsedContent.caption && (
                            <p className="whitespace-pre-wrap break-words">{parsedContent.caption}</p>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{parsedContent.text}</p>
                      )}
                      <span
                        className={cn(
                          "mt-1 block text-xs opacity-75",
                          isMe
                            ? "text-primary-foreground/90"
                            : "text-muted-foreground",
                        )}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString(dateTimeLocale, {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: language !== "ar",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className="border-t border-border/60 bg-gradient-to-r from-muted/70 via-muted/50 to-transparent p-4">
          {selectedImagePreview && (
            <div className="mb-3 flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 p-2">
              <img
                src={selectedImagePreview}
                alt={labels.imageMessage}
                className="h-16 w-16 rounded-lg border border-border/60 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedImageFile?.name || labels.imageMessage}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "يمكنك إضافة تعليق قبل الإرسال." : "You can add a caption before sending."}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={labels.removeImage}
                onClick={clearSelectedImage}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {error && (
            <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelected}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={labels.attachImage}
              onClick={openFilePicker}
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={labels.typeMessage}
              className="flex-1 bg-background"
            />
            <Button
              onClick={handleSendClick}
              size="icon"
              aria-label={labels.sendMessage}
              className="bg-primary hover:bg-primary/90"
              disabled={!canSend}
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          {isSending && (
            <p className="mt-2 text-xs text-muted-foreground">{labels.sending}</p>
          )}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setFullscreenImage(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setFullscreenImage(null);
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          {/* Action Bar */}
          <div
            className="absolute top-4 right-16 flex items-center gap-3 rounded-full bg-black/50 px-4 py-2 text-white shadow-lg backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <button
              type="button"
              className="group flex items-center gap-2 text-sm font-medium transition-colors hover:text-white/80"
              onClick={() => {
                import("sonner").then(({ toast }) => {
                  toast.success(
                    language === "ar"
                      ? "تم الإبلاغ عن هذه الصورة بنجاح. سنقوم بمراجعتها."
                      : "Image reported successfully. We will review it.",
                  );
                  setFullscreenImage(null);
                });
              }}
              title={language === "ar" ? "الإبلاغ عن الصورة" : "Report image"}
            >
              <Flag className="h-4 w-4 text-destructive group-hover:text-destructive/80" />
              <span className="hidden sm:inline">{language === "ar" ? "إبلاغ" : "Report"}</span>
            </button>
            <div className="h-4 w-px bg-white/20" />
            <button
              type="button"
              onClick={async () => {
                try {
                  const downloadUrl = fullscreenImage.includes("/chat/download-image?")
                    ? fullscreenImage
                    : `${(await import("../../../constants/appConfig")).APP_CONFIG.apiBaseUrl}/chat/download-image?url=${encodeURIComponent(fullscreenImage)}`;
                  window.location.href = downloadUrl;
                } catch {
                  window.open(fullscreenImage, "_blank");
                }
              }}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white/80"
              title={language === "ar" ? "تنزيل الصورة" : "Download image"}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "ar" ? "تنزيل" : "Download"}</span>
            </button>
          </div>

          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenImage(null);
            }}
            aria-label="Close fullscreen image"
          >
            <X className="h-6 w-6" />
          </button>
          
          <img
            src={fullscreenImage}
            alt="Fullscreen view"
            className="max-h-full max-w-full rounded-md object-contain shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          />
        </div>
      )}
    </>
  );
}
