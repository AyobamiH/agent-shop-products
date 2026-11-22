import test from "node:test";
import assert from "node:assert/strict";
import { reconcileOrUpload, reserveOneShotVersionAttempt } from "./worker-upload-control.mjs";
import { mkdtempSync, readFileSync, lstatSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sha = "e".repeat(40);
const version = {
 id:"12345678-1234-1234-1234-123456789abc",
 annotations:{"workers/tag":sha,"workers/alias":"release-eeeeeeee"},
};
function reader(state) {
 return async (page,per_page)=>({items:state.items.slice((page-1)*per_page,page*per_page),
    result_info:{page,per_page,total_count:state.items.length}});
}
test("existing exact-tag version is reused without upload or new intent", async()=>{
 const state={items:[version]};let writes=0,reserved=0;
 const v=await reconcileOrUpload({sha,readPage:reader(state),reserveAttempt:()=>reserved++,upload:()=>writes++});
 assert.equal(v.versionId,version.id);assert.equal(v.source,"recovered_existing_exact_version");
 assert.equal(writes,0);assert.equal(reserved,0);
});
test("zero-exit CLI is not accepted without provider version",async()=>{
 const state={items:[]};let uploaded=0,reserved=0;
 await assert.rejects(reconcileOrUpload({sha,readPage:reader(state),reserveAttempt:()=>reserved++,upload:()=>{uploaded++;return "Uploaded successfully";}}),/UNCONFIRMED/);
 assert.equal(uploaded,1);assert.equal(reserved,1);
});
test("failed CLI that actually created a version recovers without repeating effect", async()=>{
 const state={items:[]};let uploaded=0,reserved=0;
 const v=await reconcileOrUpload({sha,readPage:reader(state),reserveAttempt:()=>reserved++,upload:()=>{uploaded++;state.items.push(version);throw Error("timed out");}});
 assert.equal(uploaded,1);assert.equal(reserved,1);
 assert.equal(v.versionId,version.id);assert.equal(v.source,"recovered_after_ambiguous_cli");
});
test("provider read failure before admission refuses upload",async()=>{
 let uploads=0;
 await assert.rejects(reconcileOrUpload({sha,readPage:async()=>{throw Error("provider unavailable");},reserveAttempt:()=>{},upload:()=>{uploads++;return "";}}),/unavailable/);
 assert.equal(uploads,0);
});
test("already reserved effect refuses a duplicate write",async()=>{
 let uploads=0;
 await assert.rejects(reconcileOrUpload({sha,readPage:reader({items:[]}),reserveAttempt:()=>{throw Error("already attempted");},upload:()=>{uploads++;}}),/already attempted/);
 assert.equal(uploads,0);
});

test("private source-bound upload intent is atomic and prevents replay",()=>{
 const dir=mkdtempSync(join(tmpdir(),"agent-shop-upload-intent-"));
 const params={folder:dir,sha,sourceTree:"b".repeat(40),priorVersionId:version.id};
 try {
   const f=reserveOneShotVersionAttempt(params);
   assert.equal(lstatSync(f).mode & 0o077,0);
   assert.equal(JSON.parse(readFileSync(f)).sha,sha);
   assert.throws(()=>reserveOneShotVersionAttempt(params),/EEXIST/);
 } finally {rmSync(dir,{recursive:true,force:true});}
});
