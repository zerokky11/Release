(function () {
  const root = document.documentElement;
  const page = document.body?.dataset?.page || '';

  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.from((scope || document).querySelectorAll(selector));
  }

  function normalizeManualNav() {
    const nav = qs('[data-nav-menu]');
    if (!nav) return;

    qsa('[data-nav="features"], [data-nav="family-browser"]', nav)
      .forEach((link) => link.remove());

    let manual = qs('[data-nav="manual"]', nav);
    if (!manual) {
      manual = document.createElement('a');
      manual.dataset.nav = 'manual';
      const requests = qs('[data-nav="requests"]', nav);
      if (requests) nav.insertBefore(manual, requests);
      else nav.appendChild(manual);
    }
    manual.href = '/Manual/index.html';
    manual.textContent = '매뉴얼';
  }

  function normalizeUpdatesNav() {
    const nav = qs('[data-nav-menu]');
    if (!nav) return;

    const matches = qsa('[data-nav="updates"]', nav);
    matches.slice(1).forEach((link) => link.remove());

    let updates = matches[0];
    if (!updates) {
      updates = document.createElement('a');
      updates.dataset.nav = 'updates';
    }
    updates.href = '/updates/index.html';
    updates.textContent = '업데이트 내역';

    const requests = qs('[data-nav="requests"]', nav);
    if (requests) nav.insertBefore(updates, requests);
    else nav.appendChild(updates);
  }

  function setActiveNav() {
    const activePage = page === 'features' || page === 'family-browser' ? 'manual' : page;
    qsa('[data-nav]').forEach((link) => {
      if (link.dataset.nav === activePage) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function initNavToggle() {
    const toggle = qs('[data-nav-toggle]');
    const nav = qs('[data-nav-menu]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  async function loadJson(path) {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function formatDate(value) {
    if (!value) return '-';
    return String(value);
  }

  function applyRelease(kind, data) {
    qsa(`[data-release="${kind}"]`).forEach((panel) => {
      const downloadDisabled = panel.dataset.downloadDisabled === 'true';
      qsa('[data-release-field]', panel).forEach((el) => {
        const field = el.dataset.releaseField;
        if (field === 'publishedAt') el.textContent = formatDate(data.publishedAt);
        else el.textContent = data[field] || '-';
      });
      qsa('[data-release-download]', panel).forEach((el) => {
        if (downloadDisabled) {
          el.removeAttribute('href');
          el.setAttribute('aria-disabled', 'true');
          if ('disabled' in el) el.disabled = true;
          return;
        }
        const field = el.dataset.releaseDownload || 'installerUrl';
        const url = data[field] || data.url || '';
        if (url) {
          el.setAttribute('href', url);
          el.removeAttribute('aria-disabled');
        } else {
          el.setAttribute('href', '#');
          el.setAttribute('aria-disabled', 'true');
        }
      });
    });
  }

  async function initReleasePanels() {
    const needsStable = qs('[data-release="stable"]');
    const needsKky3 = qs('[data-release="kky3"]');
    const needsFamilyBrowser = qs('[data-release="family-browser"]');
    if (!needsStable && !needsKky3 && !needsFamilyBrowser) return;
    const tasks = [];
    if (needsStable) {
      tasks.push(loadJson('/latest.json')
        .then((data) => applyRelease('stable', data))
        .catch(() => applyRelease('stable', { version: '확인 실패', notes: 'latest.json을 불러오지 못했습니다.' })));
    }
    if (needsKky3) {
      tasks.push(loadJson('/Release/kky-tool-3/latest.json')
        .then((data) => applyRelease('kky3', data))
        .catch(() => applyRelease('kky3', { version: '확인 실패', notes: 'KKY Tool 정식 배포 정보를 불러오지 못했습니다.' })));
    }
    if (needsFamilyBrowser) {
      tasks.push(loadJson('/Release/family-browser/latest.json')
        .then((data) => applyRelease('family-browser', data))
        .catch(() => applyRelease('family-browser', { version: '확인 실패', notes: 'Family Browser 정식 배포 정보를 불러오지 못했습니다.' })));
    }
    await Promise.all(tasks);
  }

  async function initHealthChecks() {
    const list = qs('[data-health-list]');
    if (!list) return;
    const checks = [
      ['KKY Tool 3.0 feed', '/Release/kky-tool-3/latest.json'],
      ['Family Browser feed', '/Release/family-browser/latest.json'],
      ['User policy', '/kky-tool/user-access.json'],
      ['Family Browser bootstrap index', '/family-browser/bootstrap-index.json'],
      ['Family Browser bootstrap', '/family-browser/bootstrap.json']
    ];
    const rows = await Promise.all(checks.map(async ([label, path]) => {
      try {
        await loadJson(path);
        return `<tr><td>${label}</td><td><code>${path}</code></td><td><span class="badge ok">정상</span></td></tr>`;
      } catch (err) {
        return `<tr><td>${label}</td><td><code>${path}</code></td><td><span class="badge warn">확인 필요</span></td></tr>`;
      }
    }));
    list.innerHTML = rows.join('');
  }

  const requestConfig = window.KKY_REQUESTS_CONFIG || {};
  const requestApiUrl = String(requestConfig.requestApiUrl || '').trim();
  const maxVisibleRequests = Number(requestConfig.maxVisibleRequests || 10);
  const draftStorageKey = 'kky-tool-request-draft';
  const ownershipStorageKey = 'kky-tool-request-ownership';

  const requestText = {
    validation: '프로젝트명, 작성자 이름, 요청 제목, 현재 불편한 점, 원하는 개선 방향을 모두 입력하세요.',
    apiMissing: '요청 저장소 연결이 아직 준비되지 않았습니다. 관리자에게 요청 저장소 연결 상태를 확인해 달라고 전달하세요.',
    copyDone: '요청 내용 복사 완료',
    copyDefault: '요청 내용 복사',
    copyFailed: '클립보드 복사에 실패했습니다. 내용을 직접 복사하세요.',
    emptyRequests: '아직 등록된 요청이 없습니다.',
    requestLoading: '등록된 요청을 불러오는 중입니다.',
    requestLoadFailed: '요청 목록을 불러오지 못했습니다.',
    requestCreatePending: '요청을 등록하는 중입니다.',
    requestCreateDone: '요청을 등록했습니다. 최근 요청 목록에서 확인할 수 있습니다.',
    requestCreateFailed: '요청 등록에 실패했습니다.',
    requestDeleting: '요청을 삭제하는 중입니다.',
    requestDeleteDone: '요청을 삭제했습니다.',
    requestDeleteFailed: '요청 삭제에 실패했습니다.',
    requestDeleteOwnOnly: '이 PC에서 등록한 요청만 삭제할 수 있습니다.',
    requestDeleteConfirm: '이 요청을 삭제할까요?',
    requestDeleteButton: '요청 삭제',
    requestSubmit: '요청 등록',
    requestSubmitLoading: '등록 중입니다.',
    requestFrequencyFallback: '반복 빈도 입력 없음',
    requestIdeaPrefix: '원하는 개선 방향',
    requestNotePrefix: '메모',
    requestConfigHelp: '요청 저장소가 아직 연결되지 않아 목록을 표시할 수 없습니다. 설정이 완료되면 등록된 요청이 이곳에 표시됩니다.',
    requestLocalPreview: '로컬 미리보기에서는 브라우저 보안 정책 때문에 운영 요청 목록을 직접 불러올 수 없습니다. 배포 주소 https://update.zerokky.com/requests.html 에서는 기존 요청 저장소와 연결됩니다.',
    requestLocalSubmit: '로컬 미리보기에서는 요청 등록을 테스트 요청으로 보내지 않습니다. 배포 주소에서 등록하거나 요청 내용 복사를 사용하세요.',
    requestAdminDetailPrefix: '관리자에게 전달할 정보'
  };

  function field(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function collectRequestValues() {
    return {
      site: field('field-site')?.value.trim() || '',
      author: field('field-author')?.value.trim() || '',
      task: field('field-task')?.value.trim() || '',
      problem: field('field-problem')?.value.trim() || '',
      idea: field('field-idea')?.value.trim() || '',
      duration: field('field-duration')?.value.trim() || '',
      frequency: field('field-frequency')?.value.trim() || '',
      note: field('field-note')?.value.trim() || ''
    };
  }

  function buildRequestText() {
    const values = collectRequestValues();
    return [
      `프로젝트명: ${values.site || '-'}`,
      `작성자 이름: ${values.author || '-'}`,
      `요청 제목: ${values.task || '-'}`,
      `현재 불편한 점: ${values.problem || '-'}`,
      `원하는 개선 방향: ${values.idea || '-'}`,
      `현재 소요 시간: ${values.duration || '-'}`,
      `반복 빈도: ${values.frequency || '-'}`,
      `메모: ${values.note || '-'}`
    ].join('\n');
  }

  function setRequestStatus(message, tone = '') {
    const status = field('request-status');
    if (!status) return;
    status.textContent = message;
    status.classList.remove('good', 'bad');
    if (tone === 'success') status.classList.add('good');
    if (tone === 'error') status.classList.add('bad');
  }

  function requestErrorMessage(userMessage, error) {
    const detail = String(error?.message || '').trim();
    return detail ? `${userMessage} (${requestText.requestAdminDetailPrefix}: ${detail})` : userMessage;
  }

  function validateRequest(values) {
    return (!values.site || !values.author || !values.task || !values.problem || !values.idea)
      ? requestText.validation
      : '';
  }

  function saveDraft() {
    if (!field('request-form')) return;
    localStorage.setItem(draftStorageKey, JSON.stringify(collectRequestValues()));
  }

  function loadDraft() {
    if (!field('request-form')) return;
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return;
    try {
      const values = JSON.parse(raw);
      field('field-site').value = values.site || '';
      field('field-author').value = values.author || '';
      field('field-task').value = values.task || '';
      field('field-problem').value = values.problem || '';
      field('field-idea').value = values.idea || '';
      field('field-duration').value = values.duration || '';
      field('field-frequency').value = values.frequency || '';
      field('field-note').value = values.note || '';
    } catch (error) {
      localStorage.removeItem(draftStorageKey);
    }
  }

  function clearDraft() {
    localStorage.removeItem(draftStorageKey);
  }

  function loadOwnershipMap() {
    try {
      return JSON.parse(localStorage.getItem(ownershipStorageKey) || '{}');
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
    return loadOwnershipMap()[id] || '';
  }

  function createRequestId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function isLocalRequestPreview() {
    const host = window.location.hostname;
    return host === '127.0.0.1' || host === 'localhost' || host === '::1';
  }

  async function copyRequestText() {
    const button = field('copy-request');
    if (!button) return;
    try {
      await navigator.clipboard.writeText(buildRequestText());
      button.textContent = requestText.copyDone;
      button.classList.add('is-done');
      window.setTimeout(() => {
        button.textContent = requestText.copyDefault;
        button.classList.remove('is-done');
      }, 1600);
    } catch (error) {
      window.alert(requestText.copyFailed);
    }
  }

  function formatRequestDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderDeleteButton(item) {
    if (!item.id || !deleteTokenFor(item.id)) return '';
    return `<button class="button danger request-delete" data-request-id="${escapeHtml(item.id)}" type="button">${requestText.requestDeleteButton}</button>`;
  }

  function renderRequestList(items) {
    const container = field('request-list');
    if (!container) return;
    if (!Array.isArray(items) || !items.length) {
      container.innerHTML = `<p class="empty-state">${requestText.emptyRequests}</p>`;
      return;
    }
    container.innerHTML = items.map((item) => {
      const site = escapeHtml(item.site);
      const author = escapeHtml(item.author || '-');
      const date = escapeHtml(formatRequestDate(item.created_at));
      const task = escapeHtml(item.task);
      const frequency = escapeHtml(item.frequency || requestText.requestFrequencyFallback);
      const problem = escapeHtml(item.problem);
      const idea = escapeHtml(item.idea);
      const duration = item.duration ? `<span><b>현재 소요 시간</b>${escapeHtml(item.duration)}</span>` : '';
      const note = item.note ? `<div class="request-card-note">${requestText.requestNotePrefix}: ${escapeHtml(item.note)}</div>` : '';
      return `
        <article class="request-card">
          <div class="request-card-head">
            <strong>${site}</strong>
            <span>${date}</span>
          </div>
          <div class="request-card-meta">
            <span><b>작성자 이름</b>${author}</span>
            <span><b>요청 제목</b>${task}</span>
            ${duration}
            <span><b>반복 빈도</b>${frequency}</span>
          </div>
          <p class="request-card-body">${problem}</p>
          <div class="request-card-idea">${requestText.requestIdeaPrefix}: ${idea}</div>
          ${note}
          ${renderDeleteButton(item)}
        </article>
      `;
    }).join('');
  }

  async function loadRequestList() {
    const container = field('request-list');
    if (!container) return;
    if (isLocalRequestPreview()) {
      container.innerHTML = `<p class="empty-state">${requestText.requestLocalPreview}</p>`;
      return;
    }
    if (!requestApiUrl) {
      container.innerHTML = `<p class="empty-state">${requestText.requestConfigHelp}</p>`;
      return;
    }
    container.innerHTML = `<p class="empty-state">${requestText.requestLoading}</p>`;
    try {
      const url = new URL(requestApiUrl);
      url.searchParams.set('limit', String(maxVisibleRequests));
      const response = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      renderRequestList(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      container.innerHTML = `<p class="empty-state">${escapeHtml(requestErrorMessage(requestText.requestLoadFailed, error))}</p>`;
    }
  }

  async function submitRequest() {
    const button = field('save-request');
    if (!button) return;
    const values = collectRequestValues();
    const errorMessage = validateRequest(values);
    if (errorMessage) {
      setRequestStatus(errorMessage, 'error');
      return;
    }
    if (!requestApiUrl) {
      setRequestStatus(requestText.apiMissing, 'error');
      return;
    }
    if (isLocalRequestPreview()) {
      setRequestStatus(requestText.requestLocalSubmit, 'error');
      return;
    }
    const id = createRequestId();
    const deleteToken = createRequestId();
    button.disabled = true;
    button.textContent = requestText.requestSubmitLoading;
    setRequestStatus(requestText.requestCreatePending);
    try {
      const response = await fetch(requestApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'create',
          id,
          deleteToken,
          ...values,
          source: 'homepage',
          created_at: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json().catch(() => ({ ok: true }));
      if (data.ok === false) throw new Error(data.message || 'create_failed');
      rememberOwnership(id, deleteToken);
      clearDraft();
      field('request-form')?.reset();
      setRequestStatus(requestText.requestCreateDone, 'success');
      await loadRequestList();
    } catch (error) {
      setRequestStatus(requestErrorMessage(requestText.requestCreateFailed, error), 'error');
    } finally {
      button.disabled = false;
      button.textContent = requestText.requestSubmit;
    }
  }

  async function deleteRequest(id) {
    const deleteToken = deleteTokenFor(id);
    if (!id || !deleteToken) {
      setRequestStatus(requestText.requestDeleteOwnOnly, 'error');
      return;
    }
    if (!window.confirm(requestText.requestDeleteConfirm)) return;
    setRequestStatus(requestText.requestDeleting);
    try {
      const response = await fetch(requestApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'delete',
          id,
          deleteToken
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json().catch(() => ({ ok: true }));
      if (data.ok === false) throw new Error(data.message || 'delete_failed');
      forgetOwnership(id);
      setRequestStatus(requestText.requestDeleteDone, 'success');
      await loadRequestList();
    } catch (error) {
      setRequestStatus(requestErrorMessage(requestText.requestDeleteFailed, error), 'error');
    }
  }

  function setupRequestPage() {
    const form = field('request-form');
    if (!form) return;
    loadDraft();
    form.addEventListener('input', saveDraft);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitRequest();
    });
    field('copy-request')?.addEventListener('click', copyRequestText);
    field('save-request')?.addEventListener('click', submitRequest);
    field('refresh-requests')?.addEventListener('click', loadRequestList);
    field('request-list')?.addEventListener('click', (event) => {
      const button = event.target.closest('.request-delete');
      if (button) deleteRequest(button.dataset.requestId || '');
    });
    loadRequestList();
  }

  document.addEventListener('DOMContentLoaded', () => {
    normalizeManualNav();
    normalizeUpdatesNav();
    setActiveNav();
    initNavToggle();
    initReleasePanels();
    initHealthChecks();
    setupRequestPage();
    root.classList.add('site-ready');
  });
}());
