import { constants, openSync, closeSync, fstatSync, readSync, writeFileSync,
  fsyncSync, linkSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { owned, syncDirectory } from './private-directory.mjs';
import { requireSnapshot, snapshotError } from './errors.mjs';

export function readPrivateFile(filename, maxBytes) {
  let fd;
  try {
    fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = fstatSync(fd);
    requireSnapshot(before.isFile() && owned(before) && (before.mode & 0o777) === 0o600,
      'SNAPSHOT_FILE_UNSAFE');
    requireSnapshot(before.size <= maxBytes && before.size > 0, 'SNAPSHOT_TOO_LARGE');
    const buffer = Buffer.allocUnsafe(before.size + 1);
    let length = 0;
    while (length < buffer.length) {
      const count = readSync(fd, buffer, length, buffer.length - length, null);
      if (!count) break;
      length += count;
    }
    const after = fstatSync(fd);
    requireSnapshot(length === before.size && after.size === before.size &&
      after.mtimeMs === before.mtimeMs && after.ctimeMs === before.ctimeMs,
    'SNAPSHOT_CHANGED_DURING_READ');
    return buffer.subarray(0, length);
  } catch (error) {
    if (error?.code?.startsWith('SNAPSHOT_')) throw error;
    if (error.code === 'ENOENT') throw snapshotError('SNAPSHOT_NOT_FOUND');
    throw snapshotError('SNAPSHOT_FILE_UNSAFE', error);
  } finally { if (fd !== undefined) closeSync(fd); }
}

export function publishPrivateFile(directory, id, bytes) {
  const temporary = path.join(directory, '.snapshot-' + randomUUID() + '.tmp');
  const destination = path.join(directory, id + '.json');
  let fd;
  let temporaryExists = false;
  try {
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL |
      constants.O_NOFOLLOW, 0o600);
    temporaryExists = true;
    writeFileSync(fd, bytes);
    fsyncSync(fd);
    closeSync(fd); fd = undefined;
    try { linkSync(temporary, destination); }
    catch (error) {
      if (error.code === 'EEXIST') return false;
      throw error;
    }
    syncDirectory(directory);
    return true;
  } catch (error) {
    if (error?.code?.startsWith('SNAPSHOT_')) throw error;
    throw snapshotError('SNAPSHOT_WRITE_FAILED', error);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (temporaryExists) {
      unlinkSync(temporary);
      syncDirectory(directory);
    }
  }
}
