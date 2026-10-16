import test from "node:test";
import assert from "node:assert/strict";
import { activeVersion, verifyCandidateMetadata, guardedPromote } from "./guarded-promote.mjs";
import { loadReleaseExpectation, verifyPublicCommerce } from "./commerce-release-policy.mjs";

const old = "11111111-1111-4111-8111-111111111111";
const next = "22222222-2222-4222-8222-222222222222";
const sha = "a".repeat(40);
const accountId = "6ddcbcb8474f1a7e460b2f0aabec0e2f";
const selected = loadReleaseExpectation();
const commerceBindings = [
  {name:"COMMERCE_ENABLED",type:"plain_text",text:"true"},
  {name:"COMMERCE_MODE",type:"plain_text",text:"live"},
  {name:"COMMERCE_LIVE_APPROVED",type:"plain_text",text:"yes:"+selected.approval.commercialDecisionId},
  {name:"COMMERCE_OFFER_APPROVAL",type:"plain_text",text:JSON.stringify(selected.approval)},
  {name:"STRIPE_SECRET_KEY",type:"secret_text"},
  {name:"STRIPE_WEBHOOK_SECRET",type:"secret_text"},
];
const bindings = [
  {name:"COMMERCE_DB",type:"d1",id:"f3fa2e0b-bb41-4c51-8b44-25f699baa39b"},
  {name:"PRIVATE_KITS",type:"r2_bucket",bucket_name:"agent-shop-private-kits"},
  {name:"COMMERCE_RATE_LIMITER",type:"ratelimit"},
  ...commerceBindings,
];
const publicCommerce = {schemaVersion:1,commerceActive:true,offers:[{
  id:selected.offerId,version:selected.offerVersion,mode:"live",paymentModel:"managed_payments",
  availability:"purchase_available",currency:"gbp",unitAmountPence:selected.approval.unitAmountPence,
  termsVersion:selected.approval.termsVersion,licenceVersion:selected.approval.licenceVersion,
  refundPolicyVersion:selected.approval.refundPolicyVersion,termsUrl:selected.approval.termsUrl,
  licenceUrl:selected.approval.licenceUrl,refundUrl:selected.approval.refundUrl,
}]};
const acceptedPublic = {status:"PASS",products:33,externalCapabilities:990,codingBugs:24,
  ...verifyPublicCommerce(publicCommerce,selected)};
const good = {
  annotations: {"workers/tag":sha},
  resources: {bindings},
};
function mock({ verified=true, malformedBinding=false, ambiguousPost=false,
  transientPublicFailures=0, concurrentPromotion=false, concurrentSameVersion=false,
  promotionLagReads=0, rollbackLagReads=0, neverConverges=false }={}) {
  let active = old;
  let publicAttempts = 0;
  let deploymentId = "deployment-initial";
  let stale = null;
  let lagRemaining = 0;
  let readsAfterWrite = 0;
  const written = [];
  const fetcher = async (url, options={}) => {
    let result;
    if (url.endsWith("/versions/" + next)) {
      result = malformedBinding ? {...good,resources:{bindings:bindings.slice(0,1)}} : good;
    } else if (url.endsWith("/deployments")) {
      if (options.method === "POST") {
        const data = JSON.parse(options.body);
        stale = {id:deploymentId, version:active};
        active = data.versions[0].version_id;
        deploymentId = "deployment-write-" + (written.length + 1);
        lagRemaining = written.length === 0 ? promotionLagReads : rollbackLagReads;
        written.push(active);
        if (ambiguousPost && written.length===1) throw Error("simulated timeout AFTER Cloudflare committed");
        result = {id:deploymentId,versions:data.versions};
      } else {
        if (written.length) readsAfterWrite++;
        const visible = stale && (lagRemaining-- > 0 || neverConverges)
          ? stale : {id:deploymentId,version:active};
        result = {deployments:[{id:visible.id,versions:[{version_id:visible.version,percentage:100}]}]};
      }
    } else throw Error("UNEXPECTED_MOCK_ENDPOINT");
    return new Response(JSON.stringify({success:true,result}),{
      status:200,headers:{"content-type":"application/json"},
    });
  };
  return {
    args: {sha,versionId:next,accountId,token:"test-only-not-a-real-token",
      fetcher,delay:async()=>{},
      publicVerifier:async()=>{
        publicAttempts++;
        if ((concurrentPromotion || concurrentSameVersion) && publicAttempts===1) {
          active=concurrentSameVersion?next:"33333333-3333-4333-8333-333333333333";
          deploymentId="deployment-other-operator";
        }
        return {...acceptedPublic,
          status: (verified && publicAttempts>transientPublicFailures)?"PASS":"FAIL"};
      }},
    get active(){return active},get writes(){return [...written]},
    get publicAttempts(){return publicAttempts},
    get readsAfterWrite(){return readsAfterWrite},
  };
}
test("checks candidate immutable SHA, resource identity and D1/R2 boundaries",()=>{
  assert.equal(verifyCandidateMetadata(good,sha),true);
  assert.throws(()=>verifyCandidateMetadata({...good,annotations:{"workers/tag":"b".repeat(40)}},sha));
  assert.throws(()=>verifyCandidateMetadata({...good,resources:{bindings:bindings.slice(1)}},sha));
  assert.throws(()=>verifyCandidateMetadata({...good,resources:{bindings:[
    ...bindings,{name:"COMMERCE_ENABLED",type:"plain_text",text:"true"},
  ]}},sha));
});
test("only accepts one 100%-traffic version",()=>{
  assert.equal(activeVersion({deployments:[{versions:[{version_id:old,percentage:100}]}]}),old);
  assert.throws(()=>activeVersion({deployments:[{versions:[
    {version_id:old,percentage:50},{version_id:next,percentage:50},
  ]}]}));
});
test("passes exact candidate and independently accepted public version",async()=>{
  const f=mock();
  const result=await guardedPromote(f.args);
  assert.equal(result.status,"PASS");
  assert.equal(result.previousVersionId,old);
  assert.equal(f.active,next);
  assert.deepEqual(f.writes,[next]);
});
test("fails before any production mutation if candidate lacks a required binding",async()=>{
  const f=mock({malformedBinding:true});
  await assert.rejects(()=>guardedPromote(f.args),/CANDIDATE_BINDING_MISMATCH/);
  assert.deepEqual(f.writes,[]);
});
test("rolls back only its own version on failed outside-in acceptance",async()=>{
  const f=mock({verified:false});
  await assert.rejects(()=>guardedPromote(f.args),/ROLLBACK_verified_previous_version_restored/);
  assert.equal(f.active,old);
  assert.deepEqual(f.writes,[next,old]);
});
test("reconciles an ambiguous Cloudflare POST instead of duplicating it",async()=>{
  const f=mock({ambiguousPost:true});
  const result=await guardedPromote(f.args);
  assert.equal(result.status,"PASS");
  assert.deepEqual(f.writes,[next]);
});

