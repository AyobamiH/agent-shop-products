import { lstatSync, mkdirSync, openSync, closeSync, fsyncSync, constants } from 'node:fs';
import path from 'node:path';
import { requireSnapshot, snapshotError } from './errors.mjs';

export function owned(stats) {
  return typeof process.getuid !== 'function' || stats.uid === process.getuid();
}

export function privateDirectory(directory, { create = false } = {}) {
  requireSnapshot(typeof directory === 'string' && directory.length > 0 && !directory.includes('\0'),
    'SNAPSHOT_INVALID_DIRECTORY');
  const absolute = path.resolve(directory);
  requireSnapshot(absolute !== path.parse(absolute).root, 'SNAPSHOT_INVALID_DIRECTORY');
  const components = absolute.slice(path.parse(absolute).root.length).split(path.sep);
  let current = path.parse(absolute).root;
  for (const component of components) {
    current = path.join(current, component);
    let stats;
    try { stats = lstatSync(current); }
    catch (error) {
      if (error.code !== 'ENOENT') throw snapshotError('SNAPSHOT_DIRECTORY_UNSAFE', error);
      if (!create) throw snapshotError('SNAPSHOT_DIRECTORY_NOT_FOUND');
      let created = false;
      try { mkdirSync(current, { mode: 0o700 }); created = true; }
      catch (mkdirError) {
        if (mkdirError.code !== 'EEXIST') throw snapshotError('SNAPSHOT_DIRECTORY_CREATE_FAILED', mkdirError);
      }
      stats = lstatSync(current);
      if (created) {
        requireSnapshot(owned(stats) && (stats.mode & 0o777) === 0o700, 'SNAPSHOT_DIRECTORY_UNSAFE');
        syncDirectory(path.dirname(current));
      }
    }
    requireSnapshot(!stats.isSymbolicLink() && stats.isDirectory(), 'SNAPSHOT_DIRECTORY_UNSAFE');
    if (current === absolute) requireSnapshot(owned(stats) && (stats.mode & 0o777) === 0o700,
      'SNAPSHOT_DIRECTORY_UNSAFE');
  }
  return absolute;
}

export function syncDirectory(directory) {
  const fd = openSync(directory, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}
