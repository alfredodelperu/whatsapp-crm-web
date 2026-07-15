import { mockBootstrap } from "./mock";
import type { BootstrapPayload, InboxConversation, MessageRow, SummaryStats } from "./types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function computeStats(conversations: InboxConversation[], messages: MessageRow[]): SummaryStats {
  return {
    instances: new Set(conversations.map((item) => item.instance_id)).size,
    conversations: conversations.length,
    unread: conversations.reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    messages24h: messages.length,
  };
}

export async function getBootstrapData(conversationId?: number): Promise<BootstrapPayload> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return mockBootstrap;
  }

  const [inboxResult, messagesResult] = await Promise.all([
    supabase
      .from("whatsapp_inbox")
      .select("conversation_id,instance_id,instance_name,chat_jid,contact_jid,title,last_message_text,last_message_at,unread_count,status,assigned_to_user_id,phone_number,display_name,push_name,is_group")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(50),
    conversationId
      ? supabase
          .from("whatsapp_messages")
          .select("id,instance_id,contact_id,conversation_id,event_fingerprint,provider_message_id,event_type,direction,chat_jid,sender_jid,receiver_jid,sender_name,message_type,message_text,caption,message_status,message_timestamp,received_at")
          .eq("conversation_id", conversationId)
          .order("message_timestamp", { ascending: true })
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (inboxResult.error) {
    return mockBootstrap;
  }

  const conversations = (inboxResult.data ?? []) as InboxConversation[];
  const selectedConversationId = conversationId ?? conversations[0]?.conversation_id ?? null;
  const messages: MessageRow[] = conversationId
    ? ((messagesResult as { data: MessageRow[] | null }).data ?? []).map((row) => ({
        ...row,
        from_me: row.direction === "outbound",
      }))
    : [];

  return {
    source: "supabase",
    generatedAt: new Date().toISOString(),
    selectedConversationId,
    stats: computeStats(conversations, messages),
    conversations,
    messages,
  };
}
