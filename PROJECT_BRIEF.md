# rec-pedigree — Project Brief

> Use this document when prompt-engineering with any AI (Gemini, ChatGPT, etc.) to give it full context about the project before asking for code or design help.

---

## What is this project?

**rec-pedigree** is a private equestrian registry and interactive toolset web application built for a roleplay/game community called **The Rift**. It is deployed at **https://redfieldec.site**.

It is not a real-world horse registry. It is a personal admin tool and public-facing reference site for tracking fictional horses in a text-based/forum equestrian roleplay game. The horses have breeds, coats, pedigrees, show results, and breeding relationships — all within the game's fiction.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js App Router** (latest — has breaking changes vs older versions) |
| Database ORM | **Prisma** with **PostgreSQL** (hosted on Neon) |
| Styling | **Tailwind CSS** + CSS custom properties (design tokens) |
| Icons | **Lucide React** |
| Deployment | **Vercel** (auto-deploys on push to `main`) |
| Image export | **html-to-image** (`toPng`) |
| Auth | Simple custom cookie-based admin session (`isAdminLoggedIn()`) |

---

## Design Language

- **Theme:** Premium desaturated dark/rustic palette — deep teal, cream, muted gold
- **Typography:** `var(--font-playfair)` for headings, `var(--font-lato)` for body/UI
- **Key CSS variables:** `--teal`, `--teal-dark`, `--teal-light`, `--teal-muted`, `--cream`, `--cream-dark`, `--border`, `--white`, `--text`, `--text-muted`, `--gold`, `--sire-bg/text/border`, `--dam-bg/text/border`, `--inbreed-text/border`
- **Card style:** White background, `rounded-xl` / `rounded-2xl`, thin subtle border, clean minimalist containers
- **Layout rule:** Dynamic toolbars/menus must be in a fixed-height container (`min-h-[56px]`) so the canvas below never jumps when they appear/disappear
- All inline styles use CSS variables for color — never hardcoded hex except for podium medals and amber cool-down badge

---

## Database Models (Prisma Schema)

### Horse
The core model. Key fields:
- `name` — unique horse name (may have a prefix tag like `[REC]`, `[TES]`, `[DSH]` etc.)
- `breed`, `gender`, `coat`, `genotype` — core attributes
- `sireName`, `damName` — plain text parent names (used to build pedigree trees recursively)
- `ownership` — `"Home"` = currently owned/active; other values = sold, NPC, etc.
- `assignedCharacter` — `"Athena Redfield"` or `"Lucille"` — which player character owns this horse
- `lifeStage` — `null` = Adult, or `"Gestation"` | `"Weanling"` | `"Yearling"` | `"Youngster"`
- `lastBredDateTime` — timestamp for mare breeding cool-down tracking (7-day window)
- `dob`, `height`, `discipline`, `regNumber`, `achievements`, `description`, `personality`, `videoUrl`, `baseStats`, `eyeColor`
- `breedingFee`, `breedingPolicies`
- `price`, `saleDescription`, `saleContact` — for sale listings
- `ownerName`, `ownerCharacter`, `stablePrefix` — roleplay/Discord info
- `isImportedPlaceholder` — true if created as a pedigree placeholder (no full data yet)

### Other models
- **Photo** — horse images (url + key for storage, isPrimary, order, caption)
- **Document** — attached PDFs or files per horse
- **Result** — show results/achievements per horse (event, date, placement, notes)
- **BreedingPlan** — saved wishlist pairing (mare + stallion, notes)
- **Pregnancy** — active pregnancy tracker (coverDate, dueDate, status: expecting/born, foalId)
- **DiaryNote** — admin private notes keyed by string (e.g. `"general"`)
- **PreferredService** — favourite service providers (providerName, serviceType, price as free text, link URL, notes)
- **SiteContent** — editable homepage/announcement text stored as key/value

---

## Site Structure

### Public Pages
| Route | Purpose |
|---|---|
| `/` | Homepage — hero, announcements, links to registry and resources |
| `/registry` | Public searchable horse registry list |
| `/registry/[id]` | Individual horse profile — photos, stats, pedigree tree, show results |
| `/for-sale` | Horses currently listed for sale |
| `/resources` | Hub page linking to all interactive tools |
| `/resources/course-planner` | Drag-and-drop show jumping course builder |
| `/resources/foal-calculator` | Coat genetics foal outcome predictor |
| `/resources/show-scoreboard` | Live show scoreboard for events (judge + spectator mode) |

