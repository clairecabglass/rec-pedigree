# Redfield Equestrian Centre — Project Handoff

A horse registry, pedigree, breeding-planning and certificate website for **Redfield
Equestrian Centre** (a roleplay stud on the ReDM server "The Rift"). Built by Claire/Athena.

---

## 1. Live site & access

- **Live URL:** https://redfieldec.site (also https://rec-pedigree.vercel.app)
- **Admin login:** click the **footer logo** (hidden entry) → username **`athena`** / password **`chefathena`**
- Auto-deploys: **every `git push` to `main`** rebuilds & deploys on Vercel automatically.

---

## 2. Accounts & services

| Service | Account / detail |
|---|---|
| **GitHub** | repo `clairecabglass/rec-pedigree` (private). Local CLI authed as `clairecabglass` (also `bloopbleep123` as fallback). `gh` installed at `~/.local/bin/gh`. |
| **Vercel** | project `claire-cabglass/rec-pedigree` (team `claire-cabglass`). GitHub connected for auto-deploy. Use `npx vercel@latest`. |
| **Database** | **Neon Postgres** via Vercel integration. `DATABASE_URL` (pooled) + `DATABASE_URL_UNPOOLED` (direct) set in all Vercel envs. ⚠️ **Local dev `.env` and production share the SAME Neon DB.** |
| **File storage** | **Cloudflare R2** bucket `redfield-photos`, public URL `https://pub-e3f47aa97487429fa393cbc0f4774603.r2.dev`. `R2_*` env vars in Vercel prod+dev + local `.env`. Photos & documents persist here. |
| **Domain** | `redfieldec.site` on **Namecheap** (A `@`→`76.76.21.21`, CNAME `www`→`cname.vercel-dns.com`). Vercel auto-SSL. |

Secrets (DB url, R2 keys, admin pw) live in `.env` (gitignored) and Vercel env vars — **not in git**.

---

## 3. Tech stack

- **Next.js 16** (App Router), **React 19**, TypeScript. Inline styles + a little Tailwind v4.
- **Prisma 5** + PostgreSQL.
- Auth: simple cookie (`rec_admin`) = `username:password` token vs `ADMIN_USERNAME`/`ADMIN_PASSWORD` env. `lib/auth.ts` → `isAdminLoggedIn()`, `checkCredentials()`.
- Storage abstraction `lib/storage.ts` (local disk in dev / R2 in prod, auto by env).
- Pedigree/genetics logic in `lib/pedigree.ts` and `lib/genetics.ts` (pure, usable client-side).
- Image/PDF export: `html-to-image` + `jspdf`.
- Fonts: Playfair Display (headings) + Lato (body). Brand: sage teal `#5E8080`, cream `#FBF8F4`, gold `#C4A96E`. Logos in `public/brand/`.

---

## 4. Local development

```bash
cd "/Users/claire/Claude/The Rift/rec-pedigree"
npm install
npm run dev          # http://localhost:3000  (connects to the shared Neon DB!)
npx tsc --noEmit     # typecheck before committing
```

To deploy: just `git push origin main` (ensure `gh auth switch --user clairecabglass` first).
Schema changes: edit `prisma/schema.prisma`, then create a migration WITHOUT a shadow DB:
```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<ts>_name/migration.sql
npx prisma migrate deploy && npx prisma generate
```

### Known gotchas
- **Postgres `contains` is case-sensitive** — always use `mode: "insensitive"` on name searches.
- **`{0 && <x>}` renders a literal "0"** in React — coerce filter flags to Boolean.
- **CSS not updating in dev** → `rm -rf .next` and restart (Tailwind v4 caches aggressively).
- **Server Components can't have `onClick`** — use CSS `:hover` (`.hover-card`) or a client component.
- The **preview tool** (`mcp__Claude_Preview__*`) is flaky: screenshots sometimes show the wrong page, and it can't trigger file downloads. Verify via DOM `eval` and trust tsc.

---

## 5. Data model (Prisma)

- **Horse** — the core record. Genotype is embedded in the `coat` string in parens, e.g. `"Bay Overo (B_O)"`. Fields: name (unique), microchip, breed, gender, sireName, damName (by NAME, not FK), coat, ownership, dob, withFoal, height, discipline, regNumber, achievements, videoUrl, personality, genotype, eyeColor, baseStats, description, ownerName, ownerCharacter, stablePrefix, breedingFee, breedingPolicies, price, saleDescription, saleContact.
- **Photo**, **Document** — per horse, files in R2.
- **Result** — show results / achievements log per horse.
- **Pregnancy** — breeding tracker (damId, sireName, dueDate, status, foalId).
- **BreedingPlan** — saved wishlist pairings.
- **SiteContent** — exists for a future CMS (no UI yet).

**Ownership values:** `Home`, `For Sale`, `Sold`, `Outside` (not owned), `Void` (deleted), `Expected` (unborn foal placeholder).

