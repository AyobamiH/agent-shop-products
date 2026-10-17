/** Owner-local direct Google Analytics & Search Console portfolio readback.
 * No new OAuth client, billing, provider calls, pixels, or authority for site writes.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inventory, ADMIN, DATA, ALPHA } from './inventory.mjs';
import { dateWindow } from './reports.mjs';

const SCOPES = new URL('./portfolio-scopes.json', import.meta.url);
const SOCIAL_PREFIX = /^(?:TWW|OPSTRUTH|DONESTATE|PAS|ASP|GBF|OCPF|OCCGPT|AGENTPROOF|CAS)-[A-Z0-9-]{4,72}$/;
const REGEX = /^[a-z0-9][a-z0-9-]{1,63}$/;
const NAME = /^properties\/[0-9]+$/;
const DIGITS = /^[0-9]+$/;

function refuse(value) { throw Error('PORTFOLIO_GA4_' + value); }
function parseUrl(value) {
  let url;
  try { url = new URL(value); } catch { refuse('URL_INVALID'); }
  if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash || url.port) refuse('URL_SCOPE');
  return url;
}
export function scopesFromFile(file=SCOPES) {
  const doc=JSON.parse(fs.readFileSync(file,'utf8'));
  if(doc.schemaVersion!==1 || !doc.projects || typeof doc.projects!=='object') refuse('SCOPE_CONFIG');
  const seen=new Map();
  for(const [project,def] of Object.entries(doc.projects)) {
    if(!REGEX.test(project) || !def || typeof def!=='object') refuse('PROJECT_INVALID');
    const origin=parseUrl(def.origin);
    if(origin.pathname!=='/' || origin.href.slice(0,-1)!==def.origin) refuse('ORIGIN_INVALID');
    if(!def.pathPrefix?.startsWith('/') || def.pathPrefix.includes('..')) refuse('PATH_SCOPE');
    const allOrNone=[def.property,def.stream,def.measurementId].every(x=>x===null);
    const allPresent=NAME.test(def.property||'') && DIGITS.test(def.stream||'') && /^G-[A-Z0-9]{7,16}$/.test(def.measurementId||'');
    if(!allOrNone && !allPresent) refuse('STREAM_PARTIAL');
    if(project==='global-bill-forge' && origin.hostname!=='globalbill.tailwaggingwebdesign.com') refuse('GLOBALBILL_ORIGIN');
    if(project==='donestate' && (origin.hostname!=='proofandstate.com' || def.pathPrefix!=='/donestate')) refuse('DONESTATE_SCOPE');
    if(def.gsc!==null && !/^sc-domain:[a-z0-9.-]+$/.test(def.gsc)) refuse('GSC_SCOPE');
    if(allPresent){
      const key=def.property+'/'+def.stream;
      const prev=seen.get(key);
      if(prev && prev.origin!==def.origin)refuse('SHARED_STREAM_CROSS_ORIGIN');
      seen.set(key,def);
    }
  }
  return doc.projects;
}
export function matchingInventory(scopes, inv) {
  if(inv?.analytics?.status!=='observed')refuse('ADMIN_INVENTORY_REQUIRED');
  const matches={};
  for(const [project,def] of Object.entries(scopes)){
    if(!def.property){matches[project]={status:def.origin==='https://github.com'?'external_source':'not_mapped'};continue;}
    const property=(inv.analytics.properties||[]).filter(p=>p.property===def.property);
    if(property.length!==1)refuse('PROPERTY_UNKNOWN');
    const stream=(property[0].streams||[]).filter(s=>s.name===def.property+'/dataStreams/'+def.stream);
    if(stream.length!==1 || stream[0].type!=='WEB_DATA_STREAM' || stream[0].measurementId!==def.measurementId)refuse('STREAM_IDENTITY_CHANGED');
    const uri=parseUrl(stream[0].defaultUri);
    const source=new URL(def.origin);
    if(![source.hostname,'www.'+source.hostname].includes(uri.hostname))refuse('STREAM_ORIGIN_CHANGED');
    matches[project]={status:'mapped',property:def.property,stream:def.stream,measurementId:def.measurementId};
  }
  return matches;
}
export function exactPageMatch(value,def){
  let url;
  try{url=new URL(value)}catch{return false}
  const host=new URL(def.origin).hostname;
  if(url.protocol!=='https:' || ![host,'www.'+host].includes(url.hostname))return false;
  if(def.pathPrefix==='/')return true;
  return url.pathname===def.pathPrefix || url.pathname.startsWith(def.pathPrefix+'/');
}
export function filterGscRows(rows,def){
  const kept=(rows||[]).filter(r=>Array.isArray(r.keys) && exactPageMatch(r.keys[0],def));
  return {rowsReturned:kept.length, clicks:kept.length?kept.reduce((n,x)=>n+Number(x.clicks||0),0):null,
    impressions:kept.length?kept.reduce((n,x)=>n+Number(x.impressions||0),0):null,
    topPageCount:kept.length?kept.length:null,
    coverage:'Google may omit anonymised queries and some low-volume rows; this is not a proof of zero organic activity.'};
}
export function normalizeReport(report,dimensions,metrics){
  if(!report || (report.rows!==undefined && !Array.isArray(report.rows)))refuse('DATA_RESPONSE');
  if(report.rows?.length>10000)refuse('ROW_LIMIT');
  return (report.rows||[]).map(row=>{
    if((row.dimensionValues||[]).length!==dimensions.length || (row.metricValues||[]).length!==metrics.length)refuse('COLUMN_MISMATCH');
    const value={};
    dimensions.forEach((key,i)=>{value[key]=String(row.dimensionValues[i]?.value||'')});
    metrics.forEach((key,i)=>{const num=Number(row.metricValues[i]?.value);if(!Number.isFinite(num)||num<0)refuse('METRIC_INVALID');value[key]=num});
    return value;
  });
}
export function scoreCampaigns(rows,social,project,matured){
  const allowed=(social||[]).filter(x=>x.project===project && typeof x.campaign==='string' && SOCIAL_PREFIX.test(x.campaign));
  return allowed.map(post=>{
    const match=rows.filter(row=>row.sessionCampaignName===post.campaign);
    return {
      project, campaign:post.campaign, provider:post.provider,
      publicationStatus:post.publicationStatus,postUrl:post.postUrl||null,
      impressions:post.impressions??null,
      websiteSessions:match.length?match.reduce((n,r)=>n+r.sessions,0):null,
      ga4KeyEvents:match.length?match.reduce((n,r)=>n+r.keyEvents,0):null,
      ga4Coverage:matured?'settled_window_with_report_rows_or_unknown':'preliminary_processing_48h',
      observedCampaignRows:match.length,
      conversionEvidence:'GA4 key events are not proof of an enquiry, signup or completed sale.'
    };
  });
}
export function validateSocial(value,scopes) {
  if(value===null)return [];
  if(!value || value.schemaVersion!==1 || !Array.isArray(value.campaigns) || value.campaigns.length>500)refuse('SOCIAL_EVIDENCE_INVALID');
  const seen=new Set();
  return value.campaigns.map(x=>{
    if(!scopes[x.project] || typeof x.campaign!=='string' || !SOCIAL_PREFIX.test(x.campaign) ||
      !['x','threads','linkedin'].includes(x.provider) ||
      !['published_verified','published_unverified','scheduled','failed','ambiguous_effect','unknown'].includes(x.publicationStatus))refuse('SOCIAL_IDENTITY_INVALID');
    if(seen.has(x.campaign))refuse('SOCIAL_DUPLICATE');
    seen.add(x.campaign);
    if(x.postUrl!==null && x.postUrl!==undefined){
      const url=parseUrl(x.postUrl);
      if(!['x.com','www.threads.com','www.linkedin.com','linkedin.com'].includes(url.hostname))refuse('SOCIAL_POST_ORIGIN');
    }
    if(x.impressions!==null && x.impressions!==undefined && (!Number.isSafeInteger(x.impressions)||x.impressions<0))refuse('IMPRESSION_INVALID');
    return x;
  });
}
export async function readPortfolio({session,scopes,inv,start,end,gscEnd,social=[],clock=new Date()}){
  dateWindow(start,end); dateWindow(start,gscEnd);
  const actual=matchingInventory(scopes,inv);
  const matured=Date.parse(end+'T23:59:59Z') < clock.getTime()-48*3600000;
  const sites=await session.request('https://www.googleapis.com/webmasters/v3/sites');
  const grants=new Set((sites.siteEntry||[]).filter(x=>x.permissionLevel && x.permissionLevel!=='siteUnverifiedUser').map(x=>x.siteUrl));
  const output={schemaVersion:1,source:'google_direct_api_and_post_once_receipts',observedAt:clock.toISOString(),
    ga4Window:{start,end,matured,processingNote:matured?'settled_48h_estimate':'recent_data_preliminary_no_zero_claim'},
    gscWindow:{start,end:gscEnd,dataState:'final'},scopes:actual,projects:{},campaigns:[]};
  const unique=new Map();
  for(const [project,def] of Object.entries(scopes)){
    if(!def.property)continue;
    const key=def.property+'/'+def.stream;
    if(!unique.has(key))unique.set(key,{...def,projects:[]});
    unique.get(key).projects.push(project);
  }
  const store=new Map();
  for(const [key,def] of unique){
    const source=new URL(def.origin);
    const filter={andGroup:{expressions:[
      {filter:{fieldName:'hostName',inListFilter:{values:[source.hostname,'www.'+source.hostname]}}},
      {filter:{fieldName:'streamId',stringFilter:{matchType:'EXACT',value:def.stream}}}
    ]}};
    const call=async(dims,metrics)=>{
      const body={dateRanges:[{startDate:start,endDate:end}],dimensions:dims.map(name=>({name})),
        metrics:metrics.map(name=>({name})),dimensionFilter:filter,limit:10000};
      const report=await session.request(DATA+def.property+':runReport',{method:'POST',body});
      return normalizeReport(report,dims,metrics);
    };
    try {
      const campaignRows=await call(['hostName','streamId','sessionCampaignName','sessionSourceMedium','sessionManualAdContent'],['sessions','keyEvents']);
      const siteRows=await call(['hostName','streamId'],['sessions','totalUsers']);
      const eventRows=await call(['hostName','eventName'],['eventCount','keyEvents']);
      const keyConfig=await session.request(ALPHA+def.property+'/keyEvents?pageSize=200');
      store.set(key,{status:'observed',campaignRows,siteRows,eventRows,
        configuredKeyEvents:(keyConfig.keyEvents||[]).map(x=>x.eventName)});
    }catch(error){store.set(key,{status:'unavailable',reason:error.message});}
  }
  for(const [project,def] of Object.entries(scopes)){
    const key=def.property+'/'+def.stream;
    const ga=def.property?store.get(key):null;
    const entry={project,origin:def.origin,pathPrefix:def.pathPrefix,ga4:{status:ga?.status||actual[project].status,
      property:def.property,stream:def.stream,
      siteSessions:null,totalUsers:null,campaignRows:[],events:[],configuredKeyEvents:[],
      caveat:null},gsc:{status:'unavailable',clicks:null,impressions:null,rowsReturned:null}};
    if(ga?.status==='observed'){
      const shared=project==='donestate';
      entry.ga4={...entry.ga4,status:'observed',siteSessions:shared||!ga.siteRows.length?null:ga.siteRows.reduce((n,r)=>n+r.sessions,0),
        totalUsers:shared||!ga.siteRows.length?null:ga.siteRows.reduce((n,r)=>n+r.totalUsers,0),
        campaignRows:ga.campaignRows,events:ga.eventRows,configuredKeyEvents:ga.configuredKeyEvents,
        caveat:shared?'Shared Proof & State web stream. Do not attribute all host sessions to DoneState; only exact campaign/landing path.':
         project==='tail-wagging-websites'?'Canonical stream only; overlapping property is intentionally excluded.':
         !matured?'Recent GA4 totals are preliminary until standard processing catches up.':null};
    }else if(ga?.status==='unavailable')entry.ga4.reason=ga.reason;
    if(def.gsc && grants.has(def.gsc)){
      try{
        const body={startDate:start,endDate:gscEnd,type:'web',dataState:'final',dimensions:['page'],
          dimensionFilterGroups:[{filters:[{dimension:'page',operator:'contains',expression:new URL(def.origin).hostname}]}],
          rowLimit:1000,startRow:0};
        const r=await session.request('https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(def.gsc)+'/searchAnalytics/query',{method:'POST',body});
        entry.gsc={status:'observed',...filterGscRows(r.rows,def),property:def.gsc};
      }catch(e){entry.gsc={status:'unavailable',reason:e.message,clicks:null,impressions:null,rowsReturned:null};}
    }else if(def.gsc)entry.gsc={status:'not_granted',clicks:null,impressions:null,rowsReturned:null};
    output.projects[project]=entry;
    if(def.property){
      const scores=scoreCampaigns(ga?.status==='observed'?ga.campaignRows:[],social,project,matured);
      output.campaigns.push(...scores);
    }else output.campaigns.push(...scoreCampaigns([],social,project,matured).map(x=>({...x,ga4Coverage:'not_mapped'})));
  }
  return output;
}