### Admin Pages (password protected)
| Route | Purpose |
|---|---|
| `/admin` | Admin dashboard with quick-links |
| `/admin/login` | Login page |
| `/admin/horses` | Full registry management — edit/delete any horse |
| `/admin/horses/new` | Add a new horse |
| `/admin/horses/[id]` | Edit a specific horse's full profile |
| `/admin/horses/[id]/certificate` | Exportable registration certificate (PNG) |
| `/admin/my-stable` | My Stable dashboard — only "Home" horses, with character assignment, filters, views |
| `/admin/breeding` | Breeding planner — pedigree viewer for any mare × stallion pairing |
| `/admin/breeding/suggested-pairings` | AI-suggested pairings with inbreeding/depth/genotype filters |
| `/admin/diary` | Private notes + Preferred Services ledger |
| `/admin/import` | Bulk import horses from CSV/text |
| `/admin/pedigree-import` | Import pedigree ancestor placeholder records |

---

## Key Features & What Has Been Built

### Horse Registry
- Full CRUD for horse records
- Individual profile pages with photo gallery (slideshow), documents, show results
- Registration certificate export as PNG
- Public registry is searchable and filterable

### Pedigree System (`lib/pedigree.ts`)
- Recursive tree builder from `sireName`/`damName` string references
- Detects inbreeding (same ancestor in multiple branches) — shows ⚠ badge
- **Fixed:** Inbred ancestors now show their FULL lineage on all occurrences (previously dead-leafed)
- Wright's inbreeding coefficient (F) calculator
- `findDuplicates`, `commonAncestors`, `pedigreeDepth` utilities
- Interactive tree viewer: zoom, pan, drag, fullscreen, generation selector (3–10), PNG download
- Hover to highlight all copies of a repeated ancestor

### My Stable (`/admin/my-stable`)
- Filters to `ownership === "Home"` horses only
- **View toggle:** List (data table) vs Gallery (card grid)
- **Character assignment:** Each horse assigned to "Athena Redfield" or "Lucille" via inline pill toggle
- **Bulk actions:** Select filtered rows → bulk move to character
- **Compound filter bar:**
  - Text search (name or ID)
  - Breed dropdown
  - Gender dropdown
  - Foal/maturity stage filter (Adults Only / Foals & Developing — based on `lifeStage` field)
  - Coat smart combobox — text input + filtered popover, matches against BOTH clean name and genotype code (e.g. typing "TOV" returns "Black Tovero (BL_TOV)")
- **Mare breeding cool-down badge:** Amber ⏱ pill showing "Cool-down: Xd Xh remaining" on mares within 7 days of `lastBredDateTime`; ticks live every 60s, disappears automatically
- Back button uses `router.back()` (context-aware)

### Coat Parser (`lib/horseCoat.ts`)
- `parseHorseCoat(str)` → `{ cleanName, genotype }`
- Input: `"Black Tovero (BL_TOV)"` → Output: `{ cleanName: "Black Tovero", genotype: "BL_TOV" }`
- Used everywhere coat strings are displayed so humans see clean names, genetics code stays accessible for calculations

### Breeding Planner
- Select any mare + stallion → view combined pedigree tree
- Foal inbreeding coefficient display
- Save pairings to wishlist (BreedingPlan)
- Pregnancy tracker with 72-hour gestation (creates placeholder foal record)

### Suggested Pairings (`/admin/breeding/suggested-pairings`)
- Generates all valid mare × stallion combinations from Home horses
- Filters: min pedigree depth, COI limit, breed (purebred/cross), known parents only, target foal genotype
- **Fixed:** Pedigree depth uses `min(sire, dam)` not `max` — a stallion with 6 gen + mare with 3 gen now correctly reports as "4 gen balanced (♂ 6 · ♀ 3)" instead of inflated "7 gen"
- Sorted by lowest inbreeding coefficient first

### Coat Genetics (`lib/genetics.ts`)
- Predicts possible foal coat outcomes from parent genotypes
- Used in both Foal Calculator (public) and Suggested Pairings (admin)

