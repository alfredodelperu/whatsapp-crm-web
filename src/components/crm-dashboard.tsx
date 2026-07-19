"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { BootstrapPayload, InboxConversation, MessageRow } from "@/lib/crm/types";
import { AlertCircle, Bot, CheckCheck, Clock3, Inbox, MessageSquarePlus, RefreshCcw, Search, ShieldCheck, Sparkles, Users, Send, Loader2, File as FileIcon, Download } from "lucide-react";

const statusStyles: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  closed: "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30",
};

const fmtDate = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatTime(value: string | null | undefined) {
  if (!value) return "";
  return fmtDate.format(new Date(value));
}

function getDisplayName(c: InboxConversation | null | undefined): string {
  if (!c) return "Selecciona una conversación";
  return c.title || c.push_name || c.display_name || c.phone_number || c.chat_jid || "Desconocido";
}

function badgeClass(status: string) {
  return statusStyles[status] ?? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30";
}

const labelColors = [
  "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30",
  "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  "bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/30",
  "bg-lime-500/15 text-lime-300 ring-1 ring-lime-500/30",
  "bg-green-500/15 text-green-300 ring-1 ring-green-500/30",
  "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  "bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/30",
  "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30",
  "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30",
  "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30",
  "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/30",
  "bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/30",
  "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30"
];

function getLabelColor(colorId: number) {
  return labelColors[colorId % labelColors.length];
}

function directionBadge(direction?: string | null) {
  return direction === "outbound"
    ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30"
    : "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/30";
}

function conversationKey(item: InboxConversation) {
  return item.phone_number?.trim() || item.chat_jid.trim();
}

function conversationSubtitle(item: InboxConversation) {
  return item.phone_number?.trim() || item.chat_jid;
}

function safePreviewText(value?: string | null) {
  const text = value?.trim();
  if (!text) return "Sin mensajes";

  const normalized = text.toLowerCase();
  const previewMap: Record<string, string> = {
    protocolmessage: "Mensaje del sistema",
    "[protocolmessage]": "Mensaje del sistema",
    imagemessage: "Foto",
    videomessage: "Video",
    audiomessage: "Audio",
    documentmessage: "Archivo",
    reactionmessage: "Reacción",
    listresponsemessage: "Respuesta de lista",
    buttonsresponsemessage: "Respuesta de botones",
    interactiveresponsemessage: "Respuesta interactiva",
    templatemessage: "Mensaje de plantilla",
    image: "Foto",
    video: "Video",
    audio: "Audio",
    document: "Archivo",
    sticker: "Sticker",
    contact: "Contacto",
    location: "Ubicación",
    poll: "Encuesta",
    reaction: "Reacción",
  };

  return previewMap[normalized] ?? text;
}

