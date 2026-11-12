import test from 'node:test';
import assert from 'node:assert/strict';
import { download } from '../src/downloads.js';

const base = 'https://update.zerokky.com/Release/kky-tool-3/';
const exe = 'official/KKY_Tool_Revit_3(2019,21,23,25,27)_v3.1.28.exe';
const zip = 'packages/KKY_Tool_Revit_3.2019.21.23.25.27._v3.1.28.zip';
const bytes = Uint8Array.of(1, 2, 3, 4);
const binary = () => new Response(bytes, {headers: {'Content-Type': 'application/octet-stream', 'Content-Length': '4'}});

for (const [file, range] of [[exe, null], [exe, 'bytes=2-'], [zip, 'bytes=-2'], [zip, 'bytes=0-1,3-3']]) {
  test(file.split('/')[0] + ': ' + (range || 'full'), async () => {
    const calls = [];
    const r = await download(new Request(base + file + '?rev=abc&url=https://invalid.test', {
      headers: {...(range ? {Range: range, 'If-Range': '"old"'} : {}), Cookie: 'not-for-origin'}
    }), async (u, opts) => {
      calls.push(u.toString());
      assert.deepEqual(opts.headers, {'Accept-Encoding': 'identity'});
      assert.equal(opts.redirect, 'manual');
      if (u.hostname === 'github.com') return Response.redirect('https://release-assets.githubusercontent.com/a', 302);
      return binary();
    });
    assert.equal(calls.length, file === exe ? 1 : 2);
    assert.equal(new URL(calls[0]).search, '?rev=abc');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('Accept-Ranges'), 'none');
    assert.equal(r.headers.get('Location'), null);
    assert.deepEqual(new Uint8Array(await r.arrayBuffer()), bytes);
  });
}

test('encoded installer HEAD returns headers without a body', async () => {
  const r = await download(new Request(base + exe.replaceAll(',', '%2C'), {method: 'HEAD'}), (_, opts) => {
    assert.equal(opts.method, 'HEAD');
    return binary();
  });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Content-Length'), '4');
  assert.equal(r.body, null);
});

test('never serves a partial file, upstream error, HTML or external redirect as a download', async () => {
  for (const [asset, expected] of [
    [new Response(null, {status: 206}), 502], [new Response(null, {status: 404}), 404],
    [new Response('HTML', {headers: {'Content-Type': 'text/html'}}), 502],
    [new Response(bytes, {headers: {'Content-Type': 'application/octet-stream', 'Content-Range': 'bytes 0-3/10'}}), 502],
    [Response.redirect('https://example.test/a'), 502]
  ]) assert.equal((await download(new Request(base + zip), () => asset)).status, expected);
});

test('only accepts official filenames and read-only methods', async () => {
  for (const path of ['packages/foo.zip', 'official/subdir/' + exe.split('/')[1], 'packages/%zz']) {
    assert.equal((await download(new Request(base + path), assert.fail)).status, 404);
  }
  assert.equal((await download(new Request(base + zip, {method: 'POST'}), assert.fail)).status, 405);
});
