(function (root) {
  "use strict";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const guid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || "") && !/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(value);
  const normalize = (path) => String(path || "").trim().replace(/\//g, "\\").replace(/\\+/g, "\\").replace(/\\+$/, "").toLowerCase();
  const contains = (prefix, path) => normalize(prefix) === normalize(path) || normalize(path).startsWith(normalize(prefix) + "\\");
  const need = (ok, message) => { if (!ok) throw new Error(message); };

  function unc(path) {
    const value = String(path || "").trim().replace(/\//g, "\\");
    return value.startsWith("\\\\") && !/^\\\\[?.]\\/.test(value) &&
      value.slice(2).split("\\").filter(Boolean).length >= 3 &&
      value.slice(2).split("\\").filter(Boolean).every((part) => part !== "." && part !== ".." && !/[<>:"|?*\x00-\x1f]/.test(part) && !/[. ]$/.test(part));
  }

  function validateStorage(storage) {
    if (storage == null) return;
    need(typeof storage === "object" && !Array.isArray(storage) && typeof storage.enabled === "boolean", "기록 저장소 사용 여부를 확인해 주세요.");
    if (!storage.enabled) return;
    need(storage.schemaVersion === 1 && guid(storage.managementId), "관리 그룹 ID 또는 기록 저장소 형식이 올바르지 않습니다.");
    need(Array.isArray(storage.stores) && storage.stores.length > 0 && storage.stores.length <= 32, "기록 저장소를 1~32개 등록해 주세요.");
    const ids = new Set();
    storage.stores.forEach((store) => {
      need(store && guid(store.id) && !ids.has(store.id.toLowerCase()), "기록 저장소 ID가 중복되었거나 올바르지 않습니다.");
      ids.add(store.id.toLowerCase());
      need(typeof store.name === "string" && store.name.trim() && store.name.length <= 200, "기록 저장소 이름을 입력해 주세요.");
      need(Array.isArray(store.pathCandidates) && store.pathCandidates.length > 0 && store.pathCandidates.length <= 8 &&
        Array.isArray(store.projectPathPrefixes) && store.projectPathPrefixes.length > 0 && store.projectPathPrefixes.length <= 256 &&
        store.pathCandidates.concat(store.projectPathPrefixes).every(unc), "각 기록 저장소에 전용 UNC 폴더와 대상 센트럴 경로를 입력해 주세요.");
    });
    storage.stores.forEach((a, index) => storage.stores.slice(index + 1).forEach((b) => {
      need(!a.projectPathPrefixes.some((x) => b.projectPathPrefixes.some((y) => contains(x, y) || contains(y, x))), "기록 저장소의 대상 센트럴 범위가 겹칩니다.");
      need(!a.pathCandidates.some((x) => b.pathCandidates.some((y) => contains(x, y) || contains(y, x))), "기록 저장소마다 분리된 폴더를 사용해 주세요.");
    }));
  }

  function validateEnvelope(value) {
    validateStorage(value.projectStorage);
    if (value.managementGroups === undefined) return value;
    need(Array.isArray(value.managementGroups) && value.managementGroups.length > 0 && value.managementGroups.length <= 32,
      "관리 그룹은 1~32개로 등록해 주세요.");
    need(guid(value.defaultManagementGroupId), "기본 관리 그룹을 선택해 주세요.");
    const ids = new Set(), storeIds = new Set(), deliveryKeys = new Set(), scopes = [], destinations = [];
    value.managementGroups.forEach((group) => {
      need(group && guid(group.id) && !ids.has(group.id.toLowerCase()), "관리 그룹 ID가 중복되었거나 올바르지 않습니다.");
      ids.add(group.id.toLowerCase());
      if (group.deliveryKey !== undefined) {
        need(typeof group.deliveryKey === "string" && /^[a-f0-9]{64}$/.test(group.deliveryKey) && !/^0+$/.test(group.deliveryKey) &&
          !deliveryKeys.has(group.deliveryKey), "그룹 연결 키가 올바르지 않거나 다른 그룹과 중복됩니다.");
        deliveryKeys.add(group.deliveryKey);
      }
      need(typeof group.name === "string" && group.name.trim() && group.name.length <= 200, "관리 그룹 이름을 입력해 주세요.");
      const settings = group.bootstrap;
      need(settings && typeof settings === "object" && !Array.isArray(settings) && !settings.managementGroups && !settings.defaultManagementGroupId,
        "중첩 관리 그룹은 사용할 수 없습니다.");
      need(unc(settings.managedRootPath), "그룹의 원본 관리 폴더는 전용 UNC 경로로 입력해 주세요.");
      need(Array.isArray(group.projectPathPrefixes) && group.projectPathPrefixes.length <= 256 &&
        (group.id.toLowerCase() === value.defaultManagementGroupId.toLowerCase() || group.projectPathPrefixes.length > 0) &&
        group.projectPathPrefixes.every(unc), "관리 그룹에 해당하는 센트럴 파일 또는 상위 폴더를 입력해 주세요.");
      const roots = [settings.managedRootPath].concat(settings.managedRootPathCandidates || []);
      need(roots.length <= 9 && roots.every(unc), "관리 폴더의 연결 주소를 확인해 주세요.");
      const policies = roots.map((path) => normalize(path) + "\\config\\standard-policy.json");
      need((!settings.managedPolicyPath || policies.includes(normalize(settings.managedPolicyPath))) &&
        (settings.managedPolicyPathCandidates || []).every((path) => policies.includes(normalize(path))), "그룹의 정책 파일은 해당 관리 폴더 안에 있어야 합니다.");
      group.projectPathPrefixes.forEach((path) => scopes.push({ id: group.id, path }));
      roots.forEach((path) => destinations.push({ id: group.id, path }));
      validateStorage(settings.projectStorage);
      if (settings.projectStorage?.enabled) {
        need(settings.projectStorage.managementId.toLowerCase() === group.id.toLowerCase(), "기록 저장소가 다른 관리 그룹에 속해 있습니다.");
        settings.projectStorage.stores.forEach((store) => {
          need(!storeIds.has(store.id.toLowerCase()), "여러 관리 그룹에 같은 기록 저장소 ID를 사용할 수 없습니다.");
          storeIds.add(store.id.toLowerCase());
          need(store.projectPathPrefixes.every((path) => group.projectPathPrefixes.some((scope) => contains(scope, path))), "기록 저장소의 대상 경로가 관리 그룹 범위를 벗어납니다.");
          store.pathCandidates.forEach((path) => destinations.push({ id: group.id, path }));
        });
      }
    });
    need(ids.has(value.defaultManagementGroupId.toLowerCase()), "기본 관리 그룹을 찾을 수 없습니다.");
    [scopes, destinations].forEach((paths, kind) => {
      const owners = new Map();
      paths.sort((a, b) => normalize(a.path).length - normalize(b.path).length).forEach((entry) => {
        const path = normalize(entry.path), id = entry.id.toLowerCase();
        for (let parent = path; parent.length > 2;) {
          need(!owners.has(parent) || owners.get(parent) === id,
            kind === 0 ? "서로 다른 관리 그룹의 센트럴 범위가 겹칩니다." : "서로 다른 관리 그룹은 관리·기록 폴더를 공유할 수 없습니다.");
          const separator = parent.lastIndexOf("\\");
          if (separator <= 1) break;
          parent = parent.slice(0, separator);
        }
        owners.set(path, id);
      });
    });
    return value;
  }

  function compose(original, groups, defaultId) {
    const selected = groups.find((group) => group.id.toLowerCase() === String(defaultId).toLowerCase());
    need(selected, "기본 관리 그룹을 찾을 수 없습니다.");
    const value = Object.assign({}, clone(original), clone(selected.bootstrap), {
      disabled: original.disabled === true,
      managementGroups: clone(groups), defaultManagementGroupId: defaultId
    });
    return validateEnvelope(value);
  }

  root.KKYFamilyStorageGroups = Object.freeze({ clone, unc, contains, validateStorage, validateEnvelope, compose });
  if (typeof module === "object" && module.exports) module.exports = root.KKYFamilyStorageGroups;
})(globalThis);
