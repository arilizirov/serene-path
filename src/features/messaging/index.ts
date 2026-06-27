// Public surface of the messaging feature (therapist↔client direct messages).
// Routes reach the feature only through this barrel; internals (repository,
// service, schema files) stay private per boundaries.yaml.
export { sendMessage, getThread, getThreads } from "./service";
export type {
  ThreadMessageDto,
  ConversationDto,
  SendResult,
  ThreadResult,
} from "./service";
export { sendMessageSchema } from "./schema";
export type { SendMessageInput } from "./schema";
