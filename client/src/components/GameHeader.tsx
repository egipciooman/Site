import { User } from "@shared/schema";
import { Sprout, Users, Gift, Wallet, Volume2, VolumeX, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { TonCoinImage } from "./TonCoinImage";
import { useAuth } from "@/components/AuthProvider";

interface GameHeaderProps {
  user: User;
}

import { useMusic } from "@/context/MusicContext";

export function GameHeader({ user }: GameHeaderProps) {
  const { isMusicPlaying, toggleMusic } = useMusic();
  const { logout } = useAuth();
  
  const displayName = user.username;

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-6 pb-16 px-4 rounded-b-[2rem] shadow-xl relative overflow-hidden border-b border-slate-700/50">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-sm mb-4">
          <h1 className="text-2xl font-black tracking-tight drop-shadow-lg flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-2xl">
              PlantaTON
            </span>
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMusic}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isMusicPlaying 
                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/40' 
                  : 'bg-slate-700/50 hover:bg-slate-600/50'
              }`}
              data-testid="button-music"
            >
              {isMusicPlaying ? (
                <Volume2 className="w-4 h-4 text-white" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <Link href="/tasks">
              <button className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/40 hover:scale-105 transition-transform" data-testid="button-tasks" title="🎁 Tasks">
                <Gift className="w-4 h-4 text-white" />
              </button>
            </Link>
            <Link href="/referrals">
              <button className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/40 hover:scale-105 transition-transform" data-testid="button-referrals" title="👥 Referrals">
                <Users className="w-4 h-4 text-white" />
              </button>
            </Link>
            <Link href="/withdraw">
              <button className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/40 hover:scale-105 transition-transform" data-testid="button-withdraw" title="💳 Withdraw">
                <Wallet className="w-4 h-4 text-white" />
              </button>
            </Link>
            <button
              onClick={logout}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-700/50 hover:bg-red-500/30 transition-all"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="w-full max-w-sm flex gap-2">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-md rounded-xl p-3 border border-emerald-500/30 shadow-lg"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <div className="relative z-10 flex items-center gap-2">
              <TonCoinImage size="lg" animate />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">💰 Balance</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-black text-emerald-400 font-mono" data-testid="text-balance">
                    {Number(user.balance).toFixed(8)}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-bold">TON</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 relative overflow-hidden bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 backdrop-blur-md rounded-xl p-3 border border-violet-500/30 shadow-lg"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            />
            <div className="relative z-10 flex items-center gap-2">
              <Avatar className="w-10 h-10 border-2 border-violet-400/60 shadow-lg shadow-violet-500/30 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white font-bold text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0">
                <p className="font-bold text-white text-sm truncate">👤 {displayName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-violet-300 font-semibold">ID: {user.id}</span>
                  <span className="text-[10px] text-fuchsia-400 font-bold">🌾 {user.completedHarvests || 0} harvests</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
