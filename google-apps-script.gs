const SHEET_NAME = "feature_requests";
const HEADERS = [
  "id",
  "created_at",
  "site",
  "author",
  "task",
  "problem",
  "idea",
  "duration",
  "frequency",
  "note",
  "source",
  "delete_token",
  "deleted_at"
];
const LEGACY_HEADERS = [
  "created_at",
  "site",
  "task",
  "problem",
  "idea",
  "duration",
  "frequency",
  "note",
  "source"
];
const CURRENT_HEADERS_WITHOUT_AUTHOR = [
  "id",
  "created_at",
  "site",
  "task",
  "problem",
  "idea",
  "duration",
  "frequency",
  "note",
  "source",
  "delete_token",
  "deleted_at"
];

function doGet(e) {
  const sheet = getSheet_();
  const limit = Number((e && e.parameter && e.parameter.limit) || 10);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return jsonOutput_({ ok: true, items: [] });
  }

  const headers = values[0];
  const items = values
    .slice(1)
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])))
    .filter((item) => !item.deleted_at)
    .reverse()
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      created_at: item.created_at,
      site: item.site,
      author: item.author,
      task: item.task,
      problem: item.problem,
      idea: item.idea,
      duration: item.duration,
      frequency: item.frequency,
      note: item.note,
      source: item.source
    }));

  return jsonOutput_({ ok: true, items });
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");

  if (payload.action === "delete") {
    return deleteRequest_(payload);
  }

  return createRequest_(payload);
}

function createRequest_(payload) {
  const sheet = getSheet_();

  sheet.appendRow([
    payload.id || uuid_(),
    payload.created_at || new Date().toISOString(),
    payload.site || "",
    payload.author || "",
    payload.task || "",
    payload.problem || "",
    payload.idea || "",
    payload.duration || "",
    payload.frequency || "",
    payload.note || "",
    payload.source || "mobile",
    payload.deleteToken || "",
    ""
  ]);

  return jsonOutput_({ ok: true });
}

function deleteRequest_(payload) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf("id");
  const tokenIndex = headers.indexOf("delete_token");
  const deletedAtIndex = headers.indexOf("deleted_at");

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex];
    if (row[idIndex] === payload.id && row[tokenIndex] === payload.deleteToken && !row[deletedAtIndex]) {
      sheet.getRange(rowIndex + 1, deletedAtIndex + 1).setValue(new Date().toISOString());
      return jsonOutput_({ ok: true });
    }
  }

  return jsonOutput_({ ok: false, message: "not_found" });
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    return sheet;
  }

  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const width = Math.max(sheet.getLastColumn(), HEADERS.length);
  const firstRow = sheet.getRange(1, 1, 1, width).getValues()[0].slice(0, HEADERS.length);

  if (sameHeaders_(firstRow, HEADERS)) {
    return;
  }

  if (sameHeaders_(firstRow, CURRENT_HEADERS_WITHOUT_AUTHOR)) {
    const rows = sheet.getDataRange().getValues().slice(1);
    sheet.clearContents();
    sheet.appendRow(HEADERS);

    rows.forEach((row) => {
      sheet.appendRow([
        row[0] || uuid_(),
        row[1] || new Date().toISOString(),
        row[2] || "",
        "",
        row[3] || "",
        row[4] || "",
        row[5] || "",
        row[6] || "",
        row[7] || "",
        row[8] || "",
        row[9] || "mobile",
        row[10] || "",
        row[11] || ""
      ]);
    });
    return;
  }

  if (sameHeaders_(firstRow.slice(0, LEGACY_HEADERS.length), LEGACY_HEADERS)) {
    const legacyRows = sheet.getDataRange().getValues().slice(1);
    sheet.clearContents();
    sheet.appendRow(HEADERS);

    legacyRows.forEach((row) => {
      sheet.appendRow([
        uuid_(),
        row[0] || new Date().toISOString(),
        row[1] || "",
        "",
        row[2] || "",
        row[3] || "",
        row[4] || "",
        row[5] || "",
        row[6] || "",
        row[7] || "",
        row[8] || "mobile",
        "",
        ""
      ]);
    });
    return;
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

function sameHeaders_(left, right) {
  return left.length >= right.length && right.every((value, index) => left[index] === value);
}

function uuid_() {
  return Utilities.getUuid();
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
