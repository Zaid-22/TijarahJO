import { APP_CONFIG } from "../../constants/appConfig";
import type { Language } from "../../types";

const CHAT_IMAGE_PREFIX = "[chat-image]";
const CHAT_DOWNLOAD_ROUTE_FRAGMENT = "/chat/download-image";

type ParsedChatMessageContent =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      imageUrl: string;
      rawImageUrl: string;
      caption?: string;
    };

const IMAGE_PATH_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg)(?:$|[?#])/i;

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function isLikelyImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("data:image/")) {
    return true;
  }

  if (trimmed.startsWith("/uploads/")) {
    return true;
  }

  if (trimmed.includes(CHAT_DOWNLOAD_ROUTE_FRAGMENT)) {
    return true;
  }

  if (!isHttpUrl(trimmed) && !trimmed.startsWith("/")) {
    return false;
  }

  try {
    const parsed = new URL(trimmed, APP_CONFIG.backendHostUrl);
    return IMAGE_PATH_PATTERN.test(parsed.pathname + parsed.search);
  } catch {
    return IMAGE_PATH_PATTERN.test(trimmed);
  }
}

function resolveImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    isHttpUrl(trimmed)
  ) {
    return trimmed;
  }

  const backendHost = APP_CONFIG.backendHostUrl.replace(/\/+$/, "");
  if (!backendHost) {
    return trimmed;
  }

  return trimmed.startsWith("/")
    ? `${backendHost}${trimmed}`
    : `${backendHost}/${trimmed}`;
}

export function serializeChatImageMessage(
  imageUrl: string,
  caption?: string,
): string {
  const normalizedImageUrl = imageUrl.trim();
  const normalizedCaption = caption?.trim() ?? "";
  if (!normalizedImageUrl) {
    return normalizedCaption;
  }

  return normalizedCaption
    ? `${CHAT_IMAGE_PREFIX} ${normalizedImageUrl}\n${normalizedCaption}`
    : `${CHAT_IMAGE_PREFIX} ${normalizedImageUrl}`;
}

export function parseChatMessageContent(content: string): ParsedChatMessageContent {
  const trimmed = content.trim();
  if (!trimmed) {
    return { type: "text", text: "" };
  }

  if (trimmed.startsWith(CHAT_IMAGE_PREFIX)) {
    const rawPayload = trimmed.slice(CHAT_IMAGE_PREFIX.length).trim();
    const payloadLines = rawPayload
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (payloadLines.length > 0 && isLikelyImageUrl(payloadLines[0])) {
      const [rawImageUrl, ...captionLines] = payloadLines;
      const caption = captionLines.join("\n").trim();
      return {
        type: "image",
        imageUrl: resolveImageUrl(rawImageUrl),
        rawImageUrl,
        ...(caption ? { caption } : {}),
      };
    }
  }

  if (isLikelyImageUrl(trimmed)) {
    return {
      type: "image",
      imageUrl: resolveImageUrl(trimmed),
      rawImageUrl: trimmed,
    };
  }

  return { type: "text", text: content };
}

export function formatChatPreviewText(
  content: string,
  language: Language = "en",
): string {
  const parsed = parseChatMessageContent(content);
  if (parsed.type === "text") {
    return parsed.text;
  }

  const photoLabel = language === "ar" ? "صورة" : "Photo";
  if (parsed.caption) {
    return `${photoLabel}: ${parsed.caption}`;
  }

  return photoLabel;
}
