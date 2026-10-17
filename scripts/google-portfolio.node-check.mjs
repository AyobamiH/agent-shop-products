import test from 'node:test';
import assert from 'node:assert/strict';
import {scopesFromFile,matchingInventory,exactPageMatch,filterGscRows,
        normalizeReport,validateSocial,scoreCampaigns,readPortfolio} from './google/portfolio-report.mjs';

const scopes=scopesFromFile();
const inventory={analytics:{status:'observed',properties:Object.values(scopes).filter(x=>x.property).map(x=>({
  property:x.property,streams:[{name:x.property+'/dataStreams/'+x.stream,measurementId:x.measurementId,
     type:'WEB_DATA_STREAM',defaultUri:x.origin}]
}))}};
const unique=new Map();
for (const p of inventory.analytics.properties){unique.set(p.property,p)}
inventory.analytics.properties=[...unique.values()].map(p=>({
  ...p,streams:[...new Map(inventory.analytics.properties.filter(x=>x.property===p.property)
    .flatMap(x=>x.streams).map(x=>[x.name,x])).values()]
}));

test('mapping requires exact owned property+stream, with no duplicate Tail sessions',()=>{
 assert.equal(matchingInventory(scopes,inventory)['tail-wagging-websites'].property,'properties/501768556');
 assert.equal(matchingInventory(scopes,inventory)['donestate'].stream,'16143351458');
 assert.equal(matchingInventory(scopes,inventory)['global-bill-forge'].status,'not_mapped');
 const bad=structuredClone(inventory);
 bad.analytics.properties[0].streams[0].measurementId='G-CHANGED';
 assert.throws(()=>matchingInventory(scopes,bad),/STREAM_IDENTITY_CHANGED/);
});
test('subdomain GSC data never becomes the Tail canonical site',()=>{
 const def=scopes['tail-wagging-websites'];
 assert.ok(exactPageMatch('https://www.tailwaggingwebdesign.com/fulfilment/?utm_source=x',def));
 assert.equal(exactPageMatch('https://globalbill.tailwaggingwebdesign.com/',def),false);
 assert.equal(exactPageMatch('https://tailwaggingwebdesign.com.evil.test/',def),false);
 const filtered=filterGscRows([
  {keys:['https://tailwaggingwebdesign.com/'],impressions:4,clicks:1},
  {keys:['https://globalbill.tailwaggingwebdesign.com/'],impressions:300,clicks:30},
  {keys:['https://tailwaggingwebdesign.com.evil.test/'],impressions:400,clicks:40},
 ],def);
 assert.equal(filtered.clicks,1);assert.equal(filtered.impressions,4);
 const done=scopes.donestate;
 assert.ok(exactPageMatch('https://proofandstate.com/donestate',done));
 assert.equal(exactPageMatch('https://proofandstate.com/about',done),false);
});
test('no model-invented campaign / fake social URL or duplicate accepted',()=>{
 const good={schemaVersion:1,campaigns:[
  {project:'opstruth',campaign:'OPSTRUTH-LIVE-20261016-001',
   provider:'x',publicationStatus:'published_verified',postUrl:'https://x.com/owner/status/123',impressions:3}
 ]};
 assert.equal(validateSocial(good,scopes).length,1);
 assert.throws(()=>validateSocial({...good,campaigns:[...good.campaigns,...good.campaigns]},scopes),/SOCIAL_DUPLICATE/);
 assert.throws(()=>validateSocial({...good,campaigns:[{...good.campaigns[0],postUrl:'https://example.com/secret'}]},scopes),/SOCIAL_POST_ORIGIN/);
 assert.throws(()=>validateSocial({...good,campaigns:[{...good.campaigns[0],project:'unknown'}]},scopes),/SOCIAL_IDENTITY_INVALID/);
});
test('campaign sessions and key events remain separate from independent sales evidence',()=>{
 const rows=[{sessionCampaignName:'OPSTRUTH-LIVE-20261016-001',sessions:4,keyEvents:1}];
 const social=validateSocial({schemaVersion:1,campaigns:[
  {project:'opstruth',campaign:'OPSTRUTH-LIVE-20261016-001',
   provider:'x',publicationStatus:'published_unverified',postUrl:null,impressions:3}
 ]},scopes);
 const match=scoreCampaigns(rows,social,'opstruth',false)[0];
 assert.equal(match.websiteSessions,4);
 assert.equal(match.ga4KeyEvents,1);
 assert.match(match.conversionEvidence,/not proof/i);
 assert.equal(match.ga4Coverage,'preliminary_processing_48h');
});
test('data report refuses invalid metrics instead of treating them as zero',()=>{
 assert.deepEqual(normalizeReport({rows:[]},['hostName'],['sessions']),[]);
 assert.throws(()=>normalizeReport({rows:[{dimensionValues:[{value:'x'}],metricValues:[{value:'-1'}]}]},['hostName'],['sessions']),/METRIC_INVALID/);
});
test('read-only Google portfolio report de-duplicates shared Proof State stream',async()=>{
 const seen=[];
 const session={async request(endpoint,opts={}){
   seen.push({endpoint,method:opts.method||'GET'});
   if(endpoint.endsWith('/sites'))return{siteEntry:[
      {siteUrl:'sc-domain:proofandstate.com',permissionLevel:'siteOwner'}]};
   if(endpoint.includes('/keyEvents'))return{keyEvents:[{eventName:'purchase'}]};
   if(endpoint.includes(':runReport')){
     const names=opts.body.dimensions.map(x=>x.name);
     if(names.includes('sessionCampaignName'))return{rows:[
        {dimensionValues:[{value:'proofandstate.com'},{value:'16143351458'},{value:'DONESTATE-LIVE-20261016-001'},{value:'x / social'},{value:'overview'}],
         metricValues:[{value:'2'},{value:'0'}]}
     ]};
     if(names.includes('eventName'))return{rows:[{dimensionValues:[{value:'proofandstate.com'},{value:'page_view'}],
        metricValues:[{value:'2'},{value:'0'}]}]};
     return{rows:[{dimensionValues:[{value:'proofandstate.com'},{value:'16143351458'}],
        metricValues:[{value:'2'},{value:'1'}]}]};
   }
   if(endpoint.includes('/searchAnalytics/query'))return{rows:[
      {keys:['https://proofandstate.com/donestate'],impressions:3,clicks:1},
      {keys:['https://agents.proofandstate.com/shop'],impressions:400,clicks:100}
   ]};
   throw Error('UNEXPECTED_ENDPOINT');
 }};
 const select={donestate:scopes.donestate,'proof-and-state':scopes['proof-and-state']};
 const seenInv={analytics:{status:'observed',properties:inventory.analytics.properties.filter(x=>x.property==='properties/559326765')}};
 const social=[{project:'donestate',campaign:'DONESTATE-LIVE-20261016-001',provider:'x',
  publicationStatus:'published_verified',postUrl:null,impressions:5}];
 const report=await readPortfolio({session,scopes:select,inv:seenInv,
   start:'2026-10-01',end:'2026-10-16',gscEnd:'2026-10-14',
   clock:new Date('2026-10-17T06:00:00Z'),social});
 assert.equal(report.projects.donestate.ga4.siteSessions,null);
 assert.equal(report.projects['proof-and-state'].ga4.siteSessions,2);
 assert.equal(report.campaigns.find(x=>x.project==='donestate').websiteSessions,2);
 assert.equal(report.projects.donestate.gsc.impressions,3);
 assert.equal(report.projects['proof-and-state'].gsc.impressions,3); // excludes Agent Shop subdomain
 assert.equal(seen.filter(x=>x.endpoint.includes(':runReport')).length,3); // shared source queried once
 assert.ok(seen.every(x=>['GET','POST'].includes(x.method)));
 assert.ok(seen.every(x=>x.endpoint.startsWith('https://www.googleapis.com/')||
   x.endpoint.startsWith('https://analyticsdata.googleapis.com/')||
   x.endpoint.startsWith('https://analyticsadmin.googleapis.com/')));
});
