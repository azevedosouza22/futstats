// Server-only. Never imported by src/. Private PoC, NOT a public quota gateway.
import {createHash,timingSafeEqual} from 'node:crypto';
const BASE='https://v3.football.api-sports.io';
const dateValid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const digest=s=>createHash('sha256').update(s).digest();
const text=v=>typeof v==='string'?v.slice(0,120):null;
const num=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const list=(v,fallback,max,valid)=>(v||fallback).split(',').map(s=>s.trim()).filter(valid).slice(0,max);
const rows=value=>Array.isArray(value)?value.slice(0,50).filter(r=>r&&typeof r.type==='string').map(r=>({type:text(r.type),value:typeof r.value==='number'?num(r.value):typeof r.value==='string'&&/^\d+(?:[.,]\d+)?%?$/.test(r.value)?r.value:null})):null;
export function sanitizeFixtures(raw){return raw.filter(r=>Number.isSafeInteger(r?.fixture?.id)&&Number.isSafeInteger(r?.teams?.home?.id)&&Number.isSafeInteger(r?.teams?.away?.id)&&r.teams.home.id!==r.teams.away.id).slice(0,500).map(r=>({id:r.fixture.id,date:text(r.fixture.date),status:text(r.fixture.status?.short),statusLabel:text(r.fixture.status?.long),minute:num(r.fixture.status?.elapsed),league:text(r.league?.name),country:text(r.league?.country),home:{id:r.teams.home.id,name:text(r.teams.home.name)},away:{id:r.teams.away.id,name:text(r.teams.away.name)},goals:[num(r.goals?.home),num(r.goals?.away)]}));}
export function sanitizeStatistics(raw){return raw.filter(r=>Number.isSafeInteger(r?.team?.id)).slice(0,2).map(r=>({team:{id:r.team.id,name:text(r.team.name)},statistics:rows(r.statistics),statistics_1h:rows(r.statistics_1h),statistics_2h:rows(r.statistics_2h)}));}
export function createFootballService({fetcher=fetch,now=Date.now,env=()=>process.env,budget=80}={}){
 const cache=new Map(),pending=new Map();let calls=0,start=0,minuteStart=0,minuteCalls=0,blockedUntil=0,blockedCode='DAILY_LIMIT';
 return async function service(params,authorization=''){
  const config=env(),token=config.API_SPORTS_POC_TOKEN;
  const fail=(status,code,error)=>({status,body:{code,error}});
  if(!token||token.length<16||!config.API_SPORTS_KEY||token===config.API_SPORTS_KEY)return fail(503,'CONFIGURATION','Integração experimental não configurada no servidor.');
  if(authorization.length>300||!timingSafeEqual(digest(authorization),digest(`Bearer ${token}`)))return fail(401,'ACCESS','Informe o código de acesso privado da prova de conceito.');
  const dates=list(config.API_SPORTS_ALLOWED_DATES,'2026-10-13',7,dateValid),fixtures=list(config.API_SPORTS_ALLOWED_FIXTURES,'1492402',20,s=>/^\d{1,10}$/.test(s));
  const kind=params.get('kind');
  const allowed=kind==='fixtures'?['kind','date']:kind==='statistics'?['kind','fixture','half']:['kind'];
  if([...params.keys()].some(k=>!allowed.includes(k)||params.getAll(k).length!==1))return fail(400,'QUERY','Parâmetros não permitidos.');
  if(kind==='config')return {status:200,body:{source:'API-Football',dates,fixtures}};
  const date=params.get('date'),id=params.get('fixture'),half=params.get('half')??'false';
  if(kind==='fixtures'&&!dates.includes(date)||kind==='statistics'&&(!fixtures.includes(id)||!['true','false'].includes(half))||!['fixtures','statistics'].includes(kind))return fail(400,'QUERY','Data ou partida fora das consultas autorizadas desta PoC.');
  // Match the date-only query validated in the provider dashboard. No implicit timezone.
  const query=kind==='fixtures'?`/fixtures?date=${date}`:`/fixtures/statistics?fixture=${id}&half=${half}`;
  const hit=cache.get(query);if(hit&&hit.expires>now())return hit.failure??{status:200,body:{...hit.body,cached:true}};
  if(pending.has(query))return pending.get(query);
  if(now()<blockedUntil)return fail(429,blockedCode,blockedCode==='DAILY_LIMIT'?'Limite diário da API atingido. Aguarde a reposição da cota.':'O provedor limitou as consultas. Aguarde antes de tentar novamente.');
  if(now()-start>=86400000){start=now();calls=0;}
  if(calls>=budget)return fail(429,'LOCAL_BUDGET','Orçamento de consultas desta instância atingido. Tente mais tarde.');
  if(now()-minuteStart>=60000){minuteStart=now();minuteCalls=0;}
  if(minuteCalls>=8)return fail(429,'RATE_LIMIT','Muitas consultas. Aguarde um minuto.');
  calls++;minuteCalls++;
  const task=(async()=>{
   try{
    const response=await fetcher(BASE+query,{headers:{'x-apisports-key':config.API_SPORTS_KEY,Accept:'application/json'},signal:AbortSignal.timeout(10000),redirect:'error'});
    const remaining=response.headers.get('x-ratelimit-requests-remaining');
    if(remaining!==null&&/^\d+$/.test(remaining)&&Number(remaining)===0){blockedUntil=now()+86400000;blockedCode='DAILY_LIMIT';}
    if(response.status===429){blockedUntil=now()+86400000;blockedCode=remaining==='0'?'DAILY_LIMIT':'PROVIDER_LIMIT';return {status:429,body:{code:blockedCode,upstreamStatus:429,error:'A API-Football retornou HTTP 429: limite de consultas. Isso não é um erro de autenticação.'}};}
    if(response.status===401)return {status:502,body:{code:'PROVIDER_UNAUTHORIZED',upstreamStatus:401,error:'A API-Football retornou HTTP 401: autenticação de servidor recusada. Confira a credencial desta implantação.'}};
    let raw;try{raw=response.status===204?{response:[],errors:[]}:await response.json();}catch{raw=null;}
    // Only explicit evidence of a half-specific restriction becomes unavailable data.
    // Provider messages are examined locally, never logged or returned.
    const errorText=raw?.errors&&typeof raw.errors==='object'?Object.values(raw.errors).filter(v=>typeof v==='string').join(' ').slice(0,4000):'';
    if(raw?.errors&&Object.keys(raw.errors).some(k=>/requests|rateLimit/i.test(k))){const daily=remaining==='0'||Object.keys(raw.errors).some(k=>/requests/i.test(k));blockedCode=daily?'DAILY_LIMIT':'RATE_LIMIT';blockedUntil=now()+(daily?86400000:60000);return fail(429,blockedCode,'O provedor informou um limite de consultas. Aguarde antes de tentar novamente.');}
    const halfUnavailable=kind==='statistics'&&half==='true'&&/\b(?:half|halves|halftime)\b/i.test(errorText)&&/not (?:available|supported|allowed)|do not have access|does not have access|no access|only available|not included|not cover/i.test(errorText);
    if((response.ok||response.status===403)&&halfUnavailable){
     const body={source:'API-Football',kind,fixtureId:Number(id),halfRequested:true,items:[],availability:'unavailable',upstreamStatus:response.status,notice:'O provedor informou que os dados por tempo não estão disponíveis para esta consulta. Os tempos permanecem N/D.',fetchedAt:new Date(now()).toISOString(),cached:false};
     cache.set(query,{body,expires:now()+3600000});return {status:200,body};
    }
    if(response.status===403)return {status:502,body:{code:'PROVIDER_FORBIDDEN',upstreamStatus:403,error:'A API-Football retornou HTTP 403: esta consulta foi proibida. Isso não comprova que a chave esteja inválida. Confira a permissão da consulta por tempo no provedor.'}};
    if(!response.ok&&response.status!==204)return fail(502,'PROVIDER','Provedor indisponível. Tente mais tarde.');
    if(!raw||typeof raw!=='object')return fail(502,'PAYLOAD','Resposta inesperada do provedor.');
    if(raw.errors&&Object.keys(raw.errors).length){
     // Classify known error field names, never forward provider text (it may echo secrets).
     const fields=Object.keys(raw.errors).map(k=>k.toLowerCase());
     if(fields.some(k=>['token','key','authentication','authorization','access'].includes(k)))return {status:502,body:{code:'PROVIDER_AUTH_RESPONSE',upstreamStatus:response.status,error:'O provedor retornou um erro de acesso nesta consulta. Isso não confirma que a chave esteja inválida; confira a autorização da consulta no provedor.'}};
     const parameter=fields.find(k=>['date','timezone','fixture','half'].includes(k));
     if(parameter)return fail(502,'PROVIDER_PARAMETER',`A API rejeitou o parâmetro ${parameter}. A consulta precisa ser revisada no servidor.`);
     return fail(502,'PROVIDER_ERROR','A API retornou um erro nesta consulta. A causa não foi identificada; não é possível concluir que seja uma restrição de plano.');
    }
    if(!Array.isArray(raw.response))return fail(502,'PAYLOAD','Resposta inesperada do provedor.');
    if(kind==='statistics'&&raw.parameters?.fixture!=null&&String(raw.parameters.fixture)!==id)return fail(502,'PAYLOAD','Resposta de outra partida rejeitada.');
    const body={source:'API-Football',kind,fixtureId:kind==='statistics'?Number(id):null,halfRequested:kind==='statistics'&&half==='true',items:kind==='fixtures'?sanitizeFixtures(raw.response):sanitizeStatistics(raw.response),fetchedAt:new Date(now()).toISOString(),cached:false};
    if(JSON.stringify(body).includes(config.API_SPORTS_KEY))return fail(502,'PAYLOAD','Resposta inesperada do provedor.');
    if(cache.size>=48)cache.delete(cache.keys().next().value);cache.set(query,{body,expires:now()+3600000});return {status:200,body};
   }catch{return fail(502,'CONNECTION','Falha de conexão, timeout ou resposta inválida da API.');}
  })();
  pending.set(query,task);
  try{const result=await task;if(result.status!==200)cache.set(query,{failure:result,expires:now()+60000});return result;}finally{pending.delete(query);}
 };
}
// Text fallback also supports browsers still running an older PWA bundle.
export function publicFootballBody(result){
 if(result.status<400)return result.body;
 const code=typeof result.body.code==='string'&&/^[A-Z_]{1,40}$/.test(result.body.code)?result.body.code:'UNKNOWN';
 const api=Number.isInteger(result.body.upstreamStatus)&&result.body.upstreamStatus>=100&&result.body.upstreamStatus<=599?result.body.upstreamStatus:'N/D';
 return {...result.body,error:`${result.body.error} [Diagnóstico: ${code}; HTTP servidor ${result.status}; HTTP API ${api}]`};
}
const service=createFootballService();
export async function handleFootball(req,res){
 res.setHeader('X-FutStats-Commit',/^[a-f0-9]{40}$/i.test(process.env.VERCEL_GIT_COMMIT_SHA??'')?process.env.VERCEL_GIT_COMMIT_SHA:'unknown');
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');res.end(JSON.stringify({error:'Método não permitido.'}));return;}
 const params=new URL(req.url,'http://internal').searchParams;
 const result=await service(params,typeof req.headers.authorization==='string'?req.headers.authorization:'');
 // Fixed fields only: never headers, URLs, provider text, tokens or env values.
 if(result.body.availability==='unavailable'||['PROVIDER_UNAUTHORIZED','PROVIDER_FORBIDDEN','PROVIDER_AUTH_RESPONSE','PROVIDER_PARAMETER','PROVIDER_ERROR','PROVIDER_LIMIT','DAILY_LIMIT','RATE_LIMIT'].includes(result.body.code))console.warn(JSON.stringify({event:'api-football-result',code:result.body.availability==='unavailable'?'PERIOD_UNAVAILABLE':result.body.code,status:result.status,upstreamStatus:result.body.upstreamStatus??null,halfRequested:params.get('half')==='true'}));
 res.statusCode=result.status;if(result.status===429)res.setHeader('Retry-After',result.body.code==='RATE_LIMIT'?'60':'3600');res.end(JSON.stringify(publicFootballBody(result)));
}
