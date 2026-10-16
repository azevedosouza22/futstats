import {describe,it,expect,vi} from 'vitest';
import {createFootballService} from '../server/api-football.js';
import {periodStats,statValue,type AutoFixture} from './apiFootball';
const env=()=>({API_SPORTS_KEY:'not-a-real-key',API_SPORTS_POC_TOKEN:'private-test-token-123',API_SPORTS_ALLOWED_DATES:'2026-10-13',API_SPORTS_ALLOWED_FIXTURES:'1492402'});
const auth='Bearer private-test-token-123';
const query=(half='false')=>new URLSearchParams({kind:'statistics',fixture:'1492402',half});
const response=(body:unknown,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers});
const raw={parameters:{fixture:'1492402'},errors:[],response:[{team:{id:1,name:'Equipe A'},statistics:[{type:'Total Shots',value:4},{type:'Red Cards',value:null},{type:'Yellow Cards',value:0},{type:'Ball Possession',value:'43%'}]}]};
const fixture:AutoFixture={id:1492402,date:null,status:'FT',statusLabel:null,minute:90,league:null,country:null,home:{id:1,name:'A'},away:{id:2,name:'B'},goals:[null,null]};
// All responses in this file are SIMULATED; not validated API data for the reference fixture.
describe('API-Football server-only PoC',()=>{
 it('blocks missing configuration and unauthorized access without upstream calls',async()=>{
  const f=vi.fn();expect((await createFootballService({fetcher:f,env:()=>({})})(query(),auth)).status).toBe(503);
  const s=createFootballService({fetcher:f,env});expect((await s(query(),'wrong')).status).toBe(401);expect(f).not.toHaveBeenCalled();
 });
 it('allowlists dates/IDs/parameters and fixes upstream URL and header',async()=>{
  const f=vi.fn().mockImplementation(async()=>response(raw)),s=createFootballService({fetcher:f,env});
  for(const p of [new URLSearchParams({kind:'statistics',fixture:'9'}),new URLSearchParams({kind:'fixtures',date:'2026-10-14'}),new URLSearchParams({kind:'statistics',fixture:'1492402',half:'1'}),new URLSearchParams('kind=statistics&fixture=1492402&url=https://evil.com'),new URLSearchParams('kind=statistics&fixture=1492402&fixture=1492402')])expect((await s(p,auth)).status).toBe(400);
  const r=await s(query(),auth);expect(r.status).toBe(200);expect(f.mock.calls[0][0]).toBe('https://v3.football.api-sports.io/fixtures/statistics?fixture=1492402&half=false');expect(f.mock.calls[0][1].headers['x-apisports-key']).toBe('not-a-real-key');expect(JSON.stringify(r)).not.toContain('not-a-real-key');
 });
 it('coalesces concurrent calls, caches successes and distinguishes half=true',async()=>{
  let clock=100000;const f=vi.fn().mockImplementation(async()=>response(raw)),s=createFootballService({fetcher:f,env,now:()=>clock});
  await Promise.all([s(query(),auth),s(query(),auth)]);expect(f).toHaveBeenCalledTimes(1);expect((await s(query(),auth)).body.cached).toBe(true);
  expect((await s(query('true'),auth)).body.halfRequested).toBe(true);expect(f.mock.calls[1][0]).toContain('half=true');clock+=3600001;await s(query(),auth);expect(f).toHaveBeenCalledTimes(3);
 });
 it('uses exactly the validated date-only endpoint, server key only, and preserves 293 simulated fixtures',async()=>{
  const items=Array.from({length:293},(_,i)=>({fixture:{id:1500000+i,date:'2026-10-13T18:00:00+00:00',status:{short:'NS'}},teams:{home:{id:1,name:'Equipe simulada A'},away:{id:2,name:'Equipe simulada B'}},goals:{home:null,away:null}}));
  const f=vi.fn().mockImplementation(async()=>response({errors:[],parameters:{date:'2026-10-13'},response:items}));
  const s=createFootballService({fetcher:f,env}),p=new URLSearchParams({kind:'fixtures',date:'2026-10-13'});
  const result=await s(p,auth);
  expect(f.mock.calls[0][0]).toBe('https://v3.football.api-sports.io/fixtures?date=2026-10-13');
  expect(f.mock.calls[0][1].headers).toEqual({'x-apisports-key':'not-a-real-key',Accept:'application/json'});
  expect(result.status).toBe(200);expect(result.body.items).toHaveLength(293);expect(result.body.items[0].goals).toEqual([null,null]);
  expect(JSON.stringify(result)).not.toContain('not-a-real-key');expect(JSON.stringify(result)).not.toContain('private-test-token-123');
  await s(p,auth);expect(f).toHaveBeenCalledTimes(1);
 });
 it('distinguishes provider parameter and authentication errors without exposing raw messages or blaming plans',async()=>{
  for(const [field,code] of [['timezone','PROVIDER_PARAMETER'],['date','PROVIDER_PARAMETER'],['half','PROVIDER_PARAMETER'],['token','PROVIDER_AUTH_RESPONSE'],['other','PROVIDER_ERRORS_OBJECT']]){
   const f=vi.fn().mockImplementation(async()=>response({errors:{[field]:'not-a-real-key private-test-token-123'},response:[]}));
   const s=createFootballService({fetcher:f,env}),result=await s(new URLSearchParams({kind:'fixtures',date:'2026-10-13'}),auth);
   expect(result.status).toBe(502);expect(result.body.code).toBe(code);expect(JSON.stringify(result)).not.toContain('not-a-real-key');expect(JSON.stringify(result)).not.toContain('private-test-token-123');
   expect(result.body.error).not.toContain('Confira plano');await s(new URLSearchParams({kind:'fixtures',date:'2026-10-13'}),auth);expect(f).toHaveBeenCalledTimes(1);
  }
 });
 it('handles quota inside HTTP 200, HTTP 429 and local rolling budget; caches failures',async()=>{
  for(const fixtureResponse of [response({errors:{requests:'private error not for client'},response:[]}),response({},429)]){
   const f=vi.fn().mockResolvedValue(fixtureResponse),s=createFootballService({fetcher:f,env});expect((await s(query(),auth)).status).toBe(429);expect((await s(query('true'),auth)).status).toBe(429);expect(f).toHaveBeenCalledTimes(1);
  }
  const f=vi.fn().mockImplementation(async()=>response(raw)),s=createFootballService({fetcher:f,env,budget:1});await s(query(),auth);expect((await s(query('true'),auth)).body.code).toBe('LOCAL_BUDGET');expect(f).toHaveBeenCalledTimes(1);
 });
 it('upstream remaining=0 blocks new requests but retains cached successful data',async()=>{
  const f=vi.fn().mockImplementation(async()=>response(raw,200,{'x-ratelimit-requests-remaining':'0'})),s=createFootballService({fetcher:f,env});expect((await s(query(),auth)).status).toBe(200);expect((await s(query(),auth)).status).toBe(200);expect((await s(query('true'),auth)).status).toBe(429);
 });
 it('malformed, forbidden, timeout and key-echo responses are sanitized',async()=>{
  for(const value of [response({response:{},errors:[]}),response({},403),response({response:[],errors:{token:'not-a-real-key'}}),response({response:[{team:{id:1,name:'not-a-real-key'},statistics:[]}],errors:[]})]){
   const s=createFootballService({fetcher:vi.fn().mockResolvedValue(value),env});const r=await s(query(),auth);expect(r.status).toBe(502);expect(JSON.stringify(r)).not.toContain('not-a-real-key');
  }
  const f=vi.fn().mockRejectedValue(Error('not-a-real-key')),s=createFootballService({fetcher:f,env});await s(query(),auth);await s(query(),auth);expect(f).toHaveBeenCalledTimes(1);
 });
 it('rejects mismatched fixture identity and returns empty data honestly',async()=>{
  expect((await createFootballService({env,fetcher:vi.fn().mockResolvedValue(response({...raw,parameters:{fixture:'9'}}))})(query(),auth)).status).toBe(502);
  const r=await createFootballService({env,fetcher:vi.fn().mockResolvedValue(response({response:[],errors:[]}))})(query(),auth);expect(r.body.items).toEqual([]);
 });
});
describe('Normalização sem dados inventados',()=>{
 it('keeps null/empty invalid values N/D and explicit zero; percentages and decimal strings',()=>{
  for(const n of [null,undefined,'',true,'N/D','-1',NaN])expect(statValue(n)).toBeNull();expect(statValue(0)).toBe(0);expect(statValue('1,71')).toBe(1.71);expect(statValue('43%')).toBe(43);
  const rows=[{team:{id:1,name:'A'},statistics:raw.response[0].statistics,statistics_1h:null,statistics_2h:null}];const result=periodStats(rows,fixture,'statistics');expect(result.values[0]).toMatchObject({shots:4,red:null,yellow:0,possession:43});expect(result.values[1].shots).toBeNull();expect(periodStats(rows,fixture,'statistics_1h').available).toBe(false);
 });
 it('never treats accumulated totals as half stats; accepts only explicit supported arrays and matching teams',()=>{
  const rows=[{team:{id:1,name:'A'},statistics:[{type:'Total Shots',value:9}],statistics_1h:[{type:'Total Shots',value:5}],statistics_2h:[{type:'Total Shots',value:4}]}];
  expect(periodStats(rows,fixture,'statistics_1h').values[0].shots).toBe(5);expect(periodStats(rows,fixture,'statistics_2h').values[0].shots).toBe(4);expect(periodStats([...rows,rows[0]],fixture,'statistics').values[0].shots).toBeNull();expect(periodStats([{...rows[0],team:{id:9,name:'Other'}}],fixture,'statistics').available).toBe(false);
 });
});
describe('Diagnóstico seguro de estatísticas por tempo',()=>{
 it('distinguishes private PoC rejection, provider 401, provider 403 and HTTP 200 auth field',async()=>{
  const f=vi.fn().mockImplementation(async()=>response(raw));const s=createFootballService({env,fetcher:f});expect((await s(query('true'),'invalid')).body.code).toBe('ACCESS');expect(f).not.toHaveBeenCalled();
  for(const [status,body,code] of [[401,{},'PROVIDER_UNAUTHORIZED'],[403,{},'PROVIDER_FORBIDDEN'],[200,{errors:{token:'credential or permission not-a-real-key private-test-token-123'},response:[]},'PROVIDER_AUTH_RESPONSE']] as const){
   const r=await createFootballService({env,fetcher:vi.fn().mockImplementation(async()=>response(body,status))})(query('true'),auth);expect(r.status).toBe(502);expect(r.body.code).toBe(code);expect(r.body.upstreamStatus).toBe(status);expect(JSON.stringify(r)).not.toContain('not-a-real-key');expect(JSON.stringify(r)).not.toContain('private-test-token-123');
  }
 });
 it('only explicit half restriction becomes N/D, without retries or deriving totals',async()=>{
  for(const status of [200,403]){
   const f=vi.fn().mockImplementation(async(url:string)=>response(url.includes('half=true')?{errors:{token:'You do not have access to halves statistics not-a-real-key'},response:[]}:raw,url.includes('half=true')?status:200));
   const s=createFootballService({env,fetcher:f});expect((await s(query(),auth)).body.items).toHaveLength(1);const r=await s(query('true'),auth);expect(r.status).toBe(200);expect(r.body).toMatchObject({halfRequested:true,fixtureId:1492402,items:[],availability:'unavailable'});expect(JSON.stringify(r)).not.toContain('not-a-real-key');await s(query('true'),auth);expect(f).toHaveBeenCalledTimes(2);expect((await s(query(),auth)).body.items).toHaveLength(1);
  }
  const r=await createFootballService({env,fetcher:vi.fn().mockImplementation(async()=>response({response:[],errors:[]}))})(query('true'),auth);expect(r.status).toBe(200);expect(r.body.items).toEqual([]);expect(r.body.availability).toBeUndefined();
 });
 it('prioritizes quota over period restriction and does not mislabel 429 as bad credentials',async()=>{
  for(const [status,body,headers,code] of [[429,{}, {},'PROVIDER_LIMIT'],[429,{}, {'x-ratelimit-requests-remaining':'0'},'DAILY_LIMIT'],[200,{errors:{rateLimit:'limit',token:'You do not have access to half statistics'},response:[]},{},'RATE_LIMIT']] as const){
   const f=vi.fn().mockImplementation(async()=>response(body,status,headers)),s=createFootballService({env,fetcher:f});const r=await s(query('true'),auth);expect(r.status).toBe(429);expect(r.body.code).toBe(code);await s(query(),auth);expect(f).toHaveBeenCalledTimes(1);
  }
 });
});
