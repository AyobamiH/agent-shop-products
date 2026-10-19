export function snapshotError(code, cause) {
  return Object.assign(new Error(code, cause ? { cause } : undefined), { code });
}

export function requireSnapshot(condition, code) {
  if (!condition) throw snapshotError(code);
}
