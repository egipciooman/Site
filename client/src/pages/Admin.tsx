import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Settings, Coins, ListTodo, Users, FileText, Plus, Trash2, Check, X, Search, Ban, Gift, Clock, Percent, Loader2, Ticket, Calendar, Hash, Pickaxe, UserPlus, Shield, AlertTriangle, Eye, Copy, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import type { Task, AdminSettings, AdminUserInfo, AdminWithdrawalInfo, PromoCode, SuspectGroup, AdminDashboardStats } from "@shared/schema";
import { TonCoin3D } from "@/components/TonCoin3D";

type AdminTab = "dashboard" | "boxes" | "money" | "tasks" | "promo" | "withdrawals" | "members" | "cheaters";

const tabConfig: { tab: AdminTab; emoji: string; label: string }[] = [
  { tab: "dashboard", emoji: "📊", label: "Dashboard" },
  { tab: "boxes", emoji: "📦", label: "Boxes" },
  { tab: "money", emoji: "💰", label: "Money" },
  { tab: "tasks", emoji: "✅", label: "Tasks" },
  { tab: "promo", emoji: "🎁", label: "Promo" },
  { tab: "withdrawals", emoji: "📤", label: "Withdraw" },
  { tab: "members", emoji: "👥", label: "Members" },
  { tab: "cheaters", emoji: "🚨", label: "Cheaters" },
];

function TabButton({ tab, currentTab, emoji, label, badge, onClick }: {
  tab: AdminTab;
  currentTab: AdminTab;
  emoji: string;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  const isActive = tab === currentTab;
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
        isActive 
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
          : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
      }`}
      data-testid={`tab-${tab}`}
    >
      <span className="text-lg">{emoji}</span>
      <span className="text-[10px] font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg shadow-red-500/50 animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );
}

const boxColors = [
  { bg: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/50", text: "text-emerald-400" },
  { bg: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/50", text: "text-cyan-400" },
  { bg: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/50", text: "text-violet-400" },
  { bg: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/50", text: "text-amber-400" },
  { bg: "from-rose-500/20 to-pink-500/20", border: "border-rose-500/50", text: "text-rose-400" },
  { bg: "from-blue-500/20 to-indigo-500/20", border: "border-blue-500/50", text: "text-blue-400" },
  { bg: "from-teal-500/20 to-cyan-500/20", border: "border-teal-500/50", text: "text-teal-400" },
  { bg: "from-fuchsia-500/20 to-purple-500/20", border: "border-fuchsia-500/50", text: "text-fuchsia-400" },
  { bg: "from-lime-500/20 to-green-500/20", border: "border-lime-500/50", text: "text-lime-400" },
];

function DashboardSection() {
  const { data: stats, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    refetchInterval: 10000,
  });

  if (isLoading || !stats) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
        <p className="text-slate-400 mt-2 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const cards = [
    { emoji: "👥", label: "Total Users", value: stats.totalUsers, gradient: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/40", valueColor: "text-emerald-400" },
    { emoji: "📅", label: "New Today", value: stats.todayNewUsers, gradient: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/40", valueColor: "text-cyan-400" },
    { emoji: "💰", label: "Total Balance", value: stats.totalBalance + " TON", gradient: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/40", valueColor: "text-amber-400" },
    { emoji: "📤", label: "Pending Withdrawals", value: stats.pendingWithdrawals, gradient: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/40", valueColor: "text-violet-400", danger: stats.pendingWithdrawals > 0 },
    { emoji: "📊", label: "Total Withdrawals", value: stats.totalWithdrawals, gradient: "from-blue-500/20 to-indigo-500/20", border: "border-blue-500/40", valueColor: "text-blue-400" },
    { emoji: "🚨", label: "Suspect Accounts", value: stats.suspectCount, gradient: "from-rose-500/20 to-red-500/20", border: "border-rose-500/40", valueColor: "text-rose-400", danger: stats.suspectCount > 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white">🎮 Admin Dashboard</h2>
        <p className="text-sm text-slate-400 mt-1">Monitor your PlantaTON game</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 border ${card.border} relative overflow-hidden`}
          >
            {card.danger && (
              <div className="absolute top-2 right-2">
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 animate-pulse">!</span>
              </div>
            )}
            <span className="text-2xl">{card.emoji}</span>
            <p className={`text-xl font-black mt-1 ${card.danger ? "text-red-400" : card.valueColor}`}>
              {card.value}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 mt-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Activity className="w-3 h-3" />
          <span>Auto-refreshing every 10 seconds</span>
        </div>
      </div>
    </div>
  );
}

