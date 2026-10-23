import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { latestJsonFiles, compareSnapshots } from '../scripts/latest-snapshot.js';

function temporary(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fansite-snapshots-'));
  try { return run(directory); } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value)); }

test('select newest save per account, with numeric collisions and underscores in IDs', () => temporary(directory => {
  const files = [
    'sec_uid_20261022_235959_999.json',
    'sec_uid_20261023_000000_001_2.json',
    'sec_uid_20261023_000000_001_10.json',
    'other_20261022_000000_000.json',
  ];
  for (const file of files) writeJson(path.join(directory, file), {});
  fs.utimesSync(path.join(directory, files[0]), new Date('2099-01-01'), new Date('2099-01-01'));
  fs.mkdirSync(path.join(directory, 'directory.json'));
  fs.writeFileSync(path.join(directory, 'ignored.csv'), '');
  assert.deepEqual(latestJsonFiles(directory), [files[3], files[2]]);
  assert.equal(fs.readdirSync(directory).length, 6);
}));

test('legacy exports use recorded time, then mtime, and compare with timestamped saves', () => temporary(directory => {
  const old = path.join(directory, '123.json');
  writeJson(old, { updatedAt: '2026-10-22T16:00:00Z' });
  fs.utimesSync(old, new Date('2099-01-01'), new Date('2099-01-01'));
  const latest = path.join(directory, '123_20261023_000000_001.json');
  writeJson(latest, {});
  assert.deepEqual(latestJsonFiles(directory), [path.basename(latest)]);
  for (const field of ['updatedAt', 'generated_at', 'exported_at']) {
    writeJson(old, { [field]: '2026-10-23T00:00:00+08:00' });
    assert.ok(compareSnapshots(old, latest) > 0);
  }
  writeJson(old, {});
  assert.ok(compareSnapshots(old, latest) < 0);
}));

for (const platform of ['bilibili', 'weibo', 'douyin', 'rednote']) {
  test(`${platform} merge uses only the latest account snapshot`, () => temporary(directory => {
    const source = path.join(directory, 'data');
    const account = path.join(source, 'Creator');
    fs.mkdirSync(account, { recursive: true });
    const list = path.join(directory, 'accounts.txt');
    fs.writeFileSync(list, 'Creator\n');
    const output = path.join(directory, 'merged.json');
    let script = fs.readFileSync(new URL(`../scripts/merge-${platform}.js`, import.meta.url), 'utf8');
    const keyword = script.match(/const FILTER_KEYWORD = '([^']+)'/)?.[1] ?? '';
    script = script.replace(/const DATA_SRC = '[^']*'/, `const DATA_SRC = ${JSON.stringify(source)}`)
      .replace(/const DATA_OUT = [^\n]+/, `const DATA_OUT = ${JSON.stringify(output)};`)
      .replace(/const (UP_LIST|ACCOUNT_LIST) = '[^']*'/, (_, name) => `const ${name} = ${JSON.stringify(list)}`)
      .replace(/const ACCOUNT_NAMES = \[[^\n]+/, "const ACCOUNT_NAMES = ['Creator'];")
      .replace(/const ACCOUNT_ID = '[^']*'/, "const ACCOUNT_ID = 'account123'")
      .replace("'../src/utils/time.js'", JSON.stringify(new URL('../src/utils/time.js', import.meta.url).href));
    const localScript = path.join(directory, 'merge.mjs');
    // Use .mjs because the temporary directory has no package.json.
    script = script.replaceAll("'./latest-snapshot.js'", "'./latest-snapshot.mjs'");
    fs.writeFileSync(localScript, script);
    fs.copyFileSync(new URL('../scripts/latest-snapshot.js', import.meta.url), path.join(directory, 'latest-snapshot.mjs'));
    function document(id) {
      const common = { updatedAt: '2000-01-01T00:00:00Z', exported_at: '2000-01-01T00:00:00Z' };
      if (platform === 'bilibili') return { ...common, upName: 'Creator', uid: 123,
        videos: { [id]: { bvid: id, title: keyword, created: 1, stat: { like: id === 'new' ? 2 : 100 } } } };
      if (platform === 'weibo') return { ...common, account: { screenName: 'Creator', uid: '123' },
        posts: { [id]: { id, text: keyword, createdAt: '2026-01-01T00:00:00Z' } } };
      if (platform === 'douyin') return { ...common, account: { nickname: 'Creator', sec_uid: '123' },
        works: { [id]: { aweme_id: id, title: keyword, create_time: 1 } } };
      return { ...common, profile: { red_id: 'account123', user_id: '123' }, notes: [{ note_id: id }] };
    }
    const old = path.join(account, '123_20261022_235959_999.json');
    writeJson(old, document('old-only'));
    writeJson(path.join(account, '123_20261023_000000_001.json'), document('new'));
    const previous = fs.readFileSync(old, 'utf8');
    execFileSync(process.execPath, [localScript], { encoding: 'utf8' });
    const merged = JSON.parse(fs.readFileSync(output, 'utf8'));
    const items = merged.videos ?? merged.posts ?? merged.works ?? merged.notes;
    assert.equal(items.length, 1);
    assert.equal(items[0].bvid ?? items[0].id ?? items[0].aweme_id ?? items[0].note_id, 'new');
    if (platform === 'bilibili') assert.equal(items[0].stat.like, 2);
    if (platform === 'weibo' || platform === 'douyin') assert.equal(merged.accounts.length, 1);
    assert.equal(fs.readFileSync(old, 'utf8'), previous);
  }));
}
