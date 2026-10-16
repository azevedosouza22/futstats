import {describe,it,expect,vi} from 'vitest';
import {inspectFootballErrors} from '../server/football-errors.js';
import {createFootballService,publicFootballBody} from '../server/api-football.js';
const env=()=>({API_SPORTS_KEY:'dummy-secret-key',API_SPORTS_POC_TOKEN:'dummy-private-token'});
const auth='Bearer dummy-private-token',params=()=>new URLSearchParams({kind:'fixtures',date:'2026-10-13'});
const service=(value:unknown,status=200)=>{
 const fetcher=vi.fn().mockImplementation(async()=>new Response(JSON.stringify(value),{status}));return {s:createFootballService({env,fetcher}),fetcher};
};
describe('Classificação privada de errors',()=>{
 it('accepts canonical empty arrays/objects and ignores absent or empty leaves',()=>{
  for(const value of [undefined,null,[],{},'',{message:''},{message:null},{nested:[]},[{message:' '}]] as unknown[])expect(inspectFootballErrors(value).present).toBe(false);
 });
 it('classifies keyed objects and arrays without echoing keys or messages',()=>{
  for(const errors of [{date:'Invalid date'},[{date:'Invalid date'}]])expect(inspectFootballErrors(errors)).toMatchObject({present:true,category:'parameter',parameter:'date'});
  expect(inspectFootballErrors(['Too many requests per minute'])).toMatchObject({category:'rate_limit',shape:'array'});
  expect(inspectFootballErrors([{requests:'Daily limit'}]).category).toBe('daily_limit');
  expect(inspectFootballErrors([{token:'Access error'}]).category).toBe('authentication');
  expect(inspectFootballErrors({token:'This plan does not have access to this endpoint'}).category).toBe('restriction');
 });
 it('keeps malformed/unknown data explicit, handles bounded nesting and does not classify echoed secrets',()=>{
  for(const v of [true,123,{message:42},{token:123},{requests:123}])expect(inspectFootballErrors(v)).toMatchObject({present:true,category:'malformed'});
  expect(inspectFootballErrors({message:'opaque error'})).toMatchObject({shape:'object',category:'unclassified'});
  expect(inspectFootballErrors('opaque error')).toMatchObject({shape:'string',category:'unclassified'});
  expect(inspectFootballErrors({message:'invalid token'},['invalid token']).category).toBe('unclassified');
  expect(JSON.stringify(inspectFootballErrors({sensitive_unknown_key:'dummy-secret-key'}))).not.toContain('sensitive_unknown_key');
  let deep:unknown='failure';for(let i=0;i<10;i++)deep={nested:deep};expect(inspectFootballErrors(deep)).toMatchObject({present:true,category:'malformed'});
 });
});
describe('Status original, cache e mensagens sanitizadas',()=>{
 it('retains HTTP 200 for every semantic error category and format, including cached failures',async()=>{
  const cases:[unknown,string][]=[
   [{message:'opaque dummy-secret-key dummy-private-token'},'PROVIDER_ERRORS_OBJECT'],
   [['opaque dummy-secret-key'],'PROVIDER_ERRORS_ARRAY'],['opaque dummy-secret-key','PROVIDER_ERRORS_STRING'],
   [123,'PROVIDER_ERRORS_FORMAT'],[{date:'dummy-secret-key'},'PROVIDER_PARAMETER'],
   [[{token:'dummy-secret-key'}],'PROVIDER_AUTH_RESPONSE'],
   [{token:'This plan does not have access to this endpoint dummy-secret-key'},'PROVIDER_RESTRICTION'],
   [[{requests:'quota dummy-secret-key'}],'DAILY_LIMIT'],[['Too many requests per minute dummy-secret-key'],'RATE_LIMIT'],
  ];
  for(const [errors,code] of cases){
   const {s,fetcher}=service({errors,response:[]});const r=await s(params(),auth);
   expect(r.status).toBe(code.endsWith('LIMIT')?429:502);expect(r.body).toMatchObject({code,upstreamStatus:200});
   const text=JSON.stringify(publicFootballBody(r));expect(text).not.toContain('dummy-secret-key');expect(text).not.toContain('dummy-private-token');
   expect((await s(params(),auth)).body.upstreamStatus).toBe(200);expect(fetcher).toHaveBeenCalledTimes(1);
  }
 });
 it('preserves received non-2xx and malformed JSON statuses; no received response stays null',async()=>{
  for(const [status,code] of [[401,'PROVIDER_UNAUTHORIZED'],[403,'PROVIDER_FORBIDDEN'],[429,'PROVIDER_LIMIT'],[503,'PROVIDER']] as const){const {s}=service({},status);expect((await s(params(),auth)).body).toMatchObject({code,upstreamStatus:status});}
  const bad=createFootballService({env,fetcher:vi.fn().mockResolvedValue(new Response('<html>not JSON</html>',{status:200}))});expect((await bad(params(),auth)).body).toMatchObject({code:'PAYLOAD',upstreamStatus:200});
  const disconnected=createFootballService({env,fetcher:vi.fn().mockRejectedValue(Error('dummy-secret-key'))});expect((await disconnected(params(),auth)).body).toMatchObject({code:'CONNECTION',upstreamStatus:null});
 });
 it('keeps successful empty errors and full/half data unchanged, never inventing missing periods',async()=>{
  for(const errors of [[],{},null]){
   const {s}=service({errors,response:[{team:{id:1,name:'Teste'},statistics:[{type:'Total Shots',value:4}],statistics_1h:[{type:'Total Shots',value:1}],statistics_2h:null}]});
   const r=await s(new URLSearchParams({kind:'statistics',fixture:'1492402',half:'true'}),auth);expect(r.status).toBe(200);expect(r.body.upstreamStatus).toBe(200);expect(r.body.items[0]).toMatchObject({statistics:[{type:'Total Shots',value:4}],statistics_1h:[{type:'Total Shots',value:1}],statistics_2h:null});
  }
 });
});
