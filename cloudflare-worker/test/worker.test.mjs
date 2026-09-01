import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import worker from "../src/index.js";

const ADMIN_PASSWORD = "local-test-password";
const ADMIN_PASSWORD_SHA256 = createHash("sha256").update(ADMIN_PASSWORD).digest("hex");
const POLICY_PATH = "kky-tool/user-access.json";
const BOOTSTRAP_PATH = "family-browser/bootstrap.json";

class FakeR2Object {
  constructor(key, content, options = {}) {
    this.key = key;
    this.content = String(content);
    this.etag = createHash("md5").update(this.content).digest("hex");
    this.httpEtag = `"${this.etag}"`;
    this.customMetadata = options.customMetadata || {};
    this.httpMetadata = options.httpMetadata || {};
  }

  async text() {
    return this.content;
  }
}

class FakeR2Bucket {
  constructor() {
    this.objects = new Map();
  }

  async get(key) {
    return this.objects.get(key) || null;
  }

  async put(key, content, options = {}) {
    const current = this.objects.get(key);
    const expected = options.onlyIf?.etagMatches;
    if (expected && (!current || current.etag !== expected)) return null;

    const object = new FakeR2Object(key, content, options);
    this.objects.set(key, object);
    return object;
  }
}

function normalized(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function policy(overrides = {}) {
  return {
    enabled: true,
    allowedProfileKeywords: ["KCIM"],
    allowedUsers: [],
    blockMessage: "외부 사용자는 사용할 수 없습니다.",
    ...overrides
  };
}

function bootstrap(overrides = {}) {
  return {
    version: "test",
    refreshMinutes: 5,
    managedRootPath: "D:\\FamilyBrowser",
    managedRootPathCandidates: ["D:\\FamilyBrowser"],
    managedPolicyPath: "D:\\FamilyBrowser\\Config\\standard-policy.json",
    managedPolicyPathCandidates: ["D:\\FamilyBrowser\\Config\\standard-policy.json"],
    requestStore: {
      mode: "NetworkShare",
      path: "D:\\FamilyBrowser\\Requests",
      pathCandidates: ["D:\\FamilyBrowser\\Requests"],
      endpoint: ""
    },
    ...overrides
  };
}

async function testEnv() {
  const bucket = new FakeR2Bucket();
  await bucket.put(POLICY_PATH, normalized(policy()));
  await bucket.put(BOOTSTRAP_PATH, normalized(bootstrap()));
  return {
    CONFIG_BUCKET: bucket,
    POLICY_ADMIN_PASSWORD_SHA256: ADMIN_PASSWORD_SHA256,
    ALLOWED_ORIGINS: "https://update.zerokky.com"
  };
}

async function request(env, path, init = {}) {
  return worker.fetch(new Request("https://update.zerokky.com" + path, init), env);
}

test("public policy GET is served from R2 without caching", async () => {
  const env = await testEnv();
  const response = await request(env, "/" + POLICY_PATH);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-KKY-Config-Source"), "r2");
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  assert.ok(response.headers.get("ETag"));
  assert.deepEqual(await response.json(), policy());
});

test("a missing R2 policy is migrated once from the existing GitHub file", async () => {
  const env = {
    CONFIG_BUCKET: new FakeR2Bucket(),
    POLICY_ADMIN_PASSWORD_SHA256: ADMIN_PASSWORD_SHA256,
    CONFIG_FALLBACK_TO_GITHUB: "true",
    GITHUB_OWNER: "zerokky11",
    GITHUB_REPO: "Release",
    GITHUB_BRANCH: "main"
  };
  const originalFetch = globalThis.fetch;
  let githubReads = 0;
  globalThis.fetch = async () => {
    githubReads += 1;
    return new Response(normalized(policy()), { status: 200 });
  };

  try {
    const migrated = await request(env, "/" + POLICY_PATH);
    assert.equal(migrated.status, 200);
    assert.equal(migrated.headers.get("X-KKY-Config-Source"), "github-migration");
    assert.deepEqual(await migrated.json(), policy());

    const stored = await request(env, "/" + POLICY_PATH);
    assert.equal(stored.headers.get("X-KKY-Config-Source"), "r2");
    assert.equal(githubReads, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("policy write requires admin authentication", async () => {
  const env = await testEnv();
  const response = await request(env, "/" + POLICY_PATH, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: normalized(policy({ enabled: false }))
  });

  assert.equal(response.status, 401);
  assert.equal((await response.json()).message, "unauthorized");
});

test("authenticated write updates current config and archives previous value", async () => {
  const env = await testEnv();
  const current = await request(env, "/" + POLICY_PATH);
  const etag = current.headers.get("ETag");
  const updated = policy({ allowedUsers: ["TEST\\user"] });

  const response = await request(env, "/" + POLICY_PATH, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-KKY-Admin-Password": ADMIN_PASSWORD,
      "If-Match": etag
    },
    body: normalized(updated)
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).changed, true);
  assert.deepEqual(JSON.parse((await env.CONFIG_BUCKET.get(POLICY_PATH)).content), updated);
  assert.equal([...env.CONFIG_BUCKET.objects.keys()].filter((key) => key.startsWith("history/" + POLICY_PATH + "/")).length, 1);
});

test("stale ETag cannot overwrite a newer policy", async () => {
  const env = await testEnv();
  const response = await request(env, "/" + POLICY_PATH, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-KKY-Admin-Password": ADMIN_PASSWORD,
      "If-Match": "\"stale-etag\""
    },
    body: normalized(policy({ enabled: false }))
  });

  assert.equal(response.status, 412);
  assert.equal((await response.json()).message, "config_changed_reload_required");
  assert.equal(JSON.parse((await env.CONFIG_BUCKET.get(POLICY_PATH)).content).enabled, true);
});

test("Family Browser bootstrap validation rejects an invalid refresh interval", async () => {
  const env = await testEnv();
  const response = await request(env, "/" + BOOTSTRAP_PATH, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-KKY-Admin-Password": ADMIN_PASSWORD
    },
    body: normalized(bootstrap({ refreshMinutes: 0 }))
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, "refreshMinutes_out_of_range");
});

test("legacy Family Browser API writes to the same R2 config", async () => {
  const env = await testEnv();
  const updated = bootstrap({ refreshMinutes: 15 });
  const response = await request(env, "/api/family-browser/file", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-KKY-Admin-Password": ADMIN_PASSWORD
    },
    body: JSON.stringify({ path: BOOTSTRAP_PATH, data: updated })
  });

  assert.equal(response.status, 200);
  assert.equal(JSON.parse((await env.CONFIG_BUCKET.get(BOOTSTRAP_PATH)).content).refreshMinutes, 15);
});
