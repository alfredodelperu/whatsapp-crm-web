"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Brain, Heart, Play, RotateCcw, Trophy, AlertCircle, CheckCircle2,
  Cat, Dog, Rabbit, Turtle, Bird, Fish, Snail, Bug, 
  Car, Bus, Train, Plane, Rocket, Bike, Sailboat,
  Apple, Banana, Cherry, Grape, Carrot, Mushroom,
  Sun, Moon, Star, Cloud, Snowflake, Flame, Droplet
} from "lucide-react";

const ICON_POOL = [
  Cat, Dog, Rabbit, Turtle, Bird, Fish, Snail, Bug, 
  Car, Bus, Train, Plane, Rocket, Bike, Sailboat,
  Apple, Banana, Cherry, Grape, Carrot, Mushroom,
  Sun, Moon, Star, Cloud, Snowflake, Flame, Droplet
];

const COLORS = [
  { name: "ROJO", hex: "#ef4444" },
  { name: "AZUL", hex: "#3b82f6" },
  { name: "VERDE", hex: "#22c55e" },
  { name: "AMARILLO", hex: "#eab308" },
  { name: "NARANJA", hex: "#f97316" },
  { name: "MORADO", hex: "#a855f7" }
];

type ChallengeType = "duplicates" | "frequency" | "color" | "memory" | "logic";

type Challenge = {
  type: ChallengeType;
  title: string;
  question: string;
  data: any;
  correctAnswer: any;
};

// Generadores de retos
function generateDuplicates(): Challenge {
  const icons = [...ICON_POOL].sort(() => Math.random() - 0.5).slice(0, 6);
  const duplicateIndex = Math.floor(Math.random() * 6);
  const duplicatedIcon = icons[duplicateIndex];
  
  // Create an array of 7 items where one is repeated
  const finalItems = [...icons, duplicatedIcon].sort(() => Math.random() - 0.5);
  
  return {
    type: "duplicates",
    title: "Duplicados",
    question: "Toca el ícono que se repite exactamente DOS veces.",
    data: { items: finalItems },
    correctAnswer: duplicatedIcon.displayName || duplicatedIcon.name,
  };
}

function generateFrequency(): Challenge {
  const icons = [...ICON_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
  const counts = [7, 5, 3]; // Total 15 items. Icon 0 appears 7 times, Icon 1: 5 times, Icon 2: 3 times.
  
  let items: any[] = [];
  icons.forEach((icon, idx) => {
    for (let i = 0; i < counts[idx]; i++) {
      items.push(icon);
    }
  });
  
  items = items.sort(() => Math.random() - 0.5);
  
  return {
    type: "frequency",
    title: "Frecuencia",
    question: "¿Qué ícono aparece más veces?",
    data: { items, unique: icons },
    correctAnswer: icons[0].displayName || icons[0].name,
  };
}

function generateColor(): Challenge {
  const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  const inkColors = COLORS.filter(c => c.name !== wordColor.name);
  const inkColor = inkColors[Math.floor(Math.random() * inkColors.length)];
  
  const options = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 4);
  if (!options.find(o => o.name === inkColor.name)) {
    options[0] = inkColor; // Ensure correct answer is in options
  }
  
  return {
    type: "color",
    title: "Color",
    question: "Ignora la palabra. ¿De qué COLOR es la TINTA?",
    data: { word: wordColor.name, inkHex: inkColor.hex, options: options.sort(() => Math.random() - 0.5) },
    correctAnswer: inkColor.name,
  };
}

function generateMemory(): Challenge {
  const icons = [...ICON_POOL].sort(() => Math.random() - 0.5).slice(0, 5);
  const memorizeItems = icons.slice(0, 4); // Show 4 items
  const intruder = icons[4]; // 1 new item
  
  const recallOptions = [...memorizeItems, intruder].sort(() => Math.random() - 0.5);
  
  return {
    type: "memory",
    title: "Memoria",
    question: "Encuentra al INTRUSO que NO estaba en la pantalla anterior.",
    data: { memorizeItems, recallOptions },
    correctAnswer: intruder.displayName || intruder.name,
  };
}

