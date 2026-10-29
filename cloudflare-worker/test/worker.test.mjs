import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import worker from "../src/index.js";

const ADMIN_PASSWORD = "local-test-password";
const ADMIN_PASSWORD_SHA256 = createHash("sha256").update(ADMIN_PASSWORD).digest("hex");
const POLICY_PATH = "kky-tool/user-access.json";
const BOOTSTRAP_PATH = "family-browser/bootstrap.json";

class FakeD1Statement {
  constructor(db, sql, bindings = []) {
    this.db = db;
    this.sql = String(sql).replace(/\s+/g, " ").trim();
    this.bindings = bindings;
  }

  bind(...bindings) {
    return new FakeD1Statement(this.db, this.sql, bindings);
  }

  async first() {
    return this.db.first(this.sql, this.bindings);
  }

  async run() {
    return this.db.run(this.sql, this.bindings);
  }

  async all() {
    return this.db.all(this.sql, this.bindings);
  }
}

class FakeD1Database {
  constructor() {
    this.configs = new Map();
    this.history = [];
    this.usageEvents = [];
  }

  withSession() {
    return this;
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }

  async batch(statements) {
    const configsSnapshot = new Map([...this.configs].map(([key, value]) => [key, { ...value }]));
    const historySnapshot = this.history.map((value) => ({ ...value }));
    const usageSnapshot = this.usageEvents.map((value) => ({ ...value }));
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    } catch (error) {
      this.configs = configsSnapshot;
      this.history = historySnapshot;
      this.usageEvents = usageSnapshot;
      throw error;
    }
  }

  seed(path, content, updatedAtUtc = "2026-01-01T00:00:00.000Z") {
    this.configs.set(path, {
      content,
      etag: createHash("sha256").update(content).digest("hex"),
      updated_at_utc: updatedAtUtc
    });
  }

  getConfig(path) {
    return this.configs.get(path) || null;
  }

  historyFor(path) {
    return this.history.filter((item) => item.path === path);
  }

  all(sql, bindings) {
    if (sql.startsWith("SELECT id, received_at_utc") && sql.includes("FROM usage_events")) {
      const limit = Number(bindings[0]) || 200;
      return {
        success: true,
        results: [...this.usageEvents].sort((left, right) => right.id - left.id).slice(0, limit)
      };
    }
    throw new Error("Unsupported fake D1 all query: " + sql);
  }

  first(sql, bindings) {
    if (sql === "SELECT content, etag, updated_at_utc FROM policy_config WHERE path = ?") {
      const row = this.configs.get(bindings[0]);
      return row ? { ...row } : null;
    }
    throw new Error("Unsupported fake D1 first query: " + sql);
  }

  run(sql, bindings) {
    if (sql.startsWith("INSERT OR IGNORE INTO policy_config")) {
      const [path, content, etag, updatedAtUtc] = bindings;
      if (this.configs.has(path)) return d1Result(0);
      this.configs.set(path, { content, etag, updated_at_utc: updatedAtUtc });
      return d1Result(1);
    }

    if (sql.startsWith("INSERT INTO policy_history")) {
      const [archivedAtUtc, path, expectedEtag] = bindings;
      const current = this.configs.get(path);
      if (!current || current.etag !== expectedEtag) return d1Result(0);
      this.history.push({
        path,
        content: current.content,
        etag: current.etag,
        archived_at_utc: archivedAtUtc
      });
      return d1Result(1);
    }

    if (sql.startsWith("UPDATE policy_config SET")) {
      const [content, etag, updatedAtUtc, path, expectedEtag] = bindings;
      const current = this.configs.get(path);
      if (!current || current.etag !== expectedEtag) return d1Result(0);
      this.configs.set(path, { content, etag, updated_at_utc: updatedAtUtc });
      return d1Result(1);
    }

    if (sql.startsWith("INSERT OR IGNORE INTO usage_events")) {
      const [
        receivedAtUtc,
        clientEventId,
        sessionId,
        product,
        eventName,
        profileName,
        profileSource,
        machineHash,
        addinVersion,
        revitVersion,
        accessAllowed,
        clientTimeUtc,
        ipHash,
        country,
        userAgent
      ] = bindings;
      if (this.usageEvents.some((item) => item.client_event_id === clientEventId)) return d1Result(0);
      this.usageEvents.push({
        id: this.usageEvents.length + 1,
        received_at_utc: receivedAtUtc,
        client_event_id: clientEventId,
        session_id: sessionId,
        product,
        event_name: eventName,
        profile_name: profileName,
        profile_source: profileSource,
        machine_hash: machineHash,
        addin_version: addinVersion,
        revit_version: revitVersion,
        access_allowed: accessAllowed,
        client_time_utc: clientTimeUtc,
        ip_hash: ipHash,
        country,
        user_agent: userAgent
      });
      return d1Result(1);
    }

    if (sql.startsWith("DELETE FROM usage_events")) {
      const cutoff = bindings[0];
      const before = this.usageEvents.length;
      this.usageEvents = this.usageEvents.filter((item) => item.received_at_utc >= cutoff);
      return d1Result(before - this.usageEvents.length);
    }

    throw new Error("Unsupported fake D1 run query: " + sql);
  }
}