test("retries transient Cloudflare edge convergence without redeploying or billing",async()=>{
  const f=mock({transientPublicFailures:2});
  const result=await guardedPromote(f.args);
  assert.equal(result.status,"PASS");
  assert.equal(result.publicAcceptance.acceptedAttempt,3);
  assert.equal(f.publicAttempts,3);
  assert.deepEqual(f.writes,[next]);
});

test("does not roll back a different operator's concurrent promotion",async()=>{
  const f=mock({concurrentPromotion:true,transientPublicFailures:1});
  await assert.rejects(()=>guardedPromote(f.args),/PRODUCTION_CHANGED_DURING_CONVERGENCE/);
  assert.equal(f.active,"33333333-3333-4333-8333-333333333333");
  assert.deepEqual(f.writes,[next]);
});

test("refuses to promote after production changed since the owner-local preflight",async()=>{
  const f=mock();
  await assert.rejects(()=>guardedPromote({...f.args, expectedPreviousVersion:next}),
    /PRODUCTION_CHANGED_DURING_RELEASE/);
  assert.deepEqual(f.writes,[]);
  assert.equal(f.active,old);
});


test("waits for a delayed deployment pointer without a false rollback", async()=>{
  const f=mock({promotionLagReads:3});
  const result=await guardedPromote(f.args);
  assert.equal(result.status,"PASS");
  assert.equal(result.deploymentId,"deployment-write-1");
  assert.deepEqual(f.writes,[next]);
});
test("a timed-out promotion with delayed visibility is reconciled without another POST", async()=>{
  const f=mock({ambiguousPost:true,promotionLagReads:3});
  const result=await guardedPromote(f.args);
  assert.equal(result.status,"PASS");
  assert.deepEqual(f.writes,[next]);
});
test("rollback waits for its own new deployment record to become visible", async()=>{
  const f=mock({verified:false,rollbackLagReads:3});
  await assert.rejects(()=>guardedPromote(f.args),/ROLLBACK_verified_previous_version_restored/);
  assert.deepEqual(f.writes,[next,old]);
});
test("another operator redeploying the same version is not overwritten", async()=>{
  const f=mock({concurrentSameVersion:true,transientPublicFailures:1});
  await assert.rejects(()=>guardedPromote(f.args),/PRODUCTION_CHANGED_DURING_CONVERGENCE/);
  assert.deepEqual(f.writes,[next]);
});
test("permanently stale control-plane state is bounded and never treated as success", async()=>{
  const f=mock({neverConverges:true});
  await assert.rejects(()=>guardedPromote(f.args),/NOT_CONVERGED/);
  assert.deepEqual(f.writes,[next]);
  assert.equal(f.publicAttempts,0);
  assert.ok(f.readsAfterWrite<=17);
});