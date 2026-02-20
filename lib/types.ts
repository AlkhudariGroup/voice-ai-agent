export interface UserProfile {
  name?: string;
  preferences?: Record<string, string | number | boolean>;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  startedAt: string;
  updatedAt: string;
}

export interface Memory {
  userProfile: UserProfile;
  projects: Project[];
  notes: Note[];
  conversations: Conversation[];
}

export const EMPTY_MEMORY: Memory = {
  userProfile: {},
  projects: [],
  notes: [],
  conversations: [],
};
