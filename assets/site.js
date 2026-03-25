const packageBaseName = "KKY_Tool_Revit(2019,21,23,25)_v";
const requestConfig = window.KKY_REQUESTS_CONFIG || {};
const requestApiUrl = String(requestConfig.requestApiUrl || "").trim();
const maxVisibleRequests = Number(requestConfig.maxVisibleRequests || 10);
const draftStorageKey = "kky-tool-request-draft";
const ownershipStorageKey = "kky-tool-request-ownership";

const text = {
  releaseNotesEmpty: "\uBC30\uD3EC \uB178\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  packageCheckNeeded: "\uCD5C\uC2E0 \uD328\uD0A4\uC9C0 \uD655\uC778 \uD544\uC694",
  exeCheckNeeded: "\uCD5C\uC2E0 \uC124\uCE58 \uD30C\uC77C \uD655\uC778 \uD544\uC694",
  latestJsonLoadFailed: "latest.json\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
  validation: "\uD504\uB85C\uC81D\uD2B8\uBA85, \uC791\uC131\uC790 \uC774\uB984, \uC5C5\uBB34 \uC720\uD615, \uBD88\uD3B8\uD55C \uC810, \uC788\uC73C\uBA74 \uC88B\uC740 \uAE30\uB2A5\uC744 \uC801\uC5B4\uC8FC\uC138\uC694.",
  apiMissing: "\uC800\uC7A5 \uAE30\uB2A5\uC774 \uC544\uC9C1 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. assets/site-config.js\uC5D0 Apps Script \uC6F9\uC571 \uC8FC\uC18C\uB97C \uB123\uC5B4\uC8FC\uC138\uC694.",
  copyDone: "\uBCF5\uC0AC \uC644\uB8CC",
  copyDefault: "\uB0B4\uC6A9 \uBCF5\uC0AC",
  copyFailed: "\uD074\uB9BD\uBCF4\uB4DC \uBCF5\uC0AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB0B4\uC6A9\uC744 \uC9C1\uC811 \uBCF5\uC0AC\uD574\uC8FC\uC138\uC694.",
  emptyRequests: "\uC544\uC9C1 \uB4F1\uB85D\uB41C \uC694\uCCAD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  requestLoading: "\uB4F1\uB85D\uB41C \uC694\uCCAD\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.",
  requestLoadFailed: "\uC694\uCCAD \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC6F9\uC571 \uC8FC\uC18C\uC640 \uBC30\uD3EC \uC0C1\uD0DC\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
  requestCreatePending: "\uB4F1\uB85D \uC911\uC785\uB2C8\uB2E4. \uC7A0\uC2DC\uB9CC \uAE30\uB2E4\uB824\uC8FC\uC138\uC694.",
  requestCreateDone: "\uB4F1\uB85D\uD588\uC2B5\uB2C8\uB2E4. \uC544\uB798 \uCD5C\uADFC \uC694\uCCAD\uC5D0\uC11C \uBC14\uB85C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  requestCreateFailed: "\uB4F1\uB85D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC6F9\uC571 \uBC30\uD3EC \uC8FC\uC18C \uB610\uB294 \uAD8C\uD55C \uC124\uC815\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.",
  requestDeleting: "\uC0AD\uC81C \uC911\uC785\uB2C8\uB2E4.",
  requestDeleteDone: "\uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.",
  requestDeleteFailed: "\uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.",
  requestDeleteOwnOnly: "\uC774 \uAE30\uAE30\uC5D0\uC11C \uB4F1\uB85D\uD55C \uC694\uCCAD\uB9CC \uC0AD\uC81C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  requestDeleteConfirm: "\uC774 \uC694\uCCAD\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?",
  requestDeleteButton: "\uC0AD\uC81C",
  requestRefresh: "\uC0C8\uB85C \uBD88\uB7EC\uC624\uAE30",
  requestSubmit: "\uB4F1\uB85D\uD558\uAE30",
  requestSubmitLoading: "\uB4F1\uB85D \uC911...",
  requestFrequencyFallback: "\uBE48\uB3C4 \uBBF8\uC785\uB825",
  requestIdeaPrefix: "\uD544\uC694 \uAE30\uB2A5",
  requestNotePrefix: "\uBA54\uBAA8",
  requestConfigHelp: "\uC800\uC7A5 \uAE30\uB2A5 \uC5F0\uACB0 \uC804\uC785\uB2C8\uB2E4. assets/site-config.js\uC5D0 Apps Script \uC6F9\uC571 \uC8FC\uC18C\uB97C \uB123\uC73C\uBA74 \uBAA9\uB85D\uC774 \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
  releaseHistoryLoading: "\uC5C5\uB370\uC774\uD2B8 \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.",
  releaseHistoryEmpty: "\uC544\uC9C1 \uAE30\uB85D\uB41C \uC5C5\uB370\uC774\uD2B8 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  releaseHistoryFailed: "\uC5C5\uB370\uC774\uD2B8 \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
  releaseHistoryNotesEmpty: "\uC138\uBD80 \uBCC0\uACBD \uC0AC\uD56D \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  releaseHistoryZip: "\uC5C5\uB370\uC774\uD2B8 ZIP",
  releaseHistoryExe: "\uC124\uCE58 EXE",
  releaseHistoryVersionPrefix: "\uBC84\uC804"
};