### Show Scoreboard (`/resources/show-scoreboard`)
- Disciplines: Show Jumping and Cross Country
- Organizer Mode: roster entry (paste list), queue management, live timer (start/pause/reset), penalty buttons, submit score
- **Queue:** Any un-scored rider is clickable to jump to; scored riders show ↩ Redo button (removes score, returns them to active)
- **Mobile friendly:** Judge panel collapses behind a toggle; responsive font sizes; leaderboard shows compact 2-line card on mobile
- Spectator board: active rider spotlight with live timer, FLIP-animated leaderboard
- Export final standings as PNG
- XC mode has optimum time + time deviation display

### Course Planner (`/resources/course-planner`)
- Drag-and-drop arena builder
- Place jumps, water, ditches, combinations
- Catmull-Rom spline track between obstacles
- Export master plan

### Foal Calculator (`/resources/foal-calculator`)
- Select sire coat + dam coat → see all possible foal coat outcomes with probabilities

### Diary & Services (`/admin/diary`)
- **General Notes:** Auto-saving rich textarea (debounced, 1.5s)
- **Preferred Services ledger:** Track favourite service providers (trainer, farrier, vet, tack maker etc.)
  - Fields: Provider name, service type, price (free text — "Free", "250k", "Negotiable", etc.), link URL, notes
  - Filter bar: text search (name + notes) + service type dropdown
  - "No matching services" empty state with clear-filters link

---

## Important Conventions & Patterns

### API Routes
All under `/api/`. Auth-checked with `isAdminLoggedIn()`. Key routes:
- `PATCH /api/horses/[id]/character` — update assignedCharacter
- `POST /api/horses/bulk-character` — bulk assign character
- `DELETE /api/horses/bulk-delete`
- `POST /api/diary/services`, `PATCH /api/diary/services/[id]`, `DELETE /api/diary/services/[id]`

### Schema Migrations
Vercel runs `prisma migrate deploy` on every deploy. When adding fields:
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` locally (applies to Neon DB)
3. Create a migration file manually at `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql` using `IF NOT EXISTS`
4. Run `npx prisma migrate resolve --applied <name>` to mark it applied
5. Commit and push — Vercel sees "no pending migrations"

### Horse Name Prefixes
Names use tags like `[REC]`, `[TES]`, `[DSH]`, `[F.E]`, `[MLY]`, `[WRR]`, `[EMR]`, `[YRC]`, `[GH]`, `[TSSi]` etc. These indicate stable/faction ownership in the game. The registry displays them as-is.

### Character Personas
Two admin characters own horses:
- **Athena Redfield** — primary character
- **Lucille** — second character
All horses default to "Athena Redfield" on creation.

### Foal Life Stages
Stored in `lifeStage` field on Horse. Values:
- `null` — Adult (fully grown)
- `"Gestation"` — pregnant/unborn
- `"Weanling"` — just born, early stage
- `"Yearling"` — one year old equivalent
- `"Youngster"` — adolescent, nearly adult

### Breeding Cool-down
- Server rule: mares have a 7-day real-world cool-down after breeding
- Stored as `lastBredDateTime` (DateTime) on Horse
- Constant `COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000` in MyStableClient.tsx — easy to change

---

## What The Owner Wants (Design Goals)

- A **personal, private admin tool** for managing their game horses — not a generic SaaS product
- Clean, premium aesthetic that feels like a real equestrian registry — not generic web app UI
- Everything fast and in-browser where possible
- Public pages are view-only for the community; all editing is admin-only
- The tone is roleplay/game but the UI should feel professional and elegant
- No AI-sounding copy anywhere on the site
- Mobile-friendly where it matters (especially the show scoreboard used at live events)

---

## Things NOT to Change Without Asking
- The auth system — it's intentionally simple (single admin password)
- The `[REC]` prefix filtering logic — `ownership === "Home"` is the source of truth, not name prefixes
- The 72-hour gestation rule in the breeding tracker
- The 7-day breeding cool-down (unless the game server rules change)
- The two character names "Athena Redfield" and "Lucille" — these are the owner's in-game personas

---

## Deployment

```bash
# Deploy to production
npx vercel --prod

# TypeScript check before deploying
npx tsc --noEmit

# Push schema changes (then create migration file manually)
npx prisma db push
npx prisma migrate resolve --applied <migration_name>
```

Live URL: **https://redfieldec.site**
GitHub: **clairecabglass/rec-pedigree** (main branch)
