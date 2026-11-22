import { createHash } from 'node:crypto';
import { SHOP_ORIGIN, numericResource } from './constants.mjs';
import { ADMIN, ALPHA } from './inventory.mjs';
import { paged } from './session.mjs';
export const PROPERTY_TITLE = 'Agent Shop — Proof & State';
export const STREAM_TITLE = 'Agent Shop website';
export const ENHANCED_OFF = Object.freeze({ streamEnabled:false, scrollsEnabled:false,
  outboundClicksEnabled:false, siteSearchEnabled:false, videoEngagementEnabled:false,
  fileDownloadsEnabled:false, pageChangesEnabled:false, formInteractionsEnabled:false });
export const RETENTION = Object.freeze({ eventDataRetention:'TWO_MONTHS', userDataRetention:'TWO_MONTHS', resetUserDataOnNewActivity:false });
export const REDACTION = Object.freeze({ emailRedactionEnabled:true, queryParameterRedactionEnabled:true,
  queryParameterKeys:['email','token','claim','claimToken','order','orderId','order_id','receipt','code','q','search'] });
export const DIMENSIONS = Object.freeze({ page_group:'Public page group', discovery_source:'Discovery source',
  discovery_campaign:'Discovery campaign', quote_context:'Quote context', capability_id:'Public capability ID', capability_kind:'Public capability kind' });
