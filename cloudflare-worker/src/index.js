const DEFAULT_ALLOWED_ORIGIN = "https://update.zerokky.com";
const FAMILY_BROWSER_INDEX_PATH = "family-browser/bootstrap-index.json";
const FAMILY_BROWSER_BOOTSTRAP_PATH = "family-browser/bootstrap.json";

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
        return jsonResponse({ ok: true, service: "kky-update-api" }, 200, cors);
      }

      if (pathname === "/api/requests") {
        return await proxyRequests(request, env, cors);
      }

      if (pathname.startsWith("/api/family-browser")) {
        return await handleFamilyBrowser(request, env, cors, pathname, url);
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
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-KKY-Admin-Token,X-KKY-Admin-Password",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function noStoreHeaders(cors, contentType = "application/json; charset=utf-8") {
  return {
    ...cors,
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  };
}

function jsonResponse(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: noStoreHeaders(cors)
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

  const init = {
    method: request.method,
    headers,
    redirect: "follow"
  };

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

async function handleFamilyBrowserStatic(request, env, cors, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    throw new HttpError(405, "method_not_allowed");
  }

  const repoPath = resolveFamilyBrowserStaticPath(pathname);
  const content = request.method === "HEAD" ? "" : await readGitHubFile(env, repoPath);
  return new Response(content, {
    status: 200,
    headers: noStoreHeaders(cors, contentTypeForPath(repoPath))
  });
}

function resolveFamilyBrowserStaticPath(pathname) {
  let value = String(pathname || "/family-browser")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (value === "family-browser") {
    value = "family-browser/index.html";
  }

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

async function handleFamilyBrowser(request, env, cors, pathname, url) {
  if (request.method === "GET") {
    const path = resolveFamilyBrowserReadPath(pathname, url);
    const content = await readGitHubFile(env, path);
    return new Response(content, {
      status: 200,
      headers: noStoreHeaders(cors)
    });
  }

  if (request.method === "POST" || request.method === "PUT") {
    await requireAdminToken(request, env);
    const payload = await parseJsonBody(request);
    const path = normalizeFamilyBrowserRepoPath(payload.path || FAMILY_BROWSER_BOOTSTRAP_PATH);
    const content = normalizeJsonContent(payload.content ?? payload.data ?? payload.json);
    const result = await writeGitHubFile(env, path, content, payload.message);
    return jsonResponse({ ok: true, path, commit: result.commit }, 200, cors);
  }

  throw new HttpError(405, "method_not_allowed");
}

function resolveFamilyBrowserReadPath(pathname, url) {
  if (pathname === "/api/family-browser/bootstrap" || pathname === "/api/family-browser/bootstrap.json") {
    return FAMILY_BROWSER_BOOTSTRAP_PATH;
  }

  if (pathname === "/api/family-browser/bootstrap-index" || pathname === "/api/family-browser/bootstrap-index.json") {
    return FAMILY_BROWSER_INDEX_PATH;
  }

  if (pathname === "/api/family-browser/file") {
    return normalizeFamilyBrowserRepoPath(url.searchParams.get("path") || FAMILY_BROWSER_BOOTSTRAP_PATH);
  }

  throw new HttpError(404, "family_browser_route_not_found");
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new HttpError(400, "invalid_json_body");
  }
}

function normalizeJsonContent(value) {
  if (value === undefined || value === null) {
    throw new HttpError(400, "content_required");
  }

  if (typeof value === "string") {
    JSON.parse(value);
    return value.replace(/\s*$/, "") + "\n";
  }

  return JSON.stringify(value, null, 2) + "\n";
}

function normalizeFamilyBrowserRepoPath(rawPath) {
  let value = String(rawPath || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!value) value = FAMILY_BROWSER_BOOTSTRAP_PATH;
  if (!value.startsWith("family-browser/")) value = "family-browser/" + value;

  if (!value.endsWith(".json")) {
    throw new HttpError(400, "only_json_files_are_allowed");
  }

  if (value.includes("..") || value.includes("//")) {
    throw new HttpError(400, "invalid_path");
  }

  return value;
}

