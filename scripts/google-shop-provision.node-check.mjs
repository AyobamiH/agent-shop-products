import test from 'node:test';
import assert from 'node:assert/strict';
import {provisioningPlan,planHash,provisionShop,PROPERTY_TITLE,STREAM_TITLE,ENHANCED_OFF,RETENTION,REDACTION,DIMENSIONS} from './google/shop-provision.mjs';
import {SHOP_ORIGIN} from './google/constants.mjs';
const account='accounts/123', property='properties/456', stream=property+'/dataStreams/789';
function fixture({existing=false,unknownProperty=false,foreignStream=false,wrongName=false}={}) {
  let prop=existing?{name:property,parent:account,displayName:PROPERTY_TITLE,timeZone:'Europe/London',currencyCode:'GBP'}:null;
  let st=existing?{name:stream,displayName:STREAM_TITLE,type:'WEB_DATA_STREAM',webStreamData:{defaultUri:foreignStream?'https://other.invalid':SHOP_ORIGIN,measurementId:'G-TESTONLY00'}}:null;
  const calls=[],dimensions=[],settings=new Map();
  const session={request:async(url,options={})=>{
    const p=new URL(url).pathname.replace(/^\/v1(?:alpha|beta)\//,'');const method=options.method||'GET';calls.push({p,method,body:options.body});
    if(p===account)return{name:account};
    if(p==='properties'&&method==='GET')return{properties:prop?[prop]:[]};
    if(p==='properties'&&method==='POST'){
      prop={name:property,...options.body};if(unknownProperty)throw Error('GOOGLE_TRANSPORT_UNAVAILABLE');return prop;
    }
    if(p===property)return wrongName?{...prop,displayName:'Other brand'}:prop;
    if(p===property+'/dataStreams'&&method==='GET')return{dataStreams:st?[st]:[]};
    if(p===property+'/dataStreams'&&method==='POST'){st={name:stream,...options.body,webStreamData:{...options.body.webStreamData,measurementId:'G-TESTONLY00'}};return st;}
    if(p===stream)return st;
    if(/Settings$/.test(p)){
      if(method==='PATCH')settings.set(p,{name:p,...options.body,...(options.body.queryParameterKeys?{queryParameterKeys:options.body.queryParameterKeys.map(key=>key.toLowerCase())}:{})});
      return settings.get(p)||{name:p};
    }
    if(p===property+'/customDimensions'){
      if(method==='POST'){dimensions.push({name:p+'/'+(dimensions.length+1),...options.body});return dimensions.at(-1);}
      return{customDimensions:dimensions};
    }
    if(p===property+'/googleAdsLinks')return{googleAdsLinks:[]};
    throw Error('UNEXPECTED_FIXTURE_REQUEST');
  }};
  const journal={};return{session,journal,calls,settings,args:{session,account,journal,expectedHash:planHash(provisioningPlan(account)),save:async()=>{}}};
}
test('plan binds an explicit account, dedicated host and privacy-first defaults',()=>{
 const p=provisioningPlan(account);assert.equal(p.activateWebsite,false);assert.equal(p.property.parent,account);
 assert.equal(p.stream.webStreamData.defaultUri,SHOP_ORIGIN);assert.ok(Object.values(ENHANCED_OFF).every(x=>x===false));
 assert.equal(RETENTION.eventDataRetention,'TWO_MONTHS');assert.equal(REDACTION.emailRedactionEnabled,true);
 assert.throws(()=>provisioningPlan('accounts/123?other=true'));
});
test('wrong plan hash admits no Google operation',async()=>{
 const f=fixture();await assert.rejects(()=>provisionShop({...f.args,expectedHash:'wrong'}),/HASH_MISMATCH/);assert.equal(f.calls.length,0);
});
test('creates one dedicated property/stream with independently verified privacy and dimensions',async()=>{
 const f=fixture();const r=await provisionShop(f.args);
 assert.equal(r.status,'provisioned_verified');assert.equal(r.websiteCollectionEnabled,false);assert.equal(r.stream,stream);
 assert.equal(r.customDimensions.length,Object.keys(DIMENSIONS).length);
 assert.ok(f.calls.filter(c=>c.method==='POST'&&c.p.endsWith('/customDimensions')).every(c=>!('disallowAdsPersonalization' in c.body)));
 assert.equal(f.calls.filter(c=>c.method==='POST'&&c.p==='properties').length,1);
 assert.equal(f.calls.filter(c=>c.method==='POST'&&c.p===property+'/dataStreams').length,1);
 assert.ok(f.calls.every(c=>c.p==='properties'||c.p===account||c.p.startsWith(property)));
});
test('identical repeated provisioning creates no additional property, stream or dimensions',async()=>{
 const f=fixture();await provisionShop(f.args);const n=f.calls.filter(c=>c.method==='POST').length;
 await provisionShop(f.args);assert.equal(f.calls.filter(c=>c.method==='POST').length,n);
});
test('existing dedicated stream is reused rather than copied',async()=>{
 const f=fixture({existing:true});const r=await provisionShop(f.args);assert.equal(r.stream,stream);
 assert.ok(!f.calls.some(c=>c.method==='POST'&&(c.p==='properties'||c.p===property+'/dataStreams')));
});
test('another brand in the property blocks settings changes',async()=>{
 const f=fixture({existing:true,foreignStream:true});await assert.rejects(()=>provisionShop(f.args),/NOT_DEDICATED/);
 assert.ok(!f.calls.some(c=>c.method==='PATCH'||c.method==='POST'));
});
test('ambiguous property creation is reconciled by listing, never by replaying the POST',async()=>{
 const f=fixture({unknownProperty:true});await assert.rejects(()=>provisionShop(f.args),/TRANSPORT/);
 assert.equal(f.journal.propertyCreateAttempted,true);
 await provisionShop(f.args);assert.equal(f.calls.filter(c=>c.p==='properties'&&c.method==='POST').length,1);
});
test('unresolved prior creation intent refuses a second creation',async()=>{
 const f=fixture();f.journal.propertyCreateAttempted=true;
 await assert.rejects(()=>provisionShop(f.args),/UNRESOLVED_NO_RETRY/);assert.ok(!f.calls.some(c=>c.method==='POST'));
});
test('resource identity mismatch after a saved journal cannot reach privacy writes',async()=>{
 const f=fixture({existing:true,wrongName:true});f.journal.property=property;
 await assert.rejects(()=>provisionShop(f.args),/PROPERTY_IDENTITY_MISMATCH/);assert.ok(!f.calls.some(c=>c.method==='PATCH'));
});

test('case-insensitive provider-normalised redaction keys do not falsely fail privacy acceptance',async()=>{const f=fixture();const r=await provisionShop(f.args);assert.ok(r.redaction.queryParameterKeys.includes('claimtoken'));assert.ok(r.redaction.queryParameterKeys.includes('orderid'));assert.equal(r.status,'provisioned_verified');});
