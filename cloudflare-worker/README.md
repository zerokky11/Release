# KKY Update API Worker

`https://update.zerokky.com`의 동적 API와 실시간 정책 설정을 제공하는 Cloudflare Worker다.

## Storage split

- Cloudflare R2 `kky-policy-config`
  - `kky-tool/user-access.json`
  - `family-browser/bootstrap.json`
  - `family-browser/bootstrap-index.json`
- GitHub Pages / GitHub repository
  - 홈페이지 HTML, CSS, JavaScript, 이미지와 설치파일
  - R2에 아직 시드되지 않은 설정의 최초 마이그레이션 원본
- Existing request upstream
  - `/api/requests`가 기존 요청 API를 프록시한다.

애드인이 읽는 공개 URL은 바뀌지 않는다. 세 설정 파일의 정상 응답에는 `Cache-Control: no-store`, `ETag`, `X-KKY-Config-Source: r2`가 포함된다.

## Routes

- `GET /api/health`
- `GET|POST /api/requests`
- `GET|HEAD|PUT /kky-tool/user-access.json`
- `GET|HEAD|PUT /family-browser/bootstrap.json`
- `GET|HEAD|PUT /family-browser/bootstrap-index.json`
- `GET|PUT /api/policy/file?path=...`
- `GET|PUT /api/family-browser/file?path=...`
- `GET /family-browser/*` for the existing static Family Browser pages

Public reads do not require authentication. Writes require `X-KKY-Admin-Password` or an admin token. The password itself is never stored in Worker variables; the Worker compares its SHA-256 value with the `POLICY_ADMIN_PASSWORD_SHA256` secret.

## Write safeguards

- Only the three allow-listed JSON paths can be written.
- Payload size is limited to 128 KiB.
- KKY Tool policy, Family Browser bootstrap, and bootstrap index have separate schema checks.
- The current R2 object is copied to `history/<path>/...json` before a changed value is written.
- The admin page sends the last `ETag` through `If-Match`. A stale page receives HTTP `412` instead of overwriting a newer change.
- The admin page immediately reads the public URL again and compares the saved JSON.

## Local verification

```powershell
pnpm install
pnpm run check
pnpm test
pnpm exec wrangler deploy --dry-run
```

The browser save flow is covered by `tools/homepage/test-admin-mobile.js` in the KKY Tool workspace.

## First deployment

```powershell
pnpm exec wrangler login
pnpm exec wrangler r2 bucket create kky-policy-config

pnpm exec wrangler r2 object put kky-policy-config/kky-tool/user-access.json `
  --file=../kky-tool/user-access.json --content-type=application/json --remote
pnpm exec wrangler r2 object put kky-policy-config/family-browser/bootstrap.json `
  --file=../family-browser/bootstrap.json --content-type=application/json --remote
pnpm exec wrangler r2 object put kky-policy-config/family-browser/bootstrap-index.json `
  --file=../family-browser/bootstrap-index.json --content-type=application/json --remote

pnpm exec wrangler secret put POLICY_ADMIN_PASSWORD_SHA256
pnpm exec wrangler deploy
```

Set `POLICY_ADMIN_PASSWORD_SHA256` to the SHA-256 constant used by the unified homepage admin screen. Keep `REQUESTS_UPSTREAM_URL`, `GITHUB_TOKEN`, and existing secrets when updating the same Worker.

## Recovery

1. List history objects under `history/<public-path>/` in the R2 bucket.
2. Download the required JSON and validate it locally.
3. Upload it back to its original public-path key.
4. Open the public URL with cache disabled and confirm `X-KKY-Config-Source: r2`.

If a current object is missing and `CONFIG_FALLBACK_TO_GITHUB=true`, the next read validates the corresponding repository JSON, seeds R2, and identifies that one response as `github-migration`. Normal reads after that use R2.
