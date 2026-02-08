import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sprout, Coins, Clock, Wallet, Users, ArrowRight, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count.toLocaleString()}</span>;
}

function FloatingEmoji({ emoji, delay, x, y }: { emoji: string; delay: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute text-2xl pointer-events-none select-none opacity-20"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -20, 0, 20, 0],
        x: [0, 10, -10, 5, 0],
        rotate: [0, 10, -10, 5, 0],
      }}
      transition={{
        repeat: Infinity,
        duration: 6,
        delay,
        ease: "easeInOut",
      }}
    >
      {emoji}
    </motion.div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-48 h-48 bg-pink-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/3 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />

        <FloatingEmoji emoji="🌱" delay={0} x="10%" y="15%" />
        <FloatingEmoji emoji="💰" delay={1} x="80%" y="20%" />
        <FloatingEmoji emoji="🌾" delay={2} x="15%" y="55%" />
        <FloatingEmoji emoji="💎" delay={0.5} x="85%" y="60%" />
        <FloatingEmoji emoji="⭐" delay={1.5} x="50%" y="10%" />
        <FloatingEmoji emoji="🚀" delay={3} x="70%" y="80%" />
        <FloatingEmoji emoji="🎮" delay={2.5} x="25%" y="85%" />
        <FloatingEmoji emoji="🌿" delay={1.8} x="90%" y="40%" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🌱</span>
            <h1
              className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-400 via-green-400 to-cyan-400"
              style={{
                textShadow: '0 0 20px rgba(255,0,255,0.3), 0 0 40px rgba(0,255,255,0.2)',
              }}
            >
              PlantaTON
            </h1>
            <span className="text-4xl">💎</span>
          </div>
          <p className="text-xl text-slate-300 font-medium">🌾 Plant, Grow, Harvest & Earn TON 💰</p>
          <p className="text-sm text-slate-400 mt-2">🚀 Your digital farming adventure starts here!</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-violet-500/20 backdrop-blur-xl rounded-2xl p-4 border border-emerald-500/30 mb-8 text-center"
        >
          <p className="text-sm text-slate-300 mb-1">🔥 Join <span className="font-black text-emerald-400"><AnimatedCounter target={1000} /></span>+ farmers earning TON daily!</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-lg">💰</span>
              <span className="text-xs text-slate-400">Total Earned</span>
              <span className="text-sm font-black text-yellow-400"><AnimatedCounter target={5000} /> TON</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-center text-lg font-bold text-white mb-4">🎯 How It Works</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 border border-emerald-500/30 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center text-xs font-black text-emerald-300">1</div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="font-bold text-emerald-400 text-sm">Plant 🌱</h3>
              <p className="text-xs text-slate-400 mt-1">Plant seeds in your 9 farming plots</p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/30 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center text-xs font-black text-cyan-300">2</div>
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mb-2">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="font-bold text-cyan-400 text-sm">Wait ⏰</h3>
              <p className="text-xs text-slate-400 mt-1">Wait for your crops to grow and mature</p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 border border-yellow-500/30 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-500/30 flex items-center justify-center text-xs font-black text-yellow-300">3</div>
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                <span className="text-2xl">🌾</span>
              </div>
              <h3 className="font-bold text-yellow-400 text-sm">Harvest 🌾</h3>
              <p className="text-xs text-slate-400 mt-1">Collect your harvest and earn TON rewards</p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 border border-violet-500/30 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500/30 flex items-center justify-center text-xs font-black text-violet-300">4</div>
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center mb-2">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-bold text-violet-400 text-sm">Earn 💰</h3>
              <p className="text-xs text-slate-400 mt-1">Withdraw your earnings to your TON wallet</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-5 border border-emerald-500/30 mb-6"
        >
          <h3 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
            👥 Invite Friends & Earn More 🎉
          </h3>
          <p className="text-sm text-slate-300">
            Share your referral link and earn <span className="font-bold text-emerald-400">💰 0.01 TON</span> for each friend who completes all 9 plots.
            Plus get <span className="font-bold text-emerald-400">+10% 🚀</span> from their earnings at withdrawal!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-center gap-4 mb-6"
        >
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-full border border-emerald-500/30">
            <span className="text-sm">🔒</span>
            <span className="text-xs font-bold text-emerald-400">100% Secure</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-full border border-yellow-500/30">
            <span className="text-sm">⚡</span>
            <span className="text-xs font-bold text-yellow-400">Instant Withdrawals</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-full border border-cyan-500/30">
            <span className="text-sm">⭐</span>
            <span className="text-xs font-bold text-cyan-400">Free to Play</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Link href="/register">
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/30 rounded-xl bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]">
                🚀 Sign Up Now — It's Free!
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full h-12 text-base font-semibold border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl mt-3">
              🔑 Log In
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-slate-500 text-xs">
            <span className="text-emerald-400 font-semibold">🌱 Plant</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-yellow-400 font-semibold">⏰ Grow</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-cyan-400 font-semibold">🌾 Harvest</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-violet-400 font-semibold">💰 Earn</span>
          </p>
          <p className="text-slate-600 text-[10px] mt-2">🌿 PlantaTON v1.0</p>
        </motion.div>
      </div>
    </div>
  );
}
