import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SevakLogo } from "@/components/sevak-logo";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, ROLE_NAV, type NavKey } from "@/lib/role-access";
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Command Center · SevakAI" }] }),
  component: DashboardShell,
});

type NavItem = {
  key: NavKey;
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
};

const ALL_NAV: NavItem[] = [
  { key: "overview", to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { key: "map", to: "/dashboard/map", label: "Command Map", icon: MapIcon },
  { key: "assign", to: "/dashboard/assign", label: "Smart Assign", icon: Brain },
  { key: "emergency", to: "/dashboard/emergency", label: "Emergency", icon: AlertTriangle },
  { key: "roster", to: "/dashboard/roster", label: "Roster", icon: Users },
  { key: "analytics", to: "/dashboard/analytics", label: "Analytics", icon: Activity },
  { key: "my-tasks", to: "/dashboard/my-tasks", label: "My Tasks", icon: ClipboardList },
  { key: "my-shift", to: "/dashboard/my-shift", label: "My Shift", icon: CalendarClock },
  { key: "sos", to: "/dashboard/sos", label: "Emergency SOS", icon: ShieldAlert },
  { key: "assistant", to: "/dashboard/assistant", label: "AI Assistant", icon: Sparkles },
];

function DashboardShell() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Loading command center…</div>
      </div>
    );
  }

  const allowedKeys = role ? ROLE_NAV[role] : [];
  const nav = ALL_NAV.filter((n) => allowedKeys.includes(n.key));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 py-5">
          <Link to="/"><SevakLogo /></Link>
        </div>
        {role && (
          <div className="mx-3 mb-3 rounded-lg border border-sidebar-foreground/10 bg-sidebar-foreground/5 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Role</div>
            <div className="text-sm font-semibold text-sidebar-foreground">{ROLE_LABEL[role]}</div>
          </div>
        )}
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => {
            const active = n.end ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to as "/dashboard"}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary/20 text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60">
          <div className="truncate font-medium text-sidebar-foreground">{user.email}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-xs uppercase tracking-wider text-muted-foreground md:inline">SevakAI / </span>
            <span className="font-medium">{titleFor(pathname, nav)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-medium text-success sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> All systems operational
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function titleFor(p: string, nav: NavItem[]) {
  const m = nav.find((n) => (n.end ? p === n.to : p.startsWith(n.to)));
  return m?.label ?? "Dashboard";
}
