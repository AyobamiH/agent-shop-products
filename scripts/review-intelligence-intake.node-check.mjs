import test from "node:test";
import assert from "node:assert/strict";
import { normaliseTitle, reviewIntake } from "./review-intelligence-intake.mjs";

const catalog = {products:[{id:"ci-admission-and-fallback-triage",name:"CI Admission and Fallback Triage"}]};
const source=(type, records)=>({source:{type,spreadsheetId:"mock-1",tab:type},records});
const row=(id,title,verification="Verified",limitations="")=>({id,title,row:2,verification,limitations});
test("Unicode and punctuation normalise deterministically",()=>{
  assert.equal(normaliseTitle("Google’s — Indexed-Status"),"google s indexed status");
});
test("review candidates are never promoted automatically",()=>{
  const item={recordKind:"private-candidate-inventory",sources:[
    source("problem",[row("P1","Problems")]),source("research-candidate",[row("R1","Experiment")]),
    source("execution-solution",[row("S1","CI Admission and Fallback Triage")]),
    source("reusable-solution",[row("S2","New Source Method","Proposed only")]),
  ]};
  const r=reviewIntake(item,catalog);
  assert.equal(r.status,"REVIEW_ONLY");
  assert.deepEqual([r.counts.total,r.counts.problemOnly,r.counts.researchOnly,
    r.counts.exactTitleMatches,r.counts.reviewNeeded],[4,1,1,1,1]);
  assert.equal(r.counts.limitedEvidence,1);
  assert.equal(r.reviews[2].existingProductId,"ci-admission-and-fallback-triage");
});
test("cross-source equal titles are marked possible duplicates, not merged",()=>{
  const item={recordKind:"private-candidate-inventory",sources:[
    source("execution-solution",[row("S1","Exact-CI")]),
    source("reusable-solution",[row("S2","Exact CI")]),
  ]};
  const r=reviewIntake(item,{products:[]});
  assert.equal(r.counts.duplicateTitles,1);
  assert.ok(r.reviews[1].duplicateOf);
});
test("duplicate source IDs and missing row metadata fail closed",()=>{
  const item={recordKind:"private-candidate-inventory",sources:[
    source("reusable-solution",[row("S1","Skill"),row("S1","Skill duplicate")]),
  ]};
  assert.throws(()=>reviewIntake(item,{products:[]}),/INVALID_OR_DUPLICATE/);
  item.sources[0].records[1].id="S2";
  item.sources[0].records[1].row=0;
  assert.throws(()=>reviewIntake(item,{products:[]}),/INVALID_OR_DUPLICATE/);
});
test("missing catalogue or unknown source type is never silently accepted",()=>{
  assert.throws(()=>reviewIntake({recordKind:"private-candidate-inventory",sources:[]},null),/INVALID/);
  assert.throws(()=>reviewIntake({recordKind:"private-candidate-inventory",sources:[source("runtime-admin",[])]},{products:[]}),/INVALID_SOURCE_SLICE/);
});