function BoxesSection({ settings, onUpdate }: { settings: AdminSettings; onUpdate: (key: string, value: string) => void }) {
  const defaultBoxSettings = Array(9).fill(null).map((_, i) => ({
    growthTimeSeconds: settings.boxes?.[i]?.growthTimeSeconds ?? settings.growthTimeSeconds ?? 60,
    harvestReward: settings.boxes?.[i]?.harvestReward ?? settings.harvestReward ?? "0.010"
  }));
  
  const [boxSettings, setBoxSettings] = useState(defaultBoxSettings);

  const updateBox = (index: number, field: 'growthTimeSeconds' | 'harvestReward', value: string) => {
    const newSettings = [...boxSettings];
    if (field === 'growthTimeSeconds') {
      newSettings[index] = { ...newSettings[index], growthTimeSeconds: parseInt(value) || 60 };
    } else {
      newSettings[index] = { ...newSettings[index], harvestReward: value };
    }
    setBoxSettings(newSettings);
  };

  const saveBox = (index: number) => {
    onUpdate(`box_${index}_time`, boxSettings[index].growthTimeSeconds.toString());
    onUpdate(`box_${index}_reward`, boxSettings[index].harvestReward);
  };

  const saveAllBoxes = () => {
    onUpdate("boxes", JSON.stringify(boxSettings));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          📦 Box Settings (9 Boxes)
        </h2>
        <Button
          onClick={saveAllBoxes}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          data-testid="button-save-all-boxes"
        >
          Save All
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {boxSettings.map((box, index) => {
          const color = boxColors[index];
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gradient-to-br ${color.bg} rounded-xl p-3 border ${color.border} space-y-2`}
            >
              <div className="text-center">
                <span className={`text-lg font-black ${color.text}`}>#{index + 1}</span>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Time (s)</label>
                <Input
                  type="number"
                  value={box.growthTimeSeconds}
                  onChange={(e) => updateBox(index, 'growthTimeSeconds', e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white h-8 text-sm text-center"
                  data-testid={`input-box-${index}-time`}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Reward (TON)</label>
                <Input
                  type="text"
                  value={box.harvestReward}
                  onChange={(e) => updateBox(index, 'harvestReward', e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white h-8 text-sm text-center"
                  data-testid={`input-box-${index}-reward`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="bg-slate-800/50 rounded-xl p-4 mt-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          ⚙️ Default Settings (Legacy)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Default Time (s)</label>
            <Input
              type="number"
              value={settings.growthTimeSeconds}
              onChange={(e) => onUpdate("growthTimeSeconds", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white h-9"
              data-testid="input-default-growth-time"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Default Reward</label>
            <Input
              type="text"
              value={settings.harvestReward}
              onChange={(e) => onUpdate("harvestReward", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white h-9"
              data-testid="input-default-harvest-reward"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MoneySection({ settings, onUpdate }: { settings: AdminSettings; onUpdate: (key: string, value: string) => void }) {
  const [minWithdrawal, setMinWithdrawal] = useState(settings.minimumWithdrawal);
  const [referralBonus, setReferralBonus] = useState(settings.referralBonus);
  const [referralPercent, setReferralPercent] = useState(settings.referralPercentage.toString());
  const [dailyBonus, setDailyBonus] = useState(settings.dailyBonusAmount || "0.005");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        💰 Money Settings
      </h2>
      
      <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/30">
          <label className="text-sm text-amber-300 mb-2 block flex items-center gap-2">
            🎁 Daily Bonus Amount (TON)
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={dailyBonus}
              onChange={(e) => setDailyBonus(e.target.value)}
              className="bg-slate-700/50 border-amber-500/50 text-white"
              data-testid="input-daily-bonus"
            />
            <Button
              onClick={() => onUpdate("dailyBonusAmount", dailyBonus)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              data-testid="button-save-daily-bonus"
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-amber-400/70 mt-2">Players can claim this bonus once every 24 hours</p>
        </div>
        
        <div>
          <label className="text-sm text-slate-300 mb-2 block">💸 Minimum Withdrawal (TON)</label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              data-testid="input-min-withdrawal"
            />
            <Button
              onClick={() => onUpdate("minimumWithdrawal", minWithdrawal)}
              className="bg-emerald-500 hover:bg-emerald-600"
              data-testid="button-save-min-withdrawal"
            >
              Save
            </Button>
          </div>
        </div>
        
        <div>
          <label className="text-sm text-slate-300 mb-2 block">🤝 Referral Bonus (TON)</label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={referralBonus}
              onChange={(e) => setReferralBonus(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              data-testid="input-referral-bonus"
            />
            <Button
              onClick={() => onUpdate("referralBonus", referralBonus)}
              className="bg-emerald-500 hover:bg-emerald-600"
              data-testid="button-save-referral-bonus"
            >
              Save
            </Button>
          </div>
        </div>
        
        <div>
          <label className="text-sm text-slate-300 mb-2 block flex items-center gap-1">
            <Percent className="w-4 h-4" /> 📊 Referral Percentage
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={referralPercent}
              onChange={(e) => setReferralPercent(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white"
              data-testid="input-referral-percent"
            />
            <Button
              onClick={() => onUpdate("referralPercentage", referralPercent)}
              className="bg-emerald-500 hover:bg-emerald-600"
              data-testid="button-save-referral-percent"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksSection() {
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    type: "youtube" as "youtube" | "telegram" | "link",
    title: "",
    description: "",
    url: "",
    reward: "",
  });

  const { data, isLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ["/api/admin/tasks"],
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/tasks", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      setShowForm(false);
      setFormData({ type: "youtube", title: "", description: "", url: "", reward: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<Task> }) => 
      apiRequest("PATCH", `/api/admin/tasks/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      setEditTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          ✅ Tasks
        </h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-500 hover:bg-emerald-600"
          size="sm"
          data-testid="button-add-task"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 rounded-xl p-4 space-y-3"
          >
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full p-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white"
              data-testid="select-task-type"
            >
              <option value="youtube">YouTube</option>
              <option value="telegram">Telegram</option>
              <option value="link">External Link</option>
            </select>
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
              data-testid="input-task-title"
            />
            <Input
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
              data-testid="input-task-description"
            />
            <Input
              placeholder="URL"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
              data-testid="input-task-url"
            />
            <Input
              placeholder="e.g. 0.01"
              type="number"
              step="0.0001"
              value={formData.reward}
              onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
              data-testid="input-task-reward"
            />
            <p className="text-xs text-slate-500 -mt-2">Reward amount in TON (e.g. 0.001, 0.01, 0.1)</p>
            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !formData.reward}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                data-testid="button-create-task"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="border-slate-600 text-slate-300"
                data-testid="button-cancel-task"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          </div>
        ) : (
          data?.tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{task.title}</h3>
                <p className="text-sm text-slate-400 truncate">{task.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{task.type}</span>
                  <span className="text-xs text-emerald-400">+{parseFloat(task.reward).toFixed(4)} TON</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(task.id)}
                  className="text-red-400 hover:bg-red-500/20"
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PromoCodesSection() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    reward: "0.010",
    maxUses: "100",
  });

  const { data, isLoading } = useQuery<{ codes: PromoCode[] }>({
    queryKey: ["/api/admin/promo-codes"],
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/promo-codes", {
      code: formData.code.toUpperCase(),
      reward: formData.reward,
      maxUses: parseInt(formData.maxUses) || 1,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setShowForm(false);
      setFormData({ code: "", reward: "0.010", maxUses: "100" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/promo-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          🎁 Promo Codes
        </h2>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-violet-500 hover:bg-violet-600"
          size="sm"
          data-testid="button-add-promo"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Code
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 rounded-xl p-4 space-y-3"
          >
            <div className="flex gap-2">
              <Input
                placeholder="Code (e.g., BONUS100)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="bg-slate-700/50 border-slate-600 text-white uppercase flex-1"
                data-testid="input-promo-code-new"
              />
              <Button
                onClick={generateRandomCode}
                variant="outline"
                className="border-slate-600 text-slate-300"
                data-testid="button-generate-code"
              >
                Generate
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Reward (TON)</label>
                <Input
                  type="text"
                  placeholder="0.010"
                  value={formData.reward}
                  onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  data-testid="input-promo-reward"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Max Uses</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  data-testid="input-promo-max-uses"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !formData.code}
                className="flex-1 bg-violet-500 hover:bg-violet-600"
                data-testid="button-create-promo"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                className="border-slate-600 text-slate-300"
                data-testid="button-cancel-promo"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
          </div>
        ) : data?.codes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No promo codes yet
          </div>
        ) : (
          data?.codes.map((promo) => (
            <div
              key={promo.id}
              className={`rounded-xl p-3 flex items-center justify-between ${
                promo.isActive && promo.currentUses < promo.maxUses
                  ? "bg-violet-500/10 border border-violet-500/30"
                  : "bg-slate-800/50 border border-slate-700/50 opacity-60"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white tracking-wider">{promo.code}</h3>
                  {promo.currentUses >= promo.maxUses && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Exhausted</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-emerald-400 font-medium">+{promo.reward} TON</span>
                  <span className="text-slate-400">{promo.currentUses}/{promo.maxUses} uses</span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteMutation.mutate(promo.id)}
                className="text-red-400 hover:bg-red-500/20"
                data-testid={`button-delete-promo-${promo.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WithdrawalsSection() {
  const { data, isLoading } = useQuery<{ withdrawals: AdminWithdrawalInfo[] }>({
    queryKey: ["/api/admin/withdrawals"],
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; status: string }) => 
      apiRequest("PATCH", `/api/admin/withdrawals/${data.id}`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
    },
  });

  const pendingWithdrawals = data?.withdrawals.filter(w => w.status === "pending") || [];
  const approvedWithdrawals = data?.withdrawals.filter(w => w.status === "approved") || [];
  const rejectedWithdrawals = data?.withdrawals.filter(w => w.status === "rejected") || [];

  const sortedWithdrawals = [
    ...pendingWithdrawals,
    ...approvedWithdrawals,
    ...rejectedWithdrawals,
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">⏳ Pending</span>;
      case "approved":
        return <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✅ Approved</span>;
      case "rejected":
        return <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">❌ Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          📤 Withdrawals
        </h2>
        {pendingWithdrawals.length > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-3 py-1 animate-pulse">
            {pendingWithdrawals.length} pending
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
        </div>
      ) : sortedWithdrawals.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No withdrawals yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedWithdrawals.map((w) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-3 border ${
                w.status === "pending"
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : w.status === "approved"
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white text-sm">👤 {w.username}</p>
                    {getStatusBadge(w.status)}
                  </div>
                  <p className="text-emerald-400 font-bold text-lg">💰 {w.amount} TON</p>
                </div>
                {w.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="icon"
                      onClick={() => updateMutation.mutate({ id: w.id, status: "approved" })}
                      className="bg-green-500 hover:bg-green-600 h-8 w-8"
                      data-testid={`button-approve-${w.id}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => updateMutation.mutate({ id: w.id, status: "rejected" })}
                      className="bg-red-500 hover:bg-red-600 h-8 w-8"
                      data-testid={`button-reject-${w.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2">
                <span className="text-[10px] text-slate-500">Wallet:</span>
                <p className="text-xs text-slate-300 truncate flex-1 font-mono">{w.address}</p>
                <button
                  onClick={() => copyToClipboard(w.address)}
                  className="text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              {w.createdAt && (
                <p className="text-[10px] text-slate-500 mt-1">
                  📅 {new Date(w.createdAt).toLocaleString()}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user, onSelect, compact }: { user: AdminUserInfo; onSelect?: (user: AdminUserInfo) => void; compact?: boolean }) {
  const joinDate = user.createdAt ? new Date(user.createdAt) : null;
  const formattedDate = joinDate
    ? `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}-${String(joinDate.getDate()).padStart(2, '0')}`
    : "Unknown";
  const formattedTime = joinDate
    ? `${String(joinDate.getHours()).padStart(2, '0')}:${String(joinDate.getMinutes()).padStart(2, '0')}`
    : "";

  return (
    <div
      className={`bg-slate-800/60 rounded-xl border border-slate-700/50 p-3 ${onSelect ? 'cursor-pointer hover:bg-slate-700/50 hover:border-slate-600/50 transition-all' : ''}`}
      onClick={() => onSelect?.(user)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            {user.username?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white text-sm truncate">{user.username}</p>
            <p className="text-[10px] text-slate-500">TG: {user.telegramId || "N/A"} | DB: {user.id}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-emerald-400">{parseFloat(user.balance).toFixed(4)}</p>
          <p className="text-[10px] text-slate-500">TON</p>
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="bg-slate-900/50 rounded-lg px-2 py-1.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Pickaxe className="w-3 h-3 text-amber-400" />
            </div>
            <p className="text-xs font-bold text-white">{user.completedHarvests || 0}</p>
            <p className="text-[9px] text-slate-500">Harvests</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg px-2 py-1.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <UserPlus className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-xs font-bold text-white">{user.referralCount || 0}</p>
            <p className="text-[9px] text-slate-500">Referrals</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg px-2 py-1.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Calendar className="w-3 h-3 text-violet-400" />
            </div>
            <p className="text-[10px] font-bold text-white">{formattedDate}</p>
            <p className="text-[9px] text-slate-500">{formattedTime}</p>
          </div>
        </div>
      )}

      {user.isBanned && (
        <div className="mt-2 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
          <span className="text-[10px] font-bold text-red-400">🚫 BANNED</span>
        </div>
      )}
    </div>
  );
}

function MembersSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminUserInfo[]>([]);
  const [searchedUser, setSearchedUser] = useState<AdminUserInfo | null>(null);
  const [addBalanceAmount, setAddBalanceAmount] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "balance" | "referrals" | "harvests">("newest");

  const { data, isLoading } = useQuery<{ users: AdminUserInfo[]; totalUsers: number }>({
    queryKey: [`/api/admin/members?page=1&limit=100&sort=${sortBy}`],
  });

  const searchMutation = useMutation({
    mutationFn: (query: string) => apiRequest("GET", `/api/admin/members/search?q=${encodeURIComponent(query)}`),
    onSuccess: (data: any) => {
      setSearchResults(data.users || []);
      if (data.users?.length === 1) {
        setSearchedUser(data.users[0]);
      } else {
        setSearchedUser(null);
      }
    },
    onError: () => {
      setSearchResults([]);
      setSearchedUser(null);
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: (data: { userId: number; amount: string }) => 
      apiRequest("POST", `/api/admin/members/${data.userId}/balance`, { amount: data.amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      setAddBalanceAmount("");
      if (searchedUser) {
        searchMutation.mutate(String(searchedUser.telegramId || searchedUser.id));
      }
    },
  });

  const banMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", `/api/admin/members/${userId}/ban`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      if (searchedUser) {
        searchMutation.mutate(String(searchedUser.telegramId || searchedUser.id));
      }
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", `/api/admin/members/${userId}/unban`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      if (searchedUser) {
        searchMutation.mutate(String(searchedUser.telegramId || searchedUser.id));
      }
    },
  });

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchedUser(null);
  }, []);

  const sortLabels: Record<string, string> = {
    newest: "Newest Members",
    balance: "Top Balance",
    referrals: "Top Referrals",
    harvests: "Top Harvesters",
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        👥 Members
      </h2>

      <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-3 text-center">
        <p className="text-3xl font-bold text-emerald-400">{data?.totalUsers || 0}</p>
        <p className="text-xs text-slate-300">Total Members</p>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-3">
        <p className="text-xs text-slate-400 mb-2">🔍 Search by Username, Telegram ID, or DB ID</p>
        <div className="flex gap-2">
          <Input
            placeholder="Enter name, TG ID, or DB ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchQuery && searchMutation.mutate(searchQuery)}
            className="bg-slate-700/50 border-slate-600 text-white text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearSearch}
              className="text-slate-400 hover:bg-slate-700/50 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={() => searchMutation.mutate(searchQuery)}
            disabled={!searchQuery || searchMutation.isPending}
            className="bg-cyan-500 hover:bg-cyan-600 shrink-0"
          >
            {searchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {searchResults.length > 1 && !searchedUser && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            <p className="text-xs text-slate-400">{searchResults.length} results found</p>
            {searchResults.map((user) => (
              <UserCard key={user.id} user={user} onSelect={setSearchedUser} compact />
            ))}
          </div>
        )}

        {searchedUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Member Details</p>
              <Button variant="ghost" size="sm" onClick={handleClearSearch} className="text-xs text-slate-400 h-6">
                Close
              </Button>
            </div>

            <UserCard user={searchedUser} />

            <div className="mt-3 flex gap-2">
              {searchedUser.isBanned ? (
                <Button
                  size="sm"
                  onClick={() => unbanMutation.mutate(searchedUser.id)}
                  disabled={unbanMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 flex-1"
                >
                  {unbanMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                  Unban
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => banMutation.mutate(searchedUser.id)}
                  disabled={banMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 flex-1"
                >
                  {banMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                  Ban
                </Button>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Amount (TON)"
                value={addBalanceAmount}
                onChange={(e) => setAddBalanceAmount(e.target.value)}
                className="bg-slate-600/50 border-slate-500 text-white"
              />
              <Button
                onClick={() => addBalanceMutation.mutate({ userId: searchedUser.id, amount: addBalanceAmount })}
                disabled={!addBalanceAmount || addBalanceMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {addBalanceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4 mr-1" />}
                Add
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: "newest" as const, label: "Newest", icon: Calendar },
            { key: "balance" as const, label: "Balance", icon: Coins },
            { key: "referrals" as const, label: "Referrals", icon: UserPlus },
            { key: "harvests" as const, label: "Harvests", icon: Pickaxe },
          ]).map(({ key, label, icon: SortIcon }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                sortBy === key
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60"
              }`}
            >
              <SortIcon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-slate-400">{sortLabels[sortBy]}</h3>
          <p className="text-[10px] text-slate-500">Top {Math.min(100, data?.users?.length || 0)} of {data?.totalUsers || 0}</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-700/50 bg-slate-900/30 members-scroll">
            <div className="space-y-1.5 p-2">
              {data?.users?.map((user, index) => (
                <div key={user.id} className="flex items-center gap-2">
                  <span className={`w-6 text-center text-[10px] font-bold shrink-0 ${
                    index < 3 ? "text-amber-400" : "text-slate-500"
                  }`}>
                    {index < 3 ? ["🥇", "🥈", "🥉"][index] : `#${index + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <UserCard user={user} onSelect={(u) => { setSearchedUser(u); }} compact />
                  </div>
                </div>
              ))}
              {(!data?.users || data.users.length === 0) && (
                <p className="text-center text-slate-500 text-sm py-6">No members yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheatersSection() {
  const { data, isLoading } = useQuery<{ suspects: SuspectGroup[] }>({
    queryKey: ["/api/admin/suspects"],
  });

  const banMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", `/api/admin/members/${userId}/ban`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suspects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", `/api/admin/members/${userId}/unban`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suspects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
  });

  const banAllInGroup = (users: SuspectGroup["users"]) => {
    users.forEach((u) => {
      if (!u.isBanned) {
        banMutation.mutate(u.id);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto" />
        <p className="text-slate-400 mt-2 text-sm">Scanning for suspects...</p>
      </div>
    );
  }

  const suspects = data?.suspects || [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">
        🚨 Suspect Accounts (Shared IPs)
      </h2>

      {suspects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-lg font-medium text-green-400">No suspicious activity detected</p>
          <p className="text-sm text-slate-500 mt-1">All accounts appear to be unique</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suspects.map((group, gi) => (
            <motion.div
              key={group.ipAddress}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.1 }}
              className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl border border-red-500/30 overflow-hidden"
            >
              <div className="p-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔍</span>
                  <div>
                    <p className="font-bold text-white text-sm font-mono">{group.ipAddress}</p>
                    <p className="text-[10px] text-red-300">{group.users.length} accounts sharing this IP</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => banAllInGroup(group.users)}
                  disabled={banMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-xs"
                >
                  {banMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                  Ban All
                </Button>
              </div>

              <div className="p-3 space-y-2">
                {group.users.map((user) => {
                  const joinDate = user.createdAt ? new Date(user.createdAt) : null;
                  const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;

                  return (
                    <div
                      key={user.id}
                      className={`bg-slate-900/50 rounded-lg p-3 border ${
                        user.isBanned ? "border-red-500/40" : "border-slate-700/40"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white text-sm truncate">
                              {user.isBanned ? "🚫" : "👤"} {user.username}
                            </p>
                            {user.isBanned && (
                              <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">BANNED</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">ID: {user.id}</p>
                          {user.email && (
                            <p className="text-[10px] text-slate-400">📧 {user.email}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {joinDate && (
                              <p className="text-[10px] text-slate-500">
                                📅 Joined: {joinDate.toLocaleDateString()}
                              </p>
                            )}
                            {lastLogin && (
                              <p className="text-[10px] text-slate-500">
                                🕐 Last: {lastLogin.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">
                          {user.isBanned ? (
                            <Button
                              size="sm"
                              onClick={() => unbanMutation.mutate(user.id)}
                              disabled={unbanMutation.isPending}
                              className="bg-green-500 hover:bg-green-600 text-xs h-7"
                            >
                              Unban
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => banMutation.mutate(user.id)}
                              disabled={banMutation.isPending}
                              className="bg-red-500 hover:bg-red-600 text-xs h-7"
                            >
                              Ban
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const { data: settings, isLoading } = useQuery<AdminSettings>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: dashboardStats } = useQuery<AdminDashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    refetchInterval: 10000,
  });

  const { data: suspectsData } = useQuery<{ suspects: SuspectGroup[] }>({
    queryKey: ["/api/admin/suspects"],
  });

  const { data: withdrawalsData } = useQuery<{ withdrawals: AdminWithdrawalInfo[] }>({
    queryKey: ["/api/admin/withdrawals"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: (data: { key: string; value: string }) => 
      apiRequest("POST", "/api/admin/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
  });

  const handleUpdateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const pendingCount = withdrawalsData?.withdrawals.filter(w => w.status === "pending").length || 0;
  const suspectCount = suspectsData?.suspects?.length || 0;

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tasks")}
            className="text-slate-300 hover:bg-slate-700/50"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            ⚙️ Admin Panel
          </h1>
          
          <div className="w-10" />
        </div>
      </header>

      <div className="sticky top-[65px] z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 p-2">
        <div className="flex gap-2 max-w-lg mx-auto overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {tabConfig.map(({ tab, emoji, label }) => (
            <TabButton
              key={tab}
              tab={tab}
              currentTab={activeTab}
              emoji={emoji}
              label={label}
              badge={
                tab === "withdrawals" ? pendingCount :
                tab === "cheaters" ? suspectCount :
                undefined
              }
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>
      </div>

      <main className="max-w-lg mx-auto p-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "dashboard" && <DashboardSection />}
            {activeTab === "boxes" && <BoxesSection settings={settings} onUpdate={handleUpdateSetting} />}
            {activeTab === "money" && <MoneySection settings={settings} onUpdate={handleUpdateSetting} />}
            {activeTab === "tasks" && <TasksSection />}
            {activeTab === "promo" && <PromoCodesSection />}
            {activeTab === "withdrawals" && <WithdrawalsSection />}
            {activeTab === "members" && <MembersSection />}
            {activeTab === "cheaters" && <CheatersSection />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
