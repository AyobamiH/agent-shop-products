// Adapted from this repository's scripts/google/private-store.mjs (owner-direct operator).
import { constants, openSync, closeSync, fstatSync, readFileSync, writeFileSync, mkdirSync,
  lstatSync, renameSync, unlinkSync, fsyncSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { authError } from './constants.mjs';

function owned(stats) { return !process.getuid || stats.uid === process.getuid(); }

function inspect(filename) {
  try { return lstatSync(filename); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export function privateDirectory(directory, { create = true } = {}) {
  if (typeof directory !== 'string' || !path.isAbsolute(directory)) throw authError('PRIVATE_PATH_INVALID');
  const absolute = path.resolve(directory);
  const ancestors = [];
  for (let part = absolute; part !== path.dirname(part); part = path.dirname(part)) ancestors.unshift(part);
  for (const part of ancestors) {
    let stats = inspect(part);
    if (!stats) {
      if (!create) return null;
      mkdirSync(part, { mode: 0o700 }); stats = lstatSync(part);
    }
    if (!stats.isDirectory() || stats.isSymbolicLink()) throw authError('PRIVATE_STORE_SYMLINK');
  }
  const stats = lstatSync(absolute);
  if (!owned(stats) || (stats.mode & 0o077)) throw authError('PRIVATE_STORE_PERMISSION_UNSAFE');
  return absolute;
}

export function privateRead(filename) {
  let fd;
  try {
    const absolute = path.resolve(filename);
    for (let part = path.dirname(absolute); part !== path.dirname(part); part = path.dirname(part)) {
      if (lstatSync(part).isSymbolicLink()) throw authError('PRIVATE_STORE_SYMLINK');
    }
    fd = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stats = fstatSync(fd);
    if (!stats.isFile() || !owned(stats) || (stats.mode & 0o077) || stats.size > 262144 || stats.nlink !== 1) {
      throw authError('PRIVATE_FILE_PERMISSION_OR_SIZE_UNSAFE');
    }
    try { return JSON.parse(readFileSync(fd, 'utf8')); }
    catch { throw authError('PRIVATE_FILE_INVALID'); }
  } finally { if (fd !== undefined) closeSync(fd); }
}

export function privateWrite(name, value, directory) {
  if (!/^[a-z][a-z0-9-]*\.json$/.test(name)) throw authError('PRIVATE_PATH_INVALID');
  const root = privateDirectory(directory);
  const destination = path.join(root, name);
  if (inspect(destination)) privateRead(destination);
  const bytes = JSON.stringify(value, null, 2) + '\n';
  if (Buffer.byteLength(bytes) > 262144) throw authError('PRIVATE_FILE_PERMISSION_OR_SIZE_UNSAFE');
  const temporary = path.join(root, '.' + randomUUID());
  let fd;
  try {
    fd = openSync(temporary, 'wx', 0o600);
    writeFileSync(fd, bytes); fsyncSync(fd); closeSync(fd); fd = undefined;
    renameSync(temporary, destination);
    const parent = openSync(root, constants.O_RDONLY | constants.O_NOFOLLOW);
    try { fsyncSync(parent); } finally { closeSync(parent); }
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (inspect(temporary)) unlinkSync(temporary);
  }
}

export function acquireLock(name, directory) {
  if (!/^[a-z-]+$/.test(name)) throw authError('PRIVATE_PATH_INVALID');
  const filename = path.join(privateDirectory(directory), name + '.lock');
  let fd;
  try { fd = openSync(filename, 'wx', 0o600); writeFileSync(fd, String(process.pid)); }
  catch { throw authError('GOOGLE_OPERATION_ALREADY_LOCKED'); }
  return () => { if (fd !== undefined) { closeSync(fd); fd = undefined; unlinkSync(filename); } };
}
