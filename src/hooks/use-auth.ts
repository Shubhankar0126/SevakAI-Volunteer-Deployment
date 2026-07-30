import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/services/sevakai";
import type { AppRole, AuthPayload } from "@/lib/operations";

export type { AppRole };

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export interface AuthState {
  user: AuthPayload["user"] | null;
  role: AppRole | null;
  profile: AuthPayload["profile"] | null;
  volunteer: AuthPayload["volunteer"] | null;
  zoneManager: AuthPayload["zoneManager"] | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const query = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 60_000,
  });

  return {
    user: query.data?.user ?? null,
    role: query.data?.role ?? null,
    profile: query.data?.profile ?? null,
    volunteer: query.data?.volunteer ?? null,
    zoneManager: query.data?.zoneManager ?? null,
    loading: query.isLoading,
  };
}
