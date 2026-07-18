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
| Photo/file storage | **Cloudflare R2** (S3 API via `lib/storage.ts`); served over the bucket's public URL set in `R2_PUBLIC_URL` |
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
- **Photo** — horse images (url + key for storage, isPrimary, order, caption, `fill` boolean — true = fill block/cover, false = fit whole image/contain)
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
- Individual profile pages with hero photo gallery, documents, show results
- Registration certificate export (always 4 generations)
- Public registry is searchable and filterable

### Photos & Hero Gallery (`components/HorseHero.tsx`, `components/PhotoManager.tsx`)
- Hero image is a **carousel**: ‹ › arrows + keyboard arrows cycle through all photos, position counter (e.g. `2 / 5`)
- Click hero → fullscreen **lightbox** (also has prev/next arrows); always shows the whole image
- **Per-photo fill/fit toggle (admin only):** small "⤢ Fill block / ⤡ Fit whole image" button on the hero. Fill = `object-fit: cover` (crops edges, no letterbox gaps); Fit = `contain` (whole image). Saved to `Photo.fill`, applies for all viewers
- Hero default is `contain` on a fixed height (`min(70vh, 520px)`) so portrait images (e.g. certificates) aren't zoomed/cropped and the carousel doesn't jump between aspect ratios
- **Upload compression (`PhotoManager.shrinkImage`):** images are downscaled (longest edge ≤ 2000px) and re-encoded to JPEG in the browser before upload — Vercel serverless caps request bodies at ~4.5 MB, so full-size camera photos would 413 otherwise. GIFs/small files pass through untouched

### Pedigree System (`lib/pedigree.ts` + `components/PedigreeTree.tsx`)
- Recursive tree builder from `sireName`/`damName` string references
- Detects inbreeding (same ancestor in multiple branches) — shows ⚠ badge; hover highlights all copies of a repeated ancestor
- **Fixed:** Inbred ancestors now show their FULL lineage on all occurrences (previously dead-leafed)
- Wright's inbreeding coefficient (F) calculator; `findDuplicates`, `commonAncestors`, `pedigreeDepth` utilities
- **Display is a horizontal CSS-grid layout** (subject on the left, ancestors expanding right — NOT a connector-line tree):
  - **Colors by pedigree position, not the gender field:** upper horse of each pair = sire slot = blue (`--sire-*`), lower = dam slot = pink (`--dam-*`). The subject (root) block is a sage green-grey "selected horse" treatment; inbred = red; unknown = muted cream
  - Default **4 generations**; selector 3–10; fullscreen button
  - Rows use `1fr` so the grid fills the canvas; row height scales down with depth (28px ≤ gen 4, 20px gen 5–6, 15px gen 7+) so deep gens stay compact
  - Zoom/pan via `transform: scale()` + an explicit scroll-area sizing div (NOT CSS `zoom`, which breaks scrollWidth); auto-fit zoom capped at 1.0; canvas measured via `ResizeObserver`
  - Per-cell text gating: name always shows; breed/coat appear only when the cell is tall enough (avoids vertical clipping in cramped deep cells)
  - `bare`/`compact` modes feed the certificate export (grid div has `className="ped-export"`)

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
- Export final standings as PNG — carries a small logo + "Redfield Equestrian Centre · made on redfieldec.site" credit footer
- Live timer tick is isolated in a `LiveTimerDisplay` component so the 100ms updates don't re-render the whole board
- XC mode has optimum time + time deviation display

### Course Planner (`/resources/course-planner`)
- Drag-and-drop arena builder
- Place jumps, water, ditches, combinations
- Catmull-Rom spline track between obstacles
- Export master plan (PNG) — carries the same logo + "Redfield Equestrian Centre · made on redfieldec.site" credit footer

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
- `POST /api/horses/[id]/photos` — upload (multipart); `PATCH /api/photos/[photoId]` — caption, order, makePrimary, or `{ fill }`; `DELETE /api/photos/[photoId]`

### Gotchas / things that have bitten us
- **`position: fixed` modals/lightboxes** must not sit under an ancestor with a lingering `transform`. `<main>` animates with **opacity only** (`fadeIn`) for this reason — a `translateY` there made `<main>` the containing block and pinned every overlay to the page middle instead of the viewport.
- **Vercel request body cap (~4.5 MB):** anything uploaded through an API route must be shrunk client-side first (see photo compression). Large files 413.
- **R2 images broke once** because the bucket's public dev URL stopped resolving — images live on R2, served via `R2_PUBLIC_URL`. If images go blank site-wide, check that env/bucket public access first (it's not a code bug).

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
