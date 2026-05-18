# KKY Update API Worker

Cloudflare Worker for dynamic API routes under `https://update.zerokky.com/api/*`.

It keeps the current static GitHub Pages site, but moves blocked browser-side calls behind the KKY domain.

## Routes

- `GET /api/health`
- `GET /api/requests?limit=10`
- `POST /api/requests`
- `GET /api/family-browser/bootstrap`
- `GET /api/family-browser/bootstrap-index`
- `GET /api/family-browser/file?path=bootstrap.json`
- `POST /api/family-browser/file`

`/api/requests` currently proxies the existing Google Apps Script endpoint. Users call only `update.zerokky.com`; the Worker calls Google from Cloudflare.

Family Browser config reads/writes JSON files in the `zerokky11/Release` repository. Browser clients do not need a GitHub token. Admin writes use a Worker secret.

## Setup

```powershell
cd cloudflare-worker
npm install
npx wrangler login
npx wrangler secret put REQUESTS_UPSTREAM_URL
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put FAMILY_BROWSER_ADMIN_TOKEN
npx wrangler deploy
```

Suggested `REQUESTS_UPSTREAM_URL` value is the current Google Apps Script `/exec` URL used by `assets/site-config.js`.

`GITHUB_TOKEN` needs contents read/write access to `zerokky11/Release`.

`FAMILY_BROWSER_ADMIN_TOKEN` is the password/token the homepage editor sends to the Worker for config writes.

## After Deploy

Verify:

```powershell
Invoke-WebRequest https://update.zerokky.com/api/health
Invoke-WebRequest https://update.zerokky.com/api/requests?limit=3
Invoke-WebRequest https://update.zerokky.com/api/family-browser/bootstrap
```

Then switch `assets/site-config.js`:

```js
requestApiUrl: "https://update.zerokky.com/api/requests"
```

The Family Browser editor can also be switched from direct GitHub API saves to `/api/family-browser/file` after the Worker is deployed.
