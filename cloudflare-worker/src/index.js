const DEFAULT_ALLOWED_ORIGIN = "https://update.zerokky.com";
const KKY_TOOL_POLICY_PATH = "kky-tool/user-access.json";
const FAMILY_BROWSER_INDEX_PATH = "family-browser/bootstrap-index.json";
const FAMILY_BROWSER_BOOTSTRAP_PATH = "family-browser/bootstrap.json";
const MAX_CONFIG_BYTES = 128 * 1024;
const MAX_USAGE_BYTES = 16 * 1024;
const DEFAULT_USAGE_RETENTION_DAYS = 90;
const MANAGED_CONFIG_PATHS = new Set([
  KKY_TOOL_POLICY_PATH,
  FAMILY_BROWSER_INDEX_PATH,
  FAMILY_BROWSER_BOOTSTRAP_PATH
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const url = new URL(request.url);
      const pathname = normalizePathname(url.pathname);

      if (pathname === "/api/health") {
        return jsonResponse({
          ok: true,
          service: "kky-update-api",
          policyStorage: env.CONFIG_DB ? "d1" : "not_configured"
        }, 200, cors);
      }

      if (pathname === "/api/requests") {
        return await proxyRequests(request, env, cors);
      }

      if (pathname === "/api/usage/events") {
        return await handleUsageEvents(request, env, cors, url);
      }

      const publicConfigPath = managedPathFromPublicRoute(pathname);
      if (publicConfigPath) {
        return await handleManagedConfig(request, env, cors, publicConfigPath);
      }

      if (pathname.startsWith("/api/family-browser")) {
        return await handleFamilyBrowserApi(request, env, cors, pathname, url);
      }

      if (pathname === "/api/policy/file") {
        return await handlePolicyApi(request, env, cors, url);
      }

      if (pathname === "/family-browser" || pathname.startsWith("/family-browser/")) {
        return await handleFamilyBrowserStatic(request, env, cors, pathname);
      }

      return jsonResponse({ ok: false, message: "not_found" }, 404, cors);
    } catch (error) {
      const status = Number(error.status) || 500;
      const message = error.message || "internal_error";
      return jsonResponse({ ok: false, message }, status, cors);
    }
  }
};

function normalizePathname(pathname) {
  const value = String(pathname || "/").replace(/\/+$/, "");
  return value || "/";
}

function managedPathFromPublicRoute(pathname) {
  const path = String(pathname || "").replace(/^\/+/, "");
  return MANAGED_CONFIG_PATHS.has(path) ? path : "";
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || DEFAULT_ALLOWED_ORIGIN;
  const configured = String(env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGIN)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allowOrigin = configured.includes("*") || configured.includes(origin)
    ? origin
    : (configured[0] || DEFAULT_ALLOWED_ORIGIN);

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,If-Match,X-KKY-Admin-Token,X-KKY-Admin-Password",
    "Access-Control-Expose-Headers": "ETag,X-KKY-Config-Source",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function noStoreHeaders(cors, contentType = "application/json; charset=utf-8") {
  return {
    ...cors,
    "Content-Type": contentType,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff"
  };
}

function jsonResponse(data, status, cors, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...noStoreHeaders(cors),
      ...extraHeaders
    }
  });
}

async function proxyRequests(request, env, cors) {
  const upstream = String(env.REQUESTS_UPSTREAM_URL || "").trim();
  if (!upstream) {
    throw new HttpError(500, "REQUESTS_UPSTREAM_URL is not configured.");
  }

  if (request.method !== "GET" && request.method !== "POST") {
    throw new HttpError(405, "method_not_allowed");
  }

  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(upstream);
  for (const [key, value] of sourceUrl.searchParams.entries()) {
    targetUrl.searchParams.set(key, value);
  }

  const headers = new Headers();
  headers.set("Accept", "application/json");
  const init = { method: request.method, headers, redirect: "follow" };

  if (request.method === "POST") {
    headers.set("Content-Type", request.headers.get("Content-Type") || "text/plain;charset=utf-8");
    init.body = await request.text();
  }

  const response = await fetch(targetUrl.toString(), init);
  const contentType = response.headers.get("Content-Type") || "application/json; charset=utf-8";
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: noStoreHeaders(cors, contentType)
  });
}

