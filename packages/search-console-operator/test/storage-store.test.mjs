import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, lstatSync, readdirSync,
  chmodSync, mkdirSync, symlinkSync, unlinkSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createSnapshotStore } from '../src/storage/snapshot-store.mjs';
import { snapshotId } from '../src/storage/canonical-json.mjs';

function context(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'search-console-storage-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, directory: path.join(root, 'private', 'snapshots') };
}
function snapshot(value = 0) {
  return { schemaVersion: 1, kind: 'search-console-report', algorithmVersion: '1.0.0',
    capturedAt: '2026-10-19T12:00:00.000Z', tool: 'get_site_summary', args: { siteUrl: 'sc-domain:example.test' },
    result: { clicks: value, impressions: 0, ctr: null, pages: { status: 'failed', rows: null } } };
}

test('snapshots survive a fresh store instance and retain private modes and immutable identity', async t => {
  const { root, directory } = context(t);
  const store = createSnapshotStore(directory);
  assert.deepEqual(await store.list(), []);
  assert.equal(existsSync(directory), false, 'read-only listing must not create a store');
  const saved = await store.save(snapshot());
  assert.equal(saved.id, snapshotId(snapshot()));
  const filename = path.join(directory, saved.id + '.json');
  assert.equal(saved.bytes, readFileSync(filename).length);
  assert.equal(lstatSync(directory).mode & 0o777, 0o700);
  assert.equal(lstatSync(path.join(root, 'private')).mode & 0o777, 0o700);
  assert.equal(lstatSync(filename).mode & 0o777, 0o600);
  const before = lstatSync(filename);
  const secondStore = createSnapshotStore(directory);
  assert.deepEqual(await secondStore.load(saved.id), snapshot());
  assert.deepEqual(await secondStore.save(snapshot()), saved);
  assert.equal(lstatSync(filename).ino, before.ino, 'a repeat must not replace the immutable file');
  assert.deepEqual(readdirSync(directory), [saved.id + '.json']);
  assert.deepEqual(await store.list(), [{ ...saved, schemaVersion: 1, kind: 'search-console-report',
    algorithmVersion: '1.0.0', capturedAt: '2026-10-19T12:00:00.000Z', tool: 'get_site_summary' }]);
});

test('independent concurrent writers converge without clobbering or leftover staging files', async t => {
  const { directory } = context(t);
  const moduleUrl = pathToFileURL(path.resolve(import.meta.dirname, '../src/storage/snapshot-store.mjs')).href;
  const source = `import {createSnapshotStore} from ${JSON.stringify(moduleUrl)};
    const saved = await createSnapshotStore(process.argv[1]).save(JSON.parse(process.argv[2]));
    process.stdout.write(JSON.stringify(saved));`;
  const workers = Array.from({ length: 6 }, () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', source, directory, JSON.stringify(snapshot())],
      { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; let errorOutput = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { errorOutput += data; });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) return reject(Error(errorOutput));
      try { resolve(JSON.parse(output)); } catch (error) { reject(error); }
    });
  }));
  const results = await Promise.all(workers);
  assert.equal(new Set(results.map(value => value.id)).size, 1);
  assert.deepEqual(await createSnapshotStore(directory).load(results[0].id), snapshot());
  assert.deepEqual(readdirSync(directory), [results[0].id + '.json']);
});

test('tampering and existing corruption are refused without replacement', async t => {
  const { directory } = context(t);
  const store = createSnapshotStore(directory);
  const saved = await store.save(snapshot());
  const filename = path.join(directory, saved.id + '.json');
  const corrupt = JSON.stringify(snapshot(99)) + '\n';
  writeFileSync(filename, corrupt);
  await assert.rejects(store.load(saved.id), { code: 'SNAPSHOT_CORRUPT' });
  await assert.rejects(store.save(snapshot()), { code: 'SNAPSHOT_EXISTING_CORRUPT' });
  assert.equal(readFileSync(filename, 'utf8'), corrupt);
  assert.deepEqual(readdirSync(directory), [saved.id + '.json']);
});

