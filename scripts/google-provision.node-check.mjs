import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCOUNT,plan,planHash,provision} from './google/portfolio-provision.mjs';
test('only two exact approved products; privacy settings deny collection until consent',()=>{
  assert.throws(()=>plan('unapproved'),/PROJECT_UNAPPROVED/);
  for(const project of ['global-bill-forge','oneclickpostfactory']){
    const p=plan(project);
    assert.equal(p.account,ACCOUNT);
    assert.equal(p.websiteCollectionEnabled,false);
    assert.equal(p.enhancedMeasurement.streamEnabled,false);
    assert.equal(p.googleSignals,'GOOGLE_SIGNALS_DISABLED');
    assert.equal(p.redaction.emailRedactionEnabled,true);
    assert.match(planHash(p),/^[0-9a-f]{64}$/);
  }
});
function setup(project) {
 const p=plan(project),calls=[],ensured=[];
 const session={async request(url,opts={}){
  calls.push({url,method:opts.method||'GET'});
  if(url==='https://www.googleapis.com/webmasters/v3/sites')
    return {siteEntry:[{siteUrl:p.gsc,permissionLevel:'siteOwner'}]};
  if(url==='https://analyticsadmin.googleapis.com/v1beta/'+ACCOUNT)
    return{name:ACCOUNT};
  if(url==='https://analyticsadmin.googleapis.com/v1beta/properties' && opts.method==='POST')
    return{name:'properties/88888888'};
  if(url==='https://analyticsadmin.googleapis.com/v1beta/properties/88888888')
    return{name:'properties/88888888',...p.property};
  if(url==='https://analyticsadmin.googleapis.com/v1beta/properties/88888888/dataStreams' && opts.method==='POST')
    return {name:'properties/88888888/dataStreams/77777777',...p.stream,
      webStreamData:{...p.stream.webStreamData,measurementId:'G-TEST77777'}};
  if(url==='https://analyticsadmin.googleapis.com/v1beta/properties/88888888/dataStreams/77777777')
    return {name:'properties/88888888/dataStreams/77777777',...p.stream,
      webStreamData:{...p.stream.webStreamData,measurementId:'G-TEST77777'}};
  throw Error('UNEXPECTED_ENDPOINT');
 }};
 let saved={};
 const inventoryFn=async()=>({analytics:{status:'observed',accounts:[{account:ACCOUNT}],properties:[]},
   searchConsole:{status:'observed'}});
 const pagedFn=async(_session,endpoint,type)=>{
  if(['properties','dataStreams','googleAdsLinks'].includes(type))return[];
  throw Error('UNEXPECTED_PAGINATION');
 };
 return {p,calls,ensured,session,inventoryFn,pagedFn,
   save:async x=>{saved=structuredClone(x)},
   ensureFn:async (_session,url,value)=>{ensured.push({url,value});return {name:url}},
   getJournal:()=>saved};
}
test('creates only GA4 property and web stream with exact post-write readback and privacy checks',async()=>{
 const h=setup('global-bill-forge');
 const result=await provision({session:h.session,project:'global-bill-forge',expectedHash:planHash(h.p),
   journal:{},save:h.save,inventoryFn:h.inventoryFn,pagedFn:h.pagedFn,ensureFn:h.ensureFn});
 assert.equal(result.status,'provisioned_verified');
 assert.equal(result.websiteCollectionEnabled,false);
 assert.equal(h.calls.filter(x=>x.method==='POST').length,2);
 assert.equal(h.ensured.length,4);
 assert.ok(h.ensured.every(x=>x.url.startsWith('https://analyticsadmin.googleapis.com/')));
 assert.equal(h.getJournal().status,'provisioned_verified');
 assert.equal(h.getJournal().measurementId,'G-TEST77777');
});
test('wrong plan or ambiguous prior creation refuses all provider writes',async()=>{
 const h=setup('oneclickpostfactory');
 const base={session:h.session,project:'oneclickpostfactory',save:h.save,
   inventoryFn:h.inventoryFn,pagedFn:h.pagedFn,ensureFn:h.ensureFn};
 await assert.rejects(provision({...base,journal:{},expectedHash:'deadbeef'}),/PLAN_HASH_CHANGED/);
 assert.equal(h.calls.length,0);
 await assert.rejects(provision({...base,journal:{propertyCreateAttempted:true},expectedHash:planHash(h.p)}),/PROPERTY_AMBIGUOUS_NO_RETRY/);
 assert.equal(h.calls.filter(x=>x.method==='POST').length,0);
});
