import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { type Plot } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import type { BoxSettings } from "@/hooks/use-game";

interface PlotCardProps {
  plot: Plot;
  index: number;
  onPlant: (index: number) => void;
  onHarvest: (index: number) => void;
  isPlanting: boolean;
  isHarvesting: boolean;
  boxSettings?: BoxSettings;
}

const plotThemes = [
  { gradient: "from-emerald-600/30 to-teal-700/30", border: "border-emerald-500/60", accent: "text-emerald-400", glow: "shadow-emerald-500/30", coinColor: "#50C878" },
  { gradient: "from-cyan-600/30 to-blue-700/30", border: "border-cyan-500/60", accent: "text-cyan-400", glow: "shadow-cyan-500/30", coinColor: "#06B6D4" },
  { gradient: "from-violet-600/30 to-purple-700/30", border: "border-violet-500/60", accent: "text-violet-400", glow: "shadow-violet-500/30", coinColor: "#8B5CF6" },
  { gradient: "from-amber-600/30 to-orange-700/30", border: "border-amber-500/60", accent: "text-amber-400", glow: "shadow-amber-500/30", coinColor: "#F59E0B" },
  { gradient: "from-rose-600/30 to-pink-700/30", border: "border-rose-500/60", accent: "text-rose-400", glow: "shadow-rose-500/30", coinColor: "#F43F5E" },
  { gradient: "from-blue-600/30 to-indigo-700/30", border: "border-blue-500/60", accent: "text-blue-400", glow: "shadow-blue-500/30", coinColor: "#3B82F6" },
  { gradient: "from-teal-600/30 to-cyan-700/30", border: "border-teal-500/60", accent: "text-teal-400", glow: "shadow-teal-500/30", coinColor: "#14B8A6" },
  { gradient: "from-fuchsia-600/30 to-purple-700/30", border: "border-fuchsia-500/60", accent: "text-fuchsia-400", glow: "shadow-fuchsia-500/30", coinColor: "#D946EF" },
  { gradient: "from-lime-600/30 to-green-700/30", border: "border-lime-500/60", accent: "text-lime-400", glow: "shadow-lime-500/30", coinColor: "#84CC16" },
];

function FallingCoins() {
  return (
    <div className="falling-coins">
      <span className="coin">💰</span>
      <span className="coin">🪙</span>
      <span className="coin">💰</span>
      <span className="coin">🪙</span>
      <span className="coin">💰</span>
    </div>
  );
}