function renderMessageBody(message: MessageRow) {
  let directText = message.message_text?.trim() || message.caption?.trim();
  const type = message.message_type?.toLowerCase() || "";
  
  let base64Data = null;
  let mimetype = "";
  let fileName = "archivo";
  
  if (message.raw_payload && typeof message.raw_payload === "object") {
    const payload = message.raw_payload as any;
    
    // Attempt to extract base64 generically from the payload structure
    base64Data = payload.data?.base64 || payload.message?.base64 || payload.data?.message?.base64 || payload.data?.Message?.base64 || payload.Message?.base64;
    
    // Some payloads use lowercase "message", some use uppercase "Message"
    const msgData = payload.data?.message || payload.data?.Message || payload.message || payload.Message || {};
    
    if (type.includes("image") && msgData.imageMessage) {
      base64Data = base64Data || msgData.imageMessage.base64;
      mimetype = msgData.imageMessage.mimetype || "image/jpeg";
    } else if (type.includes("video") && msgData.videoMessage) {
      base64Data = base64Data || msgData.videoMessage.base64;
      mimetype = msgData.videoMessage.mimetype || "video/mp4";
    } else if ((type.includes("audio") || type.includes("ptt")) && msgData.audioMessage) {
      base64Data = base64Data || msgData.audioMessage.base64;
      mimetype = msgData.audioMessage.mimetype || "audio/ogg";
    } else if (type.includes("document") && msgData.documentMessage) {
      base64Data = base64Data || msgData.documentMessage.base64;
      mimetype = msgData.documentMessage.mimetype || "application/octet-stream";
      fileName = msgData.documentMessage.fileName || fileName;
    } else if (type.includes("sticker") && msgData.stickerMessage) {
      base64Data = base64Data || msgData.stickerMessage.base64;
      mimetype = msgData.stickerMessage.mimetype || "image/webp";
    }
  }

  // Hide fixed generic texts if we successfully extracted the media
  if (type.includes("sticker") && directText === "🏷️ Sticker" && base64Data) {
    directText = "";
  }
  if (type.includes("document") && directText?.startsWith("📎 ") && base64Data) {
    fileName = directText.replace("📎 ", "");
    directText = ""; // Just show the document box
  }
  
  const getSrc = () => base64Data?.startsWith("data:") ? base64Data : `data:${mimetype};base64,${base64Data}`;

  return (
    <div className="flex flex-col gap-2">
      {base64Data && (type.includes("image") || type.includes("sticker")) ? (
        <img 
          src={getSrc()} 
          alt="Media adjunta" 
          className={`w-auto max-w-full rounded-xl object-contain shadow-md ${type.includes("sticker") ? "max-h-[150px] bg-transparent" : "max-h-[300px]"}`} 
        />
      ) : null}
      
      {base64Data && type.includes("video") ? (
        <video 
          controls 
          src={getSrc()} 
          className="max-h-[250px] w-full rounded-xl shadow-md bg-black"
        />
      ) : null}
      
      {base64Data && (type.includes("audio") || type.includes("ptt")) ? (
        <audio 
          controls 
          src={getSrc()} 
          className="w-full max-w-[250px] h-10"
        />
      ) : null}
      
      {base64Data && type.includes("document") ? (
        <a 
          href={getSrc()} 
          download={fileName}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 p-3 text-sm hover:bg-zinc-700 transition-colors"
        >
          <div className="rounded bg-indigo-500/20 p-2 text-indigo-400">
             <FileIcon className="h-5 w-5" />
          </div>
          <span className="font-medium text-zinc-200 line-clamp-1">{fileName}</span>
          <Download className="h-4 w-4 text-zinc-400 ml-auto" />
        </a>
      ) : null}
      
      {directText ? (
        <span className="whitespace-pre-wrap leading-6">{directText}</span>
      ) : null}
      
      {!base64Data && !directText ? (
         <span className="italic opacity-60">
           {message.message_type === "protocolMessage" ? "Mensaje del sistema" : (message.message_type ? `[${message.message_type}]` : "[sin texto]")}
         </span>
      ) : null}
    </div>
  );
}