function generateLogic(): Challenge {
  // Secuencia simple ABAB o ABCA
  const icons = [...ICON_POOL].sort(() => Math.random() - 0.5).slice(0, 4);
  const patternType = Math.random() > 0.5 ? "ABAB" : "ABCA";
  
  let sequence: any[] = [];
  let nextItem: any;
  
  if (patternType === "ABAB") {
    sequence = [icons[0], icons[1], icons[0], icons[1], icons[0]];
    nextItem = icons[1];
  } else {
    sequence = [icons[0], icons[1], icons[2], icons[0], icons[1]];
    nextItem = icons[2];
  }
  
  const options = [nextItem, icons[3], icons[Math.floor(Math.random() * 3)]].sort(() => Math.random() - 0.5);
  
  return {
    type: "logic",
    title: "Lógica",
    question: "¿Qué figura sigue en la secuencia?",
    data: { sequence, options },
    correctAnswer: nextItem.displayName || nextItem.name,
  };
}

function getRandomChallenge(): Challenge {
  const rand = Math.random();
  if (rand < 0.2) return generateDuplicates();
  if (rand < 0.4) return generateFrequency();
  if (rand < 0.6) return generateColor();
  if (rand < 0.8) return generateMemory();
  return generateLogic();
}

export default function CortexGame() {
  const [gameState, setGameState] = useState<"start" | "memorize" | "playing" | "gameover" | "victory">("start");
  const [lives, setLives] = useState(3);
  const [pieces, setPieces] = useState(0); // 4 pieces = victory
  const [score, setScore] = useState(0); // 2 score = 1 piece
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startNextChallenge = () => {
    const challenge = getRandomChallenge();
    setCurrentChallenge(challenge);
    setFeedback(null);
    
    if (challenge.type === "memory") {
      setGameState("memorize");
      setTimeLeft(3); // 3 seconds to memorize
    } else {
      setGameState("playing");
      setTimeLeft(10); // 10 seconds to solve
    }
  };

  const startGame = () => {
    setLives(3);
    setPieces(0);
    setScore(0);
    startNextChallenge();
  };

  useEffect(() => {
    if ((gameState === "playing" || gameState === "memorize") && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timerRef.current!);
    } else if (timeLeft === 0) {
      if (gameState === "memorize") {
        setGameState("playing");
        setTimeLeft(10);
      } else if (gameState === "playing" && feedback === null) {
        // Time out
        handleWrong();
      }
    }
  }, [gameState, timeLeft, feedback]);

  const handleCorrect = () => {
    setFeedback("correct");
    const newScore = score + 1;
    setScore(newScore);
    
    let newPieces = pieces;
    if (newScore % 2 === 0) {
      newPieces += 1;
      setPieces(newPieces);
    }
    
    setTimeout(() => {
      if (newPieces >= 4) {
        setGameState("victory");
      } else {
        startNextChallenge();
      }
    }, 1000);
  };

  const handleWrong = () => {
    setFeedback("wrong");
    const newLives = lives - 1;
    setLives(newLives);
    
    setTimeout(() => {
      if (newLives <= 0) {
        setGameState("gameover");
      } else {
        startNextChallenge();
      }
    }, 1000);
  };

  const handleAnswer = (answerId: string) => {
    if (gameState !== "playing" || feedback !== null || !currentChallenge) return;
    
    if (answerId === currentChallenge.correctAnswer) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  // Renderers for different challenges
  const renderDuplicates = () => {
    if (!currentChallenge) return null;
    return (
      <div className="grid grid-cols-4 gap-6 p-4">
        {currentChallenge.data.items.map((Icon: any, i: number) => (
          <button 
            key={i} 
            onClick={() => handleAnswer(Icon.displayName || Icon.name)}
            disabled={feedback !== null}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 hover:bg-white/20 transition-all hover:scale-110 active:scale-95 disabled:hover:scale-100"
          >
            <Icon className="h-10 w-10 text-zinc-200" />
          </button>
        ))}
      </div>
    );
  };

  const renderFrequency = () => {
    if (!currentChallenge) return null;
    return (
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-wrap justify-center gap-3 max-w-sm rounded-2xl bg-white/5 p-4 border border-white/10">
          {currentChallenge.data.items.map((Icon: any, i: number) => (
            <Icon key={i} className="h-8 w-8 text-zinc-300" />
          ))}
        </div>
        <div className="flex gap-6">
          {currentChallenge.data.unique.map((Icon: any, i: number) => (
            <button 
              key={i} 
              onClick={() => handleAnswer(Icon.displayName || Icon.name)}
              disabled={feedback !== null}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all hover:scale-110 active:scale-95 border border-white/20"
            >
              <Icon className="h-10 w-10 text-amber-300" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderColor = () => {
    if (!currentChallenge) return null;
    return (
      <div className="flex flex-col items-center gap-12">
        <h2 
          className="text-7xl font-black uppercase tracking-widest drop-shadow-2xl"
          style={{ color: currentChallenge.data.inkHex }}
        >
          {currentChallenge.data.word}
        </h2>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {currentChallenge.data.options.map((opt: any, i: number) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt.name)}
              disabled={feedback !== null}
              className="rounded-xl bg-white/10 py-4 text-xl font-bold transition-all hover:bg-white/20 hover:scale-105 active:scale-95 border border-white/10 uppercase"
            >
              {opt.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMemory = () => {
    if (!currentChallenge) return null;
    
    if (gameState === "memorize") {
      return (
        <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
          <p className="text-xl font-bold text-amber-400">¡Memoriza estos objetos!</p>
          <div className="flex gap-6">
            {currentChallenge.data.memorizeItems.map((Icon: any, i: number) => (
              <div key={i} className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/50">
                <Icon className="h-12 w-12 text-indigo-300" />
              </div>
            ))}
          </div>
          <div className="text-4xl font-black text-white">{timeLeft}</div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8">
        <div className="flex flex-wrap justify-center gap-6 max-w-lg">
          {currentChallenge.data.recallOptions.map((Icon: any, i: number) => (
            <button 
              key={i} 
              onClick={() => handleAnswer(Icon.displayName || Icon.name)}
              disabled={feedback !== null}
              className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all hover:scale-110 active:scale-95 border border-white/10"
            >
              <Icon className="h-12 w-12 text-zinc-200" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderLogic = () => {
    if (!currentChallenge) return null;
    return (
      <div className="flex flex-col items-center gap-10">
        <div className="flex items-center gap-4 rounded-3xl bg-white/5 p-6 border border-white/10">
          {currentChallenge.data.sequence.map((Icon: any, i: number) => (
            <div key={i} className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10">
              <Icon className="h-8 w-8 text-cyan-300" />
            </div>
          ))}
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-zinc-500 bg-transparent text-2xl font-bold text-zinc-500">
            ?
          </div>
        </div>
        <div className="flex gap-6">
          {currentChallenge.data.options.map((Icon: any, i: number) => (
            <button 
              key={i} 
              onClick={() => handleAnswer(Icon.displayName || Icon.name)}
              disabled={feedback !== null}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-cyan-900/40 hover:bg-cyan-800/60 transition-all hover:scale-110 active:scale-95 border border-cyan-500/30"
            >
              <Icon className="h-10 w-10 text-cyan-200" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#081614] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950 to-black p-4 font-sans text-white">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              <Brain className="h-8 w-8 text-purple-400" />
              Cortex Challenge
            </h1>
            <p className="mt-1 text-sm text-zinc-400">Pon a prueba tu cerebro en 360°</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
              <div className="flex flex-col items-end">
                <span>Vidas</span>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3].map((i) => (
                    <Heart key={i} className={`h-5 w-5 ${i <= lives ? "fill-red-500 text-red-500" : "text-zinc-700"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brain Status / Progress */}
        {(gameState === "playing" || gameState === "memorize" || gameState === "victory" || gameState === "gameover") && (
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3 rounded-full bg-black/40 px-6 py-3 border border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cerebro</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${i <= pieces ? "bg-purple-500 text-white shadow-[0_0_10px_#a855f7]" : "bg-zinc-800 text-zinc-700"}`}>
                    <Brain className="h-5 w-5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Screens */}
        {gameState === "start" && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-6 rounded-full bg-purple-500/10 p-6">
              <Brain className="h-20 w-20 text-purple-400 animate-pulse" />
            </div>
            <h2 className="mb-4 text-2xl font-bold">¡Desafía tu mente!</h2>
            <div className="mb-8 max-w-md space-y-4 text-left text-zinc-300">
              <p>Te enfrentarás a 5 tipos de retos aleatorios: <strong>Memoria, Color, Frecuencia, Lógica y Duplicados.</strong></p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                <li>Solo tienes <strong>10 segundos</strong> por reto.</li>
                <li>Si te equivocas o el tiempo acaba, pierdes 1 vida.</li>
                <li>Cada 2 aciertos te otorgan 1 pieza de cerebro.</li>
                <li>¡Reúne <strong>4 piezas</strong> para ganar!</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-purple-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-purple-500 active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Comenzar Reto
            </button>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="flex flex-col items-center py-10 text-center">
            <h2 className="mb-2 text-4xl font-extrabold text-red-500">¡Fin del Juego!</h2>
            <p className="mb-8 text-xl text-zinc-400">
              Cerebros conseguidos: <span className="font-black text-white">{pieces}/4</span>
            </p>
            <button
              onClick={startGame}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-purple-500 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Intentar de nuevo
            </button>
          </div>
        )}

        {gameState === "victory" && (
          <div className="flex flex-col items-center py-10 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-6 rounded-full bg-amber-500/20 p-8 shadow-[0_0_50px_rgba(245,158,11,0.4)]">
              <Trophy className="h-24 w-24 text-amber-400" />
            </div>
            <h2 className="mb-2 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">¡CEREBRO COMPLETADO!</h2>
            <p className="mb-8 text-xl text-zinc-300">
              ¡Tienes una agilidad mental increíble! Sobreviviste al Cortex Challenge.
            </p>
            <button
              onClick={startGame}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Play className="h-5 w-5" />
              Jugar otra vez
            </button>
          </div>
        )}

        {(gameState === "playing" || gameState === "memorize") && currentChallenge && (
          <div className="relative flex flex-col items-center min-h-[400px] justify-center w-full">
            
            {/* Feedback Overlay */}
            {feedback && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl animate-in fade-in">
                {feedback === "correct" ? (
                  <div className="flex flex-col items-center animate-[bounce_0.5s_ease-in-out]">
                    <CheckCircle2 className="h-32 w-32 text-emerald-500 drop-shadow-[0_0_15px_#10b981]" />
                    <span className="mt-4 text-3xl font-black text-emerald-400">¡Correcto!</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center animate-[shake_0.4s_ease-in-out]">
                    <AlertCircle className="h-32 w-32 text-red-500 drop-shadow-[0_0_15px_#ef4444]" />
                    <span className="mt-4 text-3xl font-black text-red-500">¡Incorrecto!</span>
                  </div>
                )}
              </div>
            )}

            {/* Timer Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? "bg-red-500" : "bg-purple-500"}`}
                style={{ width: `${(timeLeft / (gameState === "memorize" ? 3 : 10)) * 100}%` }}
              />
            </div>
            
            {/* Challenge Header */}
            <div className="absolute top-6 flex flex-col items-center">
              <span className="px-4 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-purple-300 mb-2">
                {currentChallenge.title}
              </span>
              {gameState !== "memorize" && (
                <p className="text-lg font-medium text-center max-w-md">{currentChallenge.question}</p>
              )}
            </div>

            {/* Challenge Content */}
            <div className="mt-20 w-full flex justify-center">
              {currentChallenge.type === "duplicates" && renderDuplicates()}
              {currentChallenge.type === "frequency" && renderFrequency()}
              {currentChallenge.type === "color" && renderColor()}
              {currentChallenge.type === "memory" && renderMemory()}
              {currentChallenge.type === "logic" && renderLogic()}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
