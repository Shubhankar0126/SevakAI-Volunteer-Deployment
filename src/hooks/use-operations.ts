import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/services/sevakai";
import { useAuth } from "./use-auth";

export const OPERATIONS_QUERY_KEY = ["operations", "snapshot"] as const;

export function useOperationsSnapshot() {
  const { user } = useAuth();

  return useQuery({
    queryKey: OPERATIONS_QUERY_KEY,
    queryFn: () => dashboardApi.snapshot(),
    enabled: Boolean(user),
    staleTime: 30_000,
  });
}