async function handleUsageEvents(request, env, cors, url) {
  if (request.method === "POST") {
    const payload = await parseUsageBody(request);
    const event = normalizeUsageEvent(payload);
    const accepted = await writeUsageEvent(request, env, event);
    return jsonResponse({ ok: true, accepted }, 202, cors);
  }

  if (request.method === "GET") {
    await requireAdmin(request, env);
    const limit = normalizeUsageLimit(url.searchParams.get("limit"));
    const items = await readUsageEvents(env, limit);
    return jsonResponse({ ok: true, items, limit }, 200, cors);
  }

  throw new HttpError(405, "method_not_allowed");
}

async function parseUsageBody(request) {
  const text = await request.text();
  if (!text.trim()) throw new HttpError(400, "usage_event_required");
  if (new TextEncoder().encode(text).length > MAX_USAGE_BYTES) {
    throw new HttpError(413, "usage_event_too_large");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new HttpError(400, "invalid_json_body");
  }
}

function normalizeUsageEvent(payload) {
  requirePlainObject(payload, "usage_event_must_be_an_object");

  const product = usageString(payload.product, "product", 100, true).toLowerCase();
  if (product !== "kky-tool" && product !== "family-browser") {
    throw new HttpError(400, "usage_product_not_allowed");
  }

  const eventName = usageString(payload.eventName, "eventName", 100, true).toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(eventName)) {
    throw new HttpError(400, "usage_event_name_invalid");
  }

  const clientEventId = usageString(payload.clientEventId, "clientEventId", 100, true);
  const sessionId = usageString(payload.sessionId, "sessionId", 100, true);
  if (!/^[a-zA-Z0-9-]+$/.test(clientEventId) || !/^[a-zA-Z0-9-]+$/.test(sessionId)) {
    throw new HttpError(400, "usage_event_id_invalid");
  }

  const machineHash = usageString(payload.machineHash, "machineHash", 128, false).toLowerCase();
  if (machineHash && !/^[a-f0-9]{64}$/.test(machineHash)) {
    throw new HttpError(400, "usage_machine_hash_invalid");
  }
  if (typeof payload.accessAllowed !== "boolean") {
    throw new HttpError(400, "usage_access_allowed_must_be_boolean");
  }

  return {
    clientEventId,
    sessionId,
    product,
    eventName,
    profileName: usageString(payload.profileName, "profileName", 500, false),
    profileSource: usageString(payload.profileSource, "profileSource", 100, false),
    machineHash,
    addinVersion: usageString(payload.addinVersion, "addinVersion", 100, false),
    revitVersion: usageString(payload.revitVersion, "revitVersion", 100, false),
    accessAllowed: payload.accessAllowed,
    clientTimeUtc: usageString(payload.clientTimeUtc, "clientTimeUtc", 100, false)
  };
}

function usageString(value, name, maxLength, required) {
  if (value === undefined || value === null) {
    if (required) throw new HttpError(400, `usage_${name}_required`);
    return "";
  }
  if (typeof value !== "string") throw new HttpError(400, `usage_${name}_must_be_a_string`);
  const normalized = value.trim();
  if (required && !normalized) throw new HttpError(400, `usage_${name}_required`);
  if (normalized.length > maxLength) throw new HttpError(400, `usage_${name}_too_long`);
  return normalized;
}

function normalizeUsageLimit(value) {
  const parsed = Number.parseInt(String(value || "200"), 10);
  if (!Number.isFinite(parsed)) return 200;
  return Math.max(1, Math.min(parsed, 500));
}