function updateReleaseNotes(rawText) {
  const releaseNotes = document.getElementById("release-notes");
  if (!releaseNotes) {
    return;
  }

  const lines = String(rawText || "")
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  releaseNotes.innerHTML = "";

  const entries = lines.length ? lines : [text.releaseNotesEmpty];
  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    releaseNotes.appendChild(item);
  });
}

function setReleaseInfo(data) {
  const version = String(data.version || "").trim();
  const releaseDate = String(data.publishedAt || "-").trim() || "-";
  const zipUrl = String(data.url || "latest.json").trim() || "latest.json";
  const packageName = zipUrl.split("/").pop() || "latest package";
  const exeName = version ? `${packageBaseName}${version}.exe` : "latest executable";
  const exeUrl = version ? `${packageBaseName}${version}.exe` : "latest.json";

  const versionElement = document.getElementById("release-version");
  const dateElement = document.getElementById("release-date");
  const zipElement = document.getElementById("download-zip");
  const exeElement = document.getElementById("download-exe");
  const packageElement = document.getElementById("package-file-label");
  const exeNameElement = document.getElementById("exe-file-label");

  if (versionElement) versionElement.textContent = version ? `v${version}` : "-";
  if (dateElement) dateElement.textContent = releaseDate;
  if (zipElement) zipElement.href = zipUrl;
  if (exeElement) exeElement.href = exeUrl;
  if (packageElement) packageElement.textContent = packageName;
  if (exeNameElement) exeNameElement.textContent = exeName;

  updateReleaseNotes(data.notes);
}

