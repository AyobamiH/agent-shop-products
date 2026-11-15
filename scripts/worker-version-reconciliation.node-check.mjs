import test from "node:test";
import assert from "node:assert/strict";
import { candidateFromRows, listExactCandidate, observeExactCandidate, normaliseCloudflareVersionPage, makeVersionPageReader } from "./worker-version-reconciliation.mjs";

const sha = "a".repeat(40), id = "12345678-1234-1234-1234-123456789abc";
const good = {id,annotations:{"workers/tag":sha,"workers/alias":"release-aaaaaaaa"}};
const pages = (rows, total=rows.length) => async (page, per_page) =>
  ({items:rows.slice((page-1)*per_page,page*per_page),result_info:{page,per_page,total_count:total}});

test("accepts exactly one Cloudflare-tagged version with matching alias", async () => {
  assert.deepEqual(await listExactCandidate({sha,readPage:pages([good])}),{
    versionId:id,previewURL:"https://release-aaaaaaaa-agent-shop.woeinvests.workers.dev",
  });
  assert.equal(await listExactCandidate({sha,readPage:pages([{...good,annotations:{"workers/tag":"f".repeat(40)}}])}),null);
});

test("refuses duplicate exact-source uploads and mismatched aliases", () => {
  assert.throws(()=>candidateFromRows([good, {...good,id:"aaaaaaaa-1234-1234-1234-123456789abc"}],sha),/DUPLICATE/);
  assert.throws(()=>candidateFromRows([{...good,annotations:{"workers/tag":sha,"workers/alias":"release-elsewhere"}}],sha),/ALIAS/);
  assert.throws(()=>candidateFromRows([{...good,id:"bad"}],sha),/VERSION/);
});

test("paginates all versions and refuses incomplete or contradictory pages", async () => {
  const ignored = Array.from({length:105},(_,i)=>({id: "unused"+i,annotations:{"workers/tag":"f".repeat(40)}}));
  assert.equal((await listExactCandidate({sha,readPage:pages([...ignored,good])})).versionId,id);
  await assert.rejects(listExactCandidate({sha,readPage:async()=>({items:[],result_info:{page:1,per_page:100,total_count:2}})}),/INCOMPLETE/);
  await assert.rejects(listExactCandidate({sha,readPage:async()=>({items:[],result_info:{page:1,per_page:100,total_count:3000}})}),/MALFORMED/);
});

test("bounded delayed reconciliation accepts eventual Cloudflare consistency", async () => {
  let calls=0, waits=0;
  const result = await observeExactCandidate({sha,readPage:async(...args)=>{
    calls++; return pages(calls>=3?[good]:[])(...args);
  },delay:async()=>{waits++},attempts:4});
  assert.equal(result.versionId,id);assert.equal(calls,3);assert.equal(waits,2);
});

test("does not retry an ambiguous absence or ignore failed provider reads", async () => {
  let calls=0;
  const result=await observeExactCandidate({sha,attempts:2,readPage:async(...args)=>{
    calls++;return pages([])(...args);
  }});
  assert.equal(result,null);assert.equal(calls,2);
  await assert.rejects(observeExactCandidate({sha,readPage:async()=>{throw Error("provider down")}}),/provider down/);
});

test("Cloudflare Version API page uses top-level result_info rather than a nested field", () => {
  const input={success:true,result:{items:[good]},result_info:{page:1,per_page:100,count:1,total_count:1}};
  assert.deepEqual(normaliseCloudflareVersionPage(input),{items:[good],result_info:input.result_info});
  assert.throws(()=>normaliseCloudflareVersionPage({success:true,result:{items:[good]}}),/INVALID/);
});

test("reads live-style top-level version pagination with scoped token and bounded timeout", async()=>{
  const url="https://api.cloudflare.com/client/v4/accounts/"+"1".repeat(32)+"/workers/scripts/agent-shop";
  let seen;
  const read=makeVersionPageReader({baseUrl:url,token:"synthetic-token",fetchImpl:async (where,opts)=>{
    seen={where,opts};return {ok:true,status:200,json:async()=>({
      success:true,result:{items:[good]},result_info:{page:1,per_page:100,count:1,total_count:1}
    })};
  }});
  assert.equal((await read(1,100)).items[0].id,id);
  assert.equal(seen.where,url+"/versions?page=1&per_page=100");
  assert.equal(seen.opts.headers.Authorization,"Bearer synthetic-token");
  await assert.rejects(makeVersionPageReader({baseUrl:url,token:"synthetic-token",fetchImpl:async()=>({
    ok:false,status:403,json:async()=>({success:false})
  })})(1,100),/HTTP_403/);
});
