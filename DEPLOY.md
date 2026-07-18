# Deploying to Vercel

## Local development

```bash
cd rec-pedigree
npm install
npx prisma migrate dev
npx prisma db seed   # loads your 565 horses from the Excel export
npm run dev
```

Admin password is `redfield2025` — change it in `.env` before deploying.

## Vercel deployment (production)

Vercel can't use SQLite (file-based). You need to swap to Neon Postgres (free).

### 1. Create a Neon database
1. Go to vercel.com → your project → Storage → Add → Postgres (Neon)
2. Follow the prompts — it creates a free Postgres database and adds `DATABASE_URL` to your Vercel env vars automatically.

### 2. Update the Prisma schema for Postgres
Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"   ← change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. Add env vars in Vercel dashboard
- `DATABASE_URL` — auto-added by Neon, or copy from Neon dashboard
- `ADMIN_PASSWORD` — set to your own secure password

### 4. Deploy
```bash
git add .
git commit -m "initial commit"
git push
# connect repo to Vercel in vercel.com dashboard
```

Vercel runs `npx prisma generate && next build` automatically (set in vercel.json).

### 5. Seed production data
After first deploy, run the seed against production:
```bash
DATABASE_URL="your-neon-url-here" npx prisma db seed
```
Or use the Import Excel feature at `/admin/import` to upload your .xlsx directly.

## Updating horse data
- **From the site**: go to `/admin` → Import Excel, upload your REC Pedigree.xlsx
- **Manually**: go to `/admin` → Edit Registry → find horse → edit form
- **Add new**: go to `/admin` → Add Horse

## Admin access
- URL: `yourdomain.com/admin`
- Password: whatever you set in `ADMIN_PASSWORD` env var
- Default (local only): `redfield2025`

## Photo & file storage (Cloudflare R2)

Photos and documents work **locally with zero setup** — they save to `public/uploads/`.
On Vercel the filesystem is read-only, so production uses **Cloudflare R2** (10 GB free,
no bandwidth fees). When the R2 env vars are present the app automatically uses R2; when
they're absent it falls back to local disk.

### One-time R2 setup
1. Create a free Cloudflare account → **R2** → **Create bucket** (e.g. `redfield-photos`).
2. In the bucket → **Settings** → enable **Public access** (R2.dev subdomain) or attach a
   custom domain. Copy that public URL (e.g. `https://pub-xxxx.r2.dev`).
3. R2 → **Manage R2 API Tokens** → **Create API token** (Object Read & Write). Copy the
   Access Key ID and Secret Access Key.
4. Find your Cloudflare **Account ID** (R2 overview page, right sidebar).
5. Add these env vars (Vercel dashboard → Settings → Environment Variables, and/or `.env` locally):

```
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=redfield-photos
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

That's it — uploads now go to R2. Nothing else changes. Photos already uploaded to local
disk in dev stay on disk; re-upload them once R2 is live if you want them in production.

## What admins can manage per horse
- **Photos**: upload (drag & drop, multiple), reorder, set the primary (used on cards &
  slideshow), delete. → `/admin/horses/<id>` → Photos
- **Documents**: vet records, registration papers, health certs (PDF/image). → Documents section
- **Profile fields**: height, discipline, registration #, achievements, video link
- **For Sale details**: price, sale description, contact (shown on the For Sale page & profile)
