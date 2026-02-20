export interface AgentSettings {
  memoryContextMessages: number;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  memoryContextMessages: 8,
  temperature: 0.7,
  maxOutputTokens: 256,
  topP: 0.95,
};

export type VoiceTone = "neutral" | "friendly" | "professional" | "warm";
export type EmotionStyle = "calm" | "enthusiastic" | "supportive" | "formal";
export type VoiceTexture = "smooth" | "clear" | "conversational";
export type ResponseLength = "brief" | "normal" | "detailed";

export interface VoiceSettings {
  tone: VoiceTone;
  speed: number;
  temperature: number;
  emotionStyle: EmotionStyle;
  voiceTexture: VoiceTexture;
  responseLength: ResponseLength;
  primaryLanguage: "ar" | "en" | "auto";
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  tone: "friendly",
  speed: 1,
  temperature: 0.7,
  emotionStyle: "supportive",
  voiceTexture: "clear",
  responseLength: "normal",
  primaryLanguage: "auto",
};

export interface WooCommerceConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  enabled: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  fromEmail: string;
  fromName: string;
}

export interface Agent {
  id: string;
  name: string;
  storeName: string;
  storeUrl: string;
  storeDesc: string;
  customInstructions: string;
  policy: string;
  usageLimit: number;
  usedCount: number;
  createdAt: string;
  embedUrl: string;
  settings?: AgentSettings;
  voiceSettings?: VoiceSettings;
  woocommerce?: WooCommerceConfig;
  smtp?: SmtpConfig;
  voiceRecordingEnabled?: boolean;
  voiceUploadToken?: string;
  lastActiveAt?: string;
}

export interface VoiceSession {
  id: string;
  user_id: string;
  store_id: string;
  audio_blob_url: string;
  transcript: string;
  ai_response: string;
  timestamp: string;
  consent_given: boolean;
}

export interface ConversationLog {
  id: string;
  agentId: string;
  userMessage: string;
  assistantReply: string;
  timestamp: string;
}

export interface DashboardData {
  agents: Agent[];
  conversations: ConversationLog[];
}

export const EMPTY_AGENT: Omit<Agent, "id" | "createdAt" | "embedUrl" | "usedCount"> = {
  name: "",
  storeName: "",
  storeUrl: "",
  storeDesc: "",
  customInstructions: "",
  policy: "Be helpful, friendly, and professional.",
  usageLimit: 1000,
  settings: DEFAULT_AGENT_SETTINGS,
};
