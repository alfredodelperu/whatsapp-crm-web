"use client";

import React, { useState, useEffect } from "react";
import { Play, RotateCcw, Trophy, Bell, Delete } from "lucide-react";

type CupColor = "red" | "yellow" | "green" | "blue" | "black";
type Orientation = "horizontal" | "vertical";

type CardData = {
  sequence: CupColor[];
  orientation: Orientation;
};

const COLORS: CupColor[] = ["red", "yellow", "green", "blue", "black"];

const COLOR_MAP: Record<CupColor, { hex: string; bgClass: string; ringClass: string }> = {
  red: { hex: "#ef4444", bgClass: "bg-red-500", ringClass: "ring-red-500" },
  yellow: { hex: "#eab308", bgClass: "bg-yellow-500", ringClass: "ring-yellow-500" },
  green: { hex: "#22c55e", bgClass: "bg-green-500", ringClass: "ring-green-500" },
  blue: { hex: "#3b82f6", bgClass: "bg-blue-500", ringClass: "ring-blue-500" },
  black: { hex: "#27272a", bgClass: "bg-zinc-800", ringClass: "ring-zinc-800" },
};

function generateCard(): CardData {
  const sequence = [...COLORS].sort(() => Math.random() - 0.5);
  const orientation = Math.random() < 0.5 ? "horizontal" : "vertical";
  return { sequence, orientation };
}

