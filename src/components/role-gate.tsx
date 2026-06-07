import { Navigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/use-auth";

export function RoleGate({ allow, children }: { allow: AppRole[]; children: React.ReactNode }) {
  const { role, loading } = useAuth();
  if (loading) return null;
  if (!role || !allow.includes(role)) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}