test('partial temporary files are ignored and valid reports remain loadable', async t => {
  const { directory } = context(t);
  const store = createSnapshotStore(directory);
  const saved = await store.save(snapshot());
  writeFileSync(path.join(directory, '.snapshot-interrupted.tmp'), '{"partial":', { mode: 0o600 });
  assert.equal((await store.list()).length, 1);
  assert.deepEqual(await store.load(saved.id), snapshot());
});

test('unsafe directories, file modes, symlinks and path traversal fail closed', async t => {
  const { root, directory } = context(t);
  const unsafe = path.join(root, 'unsafe'); mkdirSync(unsafe, { mode: 0o755 });
  chmodSync(unsafe, 0o755); // Create the intended unsafe fixture even with an inherited umask of 077.
  await assert.rejects(createSnapshotStore(unsafe).save(snapshot()), { code: 'SNAPSHOT_DIRECTORY_UNSAFE' });
  const link = path.join(root, 'linked'); symlinkSync(unsafe, link);
  await assert.rejects(createSnapshotStore(path.join(link, 'new-child')).save(snapshot()),
    { code: 'SNAPSHOT_DIRECTORY_UNSAFE' });
  assert.equal(existsSync(path.join(unsafe, 'new-child')), false);
  const store = createSnapshotStore(directory);
  const saved = await store.save(snapshot());
  const filename = path.join(directory, saved.id + '.json');
  chmodSync(filename, 0o644);
  await assert.rejects(store.load(saved.id), { code: 'SNAPSHOT_FILE_UNSAFE' });
  await assert.rejects(store.save(snapshot()), { code: 'SNAPSHOT_EXISTING_CORRUPT' });
  unlinkSync(filename); symlinkSync(path.join(root, 'never-follow'), filename);
  await assert.rejects(store.load(saved.id), { code: 'SNAPSHOT_FILE_UNSAFE' });
  await assert.rejects(store.list(), { code: 'SNAPSHOT_FILE_UNSAFE' });
  await assert.rejects(store.load('../secret'), { code: 'SNAPSHOT_INVALID_ID' });
});

test('byte limits and list bounds refuse excess work; listing is deterministic by snapshot ID', async t => {
  const { directory } = context(t);
  const small = createSnapshotStore(directory, { maxBytes: 100 });
  await assert.rejects(small.save(snapshot()), { code: 'SNAPSHOT_TOO_LARGE' });
  assert.equal(existsSync(directory), false);
  const store = createSnapshotStore(directory);
  const saves = await Promise.all([3, 1, 2].map(value => store.save(snapshot(value))));
  assert.deepEqual((await store.list({ limit: 2 })).map(value => value.id), saves.map(value => value.id).sort().slice(0, 2));
  for (const limit of [0, -1, 1.5, 101, NaN]) {
    await assert.rejects(store.list({ limit }), { code: 'SNAPSHOT_INVALID_LIST_LIMIT' });
  }
  await assert.rejects(createSnapshotStore(directory, { maxBytes: 100 }).load(saves[0].id),
    { code: 'SNAPSHOT_TOO_LARGE' });
});

test('non-regular snapshot files are rejected without waiting for a FIFO writer', async t => {
  const { directory } = context(t);
  const store = createSnapshotStore(directory);
  const saved = await store.save(snapshot());
  const filename = path.join(directory, saved.id + '.json');
  unlinkSync(filename);
  const created = spawnSync('mkfifo', ['-m', '600', filename], { encoding: 'utf8' });
  assert.ifError(created.error);
  assert.equal(created.status, 0, created.stderr);
  await assert.rejects(store.load(saved.id), { code: 'SNAPSHOT_FILE_UNSAFE' });
  await assert.rejects(store.list(), { code: 'SNAPSHOT_FILE_UNSAFE' });
});
