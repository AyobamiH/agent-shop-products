#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {PRIVATE_DIR} from './google/constants.mjs';
import {googleSession} from './google/session.mjs';
import {privateRead,privateWrite,acquireLock} from './google/private-store.mjs';
import {provisioningPlan,planHash,provisionShop} from './google/shop-provision.mjs';
import {safeError} from './google/http.mjs';
export async function main(args=process.argv.slice(2)) {
  const {values}=parseArgs({args,options:{account:{type:'string'},apply:{type:'boolean',default:false},'expected-sha256':{type:'string'}}});
  const plan=provisioningPlan(values.account),hash=planHash(plan);
  if(!values.apply){console.log(JSON.stringify({status:'preview',plan,sha256:hash}));return;}
  if(values['expected-sha256']!==hash)throw Error('GOOGLE_PROVISION_PLAN_HASH_MISMATCH');
  const unlock=acquireLock('shop-provision');
  try{
    const file=path.join(PRIVATE_DIR,'shop-provision-journal.json');
    const journal=existsSync(file)?privateRead(file):{};
    const evidence=await provisionShop({session:await googleSession(),account:values.account,expectedHash:hash,journal,
      save:current=>privateWrite('shop-provision-journal.json',current)});
    const saved=privateWrite('shop-stream-evidence.json',evidence);
    console.log(JSON.stringify({status:evidence.status,property:evidence.property,stream:evidence.stream,
      measurementId:evidence.measurementId,defaultUri:evidence.defaultUri,websiteCollectionEnabled:false,saved}));
  }finally{unlock();}
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)main().catch(e=>{console.error(safeError(e));process.exitCode=1;});
