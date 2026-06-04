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
