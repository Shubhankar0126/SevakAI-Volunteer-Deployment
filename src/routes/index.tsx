import { createFileRoute, Link } from "@tanstack/react-router";
import { SevakLogo } from "@/components/sevak-logo";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Brain,
  HeartPulse,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SevakAI — Smart Volunteer Deployment for Mahakumbh 2028" },
      {
        name: "description",
        content:
          "AI-powered command center for recruiting, deploying and optimizing volunteers across Mahakumbh 2028. Real-time matching, fatigue prediction, and shortage forecasts.",
      },
      { property: "og:title", content: "SevakAI — Mahakumbh 2028 Command Center" },
      {
        property: "og:description",
        content:
          "Intelligently allocate thousands of volunteers across medical, security, lost-and-found, and crowd management zones.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <Stats />
      <Features />
      <CommandCenterPreview />
      <CTA />
      <Footer />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <SevakLogo />
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition">Capabilities</a>
          <a href="#command" className="text-muted-foreground hover:text-foreground transition">Command Center</a>
          <a href="#cta" className="text-muted-foreground hover:text-foreground transition">Deploy</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary-glow">
            <Link to="/auth">Join the mission</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-[0.97]" aria-hidden />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, oklch(0.78 0.14 85 / 0.45), transparent 40%), radial-gradient(circle at 80% 60%, oklch(0.62 0.14 160 / 0.5), transparent 45%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-32 lg:pt-28">
        <div className="text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            AI Command Center · Built for national-scale events and designed for scalable deployment.
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance md:text-7xl">
            Deploy <span className="bg-gradient-gold bg-clip-text text-transparent">100,000 volunteers</span> like one intelligent organism.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/75">
            SevakAI orchestrates skill-matched assignment, real-time emergency response, fatigue
            prediction, and shortage forecasting across every ghat, camp, and zone of Mahakumbh 2028.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-95 shadow-gold">
              <Link to="/auth">Launch Command Center</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10">
              <a href="#features">See capabilities</a>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-primary-foreground/70">
            <Pill>Medical · Security · Lost & Found</Pill>
            <Pill>Skill + ETA + Workload matching</Pill>
            <Pill>Predictive shortage detection</Pill>
          </div>
        </div>
        <HeroPanel />
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3 py-1 text-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {children}
    </span>
  );
}

