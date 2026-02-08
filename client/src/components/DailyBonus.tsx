import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock, Sparkles, Loader2 } from "lucide-react";
import { TonCoin3D } from "./TonCoin3D";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

type DailyBonusStatus = {
  canClaim: boolean;
  bonusAmount: string;
  lastClaimTime: string | null;
  nextClaimTime: string | null;
};

function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

function CoinRain({ isActive }: { isActive: boolean }) {
  const [coins, setCoins] = useState<{ id: number; x: number; delay: number }[]>([]);
  
  useEffect(() => {
    if (isActive) {
      const newCoins = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
      }));
      setCoins(newCoins);
      
      const timer = setTimeout(() => setCoins([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);
  
  return (
    <AnimatePresence>
      {coins.map((coin) => (
        <motion.div
          key={coin.id}
          className="absolute pointer-events-none z-50"
          style={{ left: `${coin.x}%`, top: -20 }}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: 300, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, delay: coin.delay, ease: "easeIn" }}
        >
          <span className="text-xl">💎</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

function LoadingSkeleton() {
  return (
    <div className="relative rounded-2xl p-4 border bg-slate-800/60 border-slate-700/50 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-700 rounded w-24" />
          <div className="h-4 bg-slate-700 rounded w-32" />
        </div>
        <div className="h-10 w-20 bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
}

export function DailyBonus() {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showCoinRain, setShowCoinRain] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const { toast } = useToast();
  
  const { data: status, isLoading, isError } = useQuery<DailyBonusStatus>({
    queryKey: ["/api/daily-bonus"],
    refetchInterval: 10000,
    retry: 2,
  });
  
  const claimMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/daily-bonus/claim"),
    onSuccess: () => {
      setIsOpening(true);
      setShowCoinRain(true);
      
      confetti({
        particleCount: 30,
        spread: 60,
        ticks: 35,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6'],
        disableForReducedMotion: true,
      });
      
      toast({
        title: "Daily Bonus Claimed!",
        description: `You received ${status?.bonusAmount || "0.0001"} TON`,
      });
      
      setTimeout(() => {
        setIsOpening(false);
        setShowCoinRain(false);
        queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus"] });
        queryClient.invalidateQueries({ queryKey: ["/api/game/state"] });
      }, 2500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim bonus",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  useEffect(() => {
    if (!status?.nextClaimTime || status.canClaim) {
      setTimeRemaining(null);
      return;
    }
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(status.nextClaimTime!).getTime();
      const remaining = target - now;
      
      if (remaining <= 0) {
        setTimeRemaining(null);
        queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus"] });
      } else {
        setTimeRemaining(remaining);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status]);
  
  const handleClaim = useCallback(() => {
    if (!status?.canClaim || claimMutation.isPending) return;
    claimMutation.mutate();
  }, [status?.canClaim, claimMutation]);
  
  if (isLoading) return <LoadingSkeleton />;
  
  if (isError) {
    return (
      <div className="relative rounded-2xl p-4 border bg-slate-800/60 border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center">
            <Gift className="w-8 h-8 text-slate-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-400">Daily Bonus</h3>
            <p className="text-sm text-slate-500">Unable to load</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <CoinRain isActive={showCoinRain} />
      
      <div
        className={`relative rounded-2xl p-4 border transition-all ${
          status?.canClaim 
            ? "bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border-amber-500/50 shadow-lg shadow-amber-500/20" 
            : "bg-slate-800/60 border-slate-700/50"
        }`}
      >
        {status?.canClaim && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 rounded-2xl"
            animate={{ 
              x: ["-100%", "100%"],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "linear"
            }}
          />
        )}
        
        <div className="flex items-center gap-4 relative z-10">
          <motion.div 
            className={`relative w-16 h-16 rounded-xl flex items-center justify-center ${
              status?.canClaim 
                ? "bg-gradient-to-br from-amber-500 to-orange-600" 
                : "bg-slate-700"
            }`}
            animate={isOpening ? {
              rotateY: [0, 180, 360],
              scale: [1, 1.3, 1],
            } : status?.canClaim ? {
              scale: [1, 1.05, 1],
              rotate: [0, -5, 5, 0],
            } : undefined}
            transition={isOpening ? {
              duration: 0.8,
              ease: "easeInOut",
            } : {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          >
            {isOpening ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
            ) : (
              <Gift className={`w-8 h-8 ${status?.canClaim ? "text-white" : "text-slate-400"}`} />
            )}
            
            {status?.canClaim && !isOpening && (
              <motion.div 
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </motion.div>
          
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${status?.canClaim ? "text-amber-400" : "text-slate-300"}`}>
              Daily Bonus
            </h3>
            
            {status?.canClaim ? (
              <div className="flex items-center gap-2 mt-1">
                <TonCoin3D size="xs" />
                <span className="text-emerald-400 font-bold text-lg">
                  +{status.bonusAmount} TON
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {timeRemaining ? formatTimeRemaining(timeRemaining) : "Loading..."}
                </span>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleClaim}
            disabled={!status?.canClaim || claimMutation.isPending || isOpening}
            className={
              status?.canClaim && !isOpening
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none"
                : "bg-slate-700 text-slate-500"
            }
            data-testid="button-claim-daily-bonus"
          >
            {claimMutation.isPending || isOpening ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status?.canClaim ? (
              "Claim"
            ) : (
              "Claimed"
            )}
          </Button>
        </div>
        
        {!status?.canClaim && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Next bonus available in:</span>
              <div className="flex items-center gap-1">
                <div className="bg-slate-700 px-2 py-1 rounded font-mono">
                  {timeRemaining ? formatTimeRemaining(timeRemaining) : "--:--:--"}
                </div>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ 
                  width: timeRemaining 
                    ? `${100 - (timeRemaining / (24 * 60 * 60 * 1000)) * 100}%`
                    : "100%"
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
