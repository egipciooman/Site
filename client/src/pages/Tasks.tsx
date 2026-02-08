import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Youtube, Send, ExternalLink, Check, Gift, Loader2, X, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import type { TaskWithStatus } from "@shared/schema";
import { TonCoinImage } from "@/components/TonCoinImage";

const VERIFICATION_TIME = 10;

function TaskIcon({ type }: { type: string }) {
  const iconClass = "w-6 h-6";
  switch (type) {
    case "youtube":
      return <Youtube className={`${iconClass} text-red-500`} />;
    case "telegram":
      return <Send className={`${iconClass} text-blue-400`} />;
    case "link":
      return <ExternalLink className={`${iconClass} text-purple-400`} />;
    default:
      return <Gift className={`${iconClass} text-amber-400`} />;
  }
}

function taskTypeEmoji(type: string): string {
  switch (type) {
    case "youtube": return "📺";
    case "telegram": return "📱";
    case "link": return "🔗";
    default: return "🎁";
  }
}

function TaskCard({ task, onTaskComplete }: { task: TaskWithStatus; onTaskComplete: () => void }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canClaim, setCanClaim] = useState(task.isCompleted && !task.isClaimed);

  const startTaskMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tasks/${task.id}/start`),
    onSuccess: () => {
      setIsVerifying(true);
      setCountdown(VERIFICATION_TIME);
    },
  });

  const claimMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/tasks/${task.id}/claim`),
    onSuccess: () => {
      confetti({
        particleCount: 25,
        spread: 50,
        ticks: 35,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#7B68EE', '#00CED1'],
        disableForReducedMotion: true,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game/state"] });
      onTaskComplete();
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isVerifying && countdown === 0) {
      setIsVerifying(false);
      setCanClaim(true);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    }
  }, [countdown, isVerifying]);

  const handleStartTask = useCallback(() => {
    window.open(task.url, "_blank");
    startTaskMutation.mutate();
  }, [task.url, startTaskMutation]);

  const handleClaim = useCallback(() => {
    claimMutation.mutate();
  }, [claimMutation]);

  if (task.isClaimed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 p-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-400 line-through opacity-60">{task.title}</h3>
            <p className="text-sm text-slate-500">{task.description}</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">
            ✅ Completed
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-xl p-4"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-transparent pointer-events-none" />
      
      <div className="relative flex items-center gap-4">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 flex items-center justify-center shadow-lg border border-slate-600/50"
        >
          <TaskIcon type={task.type} />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate">{taskTypeEmoji(task.type)} {task.title}</h3>
          <p className="text-sm text-slate-400 truncate">{task.description}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm">💰</span>
            <span className="text-emerald-400 font-bold">+{parseFloat(task.reward).toFixed(4)}</span>
            <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">TON</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          {isVerifying ? (
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (countdown / VERIFICATION_TIME)}
                    className="text-yellow-400 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-yellow-400">{countdown}</span>
                </div>
              </div>
              <span className="text-xs text-slate-500">⏳ Verifying...</span>
            </div>
          ) : canClaim ? (
            <Button
              onClick={handleClaim}
              disabled={claimMutation.isPending}
              className="bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-500 hover:via-orange-600 hover:to-pink-600 text-white font-bold rounded-xl px-4 py-2 shadow-lg"
              data-testid={`button-claim-task-${task.id}`}
            >
              {claimMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "🎉 Claim"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStartTask}
              disabled={startTaskMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold rounded-xl px-4 py-2 shadow-lg"
              data-testid={`button-start-task-${task.id}`}
            >
              {startTaskMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "🚀 Start"
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PromoCodeSection() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const useMutation1 = useMutation({
    mutationFn: () => apiRequest("POST", "/api/promo/use", { code }),
    onSuccess: (data: any) => {
      setStatus("success");
      setMessage(`🎉 Claimed ${data.reward} TON!`);
      setCode("");
      confetti({
        particleCount: 25,
        spread: 50,
        ticks: 35,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#7B68EE', '#00CED1'],
        disableForReducedMotion: true,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/game/state"] });
      setTimeout(() => setStatus("idle"), 3000);
    },
    onError: (err: any) => {
      setStatus("error");
      setMessage(err?.message || "Invalid or expired code");
      setTimeout(() => setStatus("idle"), 3000);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 backdrop-blur-xl border border-violet-500/30 p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
          <Ticket className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white">🎟️ Promo Code</h3>
          <p className="text-sm text-slate-400">Get codes from our channel</p>
        </div>
      </div>

      <a
        href="https://t.me/plantonreward"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 mb-3 bg-blue-500/20 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
          <Send className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">📱 Join Channel for Codes</p>
          <p className="text-xs text-blue-300">@plantonreward</p>
        </div>
        <ExternalLink className="w-4 h-4 text-blue-400" />
      </a>
      
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="bg-slate-800/50 border-slate-600 text-white uppercase"
          data-testid="input-promo-code"
        />
        <Button
          onClick={() => useMutation1.mutate()}
          disabled={!code || useMutation1.isPending}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold"
          data-testid="button-use-promo"
        >
          {useMutation1.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "🎁 Claim"}
        </Button>
      </div>
      
      <AnimatePresence>
        {status !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-3 px-3 py-2 rounded-lg text-center font-medium ${
              status === "success" 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AdminAccessModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setError("Invalid code");
      }
    } catch {
      setError("Verification failed");
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-xs border border-slate-700 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Admin Access</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <Input
          type="password"
          placeholder="Enter secret code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="bg-slate-700/50 border-slate-600 text-white mb-3"
          data-testid="input-admin-code"
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !code}
          className="w-full bg-emerald-500 hover:bg-emerald-600"
          data-testid="button-admin-verify"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function Tasks() {
  const [, navigate] = useLocation();
  const [clickCount, setClickCount] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data, isLoading } = useQuery<{ tasks: TaskWithStatus[] }>({
    queryKey: ["/api/tasks"],
  });

  const handleSecretClick = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 2000);
    
    if (newCount >= 10) {
      setShowAdminModal(true);
      setClickCount(0);
    }
  }, [clickCount]);

  const handleAdminSuccess = () => {
    setShowAdminModal(false);
    navigate("/admin");
  };

  const activeTasks = data?.tasks.filter(t => !t.isClaimed) || [];
  const completedTasks = data?.tasks.filter(t => t.isClaimed) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
            data-testid="button-back-to-game"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 
            className="text-xl font-bold flex items-center gap-2 cursor-pointer select-none"
            onClick={handleSecretClick}
          >
            <span className="text-xl">🎯</span>
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Complete Tasks & Earn</span>
            <span className="text-xl">💰</span>
          </h1>
          
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 text-center"
        >
          <p className="text-slate-300 font-medium">
            🎯 Complete tasks and earn instant rewards! 💰
          </p>
        </motion.div>

        <PromoCodeSection />

        {activeTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-slate-400 font-bold text-sm uppercase tracking-wider">
                🚀 Available Tasks ({activeTasks.length})
              </h2>
            </div>
            <AnimatePresence>
              {activeTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TaskCard task={task} onTaskComplete={() => {}} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="space-y-3 mt-6">
            <h2 className="text-slate-500 font-bold text-sm uppercase tracking-wider px-1">
              ✅ Completed Tasks ({completedTasks.length})
            </h2>
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} onTaskComplete={() => {}} />
            ))}
          </div>
        )}

        {data?.tasks.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl block mb-4">🎯</span>
            <p className="text-slate-500">No tasks available at the moment</p>
            <p className="text-xs text-slate-600 mt-1">Check back soon for new tasks! ⏰</p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showAdminModal && (
          <AdminAccessModal
            onClose={() => setShowAdminModal(false)}
            onSuccess={handleAdminSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
