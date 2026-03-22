const packageBaseName = "KKY_Tool_Revit(2019,21,23,25)_v";

function buildRequestText() {
  const values = {
    site: document.getElementById("field-site")?.value.trim() || "-",
    task: document.getElementById("field-task")?.value.trim() || "-",
    problem: document.getElementById("field-problem")?.value.trim() || "-",
    idea: document.getElementById("field-idea")?.value.trim() || "-",
    duration: document.getElementById("field-duration")?.value.trim() || "-",
    frequency: document.getElementById("field-frequency")?.value.trim() || "-",
    note: document.getElementById("field-note")?.value.trim() || "-"
  };

  return [
    `현장명: ${values.site}`,
    `업무 유형: ${values.task}`,
    `불편한 점: ${values.problem}`,
    `있으면 좋은 기능: ${values.idea}`,
    `소요 시간: ${values.duration}`,
    `빈도: ${values.frequency}`,
    `메모: ${values.note}`
  ].join("\n");
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
      button.textContent = "요청 기록하기";
      button.classList.remove("is-done");
    }, 1600);
  } catch (error) {
    window.alert("클립보드 복사에 실패했습니다. 내용을 직접 복사해주세요.");
  }
}

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

document.getElementById("copy-request")?.addEventListener("click", copyRequestText);
loadReleaseInfo();
