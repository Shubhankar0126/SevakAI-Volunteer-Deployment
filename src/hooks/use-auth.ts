import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "zone_manager" | "volunteer";

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadRole = async (userId: string): Promise<AppRole | null> => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return (data?.role as AppRole) ?? null;
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState((s) => ({ ...s, session, user: session?.user ?? null }));
      if (session?.user) {
        setTimeout(async () => {
          const role = await loadRole(session.user.id);
          if (mounted) setState((s) => ({ ...s, role, loading: false }));
        }, 0);
      } else {
        setState({ user: null, session: null, role: null, loading: false });
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const role = await loadRole(session.user.id);
        if (mounted)
          setState({ session, user: session.user, role, loading: false });
      } else {
        setState({ user: null, session: null, role: null, loading: false });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
