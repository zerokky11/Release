const packageBaseName = "KKY_Tool_Revit(2019,21,23,25)_v";
const requestConfig = window.KKY_REQUESTS_CONFIG || {};
const requestApiUrl = String(requestConfig.requestApiUrl || "").trim();
const maxVisibleRequests = Number(requestConfig.maxVisibleRequests || 10);
const draftStorageKey = "kky-tool-request-draft";
const ownershipStorageKey = "kky-tool-request-ownership";

function updateReleaseNotes(text) {
  const releaseNotes = document.getElementById("release-notes");
  if (!releaseNotes) {
    return;
  }

  const lines = String(text || "")
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!lines.length) {
    releaseNotes.innerHTML = "<li>배포 노트가 없습니다.</li>";
    return;
  }

  releaseNotes.innerHTML = lines.map((entry) => `<li>${entry}</li>`).join("");
}

function setReleaseInfo(data) {
  const version = String(data.version || "").trim();
  const releaseDate = data.publishedAt || "-";
  const zipUrl = data.url || "latest.json";
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
    if (packageElement) packageElement.textContent = "최신 패키지 확인 필요";
    if (exeNameElement) exeNameElement.textContent = "최신 설치 파일 확인 필요";
    updateReleaseNotes("latest.json을 읽지 못했습니다.");
  }
}

function formField(id) {
  return document.getElementById(id);
}

function collectRequestValues() {
  return {
    site: formField("field-site")?.value.trim() || "",
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
    `현장명: ${values.site || "-"}`,
    `업무 유형: ${values.task || "-"}`,
    `불편한 점: ${values.problem || "-"}`,
    `있으면 좋은 기능: ${values.idea || "-"}`,
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

function validateRequest(values) {
  if (!values.site || !values.task || !values.problem || !values.idea) {
    return "현장명, 업무 유형, 불편한 점, 있으면 좋은 기능은 꼭 적어주세요.";
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
    button.textContent = "복사 완료";
    button.classList.add("is-done");
    window.setTimeout(() => {
      button.textContent = "내용 복사";
      button.classList.remove("is-done");
    }, 1600);
  } catch (error) {
    window.alert("클립보드 복사에 실패했습니다. 내용을 직접 복사해주세요.");
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

  return `<button class="delete-button" data-request-id="${escapeHtml(item.id)}" type="button">삭제</button>`;
}

function renderRequestList(items) {
  const container = document.getElementById("request-list");
  if (!container) {
    return;
  }

  if (!Array.isArray(items) || !items.length) {
    container.innerHTML = '<p class="empty-state">아직 등록된 요청이 없습니다.</p>';
    return;
  }

  container.innerHTML = items
    .map((item) => {
      return `
        <article class="request-card">
          <div class="request-card-head">
            <strong>${escapeHtml(item.site)}</strong>
            <span>${escapeHtml(formatRequestDate(item.created_at))}</span>
          </div>
          <div class="request-card-meta">${escapeHtml(item.task)} · ${escapeHtml(item.frequency || "빈도 미입력")}</div>
          <p class="request-card-body">${escapeHtml(item.problem)}</p>
          <div class="request-card-idea">필요 기능: ${escapeHtml(item.idea)}</div>
          ${item.note ? `<div class="request-card-note">메모: ${escapeHtml(item.note)}</div>` : ""}
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
    container.innerHTML = '<p class="empty-state">저장 기능 연결 전입니다. `assets/site-config.js`에 Apps Script 웹앱 주소를 넣으면 목록이 표시됩니다.</p>';
    return;
  }

  container.innerHTML = '<p class="empty-state">최근 요청을 불러오는 중입니다.</p>';

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
    container.innerHTML = '<p class="empty-state">요청 목록을 불러오지 못했습니다. 웹앱 주소와 배포 상태를 확인해주세요.</p>';
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
    setRequestStatus("저장 기능이 아직 연결되지 않았습니다. `assets/site-config.js`에 Apps Script 웹앱 주소를 넣어주세요.", "error");
    return;
  }

  const id = createRequestId();
  const deleteToken = createRequestId();

  button.disabled = true;
  button.textContent = "등록 중";
  setRequestStatus("등록 중입니다. 잠시만 기다려주세요.");

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

    rememberOwnership(id, deleteToken);
    clearDraft();
    document.getElementById("request-form")?.reset();
    setRequestStatus("등록되었습니다. 아래 최근 요청에서 바로 확인할 수 있습니다.", "success");
    await loadRequestList();
  } catch (error) {
    setRequestStatus("등록에 실패했습니다. 웹앱 배포 주소 또는 권한 설정을 확인해주세요.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "등록하기";
  }
}

async function deleteRequest(id) {
  const deleteToken = deleteTokenFor(id);
  if (!id || !deleteToken) {
    setRequestStatus("이 기기에서 등록한 요청만 삭제할 수 있습니다.", "error");
    return;
  }

  if (!window.confirm("이 요청을 삭제할까요?")) {
    return;
  }

  setRequestStatus("삭제 중입니다.");

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

    forgetOwnership(id);
    setRequestStatus("삭제되었습니다.", "success");
    await loadRequestList();
  } catch (error) {
    setRequestStatus("삭제에 실패했습니다. 다시 시도해주세요.", "error");
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
setupRequestPage();