async function writeUsageEvent(request, env, event) {
  const session = primaryConfigSession(env);
  const receivedAtUtc = new Date().toISOString();
  const ipHash = await usageIpHash(request, env);
  const country = usageHeader(request.headers.get("CF-IPCountry"), 16);
  const userAgent = usageHeader(request.headers.get("User-Agent"), 500);

  const result = await session.prepare(
    "INSERT OR IGNORE INTO usage_events " +
    "(received_at_utc, client_event_id, session_id, product, event_name, profile_name, profile_source, " +
    "machine_hash, addin_version, revit_version, access_allowed, client_time_utc, ip_hash, country, user_agent) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    receivedAtUtc,
    event.clientEventId,
    event.sessionId,
    event.product,
    event.eventName,
    event.profileName,
    event.profileSource,
    event.machineHash,
    event.addinVersion,
    event.revitVersion,
    event.accessAllowed ? 1 : 0,
    event.clientTimeUtc,
    ipHash,
    country,
    userAgent
  ).run();

  await pruneUsageEvents(session, env, receivedAtUtc);
  return d1Changes(result) === 1;
}

async function readUsageEvents(env, limit) {
  const result = await primaryConfigSession(env).prepare(
    "SELECT id, received_at_utc, client_event_id, session_id, product, event_name, profile_name, " +
    "profile_source, machine_hash, addin_version, revit_version, access_allowed, client_time_utc, country " +
    "FROM usage_events ORDER BY id DESC LIMIT ?"
  ).bind(limit).all();

  return (result?.results || []).map((row) => ({
    id: Number(row.id),
    receivedAtUtc: String(row.received_at_utc || ""),
    clientEventId: String(row.client_event_id || ""),
    sessionId: String(row.session_id || ""),
    product: String(row.product || ""),
    eventName: String(row.event_name || ""),
    profileName: String(row.profile_name || ""),
    profileSource: String(row.profile_source || ""),
    machineHash: String(row.machine_hash || ""),
    addinVersion: String(row.addin_version || ""),
    revitVersion: String(row.revit_version || ""),
    accessAllowed: Number(row.access_allowed) === 1,
    clientTimeUtc: String(row.client_time_utc || ""),
    country: String(row.country || "")
  }));
}

async function pruneUsageEvents(session, env, nowUtc) {
  const configured = Number.parseInt(String(env.USAGE_RETENTION_DAYS || DEFAULT_USAGE_RETENTION_DAYS), 10);
  const days = Number.isFinite(configured) ? Math.max(1, Math.min(configured, 3650)) : DEFAULT_USAGE_RETENTION_DAYS;
  const cutoff = new Date(Date.parse(nowUtc) - days * 24 * 60 * 60 * 1000).toISOString();
  await session.prepare("DELETE FROM usage_events WHERE received_at_utc < ?").bind(cutoff).run();
}

async function usageIpHash(request, env) {
  const ip = String(request.headers.get("CF-Connecting-IP") || "").trim();
  const salt = String(env.POLICY_ADMIN_PASSWORD_SHA256 || env.FAMILY_BROWSER_ADMIN_PASSWORD_SHA256 || "").trim();
  if (!ip || !salt) return "";
  return sha256Hex(`usage:${salt}:${ip}`);
}

