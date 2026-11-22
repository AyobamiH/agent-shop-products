/** One-time guarded Google Analytics Admin ownership/provisioning.
 * Product property/stream creation only; never installs a website tag.
 */
import {createHash} from 'node:crypto';
import {inventory,ADMIN,ALPHA} from './inventory.mjs';
import {paged} from './session.mjs';
import {ENHANCED_OFF,RETENTION,REDACTION,ensureSingleton} from './shop-provision.mjs';
export const ACCOUNT='accounts/338933692';
export const PLANS=Object.freeze({
  'oneclickpostfactory':{
    propertyName:'OneClickPostFactory — Website',streamName:'OneClickPostFactory Website',
    origin:'https://www.oneclickpostfactory.com',gsc:'sc-domain:oneclickpostfactory.com'
  },
  'global-bill-forge':{
    propertyName:'GlobalBill — International Documents',streamName:'GlobalBill Website',
    origin:'https://globalbill.tailwaggingwebdesign.com',gsc:'sc-domain:tailwaggingwebdesign.com'
  }
});
export function plan(project) {
 const cfg=PLANS[project];
 if(!cfg)throw Error('GOOGLE_PORTFOLIO_PROVISION_PROJECT_UNAPPROVED');
 return {schemaVersion:1,project,account:ACCOUNT,...cfg,
    property:{parent:ACCOUNT,displayName:cfg.propertyName,timeZone:'Europe/London',currencyCode:'GBP'},
    stream:{displayName:cfg.streamName,type:'WEB_DATA_STREAM',webStreamData:{defaultUri:cfg.origin}},
    websiteCollectionEnabled:false,enhancedMeasurement:ENHANCED_OFF,retention:RETENTION,
    googleSignals:'GOOGLE_SIGNALS_DISABLED',redaction:REDACTION};
}
export const planHash = p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const id=(x,kind)=>new RegExp('^'+kind+'/[0-9]+$').test(x||'');
function verifyProperty(value,p) {
 if(!id(value?.name,'properties')||value.parent!==p.account||
    value.displayName!==p.propertyName||value.timeZone!=='Europe/London'||
    value.currencyCode!=='GBP'||value.deleteTime)throw Error('GOOGLE_PORTFOLIO_PROPERTY_IDENTITY_MISMATCH');
 return value;
}
function verifyStream(value,p,property){
 if(!new RegExp('^'+property+'/dataStreams/[0-9]+$').test(value?.name||'')||
   value.displayName!==p.streamName||value.type!=='WEB_DATA_STREAM'||
   value.webStreamData?.defaultUri!==p.origin||
   !/^G-[A-Z0-9]{7,16}$/.test(value.webStreamData?.measurementId||''))
   throw Error('GOOGLE_PORTFOLIO_STREAM_IDENTITY_MISMATCH');
 return value;
}
export async function provision({session,project,expectedHash,journal={},save,inventoryFn=inventory,pagedFn=paged,ensureFn=ensureSingleton}) {
 const p=plan(project),hash=planHash(p);
 if(hash!==expectedHash)throw Error('GOOGLE_PORTFOLIO_PLAN_HASH_CHANGED');
 if(typeof save!=='function'||journal.planHash && journal.planHash!==hash)
   throw Error('GOOGLE_PORTFOLIO_JOURNAL_CONFLICT');
 const before=await inventoryFn(session);
 if(before.analytics.status!=='observed'||before.searchConsole.status==='unavailable')
   throw Error('GOOGLE_PORTFOLIO_INVENTORY_UNAVAILABLE');
 if(!before.analytics.accounts.some(x=>x.account===ACCOUNT))
   throw Error('GOOGLE_PORTFOLIO_OWNER_ACCOUNT_MISSING');
 const sites=await session.request('https://www.googleapis.com/webmasters/v3/sites');
 if(!(sites.siteEntry||[]).some(s=>s.siteUrl===p.gsc && s.permissionLevel==='siteOwner'))
   throw Error('GOOGLE_PORTFOLIO_GSC_OWNERSHIP_NOT_CONFIRMED');
 const overlapping=before.analytics.properties.flatMap(x=>(x.streams||[]).map(s=>({property:x.property,...s})))
  .filter(s=>{
   try{return new URL(s.defaultUri).hostname===new URL(p.origin).hostname}catch{return false}
  });
 if(overlapping.length>1 || overlapping.length && overlapping[0].property!==journal.property)
   throw Error('GOOGLE_PORTFOLIO_STREAM_ALREADY_EXISTS_REQUIRE_REVIEW');
 const account=await session.request(ADMIN+ACCOUNT);
 if(account.name!==ACCOUNT || account.deleted)throw Error('GOOGLE_PORTFOLIO_ACCOUNT_INACTIVE');
 const record=async(v)=>{Object.assign(journal,{planHash:hash,project,account:ACCOUNT,...v,
  observedAt:new Date().toISOString()});await save(journal);};
 const properties=await pagedFn(session,ADMIN+'properties?filter='+encodeURIComponent('parent:'+ACCOUNT)+'&showDeleted=true','properties');
 const matching=properties.filter(x=>x.displayName===p.propertyName);
 if(matching.length>1)throw Error('GOOGLE_PORTFOLIO_DUPLICATE_PROPERTY');
 let property;
 if(journal.property)property=verifyProperty(await session.request(ADMIN+journal.property),p);
 else if(matching.length)property=verifyProperty(matching[0],p);
 else {
  if(journal.propertyCreateAttempted)throw Error('GOOGLE_PORTFOLIO_PROPERTY_AMBIGUOUS_NO_RETRY');
  await record({propertyCreateAttempted:true});
  const created=await session.request(ADMIN+'properties',{method:'POST',body:p.property});
  if(!id(created.name,'properties'))throw Error('GOOGLE_PORTFOLIO_PROPERTY_CREATE_UNCONFIRMED');
  await record({property:created.name});
  property=verifyProperty(await session.request(ADMIN+created.name),p);
 }
 await record({property:property.name});
 const streams=await pagedFn(session,ADMIN+property.name+'/dataStreams','dataStreams');
 if(streams.length>1 || streams.some(x=>x.webStreamData?.defaultUri!==p.origin))
   throw Error('GOOGLE_PORTFOLIO_UNEXPECTED_STREAM');
 let stream;
 if(journal.stream)stream=verifyStream(await session.request(ADMIN+journal.stream),p,property.name);
 else if(streams.length)stream=verifyStream(streams[0],p,property.name);
 else {
  if(journal.streamCreateAttempted)throw Error('GOOGLE_PORTFOLIO_STREAM_AMBIGUOUS_NO_RETRY');
  await record({streamCreateAttempted:true});
  const created=await session.request(ADMIN+property.name+'/dataStreams',{method:'POST',body:p.stream});
  verifyStream(created,p,property.name);
  await record({stream:created.name,measurementId:created.webStreamData.measurementId});
  stream=verifyStream(await session.request(ADMIN+created.name),p,property.name);
 }
 await record({stream:stream.name,measurementId:stream.webStreamData.measurementId});
 await ensureFn(session,ALPHA+stream.name+'/enhancedMeasurementSettings',ENHANCED_OFF);
 await ensureFn(session,ADMIN+property.name+'/dataRetentionSettings',RETENTION);
 await ensureFn(session,ALPHA+property.name+'/googleSignalsSettings',{state:'GOOGLE_SIGNALS_DISABLED'});
 await ensureFn(session,ALPHA+stream.name+'/dataRedactionSettings',REDACTION);
 const ads=await pagedFn(session,ADMIN+property.name+'/googleAdsLinks','googleAdsLinks');
 if(ads.length)throw Error('GOOGLE_PORTFOLIO_UNEXPECTED_ADS_LINK');
 await record({status:'provisioned_verified',websiteCollectionEnabled:false});
 return {status:'provisioned_verified',property:property.name,stream:stream.name,
   measurementId:stream.webStreamData.measurementId,origin:p.origin,
   noGoogleAdsLink:true,websiteCollectionEnabled:false};
}
