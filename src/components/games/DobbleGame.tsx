"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Apple, Anchor, AlarmClock, Bath, Bell, Bomb, Bug, Bus, Camera, Car,
  Cat, Carrot, Cherry, Cloud, Clover, Coffee, Compass, Crown, Diamond, Dog,
  Droplet, Eye, Feather, Flame, Flower, Ghost, Gift, Hammer, Headphones, Heart,
  Key, Leaf, Lightbulb, Lock, Magnet, Map, Moon, Music, Palette, Pencil,
  Phone, Plane, Rabbit, Rocket, Scissors, Shield, Snowflake, Sparkles, Star, Sun,
  Sword, Target, Tent, TreePine, Trophy, Umbrella, Zap, Play, RotateCcw,
  AlertCircle
} from "lucide-react";

const ICON_LIST = [
  Apple, Anchor, AlarmClock, Bath, Bell, Bomb, Bug, Bus, Camera, Car,
  Cat, Carrot, Cherry, Cloud, Clover, Coffee, Compass, Crown, Diamond, Dog,
  Droplet, Eye, Feather, Flame, Flower, Ghost, Gift, Hammer, Headphones, Heart,
  Key, Leaf, Lightbulb, Lock, Magnet, Map, Moon, Music, Palette, Pencil,
  Phone, Plane, Rabbit, Rocket, Scissors, Shield, Snowflake, Sparkles, Star, Sun,
  Sword, Target, Tent, TreePine, Trophy, Umbrella, Zap
];

// 12 bright colors for the symbols
const PALETTE = [
  "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899",
  "#f97316", "#06b6d4", "#14b8a6", "#8b5cf6", "#f43f5e", "#84cc16"
];

// Generate consistent properties for each of the 57 symbols
const SYMBOLS = ICON_LIST.map((Icon, idx) => ({
  id: idx,
  Icon,
  color: PALETTE[idx % PALETTE.length],
}));

// Generates the 57 cards using projective plane N=7
function generateDobbleDeck(n: number) {
  const cards: number[][] = [];
  
  const firstCard = [];
  for (let i = 0; i <= n; i++) {
    firstCard.push(i);
  }
  cards.push(firstCard);
  
  for (let j = 0; j < n; j++) {
    const card = [0];
    for (let k = 0; k < n; k++) {
      card.push(n + 1 + n * j + k);
    }
    cards.push(card);
  }
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const card = [i + 1];
      for (let k = 0; k < n; k++) {
        card.push(n + 1 + n * k + ((i * k + j) % n));
      }
      cards.push(card);
    }
  }
  
  // Shuffle cards and the items within them
  return cards
    .map((card) => card.sort(() => Math.random() - 0.5))
    .sort(() => Math.random() - 0.5);
}

// Generate random visual properties (size, rotation, position) for 8 items in a card
function generateCardLayout(items: number[]) {
  // We place 1 item in the center and 7 around it in a circle
  const positions = [
    { left: "50%", top: "50%" }, // Center
    { left: "20%", top: "30%" },
    { left: "50%", top: "15%" },
    { left: "80%", top: "30%" },
    { left: "85%", top: "65%" },
    { left: "65%", top: "85%" },
    { left: "35%", top: "85%" },
    { left: "15%", top: "65%" },
  ];

  // Randomize which item goes to which position
  const shuffledPositions = [...positions].sort(() => Math.random() - 0.5);

  return items.map((id, idx) => {
    const scale = 0.6 + Math.random() * 0.8; // 0.6 to 1.4
    const rotation = -60 + Math.random() * 120; // -60deg to 60deg
    return {
      id,
      pos: shuffledPositions[idx],
      scale,
      rotation,
    };
  });
}

