import test from "node:test";
import assert from "node:assert/strict";
import { awaitDeployment, deploymentState, rollbackOwnedDeployment } from "./deployment-convergence.mjs";
const prior = { id: "before", versionId: "old" };
const candidate = { id: "mine", versionId: "new" };
const delay = async () => {};
const versionOf = d => d.deployments[0].versions[0].version_id;
test("deployment identity is mandatory, not inferred from code version", () => {
  assert.throws(() => deploymentState({deployments:[{versions:[{version_id:"old"}]}]},versionOf), /DEPLOYMENT_ID/);
});
test("a stale pre-release record cannot prove a rollback", async () => {
  let n=0;
  const result=await awaitDeployment({ read:async()=>++n<3?prior:{id:"restore",versionId:"old"},
    versionId:"old",deploymentId:"restore",stale:[candidate,prior],delay });
  assert.equal(result.id,"restore"); assert.equal(result.attempts,3);
});
test("rollback refuses another deployment even if it serves our version", async () => {
  let writes=0;
  const result=await rollbackOwnedDeployment({read:async()=>({id:"someone-else",versionId:"new"}),
    write:async()=>{writes++},candidate,prior,delay});
  assert.equal(writes,0); assert.match(result,/no_rollback_performed/);
});
test("rollback response timeout is reconciled without repeating its write", async () => {
  let writes=0, reads=0;
  const result=await rollbackOwnedDeployment({candidate,prior,delay,
    read:async()=>++reads<4?candidate:{id:"restore",versionId:"old"},
    write:async()=>{writes++;throw Error("simulated committed response timeout");}});
  assert.equal(result,"verified_previous_version_restored");assert.equal(writes,1);
});
test("unresolved candidate identity is not rollback authority", async () => {
  let writes=0;
  const result=await rollbackOwnedDeployment({read:async()=>candidate,write:async()=>{writes++},
    candidate:{...candidate,id:""},prior,delay});
  assert.equal(writes,0);assert.match(result,/unresolved/);
});