function usageHeader(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

async function handleManagedConfig(request, env, cors, path) {
  if (request.method === "GET" || request.method === "HEAD") {
    const stored = await readManagedConfig(env, path);
    return new Response(request.method === "HEAD" ? null : stored.content, {
      status: 200,
      headers: {
        ...noStoreHeaders(cors),
        "ETag": stored.etag,
        "X-KKY-Config-Source": stored.source
      }
    });
  }

  if (request.method === "POST" || request.method === "PUT") {
    await requireAdmin(request, env);
    const content = await readDirectConfigBody(request);
    const result = await writeManagedConfig(env, path, content, request.headers.get("If-Match"));
    return jsonResponse({
      ok: true,
      path,
      changed: result.changed,
      updatedAtUtc: result.updatedAtUtc
    }, 200, cors, {
      "ETag": result.etag,
      "X-KKY-Config-Source": "d1"
    });
  }

  throw new HttpError(405, "method_not_allowed");
}

async function handlePolicyApi(request, env, cors, url) {
  if (request.method === "GET" || request.method === "HEAD") {
    const path = normalizeManagedConfigPath(url.searchParams.get("path") || KKY_TOOL_POLICY_PATH);
    return await handleManagedConfig(request, env, cors, path);
  }

  if (request.method === "POST" || request.method === "PUT") {
    await requireAdmin(request, env);
    const payload = await parseJsonBody(request);
    const path = normalizeManagedConfigPath(payload.path || KKY_TOOL_POLICY_PATH);
    const content = normalizeJsonContent(payload.content ?? payload.data ?? payload.json);
    const result = await writeManagedConfig(env, path, content, request.headers.get("If-Match"));
    return jsonResponse({
      ok: true,
      path,
      changed: result.changed,
      updatedAtUtc: result.updatedAtUtc
    }, 200, cors, {
      "ETag": result.etag,
      "X-KKY-Config-Source": "d1"
    });
  }

  throw new HttpError(405, "method_not_allowed");
}

async function handleFamilyBrowserApi(request, env, cors, pathname, url) {
  if (request.method === "GET" || request.method === "HEAD") {
    const path = resolveFamilyBrowserReadPath(pathname, url);
    return await handleManagedConfig(request, env, cors, path);
  }

  if (request.method === "POST" || request.method === "PUT") {
    await requireAdmin(request, env);
    const payload = await parseJsonBody(request);
    const path = normalizeFamilyBrowserConfigPath(payload.path || FAMILY_BROWSER_BOOTSTRAP_PATH);
    const content = normalizeJsonContent(payload.content ?? payload.data ?? payload.json);
    const result = await writeManagedConfig(env, path, content, request.headers.get("If-Match"));
    return jsonResponse({
      ok: true,
      path,
      changed: result.changed,
      updatedAtUtc: result.updatedAtUtc
    }, 200, cors, {
      "ETag": result.etag,
      "X-KKY-Config-Source": "d1"
    });
  }

  throw new HttpError(405, "method_not_allowed");
}

function resolveFamilyBrowserReadPath(pathname, url) {
  if (pathname === "/api/family-browser" || pathname === "/api/family-browser/bootstrap" || pathname === "/api/family-browser/bootstrap.json") {
    return FAMILY_BROWSER_BOOTSTRAP_PATH;
  }
  if (pathname === "/api/family-browser/bootstrap-index" || pathname === "/api/family-browser/bootstrap-index.json") {
    return FAMILY_BROWSER_INDEX_PATH;
  }
  if (pathname === "/api/family-browser/file") {
    return normalizeFamilyBrowserConfigPath(url.searchParams.get("path") || FAMILY_BROWSER_BOOTSTRAP_PATH);
  }
  throw new HttpError(404, "family_browser_route_not_found");
}

async function readDirectConfigBody(request) {
  const text = await request.text();
  if (!text.trim()) throw new HttpError(400, "content_required");
  return normalizeJsonContent(text);
}

async function readManagedConfig(env, path) {
  const session = primaryConfigSession(env);
  let row = await selectConfigRow(session, path);
  let source = "d1";

  if (!row) {
    if (String(env.CONFIG_FALLBACK_TO_GITHUB || "true").toLowerCase() === "false") {
      throw new HttpError(404, "config_not_found");
    }

    const migratedContent = normalizeJsonContent(await readGitHubFile(env, path));
    validateManagedConfig(path, migratedContent);
    const migratedAtUtc = new Date().toISOString();
    const migratedEtag = await sha256Hex(migratedContent);
    const inserted = await session.prepare(
      "INSERT OR IGNORE INTO policy_config (path, content, etag, updated_at_utc) VALUES (?, ?, ?, ?)"
    ).bind(path, migratedContent, migratedEtag, migratedAtUtc).run();
    row = await selectConfigRow(session, path);
    source = d1Changes(inserted) === 1 ? "github-migration" : "d1";
  }

  if (!row) throw new HttpError(500, "config_storage_read_failed");
  return {
    content: String(row.content),
    etag: httpEtag(row.etag),
    source
  };
}

async function writeManagedConfig(env, rawPath, rawContent, ifMatch) {
  const path = normalizeManagedConfigPath(rawPath);
  const content = normalizeJsonContent(rawContent);
  validateManagedConfig(path, content);

  const session = primaryConfigSession(env);
  const current = await selectConfigRow(session, path);
  const currentEtag = current ? httpEtag(current.etag) : "";
  assertIfMatch(ifMatch, currentEtag);

  if (current) {
    if (String(current.content) === content) {
      return {
        changed: false,
        etag: currentEtag,
        updatedAtUtc: String(current.updated_at_utc || "")
      };
    }
  }

  const updatedAtUtc = new Date().toISOString();
  const nextEtag = await sha256Hex(content);

  if (current) {
    const results = await session.batch([
      session.prepare(
        "INSERT INTO policy_history (path, content, etag, archived_at_utc) " +
        "SELECT path, content, etag, ? FROM policy_config WHERE path = ? AND etag = ?"
      ).bind(updatedAtUtc, path, String(current.etag)),
      session.prepare(
        "UPDATE policy_config SET content = ?, etag = ?, updated_at_utc = ? WHERE path = ? AND etag = ?"
      ).bind(content, nextEtag, updatedAtUtc, path, String(current.etag))
    ]);
    if (d1Changes(results[1]) !== 1) throw new HttpError(412, "config_changed_reload_required");
  } else {
    const inserted = await session.prepare(
      "INSERT OR IGNORE INTO policy_config (path, content, etag, updated_at_utc) VALUES (?, ?, ?, ?)"
    ).bind(path, content, nextEtag, updatedAtUtc).run();
    if (d1Changes(inserted) !== 1) throw new HttpError(412, "config_changed_reload_required");
  }

  return {
    changed: true,
    etag: httpEtag(nextEtag),
    updatedAtUtc
  };
}

function primaryConfigSession(env) {
  const db = requireConfigDb(env);
  return typeof db.withSession === "function" ? db.withSession("first-primary") : db;
}

function requireConfigDb(env) {
  if (!env.CONFIG_DB) throw new HttpError(500, "CONFIG_DB is not configured.");
  return env.CONFIG_DB;
}

async function selectConfigRow(db, path) {
  return db.prepare(
    "SELECT content, etag, updated_at_utc FROM policy_config WHERE path = ?"
  ).bind(path).first();
}

function d1Changes(result) {
  return Number(result?.meta?.changes ?? result?.changes ?? 0);
}

function httpEtag(value) {
  return `"${normalizeEtag(value)}"`;
}

function assertIfMatch(ifMatch, currentEtag) {
  const value = String(ifMatch || "").trim();
  if (!value) return;
  if (value === "*" && currentEtag) return;

  const current = normalizeEtag(currentEtag);
  const matches = value
    .split(",")
    .map(normalizeEtag)
    .some((candidate) => candidate && candidate === current);

  if (!current || !matches) throw new HttpError(412, "config_changed_reload_required");
}

function normalizeEtag(value) {
  return String(value || "").trim().replace(/^W\//i, "").replace(/^\"|\"$/g, "");
}

function normalizeManagedConfigPath(rawPath) {
  const value = String(rawPath || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!MANAGED_CONFIG_PATHS.has(value)) throw new HttpError(400, "managed_config_path_not_allowed");
  return value;
}

function normalizeFamilyBrowserConfigPath(rawPath) {
  let value = String(rawPath || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!value) value = FAMILY_BROWSER_BOOTSTRAP_PATH;
  if (!value.startsWith("family-browser/")) value = "family-browser/" + value;
  return normalizeManagedConfigPath(value);
}

function normalizeJsonContent(value) {
  if (value === undefined || value === null) throw new HttpError(400, "content_required");

  let parsed;
  if (typeof value === "string") {
    if (new TextEncoder().encode(value).length > MAX_CONFIG_BYTES) throw new HttpError(413, "config_too_large");
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      throw new HttpError(400, "invalid_json_body");
    }
  } else {
    parsed = value;
  }

  const normalized = JSON.stringify(parsed, null, 2) + "\n";
  if (new TextEncoder().encode(normalized).length > MAX_CONFIG_BYTES) throw new HttpError(413, "config_too_large");
  return normalized;
}

function validateManagedConfig(path, content) {
  let value;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new HttpError(400, "invalid_json_body");
  }

  requirePlainObject(value, "config_must_be_an_object");
  if (path === KKY_TOOL_POLICY_PATH) return validateKkyPolicy(value);
  if (path === FAMILY_BROWSER_BOOTSTRAP_PATH) return validateFamilyBootstrap(value);
  if (path === FAMILY_BROWSER_INDEX_PATH) return validateFamilyIndex(value);
  throw new HttpError(400, "managed_config_path_not_allowed");
}

