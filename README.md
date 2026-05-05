# Golf Task App 🚀

Personal Project Management + AI Planner

## Features
- ✅ Multi-project management
- ✅ Kanban Board (drag & drop) — Open / To Do / In Progress / Review / Test / Done / Cancel
- ✅ Task List with Search & Filter (by name, status, owner, month)
- ✅ Dashboard with Productivity Score + Export Excel
- ✅ Timeline / Gantt Chart
- ✅ AI Assistant (Chat, Daily Plan, Smart Suggest) — powered by Claude
- ✅ Notifications — deadline alerts
- ✅ Backup / Restore (JSON)
- ✅ PWA — installable on mobile & desktop
- ✅ Dark Mode (Tech Style)
- ✅ Persistent storage (localStorage)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
npm run preview
```

## Cloud Sync (Optional — Supabase)

1. Create project at https://supabase.com (free)
2. Create `.env` file:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
3. Run SQL in Supabase:
```sql
create table projects (id text primary key, data jsonb, user_id text, updated_at timestamptz default now());
create table tasks (id text primary key, data jsonb, project_id text, user_id text, updated_at timestamptz default now());
```
4. Data will sync across all devices in real-time

## PWA Installation

- **iOS**: Safari → Share → Add to Home Screen
- **Android/Chrome**: Menu → Add to Home Screen
- **Desktop**: Click install icon in address bar

## Tech Stack
- React 18 + Vite
- Zustand (state + localStorage persist)
- date-fns (date utilities)
- dnd-kit (drag & drop)
- SheetJS/xlsx (Excel export)
- vite-plugin-pwa (PWA + Service Worker)
- **AI: Claude API (claude-sonnet-4)** — best for task reasoning

## AI Features
- **AI Chat**: Ask in Thai/English — "วันนี้ Golf ควรทำอะไร?"
- **Daily Plan**: Auto-generate time-blocked schedule from your tasks
- **Smart Suggest**: Priority ranking + risk detection + workload analysis
- **Auto-context**: AI always has access to your current tasks
