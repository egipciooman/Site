import { useGameState, usePlant, useHarvest, useInitGame, useGameSettings } from "@/hooks/use-game";
import { GameHeader } from "@/components/GameHeader";
import { PlotCard } from "@/components/PlotCard";
import { TonCoin3D } from "@/components/TonCoin3D";
import { DailyBonus } from "@/components/DailyBonus";
import { Loader2, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Game() {
  const { data: state, isLoading, error } = useGameState();
  const { data: gameSettings } = useGameSettings();
  const plantMutation = usePlant();
  const harvestMutation = useHarvest();
  const initGameMutation = useInitGame();
  
  const [hasTriedInit, setHasTriedInit] = useState(false);

  useEffect(() => {
    if (!isLoading && !state && !hasTriedInit && !initGameMutation.isPending) {
      setHasTriedInit(true);
      
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || urlParams.get('start');
      
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      initGameMutation.mutate({ 
        username: `Farmer_${randomId}`,
        referralCode: ref || undefined 
      });
    }
  }, [isLoading, state, hasTriedInit, initGameMutation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
             <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
             <Loader2 className="w-12 h-12 text-emerald-400 animate-spin relative z-10" />
          </div>
          <p className="text-emerald-400 font-bold animate-pulse">🌱 Loading Farm...</p>
        </div>
      </div>
    );
  }

  if (!state || initGameMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 relative overflow-hidden">
        <div className="flex flex-col items-center justify-center w-full max-w-md text-center space-y-8 relative z-10">
          <div className="relative">
            <div className="w-28 h-28 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl border border-slate-700 relative">
              <div className="flex items-center gap-2">
                <Sprout className="w-10 h-10 text-emerald-400" />
                <TonCoin3D size="lg" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 
              className="text-4xl font-black tracking-tight drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-400 via-green-400 to-cyan-400"
              style={{
                textShadow: '0 0 20px rgba(255,0,255,0.5), 0 0 40px rgba(0,255,255,0.3), 3px 3px 0 #1e293b, -2px -2px 0 #0f172a',
                WebkitTextStroke: '1px rgba(255,255,255,0.2)',
              }}
            >
              PlantaTON
            </h1>
            <p className="text-slate-400 text-lg font-medium">🌱 Plant • ⏰ Grow • 🌾 Harvest • 💰 Withdraw</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-emerald-400 font-bold">🚀 Starting your farm...</p>
          </div>
        </div>
      </div>
    );
  }

  const { user, plots } = state;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-40 h-40 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-emerald-400/8 rounded-full blur-3xl" />
      </div>
      
      <GameHeader user={user} />
      
      <div className="max-w-md mx-auto px-4 -mt-10 relative z-20">
        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-white">🌾 Your Farm</h2>
        </div>

        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/15 via-cyan-500/8 to-violet-500/15 rounded-3xl blur-lg opacity-50" />
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-600/50 shadow-2xl relative">
            <div className="absolute top-2 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent rounded-full" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => {
                const plot = plots.find(p => p.plotIndex === i) || { 
                  id: -1, 
                  userId: user.id, 
                  plotIndex: i, 
                  status: "empty" as const, 
                  plantedAt: null 
                };

                return (
                  <PlotCard
                    key={i}
                    index={i}
                    plot={plot}
                    onPlant={(idx) => plantMutation.mutate({ plotIndex: idx })}
                    onHarvest={(idx) => harvestMutation.mutate({ plotIndex: idx })}
                    isPlanting={plantMutation.isPending}
                    isHarvesting={harvestMutation.isPending}
                    boxSettings={gameSettings?.boxes?.[i]}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <DailyBonus />
        </div>

        <motion.div 
          className="mt-6 mx-auto rounded-xl bg-slate-800/50 border border-slate-700/40 px-4 py-2.5 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-slate-400 text-[11px] leading-relaxed">
            <span className="text-emerald-400 font-semibold">🌱 Plant</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-yellow-400 font-semibold">⏰ Grow</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-cyan-400 font-semibold">🌾 Harvest</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-violet-400 font-semibold">💰 Withdraw</span>
          </p>
          <p className="text-slate-600 text-[9px] mt-1">🌿 PlantaTON v1.0 — Happy Farming! 🎉</p>
        </motion.div>
      </div>
    </div>
  );
}
