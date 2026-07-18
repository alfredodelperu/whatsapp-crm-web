"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Ghost, FlaskConical, Rat, Book, Armchair, Play, RotateCcw, Trophy, Zap, AlertCircle } from "lucide-react";

type TrueObject = {
  id: string;
  shape: string;
  color: string;
  label: string;
  icon: any;
  colorHex: string;
};

const TRUE_OBJECTS: TrueObject[] = [
  { id: "ghost", shape: "ghost", color: "white", label: "Fantasma", icon: Ghost, colorHex: "#ffffff" },
  { id: "bottle", shape: "bottle", color: "green", label: "Botella", icon: FlaskConical, colorHex: "#22c55e" },
  { id: "mouse", shape: "mouse", color: "grey", label: "Ratón", icon: Rat, colorHex: "#71717a" },
  { id: "book", shape: "book", color: "blue", label: "Libro", icon: Book, colorHex: "#3b82f6" },
  { id: "chair", shape: "chair", color: "red", label: "Sillón", icon: Armchair, colorHex: "#ef4444" },
];

const SHAPE_MAP: Record<string, any> = {
  ghost: Ghost,
  bottle: FlaskConical,
  mouse: Rat,
  book: Book,
  chair: Armchair,
};

const COLOR_CLASSES: Record<string, string> = {
  white: "text-zinc-100",
  green: "text-green-500",
  grey: "text-zinc-500",
  blue: "text-blue-500",
  red: "text-red-500",
};

type CardItem = { shape: string; color: string };
type CardData = { items: CardItem[]; correctAnswer: string };

function generateCard(): CardData {
  const isMatchCard = Math.random() < 0.5;
  let objectsOnCard: CardItem[] = [];
  let correctAnswer = "";

  if (isMatchCard) {
    // Exact match
    const correctObj = TRUE_OBJECTS[Math.floor(Math.random() * 5)];
    correctAnswer = correctObj.id;

    const remaining = TRUE_OBJECTS.filter((o) => o.id !== correctObj.id);
    const shapeSource = remaining[Math.floor(Math.random() * 4)];
    const colorSource = remaining.filter((o) => o.id !== shapeSource.id)[Math.floor(Math.random() * 3)];

    objectsOnCard = [
      { shape: correctObj.shape, color: correctObj.color },
      { shape: shapeSource.shape, color: colorSource.color },
    ];
  } else {
    // Elimination
    const targetObj = TRUE_OBJECTS[Math.floor(Math.random() * 5)];
    correctAnswer = targetObj.id;

    const remaining = TRUE_OBJECTS.filter((o) => o.id !== targetObj.id);
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    
    objectsOnCard = [
      { shape: shuffled[0].shape, color: shuffled[1].color },
      { shape: shuffled[2].shape, color: shuffled[3].color },
    ];
  }

  return {
    items: objectsOnCard.sort(() => Math.random() - 0.5),
    correctAnswer,
  };
}

