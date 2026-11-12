// Run explicitly against production: node test/check-downloads.mjs <local latest.json>
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const feed = JSON.parse((await readFile(process.argv[2], 'utf8')).replace(/^\uFEFF/, ''));
for (const [kind, url, sha] of [['exe', feed.installerUrl, feed.sha256], ['zip', feed.packageUrl, feed.updateZipSha256]]) {
  assert.equal(new URL(url).origin, 'https://update.zerokky.com');
  const head = await fetch(url, {method: 'HEAD', redirect: 'error', headers: {'Accept-Encoding': 'identity'}});
  assert.equal(head.status, 200);
  const size = Number(head.headers.get('Content-Length'));
  assert.ok(size > 0);
  for (const range of [null, kind === 'exe' ? 'bytes=26896027-' : 'bytes=0-65535']) {
    const headers = range ? {Range: range, 'If-Range': '"old"'} : {};
    const response = await fetch(url, {headers: {...headers, 'Accept-Encoding': 'identity'}, redirect: 'error'});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-KKY-Download'), 'full-v1');
    assert.equal(response.headers.get('Accept-Ranges'), 'none');
    assert.equal(response.headers.get('Content-Range'), null);
    const hash = createHash('sha256');
    let count = 0;
    for await (const chunk of response.body) { hash.update(chunk); count += chunk.length; }
    const actual = hash.digest('hex').toUpperCase();
    assert.equal(actual, sha.toUpperCase());
    assert.equal(count, size);
    console.log(JSON.stringify({kind, range, status: response.status, size: count, sha256: actual}));
  }
}
