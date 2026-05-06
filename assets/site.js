const packageBaseName = "KKY_Tool_Revit(2019,21,23,25)_v";
const requestConfig = window.KKY_REQUESTS_CONFIG || {};
const requestApiUrl = String(requestConfig.requestApiUrl || "").trim();
const maxVisibleRequests = Number(requestConfig.maxVisibleRequests || 10);
const draftStorageKey = "kky-tool-request-draft";
const ownershipStorageKey = "kky-tool-request-ownership";

const text = {
  releaseNotesEmpty: "배포 노트가 없습니다.",
  packageCheckNeeded: "최신 패키지 확인 필요",
  exeCheckNeeded: "최신 설치 파일 확인 필요",
  latestJsonLoadFailed: "최신 업데이트 정보를 불러오지 못했습니다. 잠시 후 페이지를 새로고침하고, 계속 실패하면 관리자에게 업데이트 페이지 연결 상태 확인을 요청해 주세요.",
  validation: "프로젝트명, 작성자 이름, 요청 제목, 현재 불편한 점, 원하는 개선 방향을 모두 입력해 주세요.",
  apiMissing: "요청 목록 연결이 아직 준비되지 않았습니다. 계속 보이지 않으면 관리자에게 요청 페이지 연결 상태 확인을 요청해 주세요.",
  copyDone: "요청 내용 복사 완료",
  copyDefault: "요청 내용 복사",
  copyFailed: "클립보드 복사에 실패했습니다. 내용을 직접 복사해 주세요.",
  emptyRequests: "아직 등록된 요청이 없습니다.",
  requestLoading: "등록된 요청을 불러오는 중입니다.",
  requestLoadFailed: "요청 목록을 불러오지 못했습니다. 잠시 후 목록을 새로고침하고, 계속 실패하면 관리자에게 요청 페이지 연결 상태 확인을 요청해 주세요.",
  requestCreatePending: "요청을 등록하는 중입니다. 잠시만 기다려 주세요.",
  requestCreateDone: "요청을 등록했습니다. 아래 최근 요청에서 바로 확인할 수 있습니다.",
  requestCreateFailed: "요청 등록에 실패했습니다. 잠시 후 다시 시도하고, 계속 실패하면 관리자에게 요청 페이지 연결 상태를 전달해 주세요.",
  requestDeleting: "요청을 삭제하는 중입니다.",
  requestDeleteDone: "요청을 삭제했습니다.",
  requestDeleteFailed: "요청 삭제에 실패했습니다. 잠시 후 다시 시도하고, 계속 실패하면 관리자에게 요청 페이지 연결 상태를 전달해 주세요.",
  requestDeleteOwnOnly: "이 PC에서 등록한 요청만 삭제할 수 있습니다.",
  requestDeleteConfirm: "이 요청을 삭제할까요?",
  requestDeleteButton: "요청 삭제",
  requestRefresh: "목록 새로고침",
  requestSubmit: "요청 등록",
  requestSubmitLoading: "등록 중입니다.",
  requestFrequencyFallback: "빈도 입력 없음",
  requestIdeaPrefix: "원하는 개선 방향",
  requestNotePrefix: "메모",
  requestConfigHelp: "요청 목록 연결이 아직 준비되지 않아 목록을 표시할 수 없습니다. 관리자 설정이 완료되면 등록된 요청이 이곳에 표시됩니다.",
  requestAdminDetailPrefix: "관리자 전달 정보",
  releaseHistoryLoading: "업데이트 내역을 불러오는 중입니다.",
  releaseHistoryEmpty: "아직 기록된 업데이트 내역이 없습니다.",
  releaseHistoryFailed: "업데이트 내역을 불러오지 못했습니다. 잠시 후 페이지를 새로고침하고, 계속 실패하면 관리자에게 업데이트 내역 연결 상태 확인을 요청해 주세요.",
  releaseHistoryNotesEmpty: "세부 변경 사항 기록이 없습니다.",
  releaseHistoryZip: "업데이트 ZIP",
  releaseHistoryExe: "설치 EXE",
  releaseHistoryVersionPrefix: "버전"
};

function splitReleaseNote(entry) {
  const raw = String(entry || "").trim();
  if (!raw) {
    return { label: "", body: "" };
  }

  const colonIndex = raw.indexOf(":");
  if (colonIndex < 0) {
    return { label: "", body: raw };
  }

  return {
    label: raw.slice(0, colonIndex).trim(),
    body: raw.slice(colonIndex + 1).trim()
  };
}

function renderReleaseNoteItem(entry, itemClass = "") {
  const { label, body } = splitReleaseNote(entry);
  const classes = ["release-note-item"];
  if (itemClass) {
    classes.push(itemClass);
  }

  if (!label) {
    return `
      <li class="${classes.join(" ")}">
        <span class="release-note-text">${escapeHtml(body || text.releaseNotesEmpty)}</span>
      </li>
    `;
  }

  return `
    <li class="${classes.join(" ")}">
      <span class="release-note-tag">${escapeHtml(label)}</span>
      <span class="release-note-text">${escapeHtml(body || text.releaseNotesEmpty)}</span>
    </li>
  `;
}

function updateReleaseNotes(rawText) {
  const releaseNotes = document.getElementById("release-notes");
  if (!releaseNotes) {
    return;
  }

  const lines = normalizeReleaseNotes(rawText);

  releaseNotes.innerHTML = "";

  const entries = lines.length ? lines : [text.releaseNotesEmpty];
  entries.forEach((entry) => {
    releaseNotes.insertAdjacentHTML("beforeend", renderReleaseNoteItem(entry));
  });
}

function setReleaseInfo(data) {
  const version = String(data.version || "").trim();
  const releaseDate = String(data.publishedAt || "-").trim() || "-";
  const zipUrl = String(data.url || "latest.json").trim() || "latest.json";
  const packageName = zipUrl.split("/").pop() || "최신 업데이트 패키지";
  const exeName = version ? `${packageBaseName}${version}.exe` : "최신 설치 파일";
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
        .map((note) => renderReleaseNoteItem(note, "release-history-note-item"))
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
    `프로젝트명: ${values.site || "-"}`,
    `작성자: ${values.author || "-"}`,
    `요청 제목: ${values.task || "-"}`,
    `현재 불편한 점: ${values.problem || "-"}`,
    `원하는 개선 방향: ${values.idea || "-"}`,
    `소요 시간: ${values.duration || "-"}`,
    `빈도: ${values.frequency || "-"}`,
    `메모: ${values.note || "-"}`
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

function requestErrorMessage(userMessage, error) {
  const detail = String(error?.message || "").trim();
  if (!detail) {
    return userMessage;
  }

  return `${userMessage} (${text.requestAdminDetailPrefix}: ${detail})`;
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
          <div class="request-card-meta">
            <span><b>작성자</b>${author}</span>
            <span><b>요청</b>${task}</span>
            <span><b>빈도</b>${frequency}</span>
          </div>
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
    container.innerHTML = `<p class="empty-state">${escapeHtml(requestErrorMessage(text.requestLoadFailed, error))}</p>`;
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
        source: "homepage",
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
    setRequestStatus(requestErrorMessage(text.requestCreateFailed, error), "error");
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
    setRequestStatus(requestErrorMessage(text.requestDeleteFailed, error), "error");
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
