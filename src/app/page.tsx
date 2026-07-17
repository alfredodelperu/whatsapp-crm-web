import type { Metadata } from "next";
import { CrmDashboard } from "@/components/crm-dashboard";
import { getBootstrapData } from "@/lib/crm/bootstrap";

export const metadata: Metadata = {
  title: "DTF UV Perú · CRM WhatsApp Realtime",
  description: "Panel web realtime para conversaciones de WhatsApp conectado a Supabase.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawConversationId = params.conversationId;
  const conversationId = Array.isArray(rawConversationId)
    ? Number(rawConversationId[0])
    : Number(rawConversationId);
  const data = await getBootstrapData(Number.isFinite(conversationId) ? conversationId : undefined);
  return <CrmDashboard initialData={data} />;
}