function d1Result(changes) {
  return { success: true, meta: { changes } };
}

function normalized(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function policy(overrides = {}) {
  return {
    enabled: true,
    allowedProfileKeywords: ["KCIM"],
    blockedProfileKeywords: [],
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

function usageEvent(overrides = {}) {
  return {
    product: "kky-tool",
    eventName: "tool_open",
    profileName: "KCIM 김경연",
    profileSource: "autodesk-revit",
    machineHash: "a".repeat(64),
    sessionId: "b".repeat(32),
    clientEventId: "c".repeat(32),
    addinVersion: "3.0.14",
    revitVersion: "2025",
    accessAllowed: true,
    clientTimeUtc: "2026-09-02T00:00:00.000Z",
    ...overrides
  };
}

async function testEnv() {
  const db = new FakeD1Database();
  db.seed(POLICY_PATH, normalized(policy()));
  db.seed(BOOTSTRAP_PATH, normalized(bootstrap()));
  return {
    CONFIG_DB: db,
    POLICY_ADMIN_PASSWORD_SHA256: ADMIN_PASSWORD_SHA256,
    ALLOWED_ORIGINS: "https://update.zerokky.com"
  };
}

async function request(env, path, init = {}) {
  return worker.fetch(new Request("https://update.zerokky.com" + path, init), env);
}

test("public policy GET is served from D1 without caching", async () => {
  const env = await testEnv();
  const response = await request(env, "/" + POLICY_PATH);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-KKY-Config-Source"), "d1");
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  assert.ok(response.headers.get("ETag"));
  assert.deepEqual(await response.json(), policy());
});

test("a missing D1 policy is migrated once from the existing GitHub file", async () => {
  const env = {
    CONFIG_DB: new FakeD1Database(),
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
    assert.equal(stored.headers.get("X-KKY-Config-Source"), "d1");
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
  const updated = policy({
    blockedProfileKeywords: ["외부업체", "TEST PROFILE"],
    allowedUsers: ["TEST\\user"]
  });

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
  assert.deepEqual(JSON.parse(env.CONFIG_DB.getConfig(POLICY_PATH).content), updated);
  assert.equal(env.CONFIG_DB.historyFor(POLICY_PATH).length, 1);
});

test("policy rejects a malformed blocked profile keyword list", async () => {
  const env = await testEnv();
  const response = await request(env, "/" + POLICY_PATH, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-KKY-Admin-Password": ADMIN_PASSWORD
    },
    body: normalized(policy({ blockedProfileKeywords: "외부업체" }))
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, "blockedProfileKeywords_must_be_a_string_array");
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
  assert.equal(JSON.parse(env.CONFIG_DB.getConfig(POLICY_PATH).content).enabled, true);
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

test("legacy Family Browser API writes to the same D1 config", async () => {
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
  assert.equal(JSON.parse(env.CONFIG_DB.getConfig(BOOTSTRAP_PATH).content).refreshMinutes, 15);
});

function groupedBootstrap() {
  const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"];
  return bootstrap({ defaultManagementGroupId: ids[0], managementGroups: ids.map((id, index) => ({
    id, name: "Group " + index, projectPathPrefixes: ["\\\\server\\Projects\\Group" + index],
    bootstrap: { managedRootPath: "\\\\server\\Admin\\Group" + index, standardLibraries: [], security: { adminProfileKeywords: ["group" + index] } }
  })) });
}

function linkedGroups() {
  const value = groupedBootstrap();
  value.managementGroups.forEach((group, index) => { group.deliveryKey = String(index + 1).repeat(64); });
  return value;
}

test("anonymous bootstrap reads never expose the management directory or connection keys", async () => {
  const env = await testEnv(), value = linkedGroups();
  env.CONFIG_DB.seed(BOOTSTRAP_PATH, normalized(value));
  for (const route of ["/" + BOOTSTRAP_PATH, "/api/family-browser", "/api/family-browser/bootstrap.json", "/api/family-browser/file?path=bootstrap.json", "/api/policy/file?path=" + BOOTSTRAP_PATH]) {
    const response = await request(env, route);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-KKY-Config-Scope"), "default-group");
    const data = await response.json();
    assert.deepEqual(data, { ...value.managementGroups[0].bootstrap, disabled: false });
    assert.ok(!JSON.stringify(data).includes(value.managementGroups[1].bootstrap.managedRootPath));
    assert.ok(!JSON.stringify(data).includes("deliveryKey"));
    assert.ok(!JSON.stringify(data).includes("managementGroups"));
  }
});

test("authenticated bootstrap reads retain the entire editable envelope and its actual etag", async () => {
  const env = await testEnv(), value = linkedGroups();
  env.CONFIG_DB.seed(BOOTSTRAP_PATH, normalized(value));
  const full = await request(env, "/" + BOOTSTRAP_PATH, { headers: { "X-KKY-Admin-Password": ADMIN_PASSWORD } });
  assert.equal(full.headers.get("X-KKY-Config-Scope"), "admin");
  assert.deepEqual(await full.json(), value);
  const publicRead = await request(env, "/" + BOOTSTRAP_PATH);
  assert.notEqual(publicRead.headers.get("ETag"), full.headers.get("ETag"));
  assert.match(full.headers.get("Vary"), /X-KKY-Admin-Password/);
  const denied = await request(env, "/" + BOOTSTRAP_PATH, { headers: { "X-KKY-Admin-Password": "wrong" } });
  assert.equal(denied.status, 401);
});

test("each secret connection delivers only its own group with legacy compatible bootstrap fields", async () => {
  const env = await testEnv(), value = linkedGroups();
  env.CONFIG_DB.seed(BOOTSTRAP_PATH, normalized(value));
  for (const group of value.managementGroups) {
    const route = "/family-browser/group-config/" + group.id + "/" + group.deliveryKey + "/bootstrap.json";
    const response = await request(env, route);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-KKY-Config-Scope"), "group");
    assert.match(response.headers.get("Cache-Control"), /no-store/);
    assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
    assert.deepEqual(await response.json(), { ...group.bootstrap, disabled: false });
    const head = await request(env, route, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    assert.equal(head.headers.get("ETag"), response.headers.get("ETag"));
  }
});

test("wrong group key, guessed id, absent key and static aliases do not disclose a group", async () => {
  const env = await testEnv(), value = linkedGroups();
  env.CONFIG_DB.seed(BOOTSTRAP_PATH, normalized(value));
  const [a, b] = value.managementGroups;
  for (const route of [
    `/family-browser/group-config/${a.id}/${b.deliveryKey}/bootstrap.json`,
    `/family-browser/group-config/${b.id}/${a.deliveryKey}/bootstrap.json`,
    `/family-browser/group-config/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/${a.deliveryKey}/bootstrap.json`,
    `/family-browser/group-config/${a.id}/bootstrap.json`,
    `/family-browser/group-config/${a.id}/${a.deliveryKey}/other.json`
  ]) {
    const response = await request(env, route);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { ok: false, message: "group_configuration_not_found" });
  }
});

test("rotating and deleting a connection revoke the old address without mutating other groups", async () => {
  const env = await testEnv(), value = linkedGroups();
  env.CONFIG_DB.seed(BOOTSTRAP_PATH, normalized(value));
  const [a, b] = value.managementGroups;
  const route = `/family-browser/group-config/${a.id}/${a.deliveryKey}/bootstrap.json`;
  const other = `/family-browser/group-config/${b.id}/${b.deliveryKey}/bootstrap.json`;
  const oldOther = await (await request(env, other)).text();
  value.managementGroups[0].deliveryKey = "a".repeat(64);
  env.CONFIG_DB.seed(BOOTSTRAP_PATH, normalized(value));
  assert.equal((await request(env, route)).status, 404);
  assert.equal(await (await request(env, other)).text(), oldOther);
  value.managementGroups = [b]; value.defaultManagementGroupId = b.id;
  env.CONFIG_DB.seed(BOOTSTRAP_PATH, normalized(value));
  assert.equal((await request(env, `/family-browser/group-config/${a.id}/${"a".repeat(64)}/bootstrap.json`)).status, 404);
  assert.equal(await (await request(env, other)).text(), oldOther);
});

test("global disable remains effective for public default and private group delivery", async () => {
  const env = await testEnv(), value = linkedGroups(); value.disabled = true;
  env.CONFIG_DB.seed(BOOTSTRAP_PATH, normalized(value));
  const a = value.managementGroups[0];
  assert.equal((await (await request(env, "/" + BOOTSTRAP_PATH)).json()).disabled, true);
  assert.equal((await (await request(env, `/family-browser/group-config/${a.id}/${a.deliveryKey}/bootstrap.json`)).json()).disabled, true);
});

test("malformed or shared connection keys cannot be saved and group links cannot write", async () => {
  const env = await testEnv();
  for (const change of [v => { v.managementGroups[0].deliveryKey = "weak"; }, v => { v.managementGroups[1].deliveryKey = v.managementGroups[0].deliveryKey; }]) {
    const value = linkedGroups(); change(value);
    const response = await request(env, "/" + BOOTSTRAP_PATH, { method: "PUT", headers: { "X-KKY-Admin-Password": ADMIN_PASSWORD }, body: normalized(value) });
    assert.equal(response.status, 400);
  }
  const value = linkedGroups(), group = value.managementGroups[0];
  const response = await request(env, `/family-browser/group-config/${group.id}/${group.deliveryKey}/bootstrap.json`, { method: "PUT", body: "{}" });
  assert.equal(response.status, 405);
  assert.equal(env.CONFIG_DB.history.length, 0);
});

test("management group save retains the previous configuration and requires authentication", async () => {
  const env = await testEnv();
  const updated = groupedBootstrap();
  const denied = await request(env, "/" + BOOTSTRAP_PATH, { method: "PUT", headers: { "Content-Type": "application/json" }, body: normalized(updated) });
  assert.equal(denied.status, 401);
  const current = await request(env, "/" + BOOTSTRAP_PATH);
  const saved = await request(env, "/" + BOOTSTRAP_PATH, { method: "PUT", headers: {
    "Content-Type": "application/json", "X-KKY-Admin-Password": ADMIN_PASSWORD, "If-Match": current.headers.get("ETag")
  }, body: normalized(updated) });
  assert.equal(saved.status, 200);
  assert.deepEqual(JSON.parse(env.CONFIG_DB.getConfig(BOOTSTRAP_PATH).content), updated);
  assert.equal(env.CONFIG_DB.historyFor(BOOTSTRAP_PATH).length, 1);
});

test("management group overlap is rejected without changing current or archived configuration", async () => {
  const env = await testEnv();
  const before = env.CONFIG_DB.getConfig(BOOTSTRAP_PATH).content;
  const updated = groupedBootstrap();
  updated.managementGroups[1].projectPathPrefixes = ["\\\\server\\Projects\\Group0\\Nested"];
  const response = await request(env, "/" + BOOTSTRAP_PATH, { method: "PUT", headers: {
    "Content-Type": "application/json", "X-KKY-Admin-Password": ADMIN_PASSWORD
  }, body: normalized(updated) });
  assert.equal(response.status, 400);
  assert.equal(env.CONFIG_DB.getConfig(BOOTSTRAP_PATH).content, before);
  assert.equal(env.CONFIG_DB.historyFor(BOOTSTRAP_PATH).length, 0);
});

test("stale group configuration cannot overwrite a later administrator save", async () => {
  const env = await testEnv();
  const before = env.CONFIG_DB.getConfig(BOOTSTRAP_PATH).content;
  const response = await request(env, "/" + BOOTSTRAP_PATH, { method: "PUT", headers: {
    "Content-Type": "application/json", "X-KKY-Admin-Password": ADMIN_PASSWORD, "If-Match": '"old-group-edition"'
  }, body: normalized(groupedBootstrap()) });
  assert.equal(response.status, 412);
  assert.equal(env.CONFIG_DB.getConfig(BOOTSTRAP_PATH).content, before);
  assert.equal(env.CONFIG_DB.historyFor(BOOTSTRAP_PATH).length, 0);
});

test("usage event records the Autodesk/Revit profile without exposing the raw IP", async () => {
  const env = await testEnv();
  const response = await request(env, "/api/usage/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "KKY_Tool_Revit/UsageAudit",
      "CF-Connecting-IP": "203.0.113.10",
      "CF-IPCountry": "KR"
    },
    body: JSON.stringify(usageEvent())
  });

  assert.equal(response.status, 202);
  assert.equal((await response.json()).accepted, true);
  assert.equal(env.CONFIG_DB.usageEvents.length, 1);
  assert.equal(env.CONFIG_DB.usageEvents[0].profile_name, "KCIM 김경연");
  assert.equal(env.CONFIG_DB.usageEvents[0].ip_hash.length, 64);
  assert.notEqual(env.CONFIG_DB.usageEvents[0].ip_hash, "203.0.113.10");
});

test("duplicate usage event ids are accepted once", async () => {
  const env = await testEnv();
  const first = await request(env, "/api/usage/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usageEvent())
  });
  const duplicate = await request(env, "/api/usage/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usageEvent())
  });

  assert.equal((await first.json()).accepted, true);
  assert.equal((await duplicate.json()).accepted, false);
  assert.equal(env.CONFIG_DB.usageEvents.length, 1);
});

test("NWC Exporter opens and export outcomes use the existing private usage list", async () => {
  const env = await testEnv();
  for (const [i, eventName] of ["tool_open", "active_export_succeeded", "file_export_failed", "scheduled_export_partial"].entries()) {
    const response = await request(env, "/api/usage/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usageEvent({ product: "nwc-exporter-plus", eventName, clientEventId: String(i + 1).repeat(32),
        modelPath: "must-not-be-stored.rvt", viewName: "must-not-be-stored" }))
    });
    assert.equal(response.status, 202);
  }
  assert.equal(env.CONFIG_DB.usageEvents.length, 4);
  const response = await request(env, "/api/usage/events?limit=500", {
    headers: { "X-KKY-Admin-Password": ADMIN_PASSWORD }
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.items.length, 4);
  assert.ok(data.items.every(item => item.product === "nwc-exporter-plus"));
  assert.ok(data.items.some(item => item.eventName === "active_export_succeeded"));
  assert.ok(!JSON.stringify(data).includes("must-not-be-stored"));
});

test("usage event validation rejects an unknown product", async () => {
  const env = await testEnv();
  const response = await request(env, "/api/usage/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usageEvent({ product: "unknown" }))
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, "usage_product_not_allowed");
});

test("usage list is available only to an authenticated administrator", async () => {
  const env = await testEnv();
  await request(env, "/api/usage/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usageEvent())
  });

  const denied = await request(env, "/api/usage/events?limit=10");
  assert.equal(denied.status, 401);

  const allowed = await request(env, "/api/usage/events?limit=10", {
    headers: { "X-KKY-Admin-Password": ADMIN_PASSWORD }
  });
  assert.equal(allowed.status, 200);
  const body = await allowed.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].profileName, "KCIM 김경연");
  assert.equal(body.items[0].accessAllowed, true);
  assert.equal(body.items[0].ipHash, undefined);
});
