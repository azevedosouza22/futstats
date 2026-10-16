// Inspect provider errors locally. Only fixed categories/shapes leave this module.
export function inspectFootballErrors(value,secrets=[]){
 const shape=value==null?'absent':Array.isArray(value)?'array':typeof value==='object'?'object':typeof value==='string'?'string':'invalid';
 const fields=new Set();let present=false,malformed=false,nodes=0,content='';
 function visit(item,depth=0){
  if(++nodes>512||depth>6){present=true;malformed=true;return;}
  if(item==null)return;
  if(typeof item==='string'){
   if(!item.trim())return;present=true;
   let safe=item.slice(0,4000);for(const secret of secrets)if(typeof secret==='string'&&secret)safe=safe.split(secret).join('[redacted]');
   if(content.length<12000)content+=' '+safe.slice(0,12000-content.length);return;
  }
  if(typeof item!=='object'){present=true;malformed=true;return;}
  if(Array.isArray(item)){for(const entry of item.slice(0,100))visit(entry,depth+1);if(item.length>100){present=true;malformed=true;}return;}
  const entries=Object.entries(item);for(const [key,entry] of entries.slice(0,100)){
   // Field names are never returned. Ignore empty field values when classifying.
   if(entry!=null&&!(typeof entry==='string'&&!entry.trim())&&!(typeof entry==='object'&&Object.keys(entry).length===0))fields.add(key.replace(/[-_ ]/g,'').toLowerCase());
   visit(entry,depth+1);
  }
  if(entries.length>100){present=true;malformed=true;}
 }
 visit(value);
 const has=(names)=>names.some(name=>fields.has(name));
 const denied=/not (?:available|supported|allowed)|do not have access|does not have access|no access|only available|not included|not cover/i.test(content);
 const halfUnavailable=present&&!malformed&&/\b(?:half|halves|halftime)\b/i.test(content)&&denied;
 let category='unclassified',parameter=null;
 if(malformed)category='malformed';
 else if(has(['requests','dailyquota','dailylimit'])||/\bdaily (?:limit|quota)\b|\brequests? per day\b/i.test(content))category='daily_limit';
 else if(has(['ratelimit','requestsperminute'])||/\btoo many requests\b|\brate limit\b|\brequests? per minute\b/i.test(content))category='rate_limit';
 else if(/\b(?:plan|subscription|season|coverage)\b/i.test(content)&&denied)category='restriction';
 else if(has(['token','key','apikey','authentication','authorization','access','headers'])||/\binvalid (?:api[- ]?key|token)\b|\bauthentication (?:failed|required)\b/i.test(content))category='authentication';
 else if((parameter=['date','timezone','fixture','half','league','season','team','type'].find(k=>fields.has(k))??null))category='parameter';

 return {present,shape,category,parameter,halfUnavailable};
}
