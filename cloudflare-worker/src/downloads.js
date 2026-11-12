const site = 'https://update.zerokky.com';
const root = '/Release/kky-tool-3/';
const repo = 'zerokky11/Release';
const exe = /^KKY_Tool_Revit_3\(2019,21,23,25,27\)_v3(?:\.\d+){1,2}(?:_[a-zA-Z0-9-]+)?\.exe$/;
const zip = /^KKY_Tool_Revit_3\.2019\.21\.23\.25\.27\._v(3(?:\.\d+){1,2})(?:_[a-zA-Z0-9-]+)?\.zip$/;

function failure(status, extra = {}) {
  return new Response(null, {status, headers: {'Cache-Control': 'no-store', ...extra}});
}

export async function download(request, fetchOrigin = fetch) {
  if (!['GET', 'HEAD'].includes(request.method)) return failure(405, {Allow: 'GET, HEAD'});
  const url = new URL(request.url);
  if (url.origin !== site) return failure(404);
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { return failure(404); }
  const name = path.slice(path.lastIndexOf('/') + 1);
  const match = name.match(zip);
  let origin;
  if (path === root + 'official/' + name && exe.test(name)) {
    origin = new URL('https://raw.githubusercontent.com/' + repo + '/main' + root + 'official/' + encodeURIComponent(name));
  } else if (path === root + 'packages/' + name && match) {
    origin = new URL('https://github.com/' + repo + '/releases/download/kky-tool-v' + match[1] + '/' + name);
  } else return failure(404);
  const rev = url.searchParams.get('rev');
  if (rev && /^[a-zA-Z0-9._-]{1,80}$/.test(rev)) origin.searchParams.set('rev', rev);

  // Range, validators, credentials and cookies must not travel to either origin.
  const init = {method: request.method, headers: {'Accept-Encoding': 'identity'}, redirect: 'manual', cache: 'no-store'};
  try {
    let asset = await fetchOrigin(origin, init);
    if (match && [301, 302, 303, 307, 308].includes(asset.status)) {
      const signed = new URL(asset.headers.get('Location'));
      if (signed.origin !== 'https://release-assets.githubusercontent.com' || signed.username || signed.password) return failure(502);
      asset = await fetchOrigin(signed, init);
    }
    if (asset.status === 404) return failure(404);
    const type = (asset.headers.get('Content-Type') || '').split(';')[0].toLowerCase();
    if (asset.status !== 200 || asset.headers.has('Content-Range') ||
        !['application/octet-stream', 'application/zip', 'application/x-msdownload'].includes(type) ||
        ![null, 'identity'].includes(asset.headers.get('Content-Encoding'))) return failure(502);
    const headers = new Headers({
      'Content-Type': match ? 'application/zip' : 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="' + name + '"',
      'Accept-Ranges': 'none', 'Cache-Control': 'no-store, no-transform',
      'X-Content-Type-Options': 'nosniff', 'X-KKY-Download': 'full-v1'
    });
    const length = asset.headers.get('Content-Length');
    if (length && /^[1-9]\d*$/.test(length)) headers.set('Content-Length', length);
    return new Response(request.method === 'HEAD' ? null : asset.body, {status: 200, headers, encodeBody: 'manual'});
  } catch {
    return failure(502);
  }
}

export default { fetch(request) { return download(request); } };
