export type SummaryStats = {
  instances: number;
  conversations: number;
  unread: number;
  messages24h: number;
};

export type InboxConversation = {
  conversation_id: number;
  instance_id: number;
  instance_name: string;
  chat_jid: string;
  contact_jid: string | null;
  title: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
  status: string;
  assigned_to_user_id: string | null;
  phone_number: string | null;
  display_name: string | null;
  push_name: string | null;
  is_group: boolean;
  labels?: Array<{
    id: number;
    name: string;
    color: number;
  }>;
};

export type MessageRow = {
  id: number;
  instance_id: number;
  contact_id: number | null;
  conversation_id: number | null;
  event_fingerprint: string;
  provider_message_id: string | null;
  event_type: string;
  direction: string;
  chat_jid: string | null;
  sender_jid: string | null;
  receiver_jid: string | null;
  sender_name: string | null;
  message_type: string;
  message_text: string | null;
  caption: string | null;
  message_status: string;
  message_timestamp: string | null;
  received_at: string;
  raw_payload?: any;
  from_me?: boolean;
};

export type BootstrapPayload = {
  source: "supabase" | "mock";
  generatedAt: string;
  selectedConversationId: number | null;
  stats: SummaryStats;
  conversations: InboxConversation[];
  messages: MessageRow[];
};
