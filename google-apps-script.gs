const SHEET_NAME = "feature_requests";

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
    .reverse()
    .slice(0, limit);

  return jsonOutput_({ ok: true, items });
}

function doPost(e) {
  const sheet = getSheet_();
  const payload = JSON.parse(e.postData.contents || "{}");

  sheet.appendRow([
    new Date(),
    payload.site || "",
    payload.task || "",
    payload.problem || "",
    payload.idea || "",
    payload.duration || "",
    payload.frequency || "",
    payload.note || "",
    payload.source || "mobile"
  ]);

  return jsonOutput_({ ok: true });
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "created_at",
      "site",
      "task",
      "problem",
      "idea",
      "duration",
      "frequency",
      "note",
      "source"
    ]);
  }

  return sheet;
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
