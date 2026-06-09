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
- `lastBredDateTime` — mare breeding cool-down start timestamp (7-day window)
- `sireName` / `damName` — plain text, used to build pedigree trees recursively
- `coat` — packed string like `"Black Tovero (BL_TOV)"` — always parse with `parseHorseCoat()`
- `genotype` — genetics code string

**Other models:** Photo, Document, Result, BreedingPlan, Pregnancy, DiaryNote, PreferredService, SiteContent

---

## Domain knowledge

- **Horse name prefixes** like `[REC]`, `[TES]`, `[DSH]`, `[F.E]`, `[MLY]`, `[WRR]`, `[EMR]`, `[YRC]`, `[GH]` indicate stables/factions in the game. Display as-is, never strip them.
- **Gestation is 72 real-world hours** (game server rule)
- **Mare breeding cool-down is 7 real-world days** — constant `COOLDOWN_MS` in MyStableClient.tsx
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

2. **Preferred Services** (`/admin/diary`):
   - Price field changed from integer cents to free text string (`"Free"`, `"250k"`, `"Negotiable"`)
   - Link field added (URL to provider profile/shop/thread)
   - Filter bar added: text search (name + notes) + service type dropdown, compound AND logic, "No matching services" empty state

3. **Show Scoreboard** (`/resources/show-scoreboard`):
   - Mobile layout: judge panel collapses behind toggle button on small screens
   - Responsive font sizes with `clamp()`
   - Leaderboard: full 7-col grid on desktop, compact 2-line card on mobile
   - All touch targets `min-height: 44px`
   - Queue: "done" now derived from scores array (not position index) — any un-scored rider is tappable
   - ↩ Redo button on scored riders — removes their score, returns them to active with fresh timer

4. **Pedigree tree fix** (`lib/pedigree.ts` + `components/PedigreeTree.tsx`):
   - Inbred ancestors (repeated in tree) now show their FULL pedigree on every occurrence
   - Previously they returned as childless leaf nodes
   - Fix: inbred nodes still build children (passing unchanged `seen` to prevent true cycles), renderer no longer gates on `!node.inbreeding`

5. **Suggested pairings depth fix** (`/admin/breeding/suggested-pairings`):
   - `pedigreeDepth` now uses `1 + Math.min(stallionDepth, mareDepth)` — honest balanced depth
   - When sides differ, reason string shows: `"4 gen balanced (♂ 6 · ♀ 3)"`
   - Filter uses balanced depth so lopsided pairings can't cheat the minimum

6. **Resources page** — removed AI-sounding subtitle paragraph

---

## Things NOT to change without asking
- Auth system — intentionally simple single-password
- `ownership === "Home"` filter logic — source of truth for My Stable, not name prefixes
- 72-hour gestation rule
- 7-day breeding cool-down constant
- The two character names "Athena Redfield" and "Lucille"

---

## Full project context
See `PROJECT_BRIEF.md` in the repo root for the complete reference document (use when prompting other AIs like Gemini).
