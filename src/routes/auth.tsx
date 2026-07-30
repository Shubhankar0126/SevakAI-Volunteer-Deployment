import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SevakLogo } from "@/components/sevak-logo";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api/services/sevakai";
import { getApiErrorMessage } from "@/lib/api/client";
import { AUTH_QUERY_KEY, useAuth } from "@/hooks/use-auth";
import { OPERATIONS_QUERY_KEY } from "@/hooks/use-operations";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · SevakAI Command Center" },
      {
        name: "description",
        content: "Access the SevakAI volunteer command center for Mahakumbh 2028.",
      },
    ],
  }),
  component: AuthPage,
});

type Role = "admin" | "zone_manager" | "volunteer";

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("volunteer");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const onAuthSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: OPERATIONS_QUERY_KEY });
    navigate({ to: "/dashboard" });
  };

  const signupMutation = useMutation({
    mutationFn: () =>
      authApi.register({
        fullName,
        phone,
        role,
        email: signupEmail,
        password: signupPassword,
      }),
    onSuccess: async () => {
      toast.success("Account created. Welcome to SevakAI.");
      await onAuthSuccess();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const loginMutation = useMutation({
    mutationFn: () =>
      authApi.login({
        email: loginEmail,
        password: loginPassword,
      }),
    onSuccess: async () => {
      toast.success("Signed in.");
      await onAuthSuccess();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const loading = signupMutation.isPending || loginMutation.isPending;

  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate, user]);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-hero p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(0.78 0.14 85 / 0.45), transparent 40%), radial-gradient(circle at 70% 80%, oklch(0.62 0.14 160 / 0.55), transparent 45%)",
          }}
        />
        <div className="relative">
          <Link to="/" className="inline-block">
            <SevakLogo />
          </Link>
        </div>
        <div className="relative max-w-md">
          <ShieldCheck className="h-10 w-10 text-gold" />
          <h2 className="mt-6 font-display text-4xl font-bold leading-tight text-balance">
            Seva, orchestrated by intelligence.
          </h2>
          <p className="mt-4 text-primary-foreground/75">
            Join the command center coordinating medical aid, security, lost-and-found, and crowd
            safety across Mahakumbh 2028.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
            {[
              { l: "Volunteers", v: "100K+" },
              { l: "Zones", v: "48" },
              { l: "Uptime", v: "99.9%" },
            ].map((stat) => (
              <div
                key={stat.l}
                className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 p-3"
              >
                <div className="font-display text-2xl font-bold text-gold">{stat.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-primary-foreground/60">
                  {stat.l}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-primary-foreground/55">
          © 2028 SevakAI · Built for the world's largest gathering
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/">
              <SevakLogo />
            </Link>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in or create your SevakAI account.
          </p>

          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary-glow"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <RoleSelect value={role} onChange={setRole} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={8}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-gold text-gold-foreground hover:opacity-95 shadow-gold"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By creating an account you agree to serve with integrity and care.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function RoleSelect({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  const options: { value: Role; label: string }[] = [
    { value: "volunteer", label: "Volunteer" },
    { value: "zone_manager", label: "Zone Manager" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <div className="grid grid-cols-3 gap-1 rounded-md border border-input bg-background p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded px-2 py-1.5 text-xs font-medium transition ${
            value === option.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