export default function SpeedCupsGame() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [highScore, setHighScore] = useState(0);
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [playerSequence, setPlayerSequence] = useState<CupColor[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("speedCupsHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setCurrentCard(generateCard());
    setPlayerSequence([]);
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
        localStorage.setItem("speedCupsHighScore", score.toString());
      }
    }
  }, [gameState, timeLeft, score, highScore]);

  // Key press listener for numbers and space
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback !== null) return;
      
      const keyMap: Record<string, CupColor> = {
        "1": "red",
        "2": "yellow",
        "3": "green",
        "4": "blue",
        "5": "black",
        "r": "red",
        "y": "yellow",
        "g": "green",
        "b": "blue",
        "k": "black",
      };
      
      const color = keyMap[e.key.toLowerCase()];
      if (color) {
        handleAddCup(color);
      } else if (e.key === "Backspace") {
        handleRemoveLast();
      } else if (e.key === "Enter" || e.key === " ") {
        handleRingBell();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleAddCup = (color: CupColor) => {
    if (playerSequence.length >= 5 || playerSequence.includes(color) || feedback !== null) return;
    setPlayerSequence([...playerSequence, color]);
  };

  const handleRemoveLast = () => {
    if (playerSequence.length === 0 || feedback !== null) return;
    setPlayerSequence(playerSequence.slice(0, -1));
  };

  const handleRingBell = () => {
    if (!currentCard || playerSequence.length < 5 || feedback !== null) return;

    const isCorrect = playerSequence.every((col, idx) => col === currentCard.sequence[idx]);

    if (isCorrect) {
      setScore((s) => s + 1);
      setFeedback("correct");
      
      setTimeout(() => {
        setFeedback(null);
        setPlayerSequence([]);
        setCurrentCard(generateCard());
      }, 400);
    } else {
      setFeedback("wrong");
      setTimeout(() => {
        setFeedback(null);
        setPlayerSequence([]);
      }, 500);
    }
  };

  const renderCup = (color: CupColor, size: "large" | "small" = "small", animated = false) => {
    const wClass = size === "large" ? "w-12 sm:w-16" : "w-10 sm:w-12";
    const hClass = size === "large" ? "h-14 sm:h-20" : "h-12 sm:h-14";
    return (
      <div 
        className={`${wClass} ${hClass} ${COLOR_MAP[color].bgClass} rounded-t-md rounded-b-xl border-[3px] border-white/20 shadow-lg relative overflow-hidden flex flex-col justify-end pb-1 ${animated ? "animate-bounce" : ""}`}
        style={{ boxShadow: `0 8px 24px -4px ${COLOR_MAP[color].hex}60` }}
      >
         <div className="w-full h-[6px] bg-white/30 rounded-full" />
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#081614] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-900 to-black p-4 font-sans text-white">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              <Bell className="h-8 w-8 text-orange-400" />
              Speed Cups
            </h1>
            <p className="mt-1 text-sm text-zinc-400">¡Ordena tus vasos y toca el timbre!</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-amber-400">
              <Trophy className="h-5 w-5" />
              <span className="font-bold">Récord: {highScore}</span>
            </div>
          </div>
        </div>

        {/* Start Screen */}
        {gameState === "start" && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-6 rounded-full bg-orange-500/10 p-6">
              <Bell className="h-16 w-16 text-orange-400" />
            </div>
            <h2 className="mb-4 text-2xl font-bold">¿Cómo se juega?</h2>
            <div className="mb-8 max-w-md space-y-4 text-left text-zinc-300">
              <p className="flex items-start gap-2">
                <span className="mt-1 text-orange-400">1.</span>
                Observa la carta: te indicará un orden de 5 colores en forma <strong>Vertical</strong> u <strong>Horizontal</strong>.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1 text-orange-400">2.</span>
                Toca los vasos de colores en el orden exacto (de arriba a abajo, o de izquierda a derecha).
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1 text-orange-400">3.</span>
                Cuando los 5 vasos estén listos, ¡toca el timbre rápidamente!
              </p>
              <p className="text-xs text-zinc-500 text-center pt-2">Tip: Puedes usar los números 1-5 en tu teclado o la tecla Espacio para el timbre.</p>
            </div>
            <button
              onClick={startGame}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-orange-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-orange-400 active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Jugar (60 Segundos)
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === "gameover" && (
          <div className="flex flex-col items-center py-10 text-center">
            <h2 className="mb-2 text-4xl font-extrabold text-white">¡Tiempo Terminado!</h2>
            <p className="mb-8 text-xl text-zinc-400">
              Cartas completadas: <span className="text-4xl font-black text-orange-400">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-orange-400 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Jugar de nuevo
            </button>
          </div>
        )}

        {/* Playing Screen */}
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

            {/* Central Target Card */}
            <div className="mb-8 flex flex-col items-center">
              <span className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">Carta Objetivo</span>
              <div 
                className={`relative flex items-center justify-center rounded-xl bg-zinc-100 p-8 shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-transform duration-200 
                ${feedback === "wrong" ? "animate-[shake_0.4s_ease-in-out] bg-red-100 ring-4 ring-red-500" : ""}
                ${feedback === "correct" ? "scale-105 bg-emerald-50 ring-4 ring-emerald-500" : ""}
                ${currentCard.orientation === "horizontal" ? "w-80 h-48 flex-row gap-3" : "w-48 h-80 flex-col gap-2"}`}
              >
                {currentCard.sequence.map((color, idx) => (
                   <div key={idx} className={`${currentCard.orientation === "vertical" ? "z-[5]" : ""} ${currentCard.orientation === "vertical" && idx > 0 ? "-mt-4" : ""}`}>
                     {renderCup(color, "large")}
                   </div>
                ))}
              </div>
            </div>

            <div className="w-full flex flex-col items-center border-t border-white/10 pt-8 mt-2">
               {/* Player's current workspace sequence */}
               <div className="h-24 flex items-end justify-center gap-4 mb-8">
                  {playerSequence.length === 0 ? (
                    <span className="text-zinc-600 font-medium italic">Toca los botones para ordenar tus vasos</span>
                  ) : (
                    playerSequence.map((color, idx) => (
                      <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-200">
                        {renderCup(color, "large")}
                      </div>
                    ))
                  )}
               </div>
               
               {/* Controls */}
               <div className="flex flex-col sm:flex-row gap-6 items-center w-full max-w-lg justify-center">
                 
                 {/* Cup Buttons */}
                 <div className="flex gap-3">
                   {COLORS.map((color) => {
                     const isUsed = playerSequence.includes(color);
                     return (
                       <button
                         key={color}
                         disabled={isUsed || playerSequence.length >= 5 || feedback !== null}
                         onClick={() => handleAddCup(color)}
                         className={`relative rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all duration-200 ${COLOR_MAP[color].bgClass} 
                         ${isUsed ? "opacity-30 scale-90 grayscale" : "hover:scale-110 active:scale-95 shadow-lg"} 
                         border-2 border-white/20`}
                       >
                         <span className="sr-only">{color}</span>
                       </button>
                     );
                   })}
                 </div>

                 <div className="flex items-center gap-3">
                    <button
                      onClick={handleRemoveLast}
                      disabled={playerSequence.length === 0 || feedback !== null}
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:hover:bg-zinc-800 border border-white/10 transition-colors"
                    >
                      <Delete className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={handleRingBell}
                      disabled={playerSequence.length < 5 || feedback !== null}
                      className={`h-16 w-24 sm:h-20 sm:w-32 rounded-3xl flex flex-col items-center justify-center font-bold text-lg shadow-xl transition-all duration-200
                        ${playerSequence.length === 5 && feedback === null 
                          ? "bg-amber-400 text-amber-900 hover:bg-amber-300 hover:scale-105 active:scale-95 animate-pulse ring-4 ring-amber-500/50" 
                          : "bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed"}
                      `}
                    >
                      <Bell className="h-8 w-8 mb-1" />
                      TIMBRE
                    </button>
                 </div>

               </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
