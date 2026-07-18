import GhostBlitzGame from "@/components/games/GhostBlitzGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fantasma Blitz - CRM Juegos",
  description: "Pon a prueba tus reflejos con este clásico juego de mesa adaptado para web.",
};

export default function GhostBlitzPage() {
  return (
    <main className="min-h-screen bg-black">
      <GhostBlitzGame />
    </main>
  );
}
