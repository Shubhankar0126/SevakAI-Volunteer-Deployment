import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { askAssistant } from "@/lib/assistant.functions";
import { INCIDENTS, SHORTAGE_FORECAST, VOLUNTEERS, ZONES } from "@/lib/sample-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, User, Bot } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/assistant")({
  component: Assistant,
});

const SAMPLES = [
  "Where are we likely to face a medical shortage next?",
  "Which zone is most overloaded right now?",
  "Recommend top 3 zones to rebalance volunteers from.",
  "Summarize all open critical incidents.",
];

type Msg = { role: "user" | "assistant"; text: string };

function buildSnapshot() {
  return JSON.stringify({
    zones: ZONES.map((z) => ({ name: z.name, density: z.density, active: z.active, capacity: z.capacity })),
    incidents: INCIDENTS.map((i) => ({ id: i.id, type: i.type, zone: i.zone, severity: i.severity, status: i.status })),
    forecast: SHORTAGE_FORECAST,
    volunteers: {
      total: VOLUNTEERS.length,
      available: VOLUNTEERS.filter((v) => v.status === "available").length,
      busy: VOLUNTEERS.filter((v) => v.status === "busy").length,
      avgFatigue: Math.round(VOLUNTEERS.reduce((s, v) => s + v.fatigue, 0) / VOLUNTEERS.length),
    },
  });
}

function Assistant() {
  const ask = useServerFn(askAssistant);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Namaste. I'm your SevakAI ops assistant — ask me anything about live volunteers, zones, or incidents." },
  ]);

  const mutation = useMutation({
    mutationFn: (question: string) => ask({ data: { question, context: buildSnapshot() } }),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", text: res.answer }]),
    onError: (e: Error) => {
      toast.error(e.message || "Assistant failed");
      setMessages((m) => [...m, { role: "assistant", text: "I couldn't reach the AI gateway just now. Please try again." }]);
    },
  });

  const send = (text: string) => {
    const q = text.trim();
    if (!q || mutation.isPending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    mutation.mutate(q);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-4xl flex-col px-6 py-6">
      <header className="mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI Ops Assistant
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Ask SevakAI</h1>
        <p className="text-sm text-muted-foreground">Powered by Gemini AI - grounded in your live operational snapshot..</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}>
              {m.text}
            </div>
            {m.role === "user" && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/20 text-gold-foreground">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {mutation.isPending && (
          <div className="flex gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">Thinking…</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button key={s} onClick={() => send(s)} disabled={mutation.isPending}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about volunteers, incidents, zones, or forecasts…" className="flex-1" />
        <Button type="submit" disabled={mutation.isPending || !input.trim()} className="bg-primary text-primary-foreground">
          Send
        </Button>
      </form>
    </div>
  );
}
