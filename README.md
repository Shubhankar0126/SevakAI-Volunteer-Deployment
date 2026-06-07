# SevakAI - Smart Volunteer Deployment for Mahakumbh 2028

> AI-powered command center for orchestrating 100,000+ volunteers across medical,
> security, lost-and-found, crowd management, fire response, and visitor assistance.

SevakAI is a startup-grade, role-based platform that turns a sea of volunteers
into a coordinated, intelligent nervous system for national-scale events.

## ✨ Features

- **Beautiful landing page** - Emerald Authority design system, hero with live
  AI recommendation panel, capability grid, command-center preview.
- **Authentication & Roles** - Email/password sign-in. Three roles: `admin`,
  `zone_manager`, `volunteer`. Roles assigned at signup, stored in a
  privilege-safe `user_roles` table with a `has_role()` security definer.
- **Live Command Map** - SVG-rendered zones, volunteers, incidents, and crowd
  density heatmap with an interactive inspector.
- **Smart Assignment Engine** - Ranks volunteers per incident by
  `skill (45%) + distance (25%) + workload (15%) + performance (15%)`,
  with one-click auto-dispatch.
- **Emergency Response** - Triage queue, SOS trigger, status transitions
  (`open → dispatched → resolved`), and live top-3 AI-matched responders.
- **Volunteer Roster** - Searchable / filterable directory with skills,
  languages, performance, and fatigue scores.
- **Analytics** - 24h incident & volunteer load, zone-load bar chart,
  response-time vs satisfaction line chart, fatigue distribution.
- **AI Ops Assistant** - Conversational natural-language interface powered by Google Gemini 2.5 Flash for volunteer deployment, workforce optimization, incident response, and operational recommendations.

- **Shortage Forecasting** - Predictive zone-by-zone staffing alerts.

## 🏗 Architecture

```
┌───────────────────────────────────────────────────────┐
│  React 19 + TanStack Start (Vite 7)                   │
│  ├─ src/routes/index.tsx          → Landing Page      │
│  ├─ src/routes/auth.tsx           → Authentication    │
│  └─ src/routes/dashboard.*.tsx    → Command Center    │
│       ├─ /dashboard               → Overview & KPIs   │
│       ├─ /dashboard/map           → Live Zone Map     │
│       ├─ /dashboard/assign        → Smart Assignment  │
│       ├─ /dashboard/emergency     → SOS & Triage      │
│       ├─ /dashboard/roster        → Volunteer Roster  │
│       ├─ /dashboard/analytics     → Analytics         │
│       └─ /dashboard/assistant     → AI Assistant      │
├───────────────────────────────────────────────────────┤
│  TanStack Server Functions                            │
│  └─ src/lib/assistant.functions.ts                    │
│      → Gemini AI Recommendation Engine                │
├───────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Authentication)               │
│  ├─ auth.users          → User Authentication         │
│  ├─ public.profiles     → Volunteer Profiles          │
│  ├─ public.user_roles   → Role Management             │
│  └─ handle_new_user()   → Auto Profile Creation       │
└───────────────────────────────────────────────────────┘
```

## 🗄 Database Schema

```sql
CREATE TYPE app_role AS ENUM ('admin', 'zone_manager', 'volunteer');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT, zone TEXT,
  languages TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Security-definer to prevent recursive RLS
CREATE FUNCTION has_role(_user_id uuid, _role app_role) RETURNS boolean ...;
```

## 🔐 Auth Flow

1. User visits `/auth`, signs up with email + password + chosen role.
2. `handle_new_user()` trigger fires → creates `profiles` row + assigns
   `user_roles.role` from `raw_user_meta_data`.
3. `useAuth()` hook subscribes to `onAuthStateChange`, loads role,
   exposes `{ user, session, role, loading }` to all dashboard routes.
4. Dashboard layout redirects to `/auth` if no session.

## 🧠 AI Logic

**Smart Assignment** (`src/lib/sample-data.ts → rankVolunteersForIncident`):

```ts
score = (skillFit * 0.45) + (proximity * 0.25)
      + (availableCapacity * 0.15) + (historicalPerf * 0.15)
```

**AI Ops Assistant** (`src/lib/assistant.functions.ts`):
- TanStack server function with Zod-validated input.
- Uses Google Gemini API via `@google/generative-ai`.
- System prompt grounds the model in operational context and volunteer deployment workflows.

## 🚀 Deploy

This project is powered by **React, TanStack Start, Supabase, and Gemini AI**, and can be deployed on Vercel.

```bash
  npm install
  npm run dev     # local development
  npm run build   # production build
    
```

Deployment

1. Push the code to GitHub.
2. Import the repository into Vercel.
3. Configure environment variables.
4. Deploy the application.

## 🎤 Hackathon Pitch

> **The problem:** Mahakumbh 2028 expects 400M visitors. Volunteer coordination
> today is WhatsApp groups, paper rosters, and walkie-talkies — fatal at scale.
>
> **SevakAI:** an AI command center that matches every incident to the best
> available volunteer in <2 minutes, predicts staffing shortages 60 minutes
> ahead, and gives commanders a natural-language interface to operate the
> entire deployment. Built for national-scale events and designed for scalable deployment..

## 📁 Project Structure

```
src/
├── components/         shadcn/ui + SevakLogo
├── hooks/use-auth.ts   session + role hook
├── integrations/supabase/ auto-generated client
├── lib/
│   ├── sample-data.ts          zones, volunteers, incidents, AI scoring 
│   └── assistant.functions.ts  Gemini AI server function
├── routes/             TanStack file-based routes
└── styles.css          Emerald Authority design tokens
supabase/migrations/    SQL: enum, tables, RLS, trigger
```

Built for the Mahakumbh Innovation Hackathon 2028.
