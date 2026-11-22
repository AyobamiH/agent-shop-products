import { constants, openSync, closeSync, fstatSync, readFileSync, writeFileSync, mkdirSync,
  lstatSync, existsSync, renameSync, unlinkSync, fsyncSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PRIVATE_DIR } from './constants.mjs';
function owned(stats) {
  return !process.getuid || stats.uid === process.getuid();
}
export function privateDirectory(directory = PRIVATE_DIR) {
  const absolute = path.resolve(directory);
  const parent = path.dirname(absolute);
  if (!existsSync(parent)) throw Error('PRIVATE_STORE_PARENT_MISSING');
  let ancestor = parent;
  while (ancestor !== path.dirname(ancestor)) {
    if (lstatSync(ancestor).isSymbolicLink()) throw Error('PRIVATE_STORE_SYMLINK');
    ancestor = path.dirname(ancestor);
  }
  if (!existsSync(absolute)) mkdirSync(absolute, { mode: 0o700 });
  const stats = lstatSync(absolute);
  if (!stats.isDirectory() || stats.isSymbolicLink() || !owned(stats) || (stats.mode & 0o077)) {
    throw Error('PRIVATE_STORE_PERMISSION_UNSAFE');
  }
  return absolute;
}
export function privateRead(filename) {
  let fd;
  try {
    fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stats = fstatSync(fd);
    if (!stats.isFile() || !owned(stats) || (stats.mode & 0o077) || stats.size > 262144) {
      throw Error('PRIVATE_FILE_PERMISSION_OR_SIZE_UNSAFE');
    }
    return JSON.parse(readFileSync(fd, 'utf8'));
  } finally { if (fd !== undefined) closeSync(fd); }
}
export function privateWrite(name, value, directory = PRIVATE_DIR) {
  if (!/^[a-z][a-z0-9-]*\.json$/.test(name)) throw Error('INVALID_PRIVATE_FILENAME');
  const root = privateDirectory(directory);
  const destination = path.join(root, name);
  if (existsSync(destination)) privateRead(destination);
  const temporary = path.join(root, '.' + randomUUID());
  let fd;
  try {
    fd = openSync(temporary, 'wx', 0o600);
    writeFileSync(fd, JSON.stringify(value, null, 2) + '\n'); fsyncSync(fd); closeSync(fd); fd = undefined;
    renameSync(temporary, destination);
    const parent = openSync(root, constants.O_RDONLY); try { fsyncSync(parent); } finally { closeSync(parent); }
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  return destination;
}
export function acquireLock(name, directory = PRIVATE_DIR) {
  if (!/^[a-z-]+$/.test(name)) throw Error('INVALID_LOCK_NAME');
  const file = path.join(privateDirectory(directory), name + '.lock');
  let fd;
  try { fd = openSync(file, 'wx', 0o600); writeFileSync(fd, String(process.pid)); }
  catch { throw Error('GOOGLE_OPERATION_ALREADY_LOCKED'); }
  return () => { if (fd !== undefined) { closeSync(fd); fd = undefined; unlinkSync(file); } };
}
