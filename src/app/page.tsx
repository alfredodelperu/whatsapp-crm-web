import type { Metadata } from "next";
import { CrmDashboard } from "@/components/crm-dashboard";
import { getBootstrapData } from "@/lib/crm/bootstrap";

export const metadata: Metadata = {
  title: "DTF UV Perú · CRM WhatsApp Realtime",
  description: "Panel web realtime para conversaciones de WhatsApp conectado a Supabase.",
};

export default async function Page() {
  const data = await getBootstrapData();
  return <CrmDashboard initialData={data} />;
}