export function provisioningPlan(account) {
  numericResource(account,'accounts');
  return { schemaVersion:1, account, property:{ parent:account, displayName:PROPERTY_TITLE,
    timeZone:'Europe/London', currencyCode:'GBP' },
    stream:{ displayName:STREAM_TITLE, type:'WEB_DATA_STREAM', webStreamData:{defaultUri:SHOP_ORIGIN} },
    enhancedMeasurement:ENHANCED_OFF, retention:RETENTION, googleSignals:'GOOGLE_SIGNALS_DISABLED',
    redaction:REDACTION, customDimensions:DIMENSIONS, activateWebsite:false };
}
export const planHash = plan => createHash('sha256').update(JSON.stringify(plan)).digest('hex');
export function checkProperty(property, account) {
  numericResource(property?.name,'properties');
  if(property.parent!==account || property.displayName!==PROPERTY_TITLE || property.deleteTime ||
    property.timeZone!=='Europe/London' || property.currencyCode!=='GBP') throw Error('SHOP_PROPERTY_IDENTITY_MISMATCH');
  return property;
}
export function checkStream(stream, property) {
  if(!new RegExp('^'+property+'/dataStreams/[0-9]+$').test(stream?.name||'') ||
    stream.type!=='WEB_DATA_STREAM' || stream.displayName!==STREAM_TITLE ||
    stream.webStreamData?.defaultUri!==SHOP_ORIGIN || !/^G-[A-Z0-9]+$/.test(stream.webStreamData?.measurementId||'')) {
    throw Error('SHOP_STREAM_IDENTITY_MISMATCH');
  }
  return stream;
}
const mask = fields => Object.keys(fields).map(k=>k.replace(/[A-Z]/g,x=>'_'+x.toLowerCase())).join(',');
export async function ensureSingleton(session, endpoint, desired) {
  let actual=await session.request(endpoint);
  const resource = new URL(endpoint).pathname.replace(/^\/v1(?:alpha|beta)\//,'');
  const matches = () => actual.name === resource && Object.entries(desired).every(([k,v]) => {
    // Google protobuf JSON can omit a boolean whose default value is false.
    if(v === false) return actual[k] === false || actual[k] === undefined;
    // Google normalises these case-insensitive URL keys to lowercase.
    if(k === 'queryParameterKeys' && Array.isArray(actual[k])) {
      const canonical = keys => [...new Set(keys.map(key=>String(key).toLowerCase()))].sort();
      return JSON.stringify(canonical(actual[k])) === JSON.stringify(canonical(v));
    }
    return JSON.stringify(actual[k]) === JSON.stringify(v);
  });
  if(!matches()) {
    await session.request(endpoint+'?updateMask='+encodeURIComponent(mask(desired)), {method:'PATCH',body:desired});
    actual=await session.request(endpoint);
  }
  if(!matches()) throw Error('GOOGLE_PRIVACY_READBACK_MISMATCH');
  return actual;
}

export async function provisionShop({session, account, expectedHash, journal={}, save}) {
  const plan=provisioningPlan(account), hash=planHash(plan);
  if(expectedHash!==hash) throw Error('GOOGLE_PROVISION_PLAN_HASH_MISMATCH');
  if(journal.planHash && journal.planHash!==hash) throw Error('GOOGLE_PROVISION_JOURNAL_CONFLICT');
  const accountData=await session.request(ADMIN+account);
  if(accountData.name!==account || accountData.deleted) throw Error('GOOGLE_ACCOUNT_NOT_ACTIVE');
  const record=async patch => { Object.assign(journal,{planHash:hash,account,...patch,observedAt:new Date().toISOString()}); await save(journal); };
  const properties=await paged(session, ADMIN+'properties?filter='+encodeURIComponent('parent:'+account)+'&showDeleted=true','properties');
  const named=properties.filter(p=>p.displayName===PROPERTY_TITLE);
  if(named.length>1) throw Error('MULTIPLE_SHOP_PROPERTIES_REQUIRE_RECONCILIATION');
  let property;
  if(journal.property) property=checkProperty(await session.request(ADMIN+journal.property),account);
  else if(named.length) property=checkProperty(named[0],account);
  else {
    if(journal.propertyCreateAttempted) throw Error('PROPERTY_CREATION_UNRESOLVED_NO_RETRY');
    await record({propertyCreateAttempted:true});
    const created=await session.request(ADMIN+'properties',{method:'POST',body:plan.property});
    numericResource(created.name,'properties');
    await record({property:created.name});
    property=checkProperty(await session.request(ADMIN+created.name),account);
  }
  await record({property:property.name});
  const streams=await paged(session,ADMIN+property.name+'/dataStreams','dataStreams');
  if(streams.length>1 || (streams.length===1 && streams[0].webStreamData?.defaultUri!==SHOP_ORIGIN)) {
    throw Error('PROPERTY_NOT_DEDICATED_TO_SHOP');
  }
  let stream;
  if(journal.stream) stream=checkStream(await session.request(ADMIN+journal.stream),property.name);
  else if(streams.length) stream=checkStream(streams[0],property.name);
  else {
    if(journal.streamCreateAttempted) throw Error('STREAM_CREATION_UNRESOLVED_NO_RETRY');
    await record({streamCreateAttempted:true});
    const created=await session.request(ADMIN+property.name+'/dataStreams',{method:'POST',body:plan.stream});
    checkStream(created,property.name); await record({stream:created.name});
    stream=checkStream(await session.request(ADMIN+created.name),property.name);
  }
  await record({stream:stream.name,measurementId:stream.webStreamData.measurementId});
  const enhanced=await ensureSingleton(session,ALPHA+stream.name+'/enhancedMeasurementSettings',ENHANCED_OFF);
  const retention=await ensureSingleton(session,ADMIN+property.name+'/dataRetentionSettings',RETENTION);
  const signals=await ensureSingleton(session,ALPHA+property.name+'/googleSignalsSettings',{state:'GOOGLE_SIGNALS_DISABLED'});
  const redaction=await ensureSingleton(session,ALPHA+stream.name+'/dataRedactionSettings',REDACTION);
  const dimensions=await paged(session,ADMIN+property.name+'/customDimensions','customDimensions');
  for(const [parameterName,displayName] of Object.entries(DIMENSIONS)) {
    const found=dimensions.filter(d=>d.parameterName===parameterName);
    if(found.length>1 || (found.length && found[0].scope!=='EVENT')) throw Error('DIMENSION_SCOPE_CONFLICT');
    if(!found.length) {
      if(journal.dimensionAttempts?.includes(parameterName)) throw Error('DIMENSION_CREATION_UNRESOLVED_NO_RETRY');
      await record({dimensionAttempts:[...(journal.dimensionAttempts||[]),parameterName]});
      await session.request(ADMIN+property.name+'/customDimensions',{method:'POST',body:{parameterName,displayName,scope:'EVENT'}});
    }
  }
  const finalDimensions=await paged(session,ADMIN+property.name+'/customDimensions','customDimensions');
  if(Object.keys(DIMENSIONS).some(key=>!finalDimensions.some(d=>d.parameterName===key&&d.scope==='EVENT'))) throw Error('DIMENSION_READBACK_MISMATCH');
  const ads=await paged(session,ADMIN+property.name+'/googleAdsLinks','googleAdsLinks');
  if(ads.length) throw Error('UNEXPECTED_ADVERTISING_LINK');
  const evidence={status:'provisioned_verified',observedAt:new Date().toISOString(),account,
    property:property.name,propertyName:property.displayName,stream:stream.name,
    measurementId:stream.webStreamData.measurementId,defaultUri:stream.webStreamData.defaultUri,
    enhanced,retention,signals,redaction,customDimensions:finalDimensions,googleAdsLinkCount:ads.length,
    websiteCollectionEnabled:false};
  await record({status:evidence.status}); return evidence;
}
