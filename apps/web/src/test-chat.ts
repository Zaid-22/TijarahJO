import { parseChatMessageContent, serializeChatImageMessage } from "./features/chat/chatMessageContent";
import { logger } from "./shared/lib/logger";

const url = "/api/v1/chat/download-image?conversationId=5&url=%2Fuploads%2Fchat-images%2F2026.webp&sig=ABCDEF";
const serialized = serializeChatImageMessage(url, "Test caption");
logger.info("Serialized:", serialized);
const parsed = parseChatMessageContent(serialized);
logger.info("Parsed:", parsed);