function HeroPanel() {
  const incidents = [
    { tag: "MEDICAL", zone: "Ghat 5", score: 96, eta: "2 min", icon: HeartPulse, tone: "text-gold" },
    { tag: "CROWD SURGE", zone: "Sector 12", score: 91, eta: "4 min", icon: Users, tone: "text-warning" },
    { tag: "LOST CHILD", zone: "Camp A-7", score: 88, eta: "3 min", icon: ShieldCheck, tone: "text-primary-glow" },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-3xl bg-gold/10 blur-3xl" aria-hidden />
      <div className="relative rounded-2xl border border-primary-foreground/15 bg-sidebar/80 p-5 shadow-elegant backdrop-blur">
        <div className="flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live · Zone 04
          </div>
          <div className="text-xs text-primary-foreground/60">12:48:21 IST</div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-primary-foreground">
          <Stat label="Active" value="8,412" tone="text-success" />
          <Stat label="Available" value="2,196" tone="text-gold" />
          <Stat label="Incidents" value="37" tone="text-warning" />
        </div>

        <div className="mt-5 space-y-2">
          <div className="text-xs uppercase tracking-wider text-primary-foreground/50">AI Recommendations</div>
          {incidents.map((i) => (
            <div key={i.tag} className="flex items-center justify-between rounded-lg border border-primary-foreground/10 bg-primary-foreground/[0.04] px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-primary-foreground/10">
                  <i.icon className={`h-4 w-4 ${i.tone}`} />
                </div>
                <div className="text-primary-foreground">
                  <div className="text-xs font-semibold tracking-wider">{i.tag}</div>
                  <div className="text-[11px] text-primary-foreground/60">{i.zone} · ETA {i.eta}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-bold text-gold">{i.score}</div>
                <div className="text-[10px] uppercase tracking-wider text-primary-foreground/50">match</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/[0.04] p-3">
      <div className={`font-display text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-primary-foreground/55">{label}</div>
    </div>
  );
}

function Stats() {
  const items = [
    { value: "100K+", label: "Volunteers orchestrated" },
    { value: "<2 min", label: "Median emergency match" },
    { value: "98.4%", label: "Skill-fit accuracy" },
    { value: "24 / 7", label: "Predictive monitoring" },
  ];
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.label}>
            <div className="font-display text-3xl font-bold text-primary md:text-4xl">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Brain,
      title: "Smart Assignment Engine",
      copy: "Matches volunteers to incidents by skill, distance, workload, and historical performance — with a transparent score on every recommendation.",
    },
    {
      icon: Zap,
      title: "Emergency Response System",
      copy: "Medical, lost-child, crowd surge, fire — detect nearest qualified responders, compute ETA, auto-dispatch in seconds.",
    },
    {
      icon: MapIcon,
      title: "Live Command Map",
      copy: "Volunteers, incidents, medical camps, police booths, and crowd density heatmaps on one interactive Leaflet canvas.",
    },
    {
      icon: Activity,
      title: "Fatigue Prediction",
      copy: "Hours worked, consecutive assignments, walking distance, incident load — prevent burnout before it happens.",
    },
    {
      icon: Users,
      title: "AI Shift Scheduler",
      copy: "Balanced rosters built automatically from skills, availability, workload, and zone demand.",
    },
    {
      icon: Sparkles,
      title: "Ops Assistant",
      copy: "Ask in plain language: 'Show medical volunteers near Ghat 5.' Get instant, contextual answers.",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="max-w-2xl">
        <div className="text-sm font-medium uppercase tracking-wider text-primary">Capabilities</div>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl text-balance">
          More than management. An <span className="text-primary">intelligent nervous system</span>.
        </h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 transition hover:border-primary/40 hover:shadow-elegant"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition group-hover:bg-primary/15" />
            <div className="relative">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommandCenterPreview() {
  return (
    <section id="command" className="bg-sidebar text-sidebar-foreground">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="text-sm font-medium uppercase tracking-wider text-gold">Command Center</div>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              One screen. Every ghat. Every volunteer.
            </h2>
            <p className="mt-4 text-sidebar-foreground/70">
              Built for admins, zone managers, and field captains. Switch between roles, drill into
              incidents, and re-balance staffing with a single click.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-sidebar-foreground/80">
              {[
                "Role-based dashboards: Admin · Zone Manager · Volunteer",
                "Performance scores 0–100 with feedback loops",
                "SOS support for backup, medical, and security",
                "Predictive shortage warnings 60 minutes ahead",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-sidebar-border bg-sidebar/40 p-2 shadow-elegant">
            <div className="rounded-xl border border-sidebar-border bg-background p-5 text-foreground">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="font-display text-base font-semibold">Zone 07 · Sangam West</div>
                <div className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">Healthy</div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                {[
                  { l: "Active", v: 312, t: "text-success" },
                  { l: "Busy", v: 84, t: "text-warning" },
                  { l: "Available", v: 197, t: "text-primary" },
                  { l: "Off", v: 41, t: "text-muted-foreground" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg bg-muted/60 p-3">
                    <div className={`font-display text-2xl font-bold ${s.t}`}>{s.v}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => {
                  const intensity = (Math.sin(i * 1.3) + 1) / 2;
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-sm"
                      style={{ background: `oklch(${0.95 - intensity * 0.55} ${0.04 + intensity * 0.1} 160)` }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Low density</span>
                <span>Crowd heat — last 30 min</span>
                <span>Critical</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="mx-auto max-w-7xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-primary-foreground md:p-16">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl text-balance">
            Step into the command center.
          </h2>
          <p className="mt-4 text-primary-foreground/75">
            Create an account, choose your role, and start orchestrating the world's largest
            gathering with the precision it deserves.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-95 shadow-gold">
              <Link to="/auth">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/auth">I already have one</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-8 md:flex-row md:items-center">
        <SevakLogo />
        <div className="text-xs text-muted-foreground">
          SevakAI · Built for Mahakumbh 2028 · Seva powered by intelligence.
        </div>
      </div>
    </footer>
  );
}
