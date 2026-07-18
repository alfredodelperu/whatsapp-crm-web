import DobbleGame from "@/components/games/DobbleGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dobble (Spot It!) - CRM Juegos",
  description: "Entrena tus habilidades de observación buscando el símbolo idéntico.",
};

export default function DobblePage() {
  return (
    <main className="min-h-screen bg-black">
      <DobbleGame />
    </main>
  );
}