async function requireAdminToken(request, env) {
  const expectedToken = String(env.FAMILY_BROWSER_ADMIN_TOKEN || "").trim();
  const expectedPasswordHash = String(env.FAMILY_BROWSER_ADMIN_PASSWORD_SHA256 || "").trim().toLowerCase();
  if (!expectedToken && !expectedPasswordHash) {
    throw new HttpError(500, "admin authentication is not configured.");
  }

  if (expectedPasswordHash) {
    const providedPassword = request.headers.get("X-KKY-Admin-Password") || "";
    if (providedPassword) {
      const providedPasswordHash = await sha256Hex(providedPassword);
      if (constantTimeEqual(providedPasswordHash, expectedPasswordHash)) {
        return;
      }
    }

    throw new HttpError(401, "unauthorized");
  }

  const auth = request.headers.get("Authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const providedToken = request.headers.get("X-KKY-Admin-Token") || bearer;

  if (expectedToken && providedToken && constantTimeEqual(providedToken, expectedToken)) {
    return;
  }

  throw new HttpError(401, "unauthorized");
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(String(text || ""));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return diff === 0;
}

function githubConfig(env) {
  const owner = String(env.GITHUB_OWNER || "zerokky11").trim();
  const repo = String(env.GITHUB_REPO || "Release").trim();
  const branch = String(env.GITHUB_BRANCH || "main").trim();
  const token = String(env.GITHUB_TOKEN || "").trim();
  if (!owner || !repo || !branch) {
    throw new HttpError(500, "github_config_missing");
  }

  return { owner, repo, branch, token };
}

function githubHeaders(config, accept = "application/vnd.github+json") {
  const headers = {
    "Accept": accept,
    "User-Agent": "kky-update-api"
  };

  if (config.token) {
    headers.Authorization = "Bearer " + config.token;
  }

  return headers;
}

function githubContentsUrl(config, path) {
  return "https://api.github.com/repos/" +
    encodeURIComponent(config.owner) + "/" +
    encodeURIComponent(config.repo) + "/contents/" +
    encodePath(path);
}

function encodePath(path) {
  return String(path || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function readGitHubFile(env, path) {
  const config = githubConfig(env);
  const target = githubContentsUrl(config, path) + "?ref=" + encodeURIComponent(config.branch);
  const response = await fetch(target, {
    headers: githubHeaders(config, "application/vnd.github.raw"),
    redirect: "follow"
  });

  if (response.status === 404) {
    throw new HttpError(404, "github_file_not_found");
  }

  if (!response.ok) {
    throw new HttpError(response.status, "github_read_failed");
  }

  return response.text();
}

async function writeGitHubFile(env, path, content, message) {
  const config = githubConfig(env);
  if (!config.token) {
    throw new HttpError(500, "GITHUB_TOKEN is not configured.");
  }

  const target = githubContentsUrl(config, path);
  const currentResponse = await fetch(target + "?ref=" + encodeURIComponent(config.branch), {
    headers: githubHeaders(config)
  });

  let sha = "";
  if (currentResponse.ok) {
    const current = await currentResponse.json();
    sha = current.sha || "";
  } else if (currentResponse.status !== 404) {
    throw new HttpError(currentResponse.status, "github_read_failed");
  }

  const body = {
    message: String(message || "Update Family Browser config"),
    content: base64EncodeUtf8(content),
    branch: config.branch
  };
  if (sha) body.sha = sha;

  const updateResponse = await fetch(target, {
    method: "PUT",
    headers: {
      ...githubHeaders(config),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!updateResponse.ok) {
    throw new HttpError(updateResponse.status, "github_write_failed");
  }

  return updateResponse.json();
}

function base64EncodeUtf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}
