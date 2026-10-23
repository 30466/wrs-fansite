import fs from 'node:fs';
import path from 'node:path';

const SNAPSHOT_NAME = /^(.*)_(\d{8})_(\d{6})_(\d{3})(?:_(\d+))?\.json$/;

function snapshotInfo(file, data) {
  const name = path.basename(file);
  const match = name.match(SNAPSHOT_NAME);
  if (match) {
    const [, id, day, time, milliseconds, sequence] = match;
    // The filename records Beijing save time; never interpret it in the host timezone.
    const savedAt = Date.parse(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}T` +
      `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}.${milliseconds}+08:00`);
    if (Number.isFinite(savedAt)) return { id, savedAt, sequence: Number(sequence ?? 0) };
  }
  // Legacy exports have no timestamp suffix. Prefer their recorded export time to mtime.
  if (!data) {
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* Existing readers report parse errors. */ }
  }
  const recorded = Date.parse(data?.updatedAt ?? data?.exported_at ?? data?.generated_at ?? '');
  return {
    id: path.basename(name, '.json'),
    savedAt: Number.isFinite(recorded) ? recorded : fs.statSync(file).mtimeMs,
    sequence: 0,
  };
}

/** Sort newest first, including numeric suffixes from repeated saves in one millisecond. */
export function compareSnapshots(a, b, dataA, dataB) {
  const left = snapshotInfo(a, dataA);
  const right = snapshotInfo(b, dataB);
  return right.savedAt - left.savedAt || right.sequence - left.sequence || a.localeCompare(b);
}

/** Return one JSON filename per account ID, preserving every source snapshot on disk. */
export function latestJsonFiles(directory) {
  const groups = new Map();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name.startsWith('.') || !entry.name.endsWith('.json')) continue;
    const file = path.join(directory, entry.name);
    const { id } = snapshotInfo(file);
    const previous = groups.get(id);
    if (!previous || compareSnapshots(file, previous) < 0) groups.set(id, file);
  }
  return [...groups.values()].map(file => path.basename(file)).sort();
}
