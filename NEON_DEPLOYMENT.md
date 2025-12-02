# SQLite to Neon Migration Guide

This guide walks you through migrating your Photopia app from local SQLite to Neon PostgreSQL and deploying to Netlify.

## Prerequisites

- Node.js 18+ installed locally
- Neon account (free at https://neon.tech)
- Netlify account (free at https://netlify.com)
- Git repository pushed to GitHub

## Step 1: Create a Neon Project

1. Go to https://neon.tech and sign up (free tier available)
2. Create a new project (e.g., "photopia")
3. Create a branch (e.g., "main")
4. Copy the connection string from **Connection string** tab

Example format:
```
postgresql://neondb_owner:password@ep-xyz.neon.tech:5432/neondb?sslmode=require
```

**Keep this connection string safe** — you'll need it in the next steps.

## Step 2: Create the Schema on Neon

Before migrating data, create the database schema on Neon using Prisma migrations.

1. Set the Neon URL in a temporary environment variable:

```bash
# On macOS/Linux/Git Bash:
export DATABASE_URL='postgresql://neondb_owner:password@ep-xyz.neon.tech:5432/neondb?sslmode=require'
export DIRECT_URL="$DATABASE_URL"

# On Windows PowerShell:
$env:DATABASE_URL='postgresql://neondb_owner:password@ep-xyz.neon.tech:5432/neondb?sslmode=require'
$env:DIRECT_URL=$env:DATABASE_URL
```

2. Run Prisma migrations to create tables on Neon:

```bash
npx prisma migrate deploy
```

You should see output like:
```
8 migration(s) have been applied.
```

This creates the `Post` table (and any other tables in your migrations) on Neon.

## Step 3: Migrate Data from SQLite to Neon

Now copy your existing data from local SQLite to Neon using the migration script.

1. Run the migration script (replace the URL with your Neon connection string):

```bash
node scripts/migrate-to-neon.js 'postgresql://neondb_owner:password@ep-xyz.neon.tech:5432/neondb?sslmode=require'
```

Example output:
```
🚀 Starting migration from SQLite to Neon...

✅ Connected to SQLite: ./prisma/dev.db
✅ Connected to Neon PostgreSQL

📋 Migrating table: Post
   Found 5 posts in SQLite
   Cleared existing data in Neon
   ✅ Inserted 5 posts into Neon

✅ Migration completed successfully!
```

## Step 4: Update Local Environment Variables

Edit `.env` with your Neon connection string:

```env
DATABASE_URL='postgresql://neondb_owner:password@ep-xyz.neon.tech:5432/neondb?sslmode=require'
DIRECT_URL='postgresql://neondb_owner:password@ep-xyz.neon.tech:5432/neondb?sslmode=require'
```

## Step 5: Verify Locally

Test that your app works with Neon:

```bash
# View data in Prisma Studio
npx prisma studio

# Start dev server
npm run dev

# Test build (what Netlify will run)
npm run build
```

If everything works, proceed to deployment.

## Step 6: Deploy to Netlify

### 6a. Connect Repository to Netlify

1. Push your code to GitHub:
```bash
git add .
git commit -m "Migrate to Neon PostgreSQL"
git push
```

2. Go to https://app.netlify.com
3. Click **"Add new site"** → **"Import an existing project"**
4. Select your Git provider and repository
5. Netlify will auto-detect settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `netlify`
   - Functions directory: `netlify/functions`

### 6b. Add Environment Variables

In Netlify dashboard:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Click **"Edit variables"** and add:
   - `DATABASE_URL` = Your Neon connection string
   - `DIRECT_URL` = Your Neon connection string

Example:
```
DATABASE_URL=postgresql://neondb_owner:password@ep-xyz.neon.tech:5432/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:password@ep-xyz.neon.tech:5432/neondb?sslmode=require
```

### 6c. Deploy

1. Push to your main branch (or trigger manually in Netlify)
2. Netlify will:
   - Run `npm install` (runs `postinstall` → `prisma generate`)
   - Run `npm run build` (applies migrations → builds SvelteKit)
   - Deploy serverless functions to Netlify Functions
   - Serve your app globally

Your app should be live at your Netlify domain (e.g., `your-site.netlify.app`).

## Verification

After deployment:

1. Visit your Netlify domain
2. Test creating posts, viewing posts, uploading images
3. Check Netlify function logs if any errors occur (Site settings → Functions logs)

## Troubleshooting

### Migration script fails to connect to SQLite
- Ensure `prisma/dev.db` exists
- Verify SQLite database file is not locked (close Prisma Studio)

### Migration script fails to connect to Neon
- Verify the connection string is correct (copy from Neon console)
- Ensure Neon project is active and not paused
- Check that password and other credentials are correct

### Build fails on Netlify with "Database connection error"
- Verify `DATABASE_URL` and `DIRECT_URL` are set in Netlify environment
- Ensure Neon project is active
- Check Netlify deploy logs for exact error message

### App crashes with 500 error after deployment
- Check Netlify function logs
- Verify `DATABASE_URL` is set correctly
- Ensure migrations ran successfully (check deploy logs)

### Want to go back to SQLite?
- Keep a backup of `prisma/dev.db` before migration
- Revert `.env` to `DATABASE_URL="file:./dev.db"`
- Update Netlify env vars back (if you deployed)

## Files Changed

- `prisma/schema.prisma` — Updated provider from SQLite to PostgreSQL
- `.env` — Updated with Neon connection string
- `scripts/migrate-to-neon.js` — Migration script (created)

## Next Steps

- Monitor your app on Netlify
- Set up custom domain (optional)
- Enable auto-deploy on Git push (usually enabled by default)
- Back up Neon data periodically using Neon's branching feature

## Support

- Neon Docs: https://neon.tech/docs
- Prisma Docs: https://www.prisma.io/docs
- Netlify Docs: https://docs.netlify.com
- SvelteKit Docs: https://kit.svelte.dev