function validateKkyPolicy(value) {
  if (typeof value.enabled !== "boolean") throw new HttpError(400, "enabled_must_be_boolean");
  validateStringArray(value.allowedProfileKeywords, "allowedProfileKeywords", 500);
  validateStringArray(value.blockedProfileKeywords, "blockedProfileKeywords", 500);
  validateStringArray(value.allowedUsers, "allowedUsers", 5000);
  validateOptionalString(value.blockMessage, "blockMessage", 4000);
  validateOptionalString(value.updatedAtUtc, "updatedAtUtc", 100);
}

function validateFamilyBootstrap(value) {
  validateOptionalString(value.version, "version", 200);
  validateOptionalString(value.message, "message", 4000);
  validateOptionalString(value.standardMode, "standardMode", 200);
  validateOptionalString(value.managedRootPath, "managedRootPath", 4000);
  validateOptionalString(value.managedPolicyPath, "managedPolicyPath", 4000);
  validateStringArray(value.managedRootPathCandidates, "managedRootPathCandidates", 200);
  validateStringArray(value.managedPolicyPathCandidates, "managedPolicyPathCandidates", 200);

  if (value.refreshMinutes !== undefined) {
    const minutes = Number(value.refreshMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
      throw new HttpError(400, "refreshMinutes_out_of_range");
    }
  }
  if (value.standardLibraries !== undefined && !Array.isArray(value.standardLibraries)) {
    throw new HttpError(400, "standardLibraries_must_be_array");
  }
  if (value.security !== undefined) requirePlainObject(value.security, "security_must_be_an_object");
  if (value.requestStore !== undefined) {
    requirePlainObject(value.requestStore, "requestStore_must_be_an_object");
    validateOptionalString(value.requestStore.mode, "requestStore.mode", 200);
    validateOptionalString(value.requestStore.path, "requestStore.path", 4000);
    validateOptionalString(value.requestStore.endpoint, "requestStore.endpoint", 4000);
    validateStringArray(value.requestStore.pathCandidates, "requestStore.pathCandidates", 200);
  }
}