function MiningTree({ stage }: { stage: "growing" | "ready" }) {
  const isReady = stage === "ready";

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative animate-tree-sway">
        <svg viewBox="0 0 64 76" className="w-[4.5rem] h-[4.5rem] drop-shadow-lg">
          <ellipse cx="32" cy="72" rx="7" ry="2" fill="rgba(0,0,0,0.15)" />
          <rect x="29.5" y="56" width="5" height="14" rx="2" fill="#6B4423" />
          <rect x="30.5" y="58" width="2" height="10" rx="1" fill="#8B5A2B" opacity="0.5" />
          <polygon points="32,6 12,32 52,32" fill="#15803D" />
          <polygon points="32,6 14,30 50,30" fill="#22C55E" />
          <polygon points="32,18 8,46 56,46" fill="#15803D" />
          <polygon points="32,18 10,44 54,44" fill="#16A34A" />
          <polygon points="32,30 4,58 60,58" fill="#14532D" />
          <polygon points="32,30 6,56 58,56" fill="#15803D" />
          {isReady && (
            <>
              <circle cx="22" cy="26" r="1.5" fill="#FFD700" opacity="0.9" />
              <circle cx="42" cy="28" r="1.5" fill="#FFD700" opacity="0.9" />
              <circle cx="32" cy="16" r="1.3" fill="#FFD700" opacity="0.9" />
              <circle cx="18" cy="42" r="1.5" fill="#FFD700" opacity="0.8" />
              <circle cx="44" cy="40" r="1.3" fill="#FFD700" opacity="0.8" />
              <circle cx="28" cy="50" r="1.5" fill="#FFD700" opacity="0.7" />
              <circle cx="40" cy="52" r="1.3" fill="#FFD700" opacity="0.7" />
            </>
          )}
        </svg>

        {isReady && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <span className="text-sm animate-bounce-slow">💰</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}

export function PlotCard({
  plot,
  index,
  onPlant,
  onHarvest,
  isPlanting,
  isHarvesting,
  boxSettings,
}: PlotCardProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const theme = plotThemes[index % plotThemes.length];

  const growthTimeSeconds = boxSettings?.growthTimeSeconds ?? 60;
  const growthTimeMs = growthTimeSeconds * 1000;
  const reward = boxSettings?.harvestReward
    ? parseFloat(boxSettings.harvestReward)
    : 0.0001;

  useEffect(() => {
    if (plot.status === "growing" && plot.plantedAt) {
      const plantedTime = new Date(plot.plantedAt).getTime();
      const readyTime = plantedTime + growthTimeMs;

      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((readyTime - now) / 1000));
        setTimeLeft(diff);
      }, 1000);

      const now = Date.now();
      setTimeLeft(Math.max(0, Math.ceil((readyTime - now) / 1000)));

      return () => clearInterval(interval);
    } else {
      setTimeLeft(0);
    }
  }, [plot.status, plot.plantedAt, growthTimeMs]);

  const isReady = plot.status === "growing" && timeLeft === 0;
  const isGrowing = plot.status === "growing" && timeLeft > 0;

  const progress =
    plot.status === "growing" && plot.plantedAt
      ? Math.min(100, ((growthTimeSeconds - timeLeft) / growthTimeSeconds) * 100)
      : 0;

  const triggerConfetti = () => {
    confetti({
      particleCount: 25,
      spread: 60,
      startVelocity: 20,
      ticks: 40,
      origin: { x: 0.3, y: 0.6 },
      colors: ["#0098EA", "#FFD700", "#22C55E"],
      zIndex: 9999,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 25,
      spread: 60,
      startVelocity: 20,
      ticks: 40,
      origin: { x: 0.7, y: 0.6 },
      colors: ["#0098EA", "#FFD700", "#22C55E"],
      zIndex: 9999,
      disableForReducedMotion: true,
    });
  };

  const handleInteraction = () => {
    if (plot.status === "empty" && !isPlanting) {
      onPlant(index);
    } else if ((plot.status === "ready" || isReady) && !isHarvesting) {
      triggerConfetti();
      onHarvest(index);
    }
  };

  return (
    <motion.button
      onClick={handleInteraction}
      disabled={isGrowing || isPlanting || isHarvesting}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.95 }}
      whileHover={!isGrowing ? { scale: 1.03 } : undefined}
      data-testid={`plot-card-${index}`}
      className={cn(
        "relative aspect-square w-full rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-300 overflow-hidden group",
        plot.status === "empty" &&
          `bg-gradient-to-br ${theme.gradient} ${theme.border} hover:shadow-lg ${theme.glow}`,
        isGrowing &&
          "bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-yellow-500/50",
        (plot.status === "ready" || isReady) &&
          "bg-gradient-to-br from-emerald-900/60 to-emerald-800/60 border-emerald-400 shadow-lg shadow-emerald-500/30"
      )}
    >
      {plot.status === "empty" && (
        <>
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          <motion.div
            className={cn("absolute inset-0 rounded-xl", theme.border)}
            animate={{
              boxShadow: [
                `inset 0 0 20px rgba(255,255,255,0.1)`,
                `inset 0 0 40px rgba(255,255,255,0.2)`,
                `inset 0 0 20px rgba(255,255,255,0.1)`,
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full z-10">
        <span className="text-[8px]">💎</span>
        <span className="text-[8px] font-bold text-emerald-400">
          {reward.toFixed(4)}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {plot.status === "empty" && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-1 z-10"
          >
            <motion.div
              className={cn(
                "w-10 h-10 rounded-full bg-black/20 border-2 border-dashed flex items-center justify-center transition-all",
                theme.border
              )}
              animate={{
                scale: [1, 1.05, 1],
                borderColor: [
                  "rgba(255,255,255,0.3)",
                  "rgba(255,255,255,0.6)",
                  "rgba(255,255,255,0.3)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <motion.svg
                viewBox="0 0 24 24"
                className={cn("w-5 h-5", theme.accent)}
                animate={{ rotate: [0, 90, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <path
                  fill="currentColor"
                  d="M12 2C10.9 2 10 2.9 10 4V10H4C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14H10V20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20V14H20C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10H14V4C14 2.9 13.1 2 12 2Z"
                />
              </motion.svg>
            </motion.div>
            <span
              className={cn(
                "font-black uppercase tracking-tight text-[8px]",
                theme.accent
              )}
            >
              Plant
            </span>
          </motion.div>
        )}

        {isGrowing && (
          <motion.div
            key="growing"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center relative z-10"
          >
            <FallingCoins />
            <MiningTree stage="growing" />

            <div className="mt-0.5 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-yellow-500/50 px-2.5 py-1 rounded-full shadow-lg z-30 relative">
              <Clock size={10} className="text-yellow-400" />
              <span
                className="text-[10px] font-black text-yellow-400 font-mono"
                data-testid={`time-left-${index}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="absolute bottom-1 left-2 right-2 h-1.5 bg-slate-700/80 rounded-full overflow-hidden z-30">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        )}

        {(plot.status === "ready" || isReady) && (
          <motion.div
            key="ready"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center z-10 relative"
          >
            <FallingCoins />
            <MiningTree stage="ready" />

            <div className="mt-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg border border-emerald-400/50 uppercase tracking-wide z-30 relative animate-pulse-scale">
              Harvest
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(isGrowing || isReady || plot.status === "ready") && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              "inset 0 -10px 20px rgba(0,152,234,0.05)",
              "inset 0 -10px 30px rgba(0,152,234,0.15)",
              "inset 0 -10px 20px rgba(0,152,234,0.05)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      )}
    </motion.button>
  );
}
