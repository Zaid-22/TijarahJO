/* eslint-disable max-lines */
import { useState, useEffect, useRef, useCallback, type ChangeEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import {
  ImagePlus,
  Loader2,
  Send,
  X,
  Download,
  Flag,
  Check,
  CheckCheck,
} from "lucide-react";
import { ScrollArea } from "../../../shared/ui/scroll-area";
import { cn } from "@/shared/ui/utils";
import { api } from "../../../services/api";
import type { ChatPresence, Language } from "../../../types";
import { usePrefersReducedMotion } from "../../../shared/hooks/usePrefersReducedMotion";
import { parseChatMessageContent } from "../chatMessageContent";
import { resolveAvatarSrc, getAvatarInitial } from "../../../shared/lib/avatar";
import { formatCompactTime } from "../../../shared/lib/dateTime";
import { APP_CONFIG } from "../../../constants/appConfig";
import { ReportPostDialog } from "../../marketplace/components/ReportPostDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../shared/ui/dialog";

/** Splits message text on URLs and renders clickable anchor links for each one. */
function renderTextWithLinks(text: string, isMe: boolean) {
  const URL_REGEX = /https?:\/\/[^\s<>"]+(?:[^\s<>".,;:!?)]|\([^\s<>"]*\))*/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={isMe ? "underline text-primary-foreground/90 hover:text-primary-foreground" : "underline text-primary hover:text-primary/80"}
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>,
    );
    lastIndex = match.index + url.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

interface ChatWindowProps {
  otherUserId: number;
  otherDisplayName: string;
  otherUserAvatar?: string;
  currentUser: { id: string; name: string };
  onBack: () => void;
  postId?: number; // Optional context
  language?: Language;
  showBackButton?: boolean;
  initialMessage?: string;
}

export function ChatWindow({
  otherUserId,
  otherDisplayName,
  otherUserAvatar,
  currentUser,
  onBack,
  postId,
  language = "en",
  showBackButton = true,
  initialMessage,
}: ChatWindowProps) {
  const { messages, isLoading, error, sendMessage, sendImageMessage } = useChat(otherUserId);
  const [inputText, setInputText] = useState("");
  const initialMessageAppliedRef = useRef(false);
  const [presence, setPresence] = useState<ChatPresence>({ isOnline: false });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const labels = {
    back: language === "ar" ? "العودة" : "Back",
    online: language === "ar" ? "متصل الآن" : "Active now",
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
    sent:
      language === "ar" ? "تم الإرسال" : "Sent",
    seen:
      language === "ar" ? "تمت المشاهدة" : "Seen",
    fullscreenImage:
      language === "ar" ? "عرض الصورة بالحجم الكامل" : "Fullscreen image",
    reportImage:
      language === "ar" ? "الإبلاغ عن الصورة" : "Report image",
    downloadImage:
      language === "ar" ? "تنزيل الصورة" : "Download image",
    closeFullscreen:
      language === "ar" ? "إغلاق عرض الصورة" : "Close fullscreen image",
  };
  const dateTimeLocale = language === "ar" ? "ar-JO" : "en-US";

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fullscreenCloseButtonRef = useRef<HTMLButtonElement>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [otherUserAvatar]);

  // Only pre-fill the greeting message once, and only when the chat history
  // has finished loading and contains zero messages (i.e. brand-new conversation).
  // We track whether isLoading has ever been true to avoid the race condition where
  // isLoading starts as false before the fetch begins.
  const hasSeenLoadingRef = useRef(false);
  useEffect(() => {
    if (isLoading) {
      hasSeenLoadingRef.current = true;
      return;
    }

    // Only act after we've seen at least one loading cycle complete
    if (
      initialMessage &&
      hasSeenLoadingRef.current &&
      messages.length === 0 &&
      !initialMessageAppliedRef.current
    ) {
      initialMessageAppliedRef.current = true;
      setInputText(initialMessage);
    }
  }, [initialMessage, isLoading, messages.length]);

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
  const scrollToBottom = useCallback(() => {
    const viewport = chatBodyRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLDivElement | null;
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [prefersReducedMotion]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
      ? `${labels.lastSeen} ${formatCompactTime(presence.lastSeenAtUtc, dateTimeLocale)}`
      : labels.offline;
  const canSend = (inputText.trim().length > 0 || Boolean(selectedImageFile)) && !isSending;

  const getDeliveryState = (isRead: boolean) =>
    isRead
      ? {
          Icon: CheckCheck,
          label: labels.seen,
        }
      : {
          Icon: Check,
          label: labels.sent,
        };

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-md backdrop-blur-sm relative z-10">
        {/* Header */}
        <div className="flex items-center border-b border-border/60 bg-linear-to-r from-muted/70 via-muted/50 to-transparent p-4">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="me-2"
              aria-label={labels.back}
            >
              ←
            </Button>
          ) : null}
          <Link
            to={`/seller/${otherUserId}`}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border border-border/60 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all",
              resolveAvatarSrc(otherUserAvatar) && !avatarError
                ? "bg-transparent text-foreground" 
                : otherDisplayName
                  ? "bg-primary/10 text-primary font-medium text-lg"
                  : "bg-muted animate-pulse",
              "me-3 shrink-0",
            )}
          >
            {resolveAvatarSrc(otherUserAvatar) && !avatarError ? (
              <img 
                src={resolveAvatarSrc(otherUserAvatar)!} 
                alt={otherDisplayName} 
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover" 
                onError={() => setAvatarError(true)}
              />
            ) : otherDisplayName ? (
              getAvatarInitial(otherDisplayName)
            ) : null}
          </Link>
          <div>
            <Link to={`/seller/${otherUserId}`} className="font-semibold text-foreground hover:text-primary transition-colors block">
              {otherDisplayName ? (
                otherDisplayName
              ) : (
                <span className="inline-block h-4 w-28 rounded bg-muted animate-pulse" />
              )}
            </Link>
            <p
              className={cn(
                "flex items-center gap-2 text-sm",
                presence.isOnline
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {presence.isOnline && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
              {presenceLabel}
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
                const deliveryState = getDeliveryState(msg.isRead);
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
                        parsedContent.type === "image"
                          ? "max-w-68 sm:max-w-84 rounded-[1.4rem] p-1.5 text-sm shadow-sm"
                          : "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                        isMe
                          ? "rounded-tr-md bg-primary text-primary-foreground"
                          : "rounded-tl-md border border-border/60 bg-muted/65 text-foreground",
                      )}
                    >
                      {parsedContent.type === "image" ? (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setFullscreenImage(parsedContent.imageUrl)}
                            className="block w-full cursor-zoom-in overflow-hidden rounded-[1.05rem] transition-opacity hover:opacity-90"
                            title={language === "ar" ? "اضغط لعرض الصورة" : "Click to view full image"}
                          >
                            <img
                              src={parsedContent.imageUrl}
                              alt={parsedContent.caption || labels.imageMessage}
                              className="h-auto max-h-80 w-full rounded-[1.05rem] object-cover"
                              loading="lazy"
                              decoding="async"
                              onLoad={scrollToBottom}
                            />
                          </button>
                          <div
                            className={cn(
                              "flex items-end justify-between gap-3 px-2 pb-1 pt-0.5",
                              parsedContent.caption ? "" : "min-h-7",
                            )}
                          >
                            {parsedContent.caption ? (
                              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-5">
                                {parsedContent.caption}
                              </p>
                            ) : (
                              <span />
                            )}
                            <span className="flex shrink-0 items-center gap-1.5 text-xs opacity-75">
                              <span
                                className={cn(
                                  isMe
                                    ? "text-primary-foreground/90"
                                    : "text-muted-foreground",
                                )}
                              >
                                {formatCompactTime(msg.timestamp, dateTimeLocale)}
                              </span>
                              {isMe && (
                                <span
                                  className="inline-flex items-center gap-1 text-primary-foreground/90"
                                  title={deliveryState.label}
                                  aria-label={deliveryState.label}
                                >
                                  <deliveryState.Icon className="h-3.5 w-3.5" />
                                  <span>{deliveryState.label}</span>
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap wrap-break-word">{renderTextWithLinks(parsedContent.text, isMe)}</p>
                          <span
                            className={cn(
                              "mt-1 flex items-center justify-end gap-1.5 text-xs opacity-75",
                              isMe
                                ? "text-primary-foreground/90"
                                : "text-muted-foreground",
                            )}
                          >
                            <span>{formatCompactTime(msg.timestamp, dateTimeLocale)}</span>
                            {isMe && (
                              <span
                                className="inline-flex items-center gap-1"
                                title={deliveryState.label}
                                aria-label={deliveryState.label}
                              >
                                <deliveryState.Icon className="h-3.5 w-3.5" />
                                <span>{deliveryState.label}</span>
                              </span>
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className="border-t border-border/60 bg-linear-to-r from-muted/70 via-muted/50 to-transparent p-4">
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
              id="chat-image-upload"
              name="chatImage"
              aria-label={labels.attachImage}
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
              id="chatMessage"
              name="chatMessage"
              autoComplete="off"
              aria-label={labels.typeMessage}
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
      <Dialog
        open={Boolean(fullscreenImage)}
        onOpenChange={(open) => {
          if (!open) {
            setFullscreenImage(null);
          }
        }}
      >
        {fullscreenImage && (
          <DialogContent
            hideCloseButton
            dir={language === "ar" ? "rtl" : "ltr"}
            className="inset-0 z-100 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center overflow-hidden rounded-none border-0 bg-black/90 p-4 backdrop-blur-sm"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              fullscreenCloseButtonRef.current?.focus();
            }}
          >
            <DialogTitle className="sr-only">
              {labels.fullscreenImage}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {labels.fullscreenImage}
            </DialogDescription>

            <div className="absolute end-16 top-4 flex items-center gap-3 rounded-full bg-black/50 px-4 py-2 text-white shadow-lg backdrop-blur-sm">
              <button
                type="button"
                className="group flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={() => {
                  setFullscreenImage(null);
                  setShowReportDialog(true);
                }}
                aria-label={labels.reportImage}
              >
                <Flag className="h-4 w-4 text-destructive group-hover:text-destructive/80" />
                <span className="hidden sm:inline">
                  {language === "ar" ? "إبلاغ" : "Report"}
                </span>
              </button>
              <div className="h-4 w-px bg-white/20" aria-hidden="true" />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const downloadUrl = fullscreenImage.includes(
                      "/chat/download-image?",
                    )
                      ? fullscreenImage
                      : `${APP_CONFIG.apiBaseUrl}/chat/download-image?url=${encodeURIComponent(fullscreenImage)}`;
                    const response = await fetch(downloadUrl, {
                      credentials: "include",
                    });
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = blobUrl;
                    anchor.download = `chat-image-${Date.now()}.jpg`;
                    anchor.click();
                    URL.revokeObjectURL(blobUrl);
                  } catch {
                    window.open(
                      fullscreenImage,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }
                }}
                className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label={labels.downloadImage}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {language === "ar" ? "تنزيل" : "Download"}
                </span>
              </button>
            </div>

            <button
              ref={fullscreenCloseButtonRef}
              type="button"
              className="absolute end-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => setFullscreenImage(null)}
              aria-label={labels.closeFullscreen}
            >
              <X className="h-6 w-6" />
            </button>

            <img
              src={fullscreenImage}
              alt={labels.fullscreenImage}
              className="max-h-full max-w-full cursor-default rounded-md object-contain shadow-2xl"
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Report Dialog for chat images */}
      <ReportPostDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportType="USER"
        targetId={otherUserId}
        targetTitle={otherDisplayName}
        language={language}
      />
    </>
  );
}
