import path from 'node:path';
import { DEFAULT_STATE_DIR, authError } from './auth/constants.mjs';
import { createGoogleSession, credentialStatus } from './auth/session.mjs';
import { serveAuthorization } from './auth/listener.mjs';
import { createSearchConsoleProvider } from './core/provider.mjs';
import { createSnapshotStore } from './storage/snapshot-store.mjs';
import { createSearchConsoleService } from './service.mjs';

export function configuration({ stateDir = DEFAULT_STATE_DIR, ownerCredentialsDir } = {}) {
  if (typeof stateDir !== 'string' || !path.isAbsolute(stateDir) ||
      (ownerCredentialsDir !== undefined && (typeof ownerCredentialsDir !== 'string' || !path.isAbsolute(ownerCredentialsDir)))) {
    throw authError('PRIVATE_PATH_INVALID');
  }
  return { stateDir: path.resolve(stateDir), snapshotDir: path.join(path.resolve(stateDir), 'snapshots'),
    credentialDir: ownerCredentialsDir ? path.resolve(ownerCredentialsDir) : path.join(path.resolve(stateDir), 'auth'),
    allowExistingScopes: Boolean(ownerCredentialsDir) };
}

export async function createDefaultService(options = {}) {
  const config = configuration(options);
  const session = createGoogleSession({ directory: config.credentialDir, allowExistingScopes: config.allowExistingScopes });
  return createSearchConsoleService({ provider: createSearchConsoleProvider({ session }),
    store: createSnapshotStore(config.snapshotDir), account: () => session.account() });
}

export async function getStatus(options = {}) {
  const config = configuration(options);
  return { product: 'search-console-operator', version: '0.1.0', providerAccess: 'read_only',
    credentialSource: config.allowExistingScopes ? 'explicit_existing_owner_directory' : 'independent_connection',
    ...credentialStatus(config.credentialDir, { allowExistingScopes: config.allowExistingScopes }) };
}

export async function runAuth(options = {}) {
  if (options.ownerCredentialsDir) throw authError('OAUTH_LOCAL_CONFIGURATION_INVALID');
  const config = configuration(options);
  return serveAuthorization({ directory: config.credentialDir, clientFile: options.clientFile,
    expectedEmail: options.expectedEmail, port: options.port ?? 8775 });
}
