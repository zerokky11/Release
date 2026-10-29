# KKY Update API Worker

`https://update.zerokky.com`의 동적 API와 실시간 정책 설정을 제공하는 Cloudflare Worker다.

## Storage split

- Cloudflare D1 `kky-policy-config`
  - `kky-tool/user-access.json`
  - `family-browser/bootstrap.json`
  - `family-browser/bootstrap-index.json`
  - 변경 전 JSON은 `policy_history` 테이블에 자동 보관
  - KKY Tool 실행 기록은 `usage_events` 테이블에 90일간 보관
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
- `GET|HEAD /family-browser/group-config/{group-id}/{connection-key}/bootstrap.json`
- `GET|PUT /api/policy/file?path=...`
- `GET|PUT /api/family-browser/file?path=...`
- `POST /api/usage/events`
- `GET /api/usage/events?limit=500` (admin only)
- `GET /family-browser/*` for the existing static Family Browser pages

Public reads do not require authentication. Writes require `X-KKY-Admin-Password` or an admin token. The password itself is never stored in Worker variables; the Worker compares its SHA-256 value with the `POLICY_ADMIN_PASSWORD_SHA256` secret.

Grouped Family Browser configuration is different: an authenticated bootstrap GET returns the complete editable envelope (`X-KKY-Config-Scope: admin`). Anonymous reads through every managed-config alias return only the default group's legacy-compatible bootstrap, never the group directory or connection keys. Its ETag describes that projection, not the private full configuration. Existing single-group JSON is unchanged.

The administrator can explicitly issue a random 256-bit connection key per group and save it with the mapping. Its HTTPS connection address returns only that group's bootstrap. Knowing this address grants read access to those settings; this is a shared capability, not company-account authentication or network-folder ACL. Do not publish these addresses or put them in the public profile index. Incorrect group/key pairs have the same 404 response. Rotation or group deletion blocks new HTTP reads of the old address; an already-running client may retain its own same-URL/project in-memory cache. That cache must not be described as immediately revoked. The existing public default group remains public for compatibility.

Configure the selected address in Family Browser's existing deployment bootstrap URL setting. The response retains the existing bootstrap shape and project-storage IDs. Homepage save does not publish worker-policy files to the network, create folder permissions, collect records into the management folder, or finish the pending unified collector. A compatible client and the existing explicit worker-settings publication step are still required.

Usage event POSTs are accepted without admin authentication so the installed add-in can report an open event. The payload is schema-validated and deduplicated by `client_event_id`. The add-in sends the Revit `Application.Username` value, add-in/Revit versions, access result, a random session id, and a locally hashed machine identifier. Raw computer names are not sent. The Worker hashes the connecting IP before storage, removes records older than `USAGE_RETENTION_DAYS`, and exposes the list only through the authenticated admin GET route. The admin response omits the stored IP hash and user agent.

## Write safeguards

- Only the three allow-listed JSON paths can be written.
- Payload size is limited to 128 KiB.
- KKY Tool policy, Family Browser bootstrap, and bootstrap index have separate schema checks.
- 현재 JSON은 변경 전에 `policy_history`에 경로, 내용, ETag, 보관 시각과 함께 기록된다.
- The admin page sends the last `ETag` through `If-Match`. A stale page receives HTTP `412` instead of overwriting a newer change.
- The admin page immediately reads the same URL with administrator authentication and compares the complete saved JSON. Failed configuration reads stop saving rather than replacing existing groups with a blank default.

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
