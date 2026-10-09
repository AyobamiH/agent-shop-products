import test from "node:test";
import assert from "node:assert/strict";
import { requireExactMainCI } from "./check-release-ci.mjs";
const sha = "a".repeat(40);
const good = {head_sha:sha,head_branch:"main",event:"push",status:"completed",conclusion:"success"};
test("admits exact latest-main successful push CI only", () => {
 assert.deepEqual(requireExactMainCI(sha,"refs/heads/main",sha,[good]),{sha,ciVerdict:"PASS"});
});
test("rejects stale main after release queued",()=>assert.throws(()=>
 requireExactMainCI(sha,"refs/heads/main","b".repeat(40),[good])));
test("rejects branch/PR-only CI",()=>assert.throws(()=>
 requireExactMainCI(sha,"refs/heads/main",sha,[{...good,event:"pull_request"}])));
test("rejects red and in-progress CI",()=>{
 for(const entry of [{...good,conclusion:"failure"},{...good,status:"in_progress",conclusion:null}])
  assert.throws(()=>requireExactMainCI(sha,"refs/heads/main",sha,[entry]));
});
test("rejects non-main or malformed commit",()=>assert.throws(()=>
 requireExactMainCI("latest","refs/heads/other",sha,[good])));
