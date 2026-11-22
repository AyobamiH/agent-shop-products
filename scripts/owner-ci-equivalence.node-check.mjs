import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  REQUIRED_EQUIVALENT_STEPS, validateEquivalentReceipt,
  verifyProviderBillingBlock, verifyOwnerEquivalentCI,
} from "./owner-ci-equivalence.mjs";

const sha="a".repeat(40),treeSha="b".repeat(40);
const providerRun={id:101,head_sha:sha,head_branch:"main",event:"push",status:"completed",conclusion:"failure"};
const job={id:202,name:"verify",conclusion:"failure",steps:[]};
const annotation={annotation_level:"failure",message:"The job was not started because your account is locked due to a billing issue."};
const digest=s=>createHash("sha256").update(s).digest("hex");
function envelope(){
  return {version:1,repository:"AyobamiH/agent-shop-products",sha,treeSha,
    kind:"owner-exact-sha-ci-equivalent",status:"passed",host:"authorised-web",
    approval:"OWNER-20261102-AGENT-SHOP-RELEASE",completedAt:new Date().toISOString(),
    steps:REQUIRED_EQUIVALENT_STEPS.map(id=>({id,exitCode:0,logSha256:digest(id+" pass")}))};
}
const gh=(cmd,args)=>{
  assert.equal(cmd,"gh");
  const path=args[1];
  if(path.endsWith("/commits/"+sha))return JSON.stringify({sha,commit:{verification:{verified:true,reason:"valid"}}});
  if(path.includes("/actions/workflows/frontend-ci.yml/runs?"))return JSON.stringify({workflow_runs:[providerRun]});
  if(path.endsWith("/actions/runs/101/jobs"))return JSON.stringify({jobs:[job]});
  if(path.endsWith("/check-runs/202/annotations"))return JSON.stringify([annotation]);
  throw Error("Unexpected fake request "+path);
};
test("only exact owner-approved SHA plus complete evidence may admit CI equivalence",()=>{
  const r=validateEquivalentReceipt(envelope(),{sha,treeSha});
  assert.equal(r.githubHostedCiStatus,"BLOCKED_BILLING");
  for(const wrong of [{sha:"c".repeat(40)},{treeSha:"d".repeat(40)}]){
    assert.throws(()=>validateEquivalentReceipt(envelope(),{sha,treeSha,...wrong}),/RECEIPT_INVALID/);
  }
  const incomplete=envelope();incomplete.steps.pop();
  assert.throws(()=>validateEquivalentReceipt(incomplete,{sha,treeSha}),/MATRIX_INCOMPLETE/);
  const bad=envelope();bad.steps[0].exitCode=1;
  assert.throws(()=>validateEquivalentReceipt(bad,{sha,treeSha}),/STEP_INVALID/);
  const expired=envelope();expired.completedAt="2026-01-01T00:00:00Z";
  assert.throws(()=>validateEquivalentReceipt(expired,{sha,treeSha}),/RECEIPT_INVALID/);
});
test("runner billing annotation must prove a job never started",()=>{
  assert.equal(verifyProviderBillingBlock({sha,runs:[providerRun],jobs:[job],annotations:[annotation]}),true);
  assert.throws(()=>verifyProviderBillingBlock({sha,runs:[providerRun],jobs:[{...job,steps:[{name:"Run tests"}]}],annotations:[annotation]}),/BILLING_BLOCK/);
  assert.throws(()=>verifyProviderBillingBlock({sha,runs:[providerRun],jobs:[job],annotations:[{...annotation,message:"Tests failed"}]}),/BILLING_BLOCK/);
  assert.throws(()=>verifyProviderBillingBlock({sha,runs:[{...providerRun,head_sha:"f".repeat(40)}],jobs:[job],annotations:[annotation]}),/BILLING_BLOCK/);
});
test("owner-hosted receipt must reconcile immutable log bytes, signature and genuine GitHub failure",()=>{
  const folder=mkdtempSync(join(tmpdir(),"agent-shop-ci-equivalent-test-"));
  try{
    chmodSync(folder,0o700);
    const receipt=envelope();
    for(const step of receipt.steps) {
      const p=join(folder,step.id+".log");
      writeFileSync(p,step.id+" pass",{mode:0o600});
    }
    writeFileSync(join(folder,"equivalent-receipt.json"),JSON.stringify(receipt),{mode:0o600});
    const pass=verifyOwnerEquivalentCI({sha,treeSha,approvalSha:sha,gh,evidenceBase:folder});
    assert.equal(pass.ciVerdict,"OWNER_LOCAL_EQUIVALENT_PASS");
    assert.equal(pass.providerRunId,101);
    assert.throws(()=>verifyOwnerEquivalentCI({sha,treeSha,approvalSha:"e".repeat(40),gh,evidenceBase:folder}),/NOT_APPROVED/);
    const badGh=(cmd,args)=>args[1].endsWith("/commits/"+sha)?
      JSON.stringify({sha,commit:{verification:{verified:false,reason:"unsigned"}}}):gh(cmd,args);
    assert.throws(()=>verifyOwnerEquivalentCI({sha,treeSha,approvalSha:sha,gh:badGh,evidenceBase:folder}),/SIGNATURE_NOT_VERIFIED/);
    writeFileSync(join(folder,"catalog-sync-parity.log"),"",{mode:0o600});
    assert.throws(()=>verifyOwnerEquivalentCI({sha,treeSha,approvalSha:sha,gh,evidenceBase:folder}),/DIGEST_MISMATCH/);
    writeFileSync(join(folder,"catalog-sync-parity.log"),"catalog-sync-parity pass",{mode:0o600});
    writeFileSync(join(folder,"browser-e2e.log"),"tampered log",{mode:0o600});
    assert.throws(()=>verifyOwnerEquivalentCI({sha,treeSha,approvalSha:sha,gh,evidenceBase:folder}),/DIGEST_MISMATCH/);
  }finally{rmSync(folder,{recursive:true,force:true});}
});
