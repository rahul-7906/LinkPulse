# LinkPulse

LinkPulse is a client-side URL shortener built with React, Vite, and Supabase.
It supports validated custom aliases, password protection, expiry dates, atomic
click limits, device-aware click tracking, bot/preview filtering, ghost-click
classification, QR sharing for generated links, and a live traffic-quality
analytics view.

## Development

```bash
npm install
npm run dev
```

For local Supabase access, copy `frontend/.env.example` to
`frontend/.env.local` and fill in the Supabase project URL and anon/public key.
Never put a service-role key in frontend variables or commit `.env.local`.
If either value is missing, the app displays a setup message instead of loading
to a blank page.

The production checks are:

```bash
npm run lint
npm run build
```

## Theme

The app starts in dark mode on every page load. The theme toggle can switch to
light mode for the current session; reloading returns the app to dark mode.

## Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel, choose **Add New Project** and import the repository.
3. Set **Root Directory** to `frontend`.
4. Confirm these settings:
   - Framework preset: `Vite`
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output directory: `dist`
5. Click **Deploy**.

The root `vercel.json` provides the SPA fallback required for short-link
routes such as `/your-alias`. After deployment, create links from the Vercel
URL, not from `localhost`, so shared links are publicly reachable.

Before deploying, add these Vercel Environment Variables for the frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Select them for Production, Preview, and Development, then redeploy after
saving them. Vite embeds `VITE_` variables into the browser bundle, so only
the Supabase anon/public key belongs there. The service-role key must remain
server-side and must never be committed or added to Vercel frontend variables.

## Supabase setup

1. For a new project, run [`supabase_migration.sql`](../supabase_migration.sql)
   in the Supabase SQL editor. It creates missing `links` and `clicks` tables,
   adds required columns and indexes, enables RLS, and installs the policies
   used by the anonymous client.
2. If the tables already exist, run the full migration again: columns, indexes,
   policies, and the atomic `record_click_event` function are installed
   idempotently.
3. Existing databases that previously installed Location Insights can remove
   its database additions by running
   [`supabase_remove_location_insights.sql`](../supabase_remove_location_insights.sql).
   This drops the location columns and RPC helper while keeping existing click
   rows. Also delete any deployed `location-insights` Edge Function from the
   Supabase Dashboard under **Edge Functions**.

Passwords created by the current client are stored as SHA-256 hashes in
`password_hash`; never store or migrate plaintext passwords into that column.
Existing plaintext records must be recreated or migrated securely before
enabling password-protected links.

## Important limitation

The current anonymous-browser workspace is tied to a browser-local visitor ID.
It is not an authenticated account, so links are not automatically available
on another device or browser. The migration's permissive policies are intended
for this demo/no-account model; add Supabase Auth or a server-side API before
using it for private production data.

Redirect validation runs before navigation and is recorded through the
`record_click_event` Supabase RPC. The app labels known crawlers, social
previews, headless/automation signals, rapid repeats, and verified browser
visits separately. A server-side redirect or Edge Function is still required
for HTTP-level crawler detection when a preview service never executes
JavaScript.
