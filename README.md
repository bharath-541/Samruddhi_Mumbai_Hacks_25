# Samruddhi Backend — Day 0 (Infra & Envs)

Short, actionable steps to provision managed services and prepare the repo for the hackathon MVP.

## What you provide

- Supabase: `project-ref`, `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE` (keep secret)
- Upstash Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Mongo Atlas: `MONGO_URI` (read-only user ok for MVP)
- Vercel: project name and preferred region (close to Supabase)

## One-time setup (macOS zsh)

```bash
# Tools
brew install supabase/tap/supabase
npm i -g vercel

# Login to providers (browser prompts)
supabase login
vercel login
```

## Repo setup

```bash
# Copy env template and fill values
cp .env.example .env.local

# Initialize Supabase project files (creates supabase/)
supabase init
supabase link --project-ref <YOUR_PROJECT_REF>

# Create first migration (edit SQL later if needed)
supabase db migration new init_core

# Push migrations
# locally (optional)
supabase db push
# or remote (recommended once SQL is ready)
supabase db push --remote
```

## Env vars (Vercel project)

Add these variables in Vercel → Settings → Environment Variables:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `MONGO_URI`, `JWT_SECRET`, `IDEMPOTENCY_SECRET`
- `NODE_ENV`, `PORT` (optional on serverless)

## Clean commits

```bash
git add .
git commit -m "chore: repo scaffolding (.gitignore, README, .env.example)"
```

Next: Day 1 — create core tables via SQL migrations and add RLS policies.
