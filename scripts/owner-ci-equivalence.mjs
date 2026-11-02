import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SHA=/^[0-9a-f]{40}$/;
const HEX=/^[0-9a-f]{64}$/;
const REPO="AyobamiH/agent-shop-products";
export const REQUIRED_EQUIVALENT_STEPS=[
  "bun-install","catalog-validation","capability-validation",
  "integration-request","release-regressions","catalog-sync","catalog-sync-parity",
  "production-build","wrangler-dry-run","typecheck","lint","vitest",
  "parity-contract-tests","design-lint","node-preview-build","browser-e2e",
];

function strictPrivateFile(file, maximum=2_000_000, allowEmpty=false) {
  const st=lstatSync(file);
  if (!st.isFile() || st.isSymbolicLink() || (st.mode&0o077)!==0 ||
      (typeof process.getuid==="function" && st.uid!==process.getuid()) ||
      (!allowEmpty && st.size===0) || st.size>maximum) throw Error("LOCAL_CI_EVIDENCE_UNTRUSTED");
  return readFileSync(file);
}

export function validateEquivalentReceipt(receipt,{sha,treeSha,now=Date.now()}){
  if (!SHA.test(sha) || !SHA.test(treeSha) ||
      receipt?.version!==1 || receipt?.repository!==REPO ||
      receipt?.sha!==sha || receipt?.treeSha!==treeSha ||
      receipt?.kind!=="owner-exact-sha-ci-equivalent" ||
      receipt?.status!=="passed" ||
      receipt?.host!=="authorised-web" ||
      receipt?.approval!=="OWNER-20261102-AGENT-SHOP-RELEASE" ||
      !Number.isFinite(Date.parse(receipt.completedAt)) ||
      Math.abs(now-Date.parse(receipt.completedAt))>12*60*60*1000 ||
      !Array.isArray(receipt.steps)) throw Error("LOCAL_CI_RECEIPT_INVALID");
  const seen=new Set();
  for(const step of receipt.steps) {
    if(typeof step?.id!=="string" || seen.has(step.id) ||
       step.exitCode!==0 || !HEX.test(step.logSha256)) throw Error("LOCAL_CI_STEP_INVALID");
    seen.add(step.id);
  }
  if(seen.size!==REQUIRED_EQUIVALENT_STEPS.length ||
     REQUIRED_EQUIVALENT_STEPS.some(s=>!seen.has(s))) throw Error("LOCAL_CI_MATRIX_INCOMPLETE");
  return {sha,ciVerdict:"OWNER_LOCAL_EQUIVALENT_PASS",githubHostedCiStatus:"BLOCKED_BILLING"};
}

export function verifyProviderBillingBlock({sha,runs,jobs,annotations}){
  if(!Array.isArray(runs) || !Array.isArray(jobs) || !Array.isArray(annotations)) throw Error("GITHUB_PROVIDER_EVIDENCE_MISSING");
  const matching=runs.filter(r=>r.head_sha===sha && r.head_branch==="main" &&
    r.event==="push" && r.status==="completed" && r.conclusion==="failure");
  if(!matching.length || jobs.length!==1 ||
     jobs[0].conclusion!=="failure" || jobs[0].name!=="verify" ||
     (jobs[0].steps?.length??0)!==0 ||
     !annotations.some(a=>a.annotation_level==="failure" &&
       a.message==="The job was not started because your account is locked due to a billing issue.")){
    throw Error("GITHUB_NOT_PROVEN_BILLING_BLOCK");
  }
  return true;
}

export function verifyOwnerEquivalentCI({sha,treeSha,approvalSha,gh,evidenceBase}){
  if(approvalSha!==sha || !SHA.test(sha) || !SHA.test(treeSha)) throw Error("OWNER_EQUIVALENT_NOT_APPROVED_FOR_SHA");
  const get=(path)=>JSON.parse(gh("gh",["api",path]));
  const commit=get("repos/"+REPO+"/commits/"+sha);
  if(commit.sha!==sha || commit.commit?.verification?.verified!==true ||
     commit.commit?.verification?.reason!=="valid") throw Error("SOURCE_COMMIT_SIGNATURE_NOT_VERIFIED");
  const runs=get("repos/"+REPO+"/actions/workflows/frontend-ci.yml/runs?head_sha="+sha+"&event=push&per_page=30")?.workflow_runs;
  if(!Array.isArray(runs)) throw Error("GITHUB_CI_OBSERVATION_UNAVAILABLE");
  // The ordinary successful hosted route always takes priority in owner-local-release.
  const failures=runs.filter(x=>x.head_sha===sha&&x.head_branch==="main"&&
    x.event==="push"&&x.status==="completed"&&x.conclusion==="failure");
  if(failures.length!==1)throw Error("GITHUB_FAILED_RUN_AMBIGUOUS");
  const jobRecord=get("repos/"+REPO+"/actions/runs/"+failures[0].id+"/jobs");
  const jobs=jobRecord?.jobs;
  if(!Array.isArray(jobs)||jobs.length!==1)throw Error("GITHUB_JOB_ADMISSION_AMBIGUOUS");
  const annotations=get("repos/"+REPO+"/check-runs/"+jobs[0].id+"/annotations");
  verifyProviderBillingBlock({sha,runs,jobs,annotations});
  const dir=evidenceBase??join(homedir(),".local/share/agent-shop","ci-"+sha.slice(0,12));
  const receipt=JSON.parse(strictPrivateFile(join(dir,"equivalent-receipt.json")).toString("utf8"));
  const result=validateEquivalentReceipt(receipt,{sha,treeSha});
  for(const step of receipt.steps) {
    const expected=createHash("sha256").update(strictPrivateFile(join(dir,step.id+".log"),30_000_000,true)).digest("hex");
    if(expected!==step.logSha256) throw Error("LOCAL_CI_LOG_DIGEST_MISMATCH_"+step.id);
  }
  return {...result,providerRunId:failures[0].id,evidenceDigest:createHash("sha256")
    .update(strictPrivateFile(join(dir,"equivalent-receipt.json"))).digest("hex")};
}
