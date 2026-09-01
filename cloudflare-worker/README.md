# KKY Update API Worker

`https://update.zerokky.com`의 동적 API와 실시간 정책 설정을 제공하는 Cloudflare Worker다.

## Storage split

- Cloudflare D1 `kky-policy-config`
  - `kky-tool/user-access.json`
  - `family-browser/bootstrap.json`
  - `family-browser/bootstrap-index.json`
  - 변경 전 JSON은 `policy_history` 테이블에 자동 보관
- GitHub Pages / GitHub repository
  - 홈페이지 HTML, CSS, JavaScript, 이미지와 설치파일
  - D1에 아직 시드되지 않은 설정의 최초 마이그레이션 원본
- Existing request upstream
  - `/api/requests`가 기존 요청 API를 프록시한다.

애드인이 읽는 공개 URL은 바뀌지 않는다. 세 설정 파일의 정상 응답에는 `Cache-Control: no-store`, `ETag`, `X-KKY-Config-Source: d1`이 포함된다.

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
- 현재 JSON은 변경 전에 `policy_history`에 경로, 내용, ETag, 보관 시각과 함께 기록된다.
- The admin page sends the last `ETag` through `If-Match`. A stale page receives HTTP `412` instead of overwriting a newer change.
- The admin page immediately reads the public URL again and compares the saved JSON.

## Local verification

```powershell
pnpm install
pnpm run check
pnpm test
pnpm exec wrangler d1 migrations apply kky-policy-config --local
pnpm exec wrangler deploy --dry-run
```

The browser save flow is covered by `tools/homepage/test-admin-mobile.js` in the KKY Tool workspace.

## First deployment

```powershell
pnpm exec wrangler login
pnpm exec wrangler d1 create kky-policy-config --location apac
pnpm exec wrangler d1 migrations apply kky-policy-config --remote

pnpm exec wrangler secret put POLICY_ADMIN_PASSWORD_SHA256
pnpm exec wrangler deploy
```

Set `POLICY_ADMIN_PASSWORD_SHA256` to the SHA-256 constant used by the unified homepage admin screen. Keep `REQUESTS_UPSTREAM_URL`, `GITHUB_TOKEN`, and existing secrets when updating the same Worker. After deployment, request each managed public URL once to validate the existing GitHub JSON and seed the missing D1 row.

## Recovery

1. Query `policy_history` by `path` and `archived_at_utc` to find the required version.
2. Validate the selected `content` JSON locally.
3. Save it through the admin page so schema, authentication, ETag, and history safeguards remain active.
4. Open the public URL with cache disabled and confirm `X-KKY-Config-Source: d1`.

If a current row is missing and `CONFIG_FALLBACK_TO_GITHUB=true`, the next read validates the corresponding repository JSON, seeds D1, and identifies that one response as `github-migration`. Normal reads after that use D1.