export default function GhostBlitzGame() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("ghostBlitzHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setCurrentCard(generateCard());
    setGameState("playing");
    setFeedback(null);
  };

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === "playing") {
      setGameState("gameover");
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("ghostBlitzHighScore", score.toString());
      }
    }
  }, [gameState, timeLeft, score, highScore]);

  const handleObjectClick = (objectId: string) => {
    if (gameState !== "playing" || !currentCard) return;

    if (objectId === currentCard.correctAnswer) {
      setScore((s) => s + 1);
      setFeedback("correct");
    } else {
      setScore((s) => Math.max(0, s - 1));
      setFeedback("wrong");
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentCard(generateCard());
    }, 400);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#081614] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black p-4 font-sans text-white">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              <Ghost className="h-8 w-8 text-emerald-400" />
              Fantasma Blitz
            </h1>
            <p className="mt-1 text-sm text-zinc-400">Reflejos a la velocidad de la luz</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-amber-400">
              <Trophy className="h-5 w-5" />
              <span className="font-bold">Récord: {highScore}</span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        {gameState === "start" && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-6 rounded-full bg-emerald-500/10 p-6">
              <Zap className="h-16 w-16 text-emerald-400" />
            </div>
            <h2 className="mb-4 text-2xl font-bold">¿Cómo se juega?</h2>
            <div className="mb-8 max-w-md space-y-4 text-left text-zinc-300">
              <p className="flex items-start gap-2">
                <span className="mt-1 text-emerald-400">✓</span>
                Si la carta muestra un objeto con su <strong>color original</strong> (ej. Fantasma blanco), ¡toca ese objeto!
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1 text-emerald-400">✓</span>
                Si ninguno tiene su color original, toca el objeto que <strong>NO aparece en la carta</strong> y cuyo color <strong>tampoco aparece</strong>.
              </p>
            </div>
            <button
              onClick={startGame}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-emerald-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-emerald-400 active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Comenzar Partida (60s)
            </button>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="flex flex-col items-center py-10 text-center">
            <h2 className="mb-2 text-4xl font-extrabold text-white">¡Tiempo Terminado!</h2>
            <p className="mb-8 text-xl text-zinc-400">
              Puntuación final: <span className="text-3xl font-bold text-emerald-400">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-emerald-400 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Jugar de nuevo
            </button>
          </div>
        )}

        {gameState === "playing" && currentCard && (
          <div className="relative flex flex-col items-center">
            
            {/* Stats HUD */}
            <div className="mb-6 flex w-full justify-between px-4">
              <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-black/40 px-6 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Puntos</span>
                <span className={`text-3xl font-black ${feedback === "correct" ? "text-emerald-400" : feedback === "wrong" ? "text-red-500" : "text-white"}`}>{score}</span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-black/40 px-6 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tiempo</span>
                <span className={`text-3xl font-black ${timeLeft <= 10 ? "animate-pulse text-red-500" : "text-white"}`}>{timeLeft}s</span>
              </div>
            </div>

            {/* Current Card */}
            <div className={`relative mb-12 flex h-56 w-80 items-center justify-center gap-8 rounded-xl bg-zinc-100 p-8 shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-transform duration-200 ${feedback === "wrong" ? "animate-[shake_0.5s_ease-in-out] bg-red-100" : feedback === "correct" ? "scale-105 bg-emerald-50" : ""}`}>
              {/* Card Decoration */}
              <div className="absolute left-2 top-2 text-zinc-300"><Ghost className="h-4 w-4" /></div>
              <div className="absolute bottom-2 right-2 text-zinc-300"><Ghost className="h-4 w-4" /></div>
              
              {currentCard.items.map((item, idx) => {
                const Icon = SHAPE_MAP[item.shape];
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <Icon strokeWidth={2.5} className={`h-24 w-24 ${COLOR_CLASSES[item.color]}`} style={{ filter: `drop-shadow(0px 8px 16px rgba(0,0,0,0.3))` }} />
                  </div>
                );
              })}

              {feedback === "wrong" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-red-500/20 backdrop-blur-sm">
                  <AlertCircle className="h-16 w-16 text-red-600" />
                </div>
              )}
            </div>

            {/* The 5 Objects on the table */}
            <div className="mt-4 w-full max-w-2xl grid grid-cols-5 gap-4 sm:gap-6">
              {TRUE_OBJECTS.map((obj) => {
                const Icon = obj.icon;
                return (
                  <button
                    key={obj.id}
                    onClick={() => handleObjectClick(obj.id)}
                    disabled={feedback !== null}
                    className="group flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/5 p-4 transition-all hover:-translate-y-2 hover:bg-white/10 active:scale-95 disabled:hover:translate-y-0 disabled:opacity-50"
                  >
                    <div className={`rounded-full bg-zinc-900/50 p-4 shadow-inner border border-white/5 group-hover:border-white/20`}>
                      <Icon strokeWidth={2.5} className={`h-10 w-10 sm:h-12 sm:w-12 ${COLOR_CLASSES[obj.color]}`} style={{ filter: `drop-shadow(0px 0px 12px ${obj.colorHex}60)` }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-white sm:text-xs">{obj.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