---

## 6. Features built (all live)

**Public**
- Home (logo hero + stats), Registry (grid/table, filters: search/breed/gender/coat/generations/sort + toggles), horse profiles (studbook-style: photo slideshow/lightbox, fact blocks, owner block, sire/dam w/ breeds, breeding fee, sale banner, description, **show results**, interactive pedigree, offspring, documents), For Sale page.
- **Registry shows only owned `[REC]`-tagged horses.** Admins get a "Show all owned (incl. non-[REC])" toggle.
- **Pedigree tree** = recursive flex + CSS bracket connectors. Soft blue=sire / pink=dam / red=inbreeding. Unknown/Foundation ancestors are skipped entirely. Fullscreen (all) + Download PNG (admin). Depth toggle 3–7.

**Admin** (`/admin`, gated)
- Dashboard, Add/Edit horse (with Photo/Document/Result managers), Import Excel, Edit Registry.
- **Stable Tracker** (`/admin/stable-tracker`):
  - Plan a pairing → predicted foal pedigree, **inbreeding count + COI %**, depth, **predicted foal coat genetics** (every possible coat WITH genotype code — see `lib/genetics.ts`).
  - **"Find the best stallions for this mare"** — ranks all studs by lowest inbreeding → deepest pedigree.
  - **Breeding wishlist** (save/list/delete pairings).
  - **Pregnancies** (collapsible): register a pairing → auto-creates a foal page, **72-hour** auto due date with countdown, "Mark born" promotes the foal into the registry. Mare profile shows a "Currently in foal" banner → foal page.
- **PDF Certificate** (`/admin/horses/[id]/certificate`): on-screen shows only the pedigree; export composites it onto the "PROVEN LINEAGE" template (`public/brand/certificate-bg.png`) with the horse name + reg #. Two downloads: **Certificate (PDF)** and **Pedigree only (PNG)**. 5 or 6 generations.

---

## 7. Key files

```
app/
  page.tsx                         home (public counts = [REC]-owned)
  registry/page.tsx + RegistryClient.tsx   registry list ([REC] filter + admin toggle)
  registry/[id]/page.tsx           horse profile (admin sees Edit + Certificate buttons)
  for-sale/page.tsx
  admin/                           dashboard, login, horses CRUD, import, stable-tracker, certificate
  api/                             auth, horses, photos, documents, results, pregnancies, breeding-plans, import
components/
  Nav, Icon, PedigreeTree (bare/compact modes), Slideshow, PhotoGallery,
  PhotoManager, DocumentManager, ResultManager, HorseForm
lib/
  db, auth, storage, horseInput, pedigree (buildPedigreeTree, pedigreeDepth,
  findDuplicates, commonAncestors, inbreedingCoefficient), genetics (predictFoal, etc.)
prisma/  schema.prisma, migrations, seed.mjs, seed-data.json
public/brand/  logo-icon.png, logo-full.png, certificate-bg.png, favicon
```

---

## 8. Coat genetics quick reference (`lib/genetics.ts`)

Gene codes in coat parens: `base_dilutions_pattern`.
- **base:** R (red/chestnut), B (bay), BL (black)
- **dilutions:** CH CR CR2 Z M P G DW FLX
- **patterns:** BK BR D FSP LP O RB RN SB SF SW TO TOV ZB

Rules: base-colour combination table (red recessive; bay can throw red/black/bay); cream CR may-pass / CR2 always-passes (1 copy = single dilute, 2 = double like Cremello/Perlino); silver(Z) & flaxen(FLX) base-restricted (silver only black/bay, flaxen only red); pattern = one of the two parents' or none. `predictFoal()` enumerates all reachable foal coats with names + codes from the Coat Catalogue legend (hardcoded `BASE_COATS`). Source: `The Rift/Copy of Sire's Horse Coats for Rift_Redm By Azelas.xlsx`.

---

## 9. Outstanding / next ideas

- **Certificate fine-tuning:** user should download a real cert and report if name / reg# / pedigree need repositioning (positions in `CertificateClient.tsx`: name `top:15%`, reg `top:12.6% left:68%`, pedigree `AREA`).
- Not yet built (offered): public **"At Stud" page** (studs + breeding fees), **"can this pairing make [colour]?"**, reverse pedigree (descendants), sales inquiry form, herd colour/breed **stats dashboard**, compare two horses, foaling-due reminders, dark mode, site-content CMS (model exists).

---

## 10. Brand assets location

`/Users/claire/Library/Mobile Documents/com~apple~CloudDocs/Claire/PC/The Rift/Brand & Papers/Brand/`
(logos) and `/Users/claire/Library/Mobile Documents/com~apple~CloudDocs/Claude/The Rift/`
(gene spreadsheet `Copy of Sire's Horse Coats...xlsx`, `Lineage.pdf` certificate template,
`REC Pedigree.xlsx` original data).
