import CortexGame from "@/components/games/CortexGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cortex Challenge - CRM Juegos",
  description: "Pon a prueba tu cerebro con 5 tipos de retos diferentes.",
};

export default function CortexPage() {
  return (
    <main className="min-h-screen bg-black">
      <CortexGame />
    </main>
  );
}