export function CrmDashboard({ initialData }: { initialData: BootstrapPayload }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSyncingLabels, setIsSyncingLabels] = useState(false);
  const [connectionState, setConnectionState] = useState<"mock" | "supabase" | "checking">(
    initialData.source === "supabase" ? "supabase" : "mock",
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<InboxConversation[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const selectedConversationIdRef = useRef<number | null>(initialData.selectedConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // Reset back to true for incoming messages
    shouldScrollRef.current = true;
  }, [data.messages]);

  const normalizedConversations = useMemo(() => {
    const sorted = [...data.conversations].sort((a, b) => {
      const at = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bt = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bt - at;
    });

    const map = new Map<string, InboxConversation>();
    for (const item of sorted) {
      const key = conversationKey(item);
      const current = map.get(key);
      if (!current) {
        map.set(key, item);
        continue;
      }
      const currentTime = current.last_message_at ? new Date(current.last_message_at).getTime() : 0;
      const nextTime = item.last_message_at ? new Date(item.last_message_at).getTime() : 0;
      if (nextTime >= currentTime) {
        map.set(key, item);
      }
    }

    return Array.from(map.values());
  }, [data.conversations]);

  const activeConversation = useMemo(
    () => normalizedConversations.find((item) => item.conversation_id === data.selectedConversationId) ?? null,
    [normalizedConversations, data.selectedConversationId],
  );

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const client = createBrowserSupabaseClient();
        if (!client) return;

        const { data: searchData, error } = await client
          .from("whatsapp_inbox")
          .select("conversation_id,instance_id,instance_name,chat_jid,contact_jid,title,last_message_text,last_message_at,unread_count,status,assigned_to_user_id,phone_number,display_name,push_name,is_group")
          .or(`title.ilike.%${term}%,display_name.ilike.%${term}%,push_name.ilike.%${term}%,phone_number.ilike.%${term}%,chat_jid.ilike.%${term}%,last_message_text.ilike.%${term}%`)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(50);

        if (!error && searchData) {
          const conversationIds = searchData.map((c) => c.conversation_id);
          if (conversationIds.length > 0) {
            const { data: labelsData } = await client
              .from("whatsapp_chat_labels")
              .select("conversation_id, whatsapp_labels(id, name, color)")
              .in("conversation_id", conversationIds);

            if (labelsData) {
              const labelsByConvId: Record<number, any[]> = {};
              for (const item of labelsData) {
                if (!labelsByConvId[item.conversation_id]) {
                  labelsByConvId[item.conversation_id] = [];
                }
                if (item.whatsapp_labels) {
                  labelsByConvId[item.conversation_id].push(item.whatsapp_labels);
                }
              }
              for (const conv of searchData) {
                (conv as any).labels = labelsByConvId[conv.conversation_id] || [];
              }
            }
          }
          setSearchResults(searchData as InboxConversation[]);
        }
      } catch (e) {
        console.error("Search error", e);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [query]);

  const displayConversations = searchResults ?? normalizedConversations;

  useEffect(() => {
    selectedConversationIdRef.current = data.selectedConversationId;
  }, [data.selectedConversationId]);

  async function refreshInboxList(selectedConversationId = selectedConversationIdRef.current) {
    const response = await fetch(`/api/bootstrap`, { cache: "no-store" });
    const payload: BootstrapPayload = await response.json();
    setData((current) => ({
      ...current,
      ...payload,
      messages: current.messages,
      selectedConversationId: selectedConversationId ?? current.selectedConversationId ?? payload.selectedConversationId,
    }));
  }

  async function refreshSelectedConversation(conversationId = selectedConversationIdRef.current) {
    if (!conversationId) return;
    const response = await fetch(`/api/bootstrap?conversationId=${conversationId}`, { cache: "no-store" });
    const payload: BootstrapPayload = await response.json();
    setData((current) => ({
      ...current,
      ...payload,
      conversations: payload.conversations.length ? payload.conversations : current.conversations,
      messages: payload.messages,
      selectedConversationId: conversationId,
    }));
  }

  async function loadConversation(conversationId: number) {
    selectedConversationIdRef.current = conversationId;
    setLoadingConversation(true);
    setHasMoreHistory(true);
    shouldScrollRef.current = true;
    try {
      await refreshSelectedConversation(conversationId);
      await refreshInboxList(conversationId);
      
      fetch(`/api/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      }).catch(console.error);

      const params = new URLSearchParams(searchParams.toString());
      params.set("conversationId", String(conversationId));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } finally {
      setLoadingConversation(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeConversation) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance: activeConversation.instance_name,
          number: activeConversation.phone_number || activeConversation.chat_jid,
          text: text,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Error al enviar: ${err.error}`);
        return;
      }

      setDraft("");
      shouldScrollRef.current = true;
      // Refresh the UI to show the message, or rely on realtime
      // We do a fast refresh to fetch it immediately if realtime takes a second
      setTimeout(() => refreshSelectedConversation(), 1000);
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  }

  async function loadHistory() {
    if (!data.selectedConversationId || data.messages.length === 0 || isLoadingHistory) return;
    setIsLoadingHistory(true);
    shouldScrollRef.current = false;
    
    try {
      const client = createBrowserSupabaseClient();
      if (!client) return;
      
      const oldestMessageTimestamp = data.messages[0]?.message_timestamp || data.messages[0]?.received_at;
      if (!oldestMessageTimestamp) return;

      const { data: olderMessages, error } = await client
        .from("whatsapp_messages")
        .select("id,instance_id,contact_id,conversation_id,event_fingerprint,provider_message_id,event_type,direction,chat_jid,sender_jid,receiver_jid,sender_name,message_type,message_text,caption,message_status,message_timestamp,received_at,raw_payload")
        .eq("conversation_id", data.selectedConversationId)
        .lt("message_timestamp", oldestMessageTimestamp)
        .order("message_timestamp", { ascending: false })
        .limit(30);

      if (error) throw error;

      if (!olderMessages || olderMessages.length < 30) {
        setHasMoreHistory(false);
      }

      if (olderMessages && olderMessages.length > 0) {
        const reversed = olderMessages.reverse().map((row) => ({
          ...row,
          from_me: row.direction === "outbound",
        })).filter((row) => {
          if (row.message_type !== "protocolMessage") return true;
          return Boolean((row.message_text && row.message_text.trim()) || (row.caption && row.caption.trim()));
        });

        setData(prev => ({
          ...prev,
          messages: [...reversed, ...prev.messages]
        }));
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function handleSyncLabels() {
    if (!activeConversation?.instance_name) {
      alert("Selecciona primero una conversación para saber qué instancia sincronizar.");
      return;
    }
    setIsSyncingLabels(true);
    try {
      const response = await fetch("/api/labels/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance: activeConversation.instance_name }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Error desconocido" }));
        alert(`Error al sincronizar etiquetas: ${err.error}`);
        return;
      }
      const data = await response.json();
      alert(`¡Éxito! Se sincronizaron ${data.synced} etiquetas desde Evolution GO a Supabase.`);
      await refreshInboxList();
      await refreshSelectedConversation();
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    } finally {
      setIsSyncingLabels(false);
    }
  }

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) {
      return;
    }

    setConnectionState("supabase");

    const channel = client
      .channel("whatsapp-crm-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_messages" },
        async (payload) => {
          const inserted = payload.new as MessageRow;
          const activeId = selectedConversationIdRef.current;

          if (activeId && inserted.conversation_id === activeId) {
            setData((current) => ({
              ...current,
              messages: [...current.messages, { ...inserted, from_me: inserted.direction === "outbound" }],
            }));
            await Promise.all([refreshInboxList(), refreshSelectedConversation(activeId)]);
            return;
          }

          await refreshInboxList();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "whatsapp_conversations" },
        async () => {
          await refreshInboxList();
          await refreshSelectedConversation();
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = [
    { label: "Instancias", value: data.stats.instances, icon: Bot },
    { label: "Conversaciones", value: data.stats.conversations, icon: Inbox },
    { label: "Sin leer", value: data.stats.unread, icon: MessageSquarePlus },
    { label: "Mensajes 24h", value: data.stats.messages24h, icon: Clock3 },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_30%),linear-gradient(180deg,#04140e_0%,#071c14_45%,#0b0f10_100%)] text-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col px-4 py-4 lg:px-6">
        <header className="mb-4 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-300/80">DTF UV Perú · CRM realtime</p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Inbox de WhatsApp conectado a Supabase</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
              Panel listo para Easypanel. Carga inicial vía servidor y actualizaciones en vivo desde Supabase Realtime cuando el backend tenga permisos de lectura.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${data.source === "supabase" ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
              <ShieldCheck className="h-4 w-4" />
              Fuente: {data.source}
            </div>
            <button
              onClick={() => handleSyncLabels()}
              disabled={isSyncingLabels}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 transition hover:bg-white/10 disabled:opacity-50"
            >
              {isSyncingLabels ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-emerald-400" />}
              Sincronizar Etiquetas
            </button>
            <button
              onClick={() => refreshSelectedConversation().catch(() => null)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Refrescar
            </button>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10 backdrop-blur">
                <div className="flex items-center justify-between text-sm text-zinc-300">
                  <span>{metric.label}</span>
                  <Icon className="h-4 w-4 text-emerald-300" />
                </div>
                <div className="mt-4 text-3xl font-semibold text-white">{metric.value}</div>
              </article>
            );
          })}
        </section>

        <main className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
          <aside className="flex min-h-0 flex-col rounded-3xl border border-white/10 bg-[#071614]/90 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Conversaciones</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Bandeja</h2>
                </div>
                <Users className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <Search className="h-4 w-4 text-zinc-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nombre, número o texto..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-zinc-400">Buscando en base de datos...</div>
              ) : null}
              {displayConversations.map((conversation) => {
                const selected = conversation.conversation_id === data.selectedConversationId;
                return (
                  <button
                    key={conversation.conversation_id}
                    onClick={() => loadConversation(conversation.conversation_id).catch(() => null)}
                    className={`mb-2 w-full rounded-2xl border p-3 text-left transition ${selected ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/0 hover:bg-white/5"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{getDisplayName(conversation)}</p>
                          {conversation.is_group ? <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] text-sky-200">grupo</span> : null}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-zinc-400">{safePreviewText(conversation.last_message_text)}</p>
                        {conversation.labels && conversation.labels.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {conversation.labels.map((lbl) => (
                              <span key={lbl.id} className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 ring-1 ring-purple-500/30">
                                {lbl.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-1 truncate text-[11px] text-zinc-500">{conversationSubtitle(conversation)}</p>
                      </div>
                      <div className="text-right text-[11px] text-zinc-500">
                        <div>{formatTime(conversation.last_message_at)}</div>
                        {conversation.unread_count > 0 ? (
                          <div className="mt-2 inline-flex rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {conversation.unread_count}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${badgeClass(conversation.status)}`}>{conversation.status}</span>
                      {conversation.labels?.map((label) => (
                        <span key={label.id} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getLabelColor(label.color)}`}>
                          {label.name}
                        </span>
                      ))}
                      <span className="ml-auto text-[11px] text-zinc-500">{conversation.instance_name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col rounded-3xl border border-white/10 bg-[#081614]/90 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Chat activo</p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  {getDisplayName(activeConversation)}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {activeConversation ? `${activeConversation.instance_name} · ${activeConversation.chat_jid}` : "Vista vacía"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                {loadingConversation ? <span className="rounded-full bg-white/5 px-3 py-1">Cargando…</span> : null}
                <span className={`rounded-full px-3 py-1 ${connectionState === "supabase" ? "bg-emerald-500/15 text-emerald-200" : "bg-zinc-700/60 text-zinc-200"}`}>
                  {connectionState === "supabase" ? "Realtime listo" : "Modo mock"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {data.messages.length ? (
                <div className="space-y-4">
                  {hasMoreHistory ? (
                    <div className="flex justify-center pb-4">
                      <button 
                        onClick={() => loadHistory()} 
                        disabled={isLoadingHistory}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition disabled:opacity-50"
                      >
                        {isLoadingHistory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                        {isLoadingHistory ? "Cargando..." : "Cargar mensajes anteriores"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center pb-4">
                      <span className="text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">Inicio de la conversación</span>
                    </div>
                  )}
                  {data.messages.map((message) => {
                    const outgoing = message.from_me ?? message.direction === "outbound";
                    const direction = outgoing ? "Salida" : "Entrada";
                    const body = renderMessageBody(message);
                    return (
                      <div key={message.id} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-lg ${outgoing ? "bg-emerald-500 text-white" : "bg-white/6 text-zinc-100 ring-1 ring-white/10"}`}>
                          <div className="mb-1 flex items-center gap-2 text-[11px] opacity-80">
                            <span>{outgoing ? "Tú" : message.sender_name ?? "Cliente"}</span>
                            <span>·</span>
                            <span>{direction}</span>
                            <span>·</span>
                            <span>{formatTime(message.message_timestamp ?? message.received_at)}</span>
                          </div>
                          <div className="text-sm">{body}</div>
                          <div className="mt-2 flex items-center justify-end gap-1 text-[11px] opacity-80">
                            {outgoing ? <CheckCheck className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                            <span className="uppercase tracking-[0.16em]">{message.message_status || "received"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 text-center">
                  <Sparkles className="h-10 w-10 text-emerald-300" />
                  <h3 className="mt-4 text-lg font-semibold text-white">Sin conversación activa</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                    Selecciona un chat desde la bandeja para ver el historial en tiempo real. Cuando tengas Supabase conectado, este panel se actualizará con cada inserción en <code>whatsapp_messages</code>.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  disabled={isSending || !activeConversation}
                  className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-5 pr-14 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500/50 focus:bg-white/10 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isSending || !activeConversation}
                  className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:bg-white/10 disabled:text-zinc-500"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </section>

          <aside className="flex min-h-[740px] flex-col gap-4 rounded-3xl border border-white/10 bg-[#071614]/90 p-4 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Contacto</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{activeConversation?.title ?? activeConversation?.display_name ?? "—"}</h3>
              <p className="mt-1 text-xs text-zinc-500">{activeConversation?.chat_jid ?? "—"}</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4"><dt className="text-zinc-400">Número</dt><dd className="text-right text-white">{activeConversation?.phone_number ?? "—"}</dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="text-zinc-400">Push name</dt><dd className="text-right text-white">{activeConversation?.push_name ?? "—"}</dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="text-zinc-400">Estado</dt><dd className="text-right text-white">{activeConversation?.status ?? "—"}</dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="text-zinc-400">Asignado</dt><dd className="text-right text-white">{activeConversation?.assigned_to_user_id ?? "Sin asignar"}</dd></div>
                {activeConversation?.labels && activeConversation.labels.length > 0 && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-zinc-400">Etiquetas</dt>
                    <dd className="flex flex-wrap justify-end gap-1.5">
                      {activeConversation.labels.map((label) => (
                        <span key={label.id} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getLabelColor(label.color)}`}>
                          {label.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Checklist técnico</p>
              <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                <li className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 text-amber-300" />Configurar variables de Supabase en Easypanel.</li>
                <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />Aplicar permisos/RLS para lectura en browser.</li>
                <li className="flex gap-2"><Bot className="mt-0.5 h-4 w-4 text-sky-300" />Conectar envío saliente cuando quieras responder desde el panel.</li>
              </ul>
            </div>

            <div className="mt-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="font-medium">Estado de publicación</p>
              <p className="mt-2 leading-6 text-emerald-50/90">
                Este proyecto ya está preparado para Docker/Easypanel. Falta solo definir las variables de entorno reales y, si usarás Realtime directo del browser, habilitar permisos de lectura en Supabase.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
