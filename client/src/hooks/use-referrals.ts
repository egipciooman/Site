import { useQuery } from "@tanstack/react-query";
import { ReferralPageData } from "@shared/schema";

export function useReferrals() {
  return useQuery<ReferralPageData>({
    queryKey: ["/api/referrals"],
    refetchInterval: 30000,
  });
}
