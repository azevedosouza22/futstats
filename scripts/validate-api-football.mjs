// Run only on an authorized machine with a SERVER env key. At most three upstream calls.
import {randomBytes} from 'node:crypto';
import {createFootballService} from '../server/api-football.js';
if(!process.env.API_SPORTS_KEY){console.error('Configure API_SPORTS_KEY no ambiente de servidor, sem colocar a chave no comando ou no Git.');process.exit(1);}
const token=randomBytes(24).toString('hex'),schemas={};
function shape(value,depth=0){if(depth>5)return '[depth limit]';if(value===null)return '[null]';if(Array.isArray(value))return {length:value.length,sample:value.length?shape(value[0],depth+1):null};if(typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>/^[a-zA-Z0-9_]{1,40}$/.test(k)).map(([k,v])=>[k,shape(v,depth+1)]));return `[${typeof value}]`;}
const fetcher=async(url,options)=>{const response=await fetch(url,options);try{const raw=await response.clone().json();schemas[url.includes('half=true')?'half':url.includes('statistics')?'full':'fixtures']=shape(raw.response);}catch{}return response;};
const service=createFootballService({fetcher,env:()=>({...process.env,API_SPORTS_POC_TOKEN:token,API_SPORTS_ALLOWED_DATES:'2026-10-13',API_SPORTS_ALLOWED_FIXTURES:'1492402'})});
const report={testedAt:new Date().toISOString(),fixtureId:1492402,results:[]};
for(const params of [{kind:'fixtures',date:'2026-10-13'},{kind:'statistics',fixture:'1492402',half:'false'},{kind:'statistics',fixture:'1492402',half:'true'}]){
 const result=await service(new URLSearchParams(params),`Bearer ${token}`);
 const body=params.kind==='fixtures'&&result.body.items?{...result.body,items:result.body.items.filter(x=>x.id===1492402)}:result.body;
 report.results.push({request:params,status:result.status,body});
 if(result.status===429)break;
}
report.schemas=schemas;
console.log(JSON.stringify(report,null,2).split(process.env.API_SPORTS_KEY).join('[redacted]'));
