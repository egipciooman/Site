import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle,
  Send,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Withdrawal } from "@shared/schema";
import { TonCoinImage } from "@/components/TonCoinImage";

type WithdrawalPageData = {
  balance: string;
  minimumWithdrawal: string;
  history: Withdrawal[];
};

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: {
      icon: Clock,
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      label: "⏳ Under Review",
      emoji: "⏳"
    },
    approved: {
      icon: CheckCircle,
      className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      label: "✅ Paid",
      emoji: "✅"
    },
    rejected: {
      icon: XCircle,
      className: "bg-red-500/20 text-red-400 border-red-500/30",
      label: "❌ Rejected",
      emoji: "❌"
    }
  };

  const { icon: Icon, className, label } = config[status as keyof typeof config] || config.pending;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-bold ${className}`}>
      {label}
    </div>
  );
}

function WithdrawalHistoryItem({ withdrawal }: { withdrawal: Withdrawal }) {
  const statusColors = {
    pending: "border-l-yellow-400",
    approved: "border-l-emerald-400",
    rejected: "border-l-red-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 border-l-4 ${statusColors[withdrawal.status as keyof typeof statusColors] || statusColors.pending}`}
      data-testid={`withdrawal-item-${withdrawal.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg text-emerald-400">💰 {withdrawal.amount} TON</span>
            <StatusBadge status={withdrawal.status} />
          </div>
          <p className="text-xs text-slate-400 font-mono truncate">📋 {withdrawal.address}</p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(withdrawal.createdAt!).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {withdrawal.note && (
            <p className="text-xs text-slate-300 mt-2 bg-slate-600/50 p-2 rounded">{withdrawal.note}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Withdraw() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [useFullBalance, setUseFullBalance] = useState(false);

  const { data, isLoading, refetch } = useQuery<WithdrawalPageData>({
    queryKey: ["/api/withdrawals"],
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { amount: string; address: string }) => 
      apiRequest("POST", "/api/withdrawals", data),
    onSuccess: () => {
      toast({
        title: "✅ Request Submitted",
        description: "Your withdrawal request has been submitted for review.",
      });
      setAmount("");
      setAddress("");
      setUseFullBalance(false);
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game/state"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const withdrawAmount = useFullBalance ? data?.balance : amount;
    
    if (!withdrawAmount || parseFloat(withdrawAmount) < 0.1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal is 0.1 TON",
        variant: "destructive",
      });
      return;
    }

    if (!address || address.length < 40) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid TON wallet address",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({ amount: withdrawAmount, address });
  };

  const handleUseFullBalance = () => {
    if (data?.balance) {
      setAmount(data.balance);
      setUseFullBalance(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const balance = parseFloat(data?.balance || "0");
  const canWithdraw = balance >= 0.1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
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
          
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-xl">💳</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Withdraw TON</span>
            <span className="text-xl">💰</span>
          </h1>
          
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500/20 via-slate-800/80 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-emerald-500/30 shadow-xl p-6"
        >
          <div className="text-center mb-6">
            <p className="text-sm text-slate-400 mb-1">💰 Available Balance</p>
            <div className="flex items-center justify-center gap-2">
              <TonCoinImage size="lg" animate />
              <span className="text-2xl font-black text-emerald-400 font-mono" data-testid="text-withdraw-balance">{balance.toFixed(8)}</span>
              <span className="text-lg font-bold text-slate-500">TON</span>
            </div>
          </div>

          {!canWithdraw && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-400">
                ⚠️ Minimum withdrawal is 0.1 TON. Keep farming to earn more! 🌱
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">📋 TON Wallet Address</label>
              <Input
                placeholder="Enter your TON wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-12 font-mono text-sm bg-slate-900/80 border-slate-600 text-white placeholder:text-slate-500"
                data-testid="input-wallet-address"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">💰 Amount (TON)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.1"
                  step="0.001"
                  min="0.1"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setUseFullBalance(false);
                  }}
                  className="h-12 text-lg font-bold bg-slate-900/80 border-slate-600 text-white placeholder:text-slate-500"
                  data-testid="input-amount"
                />
                <Button
                  variant="outline"
                  onClick={handleUseFullBalance}
                  className="h-12 px-4 font-bold border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  data-testid="button-use-all"
                >
                  Use All
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Minimum: 0.1 TON</p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canWithdraw || withdrawMutation.isPending}
              className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-white shadow-lg shadow-emerald-500/20"
              data-testid="button-submit-withdrawal"
            >
              {withdrawMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  🚀 Request Withdrawal
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-xs text-slate-600 flex items-center gap-1">🔒 Secure Withdrawal</span>
              <span className="text-slate-700">•</span>
              <span className="text-xs text-slate-600 flex items-center gap-1">⚡ Fast Processing</span>
            </div>
          </div>
        </motion.div>

        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📜 Withdrawal History
          </h2>

          {data?.history && data.history.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {data.history.map((withdrawal) => (
                  <WithdrawalHistoryItem key={withdrawal.id} withdrawal={withdrawal} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <span className="text-4xl block mb-2">💳</span>
              <p className="text-sm">No withdrawal history yet</p>
              <p className="text-xs">Your withdrawal requests will appear here 📋</p>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            ⚠️ Important Notes
          </h3>
          <ul className="text-sm text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-sm shrink-0">1️⃣</span>
              Minimum withdrawal amount is 0.1 TON
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm shrink-0">2️⃣</span>
              Processing time is usually 24-48 hours ⏰
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm shrink-0">3️⃣</span>
              Make sure your wallet address is correct 📋
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm shrink-0">4️⃣</span>
              You will receive a notification when processed ✅
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
