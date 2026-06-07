import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PhoneCall, Radio, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/sos")({
  component: SosPage,
});

function SosPage() {
  const { role } = useAuth();
  const [sent, setSent] = useState(false);

  if (role && role !== "volunteer") return <Navigate to="/dashboard" />;

  const trigger = (kind: string) => {
    setSent(true);
    toast.success(`${kind} alert sent to Command Center`);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Emergency SOS</h1>
            <p className="text-sm text-muted-foreground">One tap broadcasts your location to the nearest zone manager.</p>
          </div>
        </div>
        <Button
          onClick={() => trigger("Critical SOS")}
          className="mt-6 h-20 w-full bg-destructive text-destructive-foreground text-lg font-semibold hover:opacity-95"
        >
          <AlertTriangle className="mr-2 h-6 w-6" /> Send Critical SOS
        </Button>
        {sent && (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            Signal received. Stay where you are — help is being dispatched.
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <button onClick={() => trigger("Medical")} className="rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40">
          <PhoneCall className="h-5 w-5 text-primary" />
          <h3 className="mt-2 font-semibold">Request medical backup</h3>
          <p className="text-xs text-muted-foreground">Nearest medic + supervisor pinged.</p>
        </button>
        <button onClick={() => trigger("Crowd")} className="rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40">
          <Radio className="h-5 w-5 text-primary" />
          <h3 className="mt-2 font-semibold">Report crowd surge</h3>
          <p className="text-xs text-muted-foreground">Triggers zone density review.</p>
        </button>
      </div>
    </div>
  );
}
