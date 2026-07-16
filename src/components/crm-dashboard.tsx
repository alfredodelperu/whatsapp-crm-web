"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { BootstrapPayload, InboxConversation, MessageRow } from "@/lib/crm/types";
import { AlertCircle, Bot, CheckCheck, Clock3, Inbox, MessageSquarePlus, RefreshCcw, Search, ShieldCheck, Sparkles, Users } from "lucide-react";

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
  if (!value) return "—";
  try {
    return fmtDate.format(new Date(value));
  } catch {
    return value;
  }
}

function badgeClass(status: string) {
  return statusStyles[status] ?? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30";
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

export function CrmDashboard({ initialData }: { initialData: BootstrapPayload }) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [connectionState, setConnectionState] = useState<"mock" | "supabase" | "checking">(
    initialData.source === "supabase" ? "supabase" : "mock",
  );
  const selectedConversationIdRef = useRef<number | null>(initialData.selectedConversationId);

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
    () => data.conversations.find((item) => item.conversation_id === data.selectedConversationId) ?? null,
    [data.conversations, data.selectedConversationId],
  );

  const filteredConversations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return normalizedConversations;

    return normalizedConversations.filter((item) => {
      const haystack = [
        item.title,
        item.display_name,
        item.push_name,
        item.phone_number,
        item.chat_jid,
        item.last_message_text,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [normalizedConversations, query]);

  useEffect(() => {
    selectedConversationIdRef.current = data.selectedConversationId;
  }, [data.selectedConversationId]);

  async function refreshInboxList() {
    const response = await fetch(`/api/bootstrap`, { cache: "no-store" });
    const payload: BootstrapPayload = await response.json();
    setData((current) => ({
      ...current,
      ...payload,
      messages: current.messages,
      selectedConversationId: current.selectedConversationId ?? payload.selectedConversationId,
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
    try {
      await refreshSelectedConversation(conversationId);
      await refreshInboxList();
    } finally {
      setLoadingConversation(false);
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_30%),linear-gradient(180deg,#04140e_0%,#071c14_45%,#0b0f10_100%)] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col px-4 py-4 lg:px-6">
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

        <main className="mt-4 grid flex-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
          <aside className="flex min-h-[740px] flex-col rounded-3xl border border-white/10 bg-[#071614]/90 shadow-2xl shadow-black/20 backdrop-blur">
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
              {filteredConversations.map((conversation) => {
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
                          <p className="font-medium text-white">{conversation.title ?? conversation.display_name ?? conversation.chat_jid}</p>
                          {conversation.is_group ? <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] text-sky-200">grupo</span> : null}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-zinc-400">{conversation.last_message_text ?? "Sin mensajes"}</p>
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
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${badgeClass(conversation.status)}`}>{conversation.status}</span>
                      <span className="text-[11px] text-zinc-500">{conversation.instance_name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-[740px] flex-col rounded-3xl border border-white/10 bg-[#081614]/90 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Chat activo</p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  {activeConversation?.title ?? activeConversation?.display_name ?? activeConversation?.chat_jid ?? "Selecciona una conversación"}
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
                  {data.messages.map((message) => {
                    const outgoing = message.from_me ?? message.direction === "outbound";
                    const direction = outgoing ? "Salida" : "Entrada";
                    const body = message.message_text || message.caption || (message.message_type ? `[${message.message_type}]` : "[sin texto]");
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
                          <p className="whitespace-pre-wrap text-sm leading-6">{body}</p>
                          <div className="mt-2 flex items-center justify-end gap-1 text-[11px] opacity-80">
                            {outgoing ? <CheckCheck className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                            <span className="uppercase tracking-[0.16em]">{message.message_status || "received"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                <MessageSquarePlus className="h-4 w-4 text-emerald-300" />
                <span>Bloque de respuesta listo para conectar envío saliente desde Evolution / WhatsApp API.</span>
              </div>
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
