# Claude Handoff — rec-pedigree

Paste this entire file at the start of a new Claude chat session.

---

## Project in one line
Private equestrian registry + admin toolset for a roleplay horse game called **The Rift**. Live at **https://redfieldec.site**. GitHub: **clairecabglass/rec-pedigree** (branch: `main`).

## Working directory
```
/Users/claire/Claude/The Rift/rec-pedigree
```

## Stack
- **Next.js App Router** (latest — has breaking API changes, always read `node_modules/next/dist/docs/` before writing Next.js code)
- **Prisma + PostgreSQL** (Neon serverless) — migrations via `prisma migrate deploy` on Vercel
- **Tailwind CSS** + CSS custom properties for all theme colors
- **Lucide React** icons
- **Vercel** deployment — deploy with `npx vercel --prod` from the project root

## How to deploy
```bash
npx tsc --noEmit          # type check first
git add <files>
git commit -m "message"
git push origin main
npx vercel --prod
```

## How to add a schema field
1. Edit `prisma/schema.prisma`
2. `npx prisma db push` (applies to live Neon DB)
3. Manually create `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql` using `IF NOT EXISTS`
4. `npx prisma migrate resolve --applied <name>` (marks it applied so Vercel deploy doesn't re-run it)
5. Commit everything

---

## Design rules (always follow these)

- **Colors:** never hardcode hex — use CSS vars: `--teal`, `--teal-dark`, `--teal-light`, `--teal-muted`, `--cream`, `--cream-dark`, `--border`, `--white`, `--text`, `--text-muted`, `--gold`, `--sire-bg/text/border`, `--dam-bg/text/border`, `--inbreed-text/border`
- **Fonts:** `var(--font-playfair)` headings, `var(--font-lato)` body/UI
- **Cards:** white bg, `rounded-xl`/`rounded-2xl`, thin border
- **No layout jump rule:** any toolbar that appears/disappears must live in a permanent `min-h-[56px]` container
- **Coat strings:** always use `parseHorseCoat(str)` from `@/lib/horseCoat` — returns `{ cleanName, genotype }`. Never display raw strings like `"Black Tovero (BL_TOV)"` in labels
- **No AI-sounding copy** anywhere on the site

---

## Key files to know

| File | What it does |
|---|---|
| `prisma/schema.prisma` | Full DB schema |
| `lib/pedigree.ts` | Recursive pedigree tree builder, inbreeding detection, Wright's F coefficient |
| `lib/horseCoat.ts` | `parseHorseCoat()` — splits "Black Tovero (BL_TOV)" into cleanName + genotype |
| `lib/genetics.ts` | Foal coat genetics predictor |
| `lib/auth.ts` | `isAdminLoggedIn()` — simple cookie auth |
| `components/PedigreeTree.tsx` | Interactive pedigree tree viewer (zoom, pan, fullscreen, PNG export) |
| `components/HorseForm.tsx` | Shared horse create/edit form |
| `app/admin/my-stable/MyStableClient.tsx` | My Stable dashboard — most complex client component |
| `app/admin/breeding/suggested-pairings/SuggestedPairingsClient.tsx` | Pairing engine |
| `app/resources/show-scoreboard/ShowScoreboardClient.tsx` | Live show scoreboard |

---

## Routes

### Public
- `/` — homepage
- `/registry` — searchable horse list
- `/registry/[id]` — horse profile (photos, pedigree, results)
- `/for-sale` — sale listings
- `/breeding` — breeding policies (admin-editable inline); `/breeding/studs` + `/breeding/broodmares` — public rosters of horses flagged `availableForBreeding`
- `/resources` — tools hub
- `/resources/course-planner` — drag-drop jump course builder
- `/resources/foal-calculator` — coat genetics calculator
- `/resources/show-scoreboard` — live event scoreboard

### Admin (behind `isAdminLoggedIn()`)
- `/admin` — dashboard
- `/admin/horses` — registry CRUD
- `/admin/horses/new` — add horse
- `/admin/horses/[id]` — edit horse
- `/admin/horses/[id]/certificate` — PNG certificate export
- `/admin/my-stable` — owned horses dashboard
- `/admin/breeding` — breeding pedigree planner
- `/admin/breeding/suggested-pairings` — AI pairing suggestions
- `/admin/diary` — private notes + preferred services ledger
- `/admin/import` — bulk import
- `/admin/pedigree-import` — import pedigree placeholders

---

## Database models (short version)

**Horse** — core model. Important fields:
- `ownership` — `"Home"` = actively owned (this is the filter for My Stable, NOT name prefixes)
- `assignedCharacter` — `"Athena Redfield"` or `"Lucille"` (the two player character personas)
- `lifeStage` — `null` = Adult, or `"Gestation"` | `"Weanling"` | `"Yearling"` | `"Youngster"`
- `sireName` / `damName` — plain text, used to build pedigree trees recursively
- `coat` — packed string like `"Black Tovero (BL_TOV)"` — always parse with `parseHorseCoat()`
- `genotype` — genetics code string
- `breedingFee` — free-text "price per cover"; `breedingPolicies` — free text
- `availableForBreeding` — boolean; when true the horse is listed on the public `/breeding/studs` (stallions) or `/breeding/broodmares` (mares) page
- NOTE: there is NO mare cool-down — the old `lastBredDateTime` field/logic was removed

**Photo** — `fill` boolean: true = `object-fit: cover` (fill block), false = `contain` (whole image)

**Other models:** Document, Result, BreedingPlan, Pregnancy, DiaryNote, PreferredService, SiteContent (unused)
- `DiaryNote` is a generic key/value store. Keys in use: `"general"` (admin diary), `"admin_todos"` (JSON array — admin dashboard to-do list), `"breeding_policies"` (public breeding policies text)

---

## Domain knowledge

- **Horse name prefixes** like `[REC]`, `[TES]`, `[DSH]`, `[F.E]`, `[MLY]`, `[WRR]`, `[EMR]`, `[YRC]`, `[GH]` indicate stables/factions in the game. Display as-is, never strip them.
- **Gestation is 72 real-world hours** (game server rule)
- **There is NO mare breeding cool-down** (a previous spec claimed a 7-day rule; it was removed entirely)
- **Two character personas:** "Athena Redfield" (primary) and "Lucille" — horses default to Athena
- **Foal pedigree depth** uses `Math.min(sire, dam)` not max — so a lopsided pedigree doesn't inflate the number

---

## What was done in this session (so you don't redo it)

1. **My Stable** (`/admin/my-stable`) — complete overhaul:
   - List/Gallery view toggle (LayoutList / LayoutGrid icons)
   - Compound filter bar: text search, breed dropdown, gender dropdown, foal/maturity stage dropdown, coat smart combobox (matches clean name AND genotype code, X clear button, filtered popover)
   - `lifeStage` field added to Horse schema
   - Mare breeding cool-down amber badge (⏱ "Cool-down: Xd Xh remaining"), ticks live, disappears when window lapses
   - `lastBredDateTime` field added to Horse schema
   - Back button uses `router.back()` (context-aware, not hardcoded link)
   - Bulk move to character — operates only on filtered visible rows
   - Select-all respects current filter
   - Performance: search input debounced 120ms, `React.memo` on ListView/GalleryView, `CooldownBadge` isolated interval, fixed-height badge zone prevents CLS

2. **Preferred Services** (`/admin/diary`):
   - Price field changed from integer cents to free text string (`"Free"`, `"250k"`, `"Negotiable"`)
   - Link field added (URL to provider profile/shop/thread)
   - Filter bar added: text search (name + notes) + service type dropdown, compound AND logic, "No matching services" empty state

3. **Show Scoreboard** (`/resources/show-scoreboard`):
   - Mobile layout: judge panel collapses behind toggle button on small screens (CSS grid-template-rows animation)
   - Responsive font sizes with `clamp()`
   - Leaderboard: full 7-col grid on desktop, compact 2-line card on mobile
   - All touch targets `min-height: 44px`
   - Queue: "done" now derived from scores array (not position index) — any un-scored rider is tappable
   - ↩ Redo button on scored riders — removes their score, returns them to active with fresh timer
   - Performance: `forceTick` 100ms interval isolated to `LiveTimerDisplay` component so the rest of the tree doesn't re-render while timer runs

4. **Pedigree tree fix** (`lib/pedigree.ts` + `components/PedigreeTree.tsx`):
   - Inbred ancestors (repeated in tree) now show their FULL pedigree on every occurrence
   - Previously they returned as childless leaf nodes

5. **Suggested pairings depth fix** (`/admin/breeding/suggested-pairings`):
   - `pedigreeDepth` now uses `1 + Math.min(stallionDepth, mareDepth)` — honest balanced depth
   - When sides differ, reason string shows: `"4 gen balanced (♂ 6 · ♀ 3)"`
   - Filter uses balanced depth so lopsided pairings can't cheat the minimum

6. **Resources page** — removed AI-sounding subtitle paragraph

7. **Pedigree display — full redesign** (`components/PedigreeTree.tsx`):
   - Replaced branching connector-line tree with **horizontal CSS grid layout** (subject left, ancestors expanding right)
   - **Colors by gender**: Stallion → blue (`--sire-*`), Mare → pink (`--dam-*`), root → cream/gold, inbred → red, unknown → muted cream
   - **Default 4 generations**; toggle 3–10; fullscreen button
   - **Rows use `1fr`** so grid always fills the canvas block exactly (no bottom gap at gen 3–4)
   - `naturalH = max(canvasH, totalRows × 28px)` — deeper gens grow with minimum row height, fit zoom shrinks them
   - **Zoom/pan**: `transform: scale()` with explicit scroll-area sizing div (NOT CSS `zoom` — that breaks scrollWidth at small scales)
   - Auto-fit zoom capped at 1.0 (never zooms in beyond 100%)
   - Canvas height measured via `ResizeObserver` — auto-refits on fullscreen enter/exit
   - `className="ped-export"` on bare mode div; `CertificateClient` targets `.ped-export` (not the old `.ped-root`)
   - Inbred ancestor hover highlight uses `[data-dupe].dupe-active` CSS rule (added to `globals.css`)

8. **`/pedigree-demo`** — static demo page (can be deleted once grid design is confirmed)

---

## What was done in the LATEST session (most recent first)

- **Pedigree grid polish:** colors now by **pedigree POSITION** not gender (upper of each pair = sire = blue, lower = dam = pink); subject/root = sage green-grey (`#E4E7E1`); per-cell text gating so names don't clip; row height scales down with depth (28px ≤gen4, 20px gen5–6, 15px gen7+); fixed fullscreen jitter + `min-width:0` for ellipsis. Certificate fixed at **4 generations**.
- **Photo system:**
  - Hero is a **carousel** (`components/HorseHero.tsx`) — arrows + counter + click-to-lightbox; per-photo **fill/fit toggle** (admin, saved to `Photo.fill`).
  - **Image optimization:** registry cards, gallery thumbnails, hero use **`next/image`**; R2 host whitelisted in `next.config.ts` `images.remotePatterns` (fixes pixelation = browser downscaling, not source/hosting).
  - **Upload compression** in `PhotoManager` — downscale ≤2000px + JPEG re-encode before upload (Vercel ~4.5 MB body cap → 413 otherwise).
- **Global fix:** `<main>` animates **opacity only** (no transform) so `position:fixed` modals/lightboxes center on the viewport, not the page middle.
- **Exports:** course planner + scoreboard PNGs carry a logo + "Redfield Equestrian Centre · made on redfieldec.site" credit.
- **My Stable:** removed cool-down entirely; added **Nursery View** toggle (pregnant mares + young stock); live **72h gestation countdown** badge → gold **Complete Birth** modal (confirm foal name/coat/genotype, Gestation→Weanling, `PUT` foal + `PATCH markBorn`).
- **Breeding mass-flow:** Suggested Pairings has **☆ Save pair** → wishlist; Breeding page has **⚡ Mass Breed (N)** → `POST /api/pregnancies/batch` (foal + 72h pregnancy per saved pair).
- **HorseForm:** breed is a typeable **datalist** (any new breed allowed); **Price per Cover** + **Available for breeding** toggle.
- **Admin dashboard:** **Pregnant** stat card; persistent **To-Do list** (`/api/admin/todos`); **Backup My Stable** JSON/CSV (`/api/admin/export`).
- **Public Breeding section** (new nav dropdown): `/breeding` (admin-editable policies), `/breeding/studs`, `/breeding/broodmares` — only horses with `availableForBreeding` show.
- **Build fix:** `lib/pedigree-parser` lazy-inits the OpenAI client (was throwing at build when `OPENAI_API_KEY` absent, e.g. Vercel preview).
- New schema fields this session: `Photo.fill`, `Horse.availableForBreeding` (both migrated + resolved). `lifeStage` added to `sanitizeHorseInput`.

---

## Things NOT to change without asking
- Auth system — intentionally simple single-password
- `ownership === "Home"` filter logic — source of truth for My Stable, not name prefixes
- 72-hour gestation rule
- The two character names "Athena Redfield" and "Lucille"
- Pedigree coloring is by POSITION (top=sire/blue, bottom=dam/pink), not the gender field

## Gotchas (have bitten us)
- **`position:fixed` + ancestor `transform`:** any lingering transform on an ancestor makes it the containing block → modals pin to the page, not the viewport. Keep `<main>` transform-free.
- **Vercel ~4.5 MB request body cap:** anything uploaded through an API route must be shrunk client-side first.
- **Images** live on R2 served via `R2_PUBLIC_URL`; if they go blank site-wide, check the bucket's public access/env first — not a code bug.
- **Build needs no secrets:** never construct API clients (OpenAI etc.) at module top level — lazy-init inside handlers.

---

## Full project context
See `PROJECT_BRIEF.md` in the repo root for the complete reference document (use when prompting other AIs like Gemini).
