import SpeedCupsGame from "@/components/games/SpeedCupsGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Speed Cups - CRM Juegos",
  description: "Ordena los colores lo más rápido posible y toca el timbre.",
};

export default function SpeedCupsPage() {
  return (
    <main className="min-h-screen bg-black">
      <SpeedCupsGame />
    </main>
  );
}