export default function DobbleGame() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [highScore, setHighScore] = useState(0);
  const [deck, setDeck] = useState<number[][]>([]);
  const [centerCard, setCenterCard] = useState<any[]>([]);
  const [playerCard, setPlayerCard] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dobbleHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    const newDeck = generateDobbleDeck(7);
    const center = newDeck.pop()!;
    const player = newDeck.pop()!;
    
    setDeck(newDeck);
    setCenterCard(generateCardLayout(center));
    setPlayerCard(generateCardLayout(player));
    setScore(0);
    setTimeLeft(60);
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
        localStorage.setItem("dobbleHighScore", score.toString());
      }
    }
  }, [gameState, timeLeft, score, highScore]);

  const handleSymbolClick = (symbolId: number) => {
    if (gameState !== "playing" || feedback !== null) return;

    const isMatch = centerCard.some((c) => c.id === symbolId);

    if (isMatch) {
      setScore((s) => s + 1);
      setFeedback("correct");
      
      setTimeout(() => {
        // Player's card becomes the new center card
        setCenterCard(generateCardLayout(playerCard.map(i => i.id)));
        
        // Draw new player card
        const newDeck = [...deck];
        const nextPlayer = newDeck.pop();
        if (nextPlayer) {
          setPlayerCard(generateCardLayout(nextPlayer));
          setDeck(newDeck);
        } else {
          // Deck finished early!
          setGameState("gameover");
          if (score + 1 > highScore) {
            setHighScore(score + 1);
            localStorage.setItem("dobbleHighScore", (score + 1).toString());
          }
        }
        setFeedback(null);
      }, 300);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 400);
    }
  };

  const renderCard = (layout: any[], isInteractive: boolean, label: string, isCenter: boolean) => (
    <div className="flex flex-col items-center">
      <span className="mb-2 text-sm font-bold uppercase tracking-wider text-zinc-400">{label}</span>
      <div 
        className={`relative h-64 w-64 sm:h-72 sm:w-72 rounded-full border-[6px] border-white/20 shadow-2xl transition-all duration-200 
        ${isCenter ? "bg-white" : "bg-white"}
        ${isInteractive && feedback === "wrong" ? "animate-[shake_0.4s_ease-in-out] ring-4 ring-red-500 ring-offset-4 ring-offset-black" : ""}
        ${isInteractive && feedback === "correct" ? "scale-105 ring-4 ring-emerald-500 ring-offset-4 ring-offset-black" : ""}
      `}>
        {layout.map((item) => {
          const sym = SYMBOLS[item.id];
          const Icon = sym.Icon;
          return (
            <button
              key={item.id}
              disabled={!isInteractive || feedback !== null}
              onClick={() => isInteractive && handleSymbolClick(item.id)}
              className={`absolute flex items-center justify-center transition-transform ${isInteractive ? "hover:scale-125 hover:z-10 disabled:hover:scale-100" : ""}`}
              style={{
                left: item.pos.left,
                top: item.pos.top,
                transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`,
              }}
            >
              <Icon 
                size={40} 
                color={sym.color} 
                strokeWidth={2.5}
                style={{ filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.15))" }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#081614] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 to-black p-4 font-sans text-white">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              <Eye className="h-8 w-8 text-blue-400" />
              Dobble (Spot It!)
            </h1>
            <p className="mt-1 text-sm text-zinc-400">¡Encuentra el símbolo idéntico!</p>
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
            <div className="mb-6 rounded-full bg-blue-500/10 p-6">
              <Eye className="h-16 w-16 text-blue-400" />
            </div>
            <h2 className="mb-4 text-2xl font-bold">¿Cómo se juega?</h2>
            <div className="mb-8 max-w-md space-y-4 text-left text-zinc-300">
              <p className="flex items-start gap-2">
                <span className="mt-1 text-blue-400">1.</span>
                Observa tu carta (abajo) y la carta central (arriba).
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1 text-blue-400">2.</span>
                Siempre habrá <strong>exactamente un símbolo idéntico</strong> entre ambas.
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-1 text-blue-400">3.</span>
                Haz clic en el símbolo idéntico <strong>en tu carta</strong> lo más rápido posible.
              </p>
            </div>
            <button
              onClick={startGame}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-blue-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-500 active:scale-95"
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
              Cartas ganadas: <span className="text-4xl font-black text-blue-400">{score}</span>
            </p>
            <button
              onClick={startGame}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-500 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Jugar de nuevo
            </button>
          </div>
        )}

        {/* Playing Screen */}
        {gameState === "playing" && (
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

            {/* Error Overlay */}
            {feedback === "wrong" && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-500/10 pointer-events-none">
                <AlertCircle className="h-32 w-32 animate-bounce text-red-500 opacity-50" />
              </div>
            )}

            {/* Game Cards Container */}
            <div className="flex w-full flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
              {/* Central Card */}
              {renderCard(centerCard, false, "Carta Central", true)}

              {/* Player Card */}
              {renderCard(playerCard, true, "Tu Carta (¡Busca aquí!)", false)}
            </div>

            <div className="mt-8 text-center text-sm text-zinc-500">
              Quedan {deck.length} cartas en la baraja
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
