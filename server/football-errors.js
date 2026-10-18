import {diagnosticProperties} from '../shared/football-diagnostics.js';
const normalize=key=>key.replace(/[-_ ]/g,'').toLowerCase();
const publicNames=new Map(diagnosticProperties.map(key=>[normalize(key),key]));
// Inspect provider errors locally. Only fixed categories/shapes leave this module.
export function inspectFootballErrors(value,secrets=[]){
 const shape=value==null?'absent':Array.isArray(value)?'array':typeof value==='object'?'object':typeof value==='string'?'string':'invalid';
 const fields=new Set(),knownProperties=new Set();let present=false,malformed=false,nodes=0,meaningful=0,content='',unknownPropertyCount=0,inspectionLimited=false;
 function visit(item,depth=0){
  if(++nodes>512||depth>6){present=true;malformed=true;meaningful++;inspectionLimited=true;return;}
  if(item==null)return;
  if(typeof item==='string'){
   if(!item.trim())return;present=true;meaningful++;
   let safe=item.slice(0,4000);for(const secret of secrets)if(typeof secret==='string'&&secret)safe=safe.split(secret).join('[redacted]');
   if(content.length<12000)content+=' '+safe.slice(0,12000-content.length);return;
  }
  if(typeof item!=='object'){present=true;malformed=true;meaningful++;return;}
  if(Array.isArray(item)){for(const entry of item.slice(0,100))visit(entry,depth+1);if(item.length>100){present=true;malformed=true;meaningful++;inspectionLimited=true;}return;}
  const entries=Object.entries(item);for(const [key,entry] of entries.slice(0,100)){
   const before=meaningful;visit(entry,depth+1);
   // Only report/classify properties whose subtree contains an effective error.
   if(meaningful>before){
    const normalized=normalize(key),secretName=secrets.some(secret=>typeof secret==='string'&&secret&&secret===key);
    if(!secretName){fields.add(normalized);const label=publicNames.get(normalized);if(label)knownProperties.add(label);else unknownPropertyCount++;}else unknownPropertyCount++;
   }
  }
  if(entries.length>100){present=true;malformed=true;meaningful++;inspectionLimited=true;}
 }
 visit(value);
 const has=(names)=>names.some(name=>fields.has(name));
 const denied=/not (?:available|supported|allowed|permitted|authorized|accessible)|do not have access|does not have access|(?:does|do) not allow|no access|only available|not included|not cover|access denied|permission denied|insufficient permissions|forbidden/i.test(content);
 const permissionDenied=/access denied|permission denied|insufficient permissions|forbidden|(?:does|do) not have access|(?:does|do) not allow access|no access/i.test(content);
 const halfUnavailable=present&&!malformed&&/\b(?:half|halves|halftime)\b/i.test(content)&&denied;
 let category='unclassified',parameter=null;
 if(malformed)category='malformed';
 else if(has(['requests','dailyquota','dailylimit'])||/\bdaily (?:limit|quota)\b|\brequests? per day\b/i.test(content))category='daily_limit';
 else if(has(['ratelimit','requestsperminute'])||/\btoo many requests\b|\brate limit\b|\brequests? per minute\b/i.test(content))category='rate_limit';
 else if(/\b(?:plans?|subscriptions?|seasons?|coverage)\b/i.test(content)&&denied)category='restriction';
 else if(/\b(?:invalid|missing|expired|incorrect) (?:api[- ]?key|token)\b|\b(?:api[- ]?key|token)\b.{0,30}\b(?:invalid|missing|expired|incorrect)\b|\bauthentication (?:failed|required)\b/i.test(content))category='authentication';
 else if(has(['permission','permissions','forbidden','scope','access','authorization'])||permissionDenied)category='permission';
 else if(has(['token','key','apikey','authentication','headers']))category='authentication';
 else if(has(['parameter','parameters','validation','required']))category='parameter';
 else if((parameter=['date','timezone','fixture','half','league','season','team','type'].find(k=>fields.has(k))??null))category='parameter';

 else if(has(['endpoint','route','method']))category='routing';
 else if(has(['time','timeout'])&&/\btime(?:d)?[ -]?out\b|\btimeout\b/i.test(content))category='timeout';
 else if(has(['time','bug','report']))category='provider';
 return {present,shape,category,parameter,halfUnavailable,knownProperties:[...knownProperties].sort().slice(0,24),unknownPropertyCount:Math.min(999,unknownPropertyCount),inspectionLimited:inspectionLimited||knownProperties.size>24||unknownPropertyCount>999};
}