function validateFamilyIndex(value) {
  validateOptionalString(value.version, "version", 200);
  validateOptionalString(value.defaultProfileId, "defaultProfileId", 500);
  if (!Array.isArray(value.profiles)) throw new HttpError(400, "profiles_must_be_array");
  if (value.profiles.length > 500) throw new HttpError(400, "profiles_too_many_items");
  for (const profile of value.profiles) {
    requirePlainObject(profile, "profile_must_be_an_object");
    validateOptionalString(profile.id, "profile.id", 500);
    validateOptionalString(profile.name, "profile.name", 1000);
    validateOptionalString(profile.description, "profile.description", 4000);
    validateOptionalString(profile.url, "profile.url", 2000);
    if (profile.url && (profile.url.includes("..") || !profile.url.toLowerCase().endsWith(".json"))) {
      throw new HttpError(400, "profile_url_must_point_to_json");
    }
  }
  if (value.projectRules !== undefined && !Array.isArray(value.projectRules)) {
    throw new HttpError(400, "projectRules_must_be_array");
  }
}

function requirePlainObject(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, message);
}

function validateStringArray(value, name, maxItems) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => typeof item !== "string" || item.length > 4000)) {
    throw new HttpError(400, `${name}_must_be_a_string_array`);
  }
}

function validateOptionalString(value, name, maxLength) {
  if (value !== undefined && (typeof value !== "string" || value.length > maxLength)) {
    throw new HttpError(400, `${name}_must_be_a_string`);
  }
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new HttpError(400, "invalid_json_body");
  }
}

