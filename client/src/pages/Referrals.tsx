import { useReferrals } from "@/hooks/use-referrals";
import { useGameState } from "@/hooks/use-game";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Users, 
  Clock, 
  CheckCircle, 
  Gift,
  Sprout,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { TonCoinImage } from "@/components/TonCoinImage";

function ProgressDots({ completed, total = 9 }: { completed: number; total?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <div 
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i < completed 
              ? "bg-emerald-500" 
              : "bg-slate-600"
          }`}
        />
      ))}
    </div>
  );
}

export default function Referrals() {
  const { data: referralData, isLoading } = useReferrals();
  const { data: gameState } = useGameState();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareLink = () => {
    const shareUrl = referralData?.referralLink || '';
    if (navigator.share && shareUrl) {
      navigator.share({
        title: "PlantaTON",
        text: "Join me in PlantaTON and earn TON! 🌱💰",
        url: shareUrl,
      });
    } else if (shareUrl) {
      copyToClipboard(shareUrl);
    }
  };

  if (isLoading || !referralData || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const { stats, referrals, referralCode, referralLink } = referralData;
  const shareableLink = referralLink;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-6 pb-14 px-4 rounded-b-[2rem] shadow-xl relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center justify-between w-full max-w-sm mb-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 hover:text-white" data-testid="button-back-to-game">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-black tracking-tight drop-shadow-lg flex items-center gap-2">
              <span className="text-xl">👥</span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Invite Friends</span>
              <span className="text-xl">🎉</span>
            </h1>
            <div className="w-10" />
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/30">
            <TonCoinImage size="sm" />
            <span className="font-black text-sm text-emerald-400 font-mono">💰 {Number(gameState.user.balance).toFixed(8)} TON</span>
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
            <span className="text-sm">🎉</span>
            <span className="text-xs font-bold text-yellow-400">Earn 0.01 TON per referral!</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-10 relative z-20 space-y-4">
        <div className="bg-gradient-to-br from-purple-500/20 via-slate-800/80 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            🎁 Your Referral Link
          </h2>
          
          <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
            <p className="text-xs text-slate-400 mb-1">🔗 Your Referral ID</p>
            <div className="flex items-center gap-2 mb-3">
              <code className="text-xl font-black text-purple-400 tracking-wider">{referralCode}</code>
            </div>
            
            <div className="bg-slate-900/80 rounded-lg p-2 text-xs text-slate-400 font-mono truncate mb-3 border border-slate-700">
              {shareableLink}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => copyToClipboard(shareableLink)}
                data-testid="button-copy-link"
              >
                <Copy className="w-4 h-4 mr-2" />
                📋 Copy
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                onClick={shareLink}
                data-testid="button-share-link"
              >
                <Share2 className="w-4 h-4 mr-2" />
                📤 Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 text-center border border-slate-700/50"
          >
            <span className="text-2xl block mb-1">📊</span>
            <p className="text-2xl font-black text-white">{stats.total}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 text-center border border-slate-700/50"
          >
            <span className="text-2xl block mb-1">⏳</span>
            <p className="text-2xl font-black text-white">{stats.pending}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pending</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-4 text-center border border-slate-700/50"
          >
            <span className="text-2xl block mb-1">✅</span>
            <p className="text-2xl font-black text-white">{stats.completed}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Completed</p>
          </motion.div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">💰 Total Earnings</p>
              <div className="flex items-center gap-1">
                <TonCoinImage size="sm" />
                <span className="text-xl font-black text-emerald-400">{stats.totalEarnings} TON</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">🚀 + 10% at withdrawal</p>
              <p className="text-[10px] text-purple-400 font-medium">from friends' earnings</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            👥 Referral History
            <span className="ml-auto text-sm font-normal text-slate-500">{referrals.length} friends</span>
          </h2>
          
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="text-4xl block mb-2">👥</span>
              <p className="text-sm">No referrals yet</p>
              <p className="text-xs">📤 Share your link to invite friends!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {referrals.map((ref, idx) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      ref.isComplete 
                        ? "bg-emerald-500/10 border border-emerald-500/30" 
                        : "bg-slate-700/50 border border-slate-600"
                    }`}
                    data-testid={`referral-item-${ref.id}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ref.isComplete 
                        ? "bg-emerald-500 text-white" 
                        : "bg-slate-600 text-slate-300"
                    }`}>
                      {ref.isComplete ? <CheckCircle className="w-5 h-5" /> : ref.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{ref.username}</p>
                      <p className="text-[10px] text-slate-500">ID: {ref.id}</p>
                      <ProgressDots completed={Math.min(ref.completedHarvests, 9)} />
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        ref.isComplete 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {ref.isComplete ? "✅ Completed" : `⏳ ${Math.min(ref.completedHarvests, 9)}/9`}
                      </span>
                      {ref.isComplete && (
                        <p className="text-[10px] text-emerald-400 mt-1">💰 +0.01 TON</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            📜 Terms & Conditions
          </h2>
          
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <p>💰 Earn <span className="font-bold text-emerald-400">0.01 TON</span> for each friend who joins using your referral link.</p>
            </div>
            
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <p>🌾 Your friend must complete all <span className="font-bold text-white">9 plots</span> at least once to count as a completed referral.</p>
            </div>
            
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <p>🚀 Get an additional <span className="font-bold text-emerald-400">+10%</span> from your friends' earnings at withdrawal. <span className="text-slate-500">(Coming soon)</span></p>
            </div>
            
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">4</div>
              <p>✅ Referral rewards are added automatically when conditions are met.</p>
            </div>
            
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold shrink-0">⚠️</div>
              <p className="text-yellow-400">Self-referrals and manipulation will result in account suspension.</p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 py-4">
          <p>📤 Share your link and expand your network! 🌐</p>
        </div>
      </div>
    </div>
  );
}
