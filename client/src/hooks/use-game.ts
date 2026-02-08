import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PlantRequest, type HarvestRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

export function useGameState() {
  return useQuery({
    queryKey: [api.game.state.path],
    queryFn: async () => {
      const res = await fetch(api.game.state.path);
      if (!res.ok) throw new Error("Failed to fetch game state");
      return api.game.state.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
  });
}

export function usePlant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: PlantRequest) => {
      const res = await fetch(api.game.plant.path, {
        method: api.game.plant.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to plant");
      }
      return api.game.plant.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Oops!",
        description: error.message,
      });
    },
  });
}

export function useHarvest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: HarvestRequest) => {
      const res = await fetch(api.game.harvest.path, {
        method: api.game.harvest.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to harvest");
      }
      return api.game.harvest.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] });
      
      // Fun feedback
      confetti({
        particleCount: 20,
        spread: 50,
        ticks: 30,
        origin: { y: 0.7 },
        colors: ['#0098EA', '#FFD700', '#FFFFFF'],
        disableForReducedMotion: true,
      });

      toast({
        title: `🎉 +${data.reward} TON`,
        description: "Harvest complete!",
        className: "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-none shadow-xl shadow-emerald-500/30 py-2 px-3",
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Cannot harvest yet",
        description: error.message,
      });
    },
  });
}

export function useInitGame() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { username: string; referralCode?: string }) => {
      const res = await fetch(api.game.unlock.path, {
        method: api.game.unlock.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error("Failed to start game");
      return api.game.unlock.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] });
    },
  });
}

export interface BoxSettings {
  growthTimeSeconds: number;
  harvestReward: string;
}

export interface GameSettings {
  boxes: BoxSettings[];
  growthTimeSeconds: number;
  harvestReward: string;
}

export function useGameSettings() {
  return useQuery<GameSettings>({
    queryKey: ['/api/game/settings'],
    queryFn: async () => {
      const res = await fetch('/api/game/settings');
      if (!res.ok) throw new Error("Failed to fetch game settings");
      return res.json();
    },
    staleTime: 30000,
  });
}