async function loadReleaseInfo() {
  const versionElement = document.getElementById("release-version");
  if (!versionElement) {
    return;
  }

  try {
    const response = await fetch("latest.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    setReleaseInfo(data);
  } catch (error) {
    const packageElement = document.getElementById("package-file-label");
    const exeNameElement = document.getElementById("exe-file-label");
    if (packageElement) packageElement.textContent = text.packageCheckNeeded;
    if (exeNameElement) exeNameElement.textContent = text.exeCheckNeeded;
    updateReleaseNotes(text.latestJsonLoadFailed);
  }
}

function normalizeReleaseNotes(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderReleaseHistory(items, containerId, maxItems = Number.POSITIVE_INFINITY) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  if (!Array.isArray(items) || !items.length) {
    container.innerHTML = `<p class="empty-state">${text.releaseHistoryEmpty}</p>`;
    return;
  }

  container.innerHTML = items
    .slice(0, maxItems)
    .map((item) => {
      const version = escapeHtml(item.version || "-");
      const date = escapeHtml(item.publishedAt || "-");
      const notes = normalizeReleaseNotes(item.notes);
      const packageUrl = escapeHtml(item.packageUrl || "latest.json");
      const installerUrl = escapeHtml(item.installerUrl || "latest.json");
      const notesHtml = (notes.length ? notes : [text.releaseHistoryNotesEmpty])
        .map((note) => `<li>${escapeHtml(note)}</li>`)
        .join("");

      return `
        <article class="release-history-card">
          <div class="release-history-head">
            <div>
              <div class="meta-label">${text.releaseHistoryVersionPrefix}</div>
              <div class="release-history-version">v${version}</div>
            </div>
            <div>
              <div class="meta-label">배포일</div>
              <div class="release-history-date">${date}</div>
            </div>
          </div>
          <ul class="release-history-notes">${notesHtml}</ul>
          <div class="release-history-links">
            <a class="text-link" href="${packageUrl}">${text.releaseHistoryZip}</a>
            <a class="text-link" href="${installerUrl}">${text.releaseHistoryExe}</a>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadReleaseHistory() {
  const historyRoot = document.getElementById("release-history");
  const previewRoot = document.getElementById("release-history-preview");
  if (!historyRoot && !previewRoot) {
    return;
  }

  if (historyRoot) {
    historyRoot.innerHTML = `<p class="empty-state">${text.releaseHistoryLoading}</p>`;
  }

  if (previewRoot) {
    previewRoot.innerHTML = `<p class="empty-state">${text.releaseHistoryLoading}</p>`;
  }

  try {
    const response = await fetch("release-history.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderReleaseHistory(data, "release-history");
    renderReleaseHistory(data, "release-history-preview", 2);
  } catch (error) {
    if (historyRoot) {
      historyRoot.innerHTML = `<p class="empty-state">${text.releaseHistoryFailed}</p>`;
    }

    if (previewRoot) {
      previewRoot.innerHTML = `<p class="empty-state">${text.releaseHistoryFailed}</p>`;
    }
  }
}

function formField(id) {
  return document.getElementById(id);
}

function collectRequestValues() {
  return {
    site: formField("field-site")?.value.trim() || "",
    author: formField("field-author")?.value.trim() || "",
    task: formField("field-task")?.value.trim() || "",
    problem: formField("field-problem")?.value.trim() || "",
    idea: formField("field-idea")?.value.trim() || "",
    duration: formField("field-duration")?.value.trim() || "",
    frequency: formField("field-frequency")?.value.trim() || "",
    note: formField("field-note")?.value.trim() || ""
  };
}

function buildRequestText() {
  const values = collectRequestValues();

  return [
    `\uD504\uB85C\uC81D\uD2B8\uBA85: ${values.site || "-"}`,
    `\uC791\uC131\uC790: ${values.author || "-"}`,
    `\uC5C5\uBB34 \uC720\uD615: ${values.task || "-"}`,
    `\uBD88\uD3B8\uD55C \uC810: ${values.problem || "-"}`,
    `\uC788\uC73C\uBA74 \uC88B\uC740 \uAE30\uB2A5: ${values.idea || "-"}`,
    `\uC18C\uC694 \uC2DC\uAC04: ${values.duration || "-"}`,
    `\uBE48\uB3C4: ${values.frequency || "-"}`,
    `\uBA54\uBAA8: ${values.note || "-"}`
  ].join("\n");
}

function setRequestStatus(message, tone = "") {
  const status = document.getElementById("request-status");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.remove("is-error", "is-success");

  if (tone === "error") {
    status.classList.add("is-error");
  }

  if (tone === "success") {
    status.classList.add("is-success");
  }
}

function validateRequest(values) {
  if (!values.site || !values.author || !values.task || !values.problem || !values.idea) {
    return text.validation;
  }

  return "";
}

function saveDraft() {
  const form = document.getElementById("request-form");
  if (!form) {
    return;
  }

  localStorage.setItem(draftStorageKey, JSON.stringify(collectRequestValues()));
}

function loadDraft() {
  const form = document.getElementById("request-form");
  if (!form) {
    return;
  }

  const raw = localStorage.getItem(draftStorageKey);
  if (!raw) {
    return;
  }

  try {
    const values = JSON.parse(raw);
    formField("field-site").value = values.site || "";
    formField("field-author").value = values.author || "";
    formField("field-task").value = values.task || "";
    formField("field-problem").value = values.problem || "";
    formField("field-idea").value = values.idea || "";
    formField("field-duration").value = values.duration || "";
    formField("field-frequency").value = values.frequency || "";
    formField("field-note").value = values.note || "";
  } catch (error) {
    localStorage.removeItem(draftStorageKey);
  }
}

function clearDraft() {
  localStorage.removeItem(draftStorageKey);
}

function loadOwnershipMap() {
  try {
    return JSON.parse(localStorage.getItem(ownershipStorageKey) || "{}");
  } catch (error) {
    return {};
  }
}

function saveOwnershipMap(map) {
  localStorage.setItem(ownershipStorageKey, JSON.stringify(map));
}

function rememberOwnership(id, deleteToken) {
  const map = loadOwnershipMap();
  map[id] = deleteToken;
  saveOwnershipMap(map);
}

function forgetOwnership(id) {
  const map = loadOwnershipMap();
  delete map[id];
  saveOwnershipMap(map);
}

function deleteTokenFor(id) {
  return loadOwnershipMap()[id] || "";
}

function createRequestId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function copyRequestText() {
  const button = document.getElementById("copy-request");
  if (!button) {
    return;
  }

  try {
    await navigator.clipboard.writeText(buildRequestText());
    button.textContent = text.copyDone;
    button.classList.add("is-done");
    window.setTimeout(() => {
      button.textContent = text.copyDefault;
      button.classList.remove("is-done");
    }, 1600);
  } catch (error) {
    window.alert(text.copyFailed);
  }
}

function formatRequestDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDeleteButton(item) {
  if (!item.id || !deleteTokenFor(item.id)) {
    return "";
  }

  return `<button class="delete-button" data-request-id="${escapeHtml(item.id)}" type="button">${text.requestDeleteButton}</button>`;
}

function renderRequestList(items) {
  const container = document.getElementById("request-list");
  if (!container) {
    return;
  }

  if (!Array.isArray(items) || !items.length) {
    container.innerHTML = `<p class="empty-state">${text.emptyRequests}</p>`;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const site = escapeHtml(item.site);
      const author = escapeHtml(item.author || "-");
      const date = escapeHtml(formatRequestDate(item.created_at));
      const task = escapeHtml(item.task);
      const frequency = escapeHtml(item.frequency || text.requestFrequencyFallback);
      const problem = escapeHtml(item.problem);
      const idea = escapeHtml(item.idea);
      const note = item.note ? `<div class="request-card-note">${text.requestNotePrefix}: ${escapeHtml(item.note)}</div>` : "";

      return `
        <article class="request-card">
          <div class="request-card-head">
            <strong>${site}</strong>
            <span>${date}</span>
          </div>
          <div class="request-card-meta">${author} / ${task} / ${frequency}</div>
          <p class="request-card-body">${problem}</p>
          <div class="request-card-idea">${text.requestIdeaPrefix}: ${idea}</div>
          ${note}
          ${renderDeleteButton(item)}
        </article>
      `;
    })
    .join("");
}

async function loadRequestList() {
  const container = document.getElementById("request-list");
  if (!container) {
    return;
  }

  if (!requestApiUrl) {
    container.innerHTML = `<p class="empty-state">${text.requestConfigHelp}</p>`;
    return;
  }

  container.innerHTML = `<p class="empty-state">${text.requestLoading}</p>`;

  try {
    const url = new URL(requestApiUrl);
    url.searchParams.set("limit", String(maxVisibleRequests));

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderRequestList(Array.isArray(data.items) ? data.items : []);
  } catch (error) {
    container.innerHTML = `<p class="empty-state">${text.requestLoadFailed}</p>`;
  }
}

async function submitRequest() {
  const button = document.getElementById("save-request");
  if (!button) {
    return;
  }

  const values = collectRequestValues();
  const errorMessage = validateRequest(values);

  if (errorMessage) {
    setRequestStatus(errorMessage, "error");
    return;
  }

  if (!requestApiUrl) {
    setRequestStatus(text.apiMissing, "error");
    return;
  }

  const id = createRequestId();
  const deleteToken = createRequestId();

  button.disabled = true;
  button.textContent = text.requestSubmitLoading;
  setRequestStatus(text.requestCreatePending);

  try {
    const response = await fetch(requestApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "create",
        id,
        deleteToken,
        ...values,
        source: "mobile",
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json().catch(() => ({ ok: true }));
    if (data.ok === false) {
      throw new Error(data.message || "create_failed");
    }

    rememberOwnership(id, deleteToken);
    clearDraft();
    document.getElementById("request-form")?.reset();
    setRequestStatus(text.requestCreateDone, "success");
    await loadRequestList();
  } catch (error) {
    setRequestStatus(text.requestCreateFailed, "error");
  } finally {
    button.disabled = false;
    button.textContent = text.requestSubmit;
  }
}

async function deleteRequest(id) {
  const deleteToken = deleteTokenFor(id);
  if (!id || !deleteToken) {
    setRequestStatus(text.requestDeleteOwnOnly, "error");
    return;
  }

  if (!window.confirm(text.requestDeleteConfirm)) {
    return;
  }

  setRequestStatus(text.requestDeleting);

  try {
    const response = await fetch(requestApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "delete",
        id,
        deleteToken
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json().catch(() => ({ ok: true }));
    if (data.ok === false) {
      throw new Error(data.message || "delete_failed");
    }

    forgetOwnership(id);
    setRequestStatus(text.requestDeleteDone, "success");
    await loadRequestList();
  } catch (error) {
    setRequestStatus(text.requestDeleteFailed, "error");
  }
}

function handleRequestListClick(event) {
  const button = event.target.closest(".delete-button");
  if (!button) {
    return;
  }

  deleteRequest(button.dataset.requestId || "");
}

function setupRequestPage() {
  const form = document.getElementById("request-form");
  if (!form) {
    return;
  }

  loadDraft();
  form.addEventListener("input", saveDraft);
  document.getElementById("copy-request")?.addEventListener("click", copyRequestText);
  document.getElementById("save-request")?.addEventListener("click", submitRequest);
  document.getElementById("refresh-requests")?.addEventListener("click", loadRequestList);
  document.getElementById("request-list")?.addEventListener("click", handleRequestListClick);
  loadRequestList();
}

loadReleaseInfo();
loadReleaseHistory();
setupRequestPage();