async function requireAdmin(request, env) {
  const expectedPasswordHashes = [env.POLICY_ADMIN_PASSWORD_SHA256, env.FAMILY_BROWSER_ADMIN_PASSWORD_SHA256]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  const expectedTokens = [env.POLICY_ADMIN_TOKEN, env.FAMILY_BROWSER_ADMIN_TOKEN]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!expectedPasswordHashes.length && !expectedTokens.length) {
    throw new HttpError(500, "admin authentication is not configured.");
  }

  const providedPassword = request.headers.get("X-KKY-Admin-Password") || "";
  if (providedPassword && expectedPasswordHashes.length) {
    const providedPasswordHash = await sha256Hex(providedPassword);
    if (expectedPasswordHashes.some((expected) => constantTimeEqual(providedPasswordHash, expected))) return;
  }

  const auth = request.headers.get("Authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const providedToken = request.headers.get("X-KKY-Admin-Token") || bearer;
  if (providedToken && expectedTokens.some((expected) => constantTimeEqual(providedToken, expected))) return;
  throw new HttpError(401, "unauthorized");
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(String(text || ""));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function handleFamilyBrowserStatic(request, env, cors, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") throw new HttpError(405, "method_not_allowed");
  const repoPath = resolveFamilyBrowserStaticPath(pathname);
  const content = request.method === "HEAD" ? "" : await readGitHubFile(env, repoPath);
  return new Response(content, {
    status: 200,
    headers: noStoreHeaders(cors, contentTypeForPath(repoPath))
  });
}

function resolveFamilyBrowserStaticPath(pathname) {
  let value = String(pathname || "/family-browser").replace(/^\/+/, "").replace(/\/+$/, "");
  if (value === "family-browser") value = "family-browser/index.html";
  if (!value.startsWith("family-browser/") || value.includes("..") || value.includes("//")) {
    throw new HttpError(400, "invalid_static_path");
  }
  return value;
}

function contentTypeForPath(path) {
  const value = String(path || "").toLowerCase();
  if (value.endsWith(".html")) return "text/html; charset=utf-8";
  if (value.endsWith(".css")) return "text/css; charset=utf-8";
  if (value.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (value.endsWith(".json")) return "application/json; charset=utf-8";
  if (value.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
  if (value.endsWith(".png")) return "image/png";
  if (value.endsWith(".jpg") || value.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function githubConfig(env) {
  const owner = String(env.GITHUB_OWNER || "zerokky11").trim();
  const repo = String(env.GITHUB_REPO || "Release").trim();
  const branch = String(env.GITHUB_BRANCH || "main").trim();
  const token = String(env.GITHUB_TOKEN || "").trim();
  if (!owner || !repo || !branch) throw new HttpError(500, "github_config_missing");
  return { owner, repo, branch, token };
}

function githubHeaders(config, accept = "application/vnd.github+json") {
  const headers = { "Accept": accept, "User-Agent": "kky-update-api" };
  if (config.token) headers.Authorization = "Bearer " + config.token;
  return headers;
}

function githubContentsUrl(config, path) {
  return "https://api.github.com/repos/" + encodeURIComponent(config.owner) + "/" +
    encodeURIComponent(config.repo) + "/contents/" + encodePath(path);
}

function encodePath(path) {
  return String(path || "").split("/").map((part) => encodeURIComponent(part)).join("/");
}

async function readGitHubFile(env, path) {
  const config = githubConfig(env);
  const target = githubContentsUrl(config, path) + "?ref=" + encodeURIComponent(config.branch);
  const response = await fetch(target, {
    headers: githubHeaders(config, "application/vnd.github.raw"),
    redirect: "follow"
  });
  if (response.status === 404) throw new HttpError(404, "github_file_not_found");
  if (!response.ok) throw new HttpError(response.status, "github_read_failed");
  return response.text();
}
