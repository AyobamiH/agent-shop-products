// A version identifies code; a deployment identifies one traffic change.
// Only the explicitly observed older deployment may be treated as stale.
export function deploymentState(deployments, versionOf) {
  const versionId = versionOf(deployments);
  const id = deployments.deployments[0].id;
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(id)) {
    throw Error("DEPLOYMENT_ID_MISSING_OR_INVALID");
  }
  return { id, versionId };
}

export async function awaitDeployment({ read, versionId, deploymentId = "", stale = [], delay }) {
  for (let attempt = 1; attempt <= 8; attempt++) {
    const current = await read();
    const knownOlder = stale.some(s => s.id === current.id && s.versionId === current.versionId);
    if (!knownOlder) {
      if (current.versionId !== versionId || (deploymentId && current.id !== deploymentId)) {
        throw Error("PRODUCTION_CHANGED_DURING_CONVERGENCE");
      }
      return { ...current, attempts: attempt };
    }
    if (attempt < 8) await delay(1500);
  }
  throw Error("DEPLOYMENT_CONTROL_PLANE_NOT_CONVERGED");
}

export async function rollbackOwnedDeployment({ read, write, candidate, prior, delay }) {
  // Never write over a new deployment even when its code version is identical.
  if (!candidate.id) return "candidate_identity_unresolved_no_rollback_performed";
  const current = await read();
  if (current.id !== candidate.id || current.versionId !== candidate.versionId) {
    return "candidate_not_current_no_rollback_performed";
  }
  let rollbackId = "";
  try { rollbackId = (await write())?.id || ""; }
  catch { /* Reconcile an ambiguous write with reads; never repeat the POST. */ }
  await awaitDeployment({ read, versionId: prior.versionId, deploymentId: rollbackId,
    stale: [candidate, prior], delay });
  return "verified_previous_version_restored";
}
