# NFLMS · National Fisheries & Livestock Management System

React implementation of the Phase-1 platform described in *Digital Fisheries & Livestock Management Platform* (the 20-slide concept deck) for the Ministry of Fisheries and Livestock, Bangladesh. The visual design follows the reference video (`20260921222559.mp4`): a navy split-screen sign-in with a module constellation flowing into a central database, a workspace picker, and a light, card-based application shell.

## Run

```bash
cd nflms-app
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
```

Sign in with any password. Demo accounts are listed under the sign-in form; for example:

| Workspace | Email | Role |
|---|---|---|
| DLS | `vs.sadar@dls.gov.bd` | Veterinary Surgeon, Cumilla Sadar (field) |
| DLS | `ulo.sadar@dls.gov.bd` | Upazila Livestock Officer |
| DLS | `dlo.cumilla@dls.gov.bd` | District Livestock Officer |
| DoF | `ufo.sadar@fisheries.gov.bd` | Upazila Fisheries Officer |
| MoFL | `admin@mofl.gov.bd` | System admin |

All data is seeded deterministically and persisted in the browser (localStorage). Use **Reset demo data** at the bottom of the sidebar to restore the seed.

## Modules (Phase-1, as per the deck)

| # | Module | Routes | Automation |
|---|---|---|---|
| 01 | Farm & Farmer Registration | `/farmers`, `/farms` | NID-linked Digital Farmer ID (`FMR-YYYY-########`), Unique Farm ID (`FAR-<district>-######`), duplicate-NID guard, cascading Division → District → Upazila, GPS capture, farmer 360° profile (farms, visits, medicine, training, disease) |
| 02 | Medicine & Vaccine Management | `/medicine`, `/medicine/receive`, `/transfer`, `/distribute`, `/batches`, `/ledger`, `/trace` | Central → District → Upazila → Farmer chain, batch + expiry + supplier on every consignment, **FEFO** auto-pick with visible pick plan, minimum-stock alerts per level, expiry write-off, full stock ledger, batch chain-of-custody traceability |
| 03 | Field Employee Management | `/field/attendance`, `/leave`, `/tour`, `/employees`, `/monitoring` | GPS + time + selfie check-in/out (office vs field), automatic late detection, leave approval, tours, Division → District → Upazila attendance roll-ups |
| 04 | Farmer Training Management | `/training`, `/training/:id`, `/training/certificates` | Plan → enrol (seat limit, duplicate guard) → attendance & feedback → one-click completion that issues numbered digital certificates with a verification QR code |
| 05 | Field Service & Visit Management | `/visits/new`, `/visits` | The ten-step mobile visit flow from the deck. On submit the system auto-distributes the recorded medicine from the officer's store (FEFO), writes the ledger, and files a disease report when a disease is recorded |
| 06 | Management Dashboard & MIS | `/`, `/mis` | The nine national KPIs from slide 13 with Bangladesh → Division → District → Upazila drill-down, low-stock and expiry alerts, distribution and disease trends, printable/CSV MIS reports |
| 07 | Farmer Marketplace | `/marketplace` (admin), `/market` (public, no login) | Registered farmers verify with Farmer ID + mobile to list produce; upazila officers approve/reject; citizens browse by category/district, add to cart, checkout (COD / bKash / Nagad, demo) and track orders; farmers confirm → ship → deliver; price board with district averages |
| P2 | Disease Surveillance (preview) | `/disease` | Hotspot detection (14-day vs prior 14-day rise), weekly species trends, medicine-use by disease |

Language toggle (বাংলা / EN) is in the top bar.

## AI Assistant

A floating **AI Assistant** button appears on every page of both portals (bottom-right). It answers questions about farmers, farms, medicine stock, attendance, disease trends, trainings, market prices and order status, and can open the right page for you.

- **Offline mode (default)** — no key needed. Rule-based answers computed from the app's own data (IDs, stock, prices, orders, disease, attendance).
- **Claude mode** — full conversational answers from `claude-opus-5` with tool use over live app data (streaming, prompt-cached system prompt). Enable it in the assistant's ⚙ settings by either:
  - **Proxy URL** (recommended): run `ANTHROPIC_API_KEY=sk-ant-… npm run ai-proxy` (serves `http://localhost:8787`; see `server/ai-proxy.mjs`) and enter that URL — the key never reaches the browser. `VITE_AI_PROXY_URL` in `.env` sets it at build time.
  - **API key** (demo only): paste a key; it is stored only in that browser's localStorage and sent directly to the Claude API.

Public-portal users never receive officer-only data (stock levels, attendance, full mobile numbers) — the tool layer enforces this regardless of the prompt. Code: `src/ai/assistant.ts` (tools, system prompt, streaming tool loop, offline fallback) and `src/components/AiAssistant.tsx` (widget).

## Stack

Vite · React 19 · TypeScript · Tailwind CSS · React Router 7 · Zustand (persisted) · Recharts · lucide-react · qrcode.react · @anthropic-ai/sdk

```
src/
  pages/        Login, Dashboard, Farmers, Farms, Medicine, FieldForce, Visits, Disease, Training, Mis, Marketplace
  pages/market/ Public portal (storefront, product, cart, checkout, order tracking) and farmer Sell area
  store/        store.ts — all entities + workflow actions (FEFO, check-in, visit submission, certificates)
  data/         geo.ts (divisions/districts/upazilas), seed.ts (deterministic demo data)
  components/   ui kit, AppShell (sidebar + top bar), LocationPicker
  i18n/         Bangla/English dictionary
```
