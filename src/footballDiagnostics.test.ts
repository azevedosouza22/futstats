import {describe,it,expect,vi,afterEach} from 'vitest';
import {FootballRequestError,footballRequest} from './apiFootball';
import {publicFootballBody,createFootballService} from '../server/api-football.js';
import {safeBuild,shortBuild} from './build';
afterEach(()=>vi.unstubAllGlobals());
describe('Diagnóstico visível e seguro',()=>{
 it('preserves code, local HTTP 502 and upstream HTTP 200 independently of message',async()=>{
  const sha='a'.repeat(40);vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({code:'PROVIDER_AUTH_RESPONSE',upstreamStatus:200,error:'O provedor retornou erro de acesso.'}),{status:502,headers:{'X-FutStats-Commit':sha}})));
  try{await footballRequest('statistics','dummy-private-token',{fixture:'1492402',half:'true'});expect.fail('Expected rejection');}catch(e){expect(e).toBeInstanceOf(FootballRequestError);expect(e).toMatchObject({code:'PROVIDER_AUTH_RESPONSE',serverStatus:502,upstreamStatus:200,serverBuild:sha});}
 });
 it('unknown diagnostic or missing upstream status stays unknown, never inferred',()=>{
  const e=new FootballRequestError('Falha.',{code:'unsafe secret / URL',upstreamStatus:'403'},503,'secret / URL');expect(e.code).toBe('UNKNOWN');expect(e.serverStatus).toBe(503);expect(e.upstreamStatus).toBeNull();expect(e.serverBuild).toBe('unknown');
  expect(safeBuild('local')).toBe('local');expect(shortBuild(safeBuild(null))).toBe('Não informado');expect(shortBuild(safeBuild('b'.repeat(40)))).toBe('bbbbbbb');
 });
 it('supports old message-only clients without duplicate messages on updated clients',()=>{
  const result={status:502,body:{code:'PROVIDER_AUTH_RESPONSE',upstreamStatus:200,error:'Erro de acesso.'}},body=publicFootballBody(result);
  expect(body.error).toBe('Erro de acesso. [Diagnóstico: PROVIDER_AUTH_RESPONSE; HTTP servidor 502; HTTP API 200]');expect(result.body.error).toBe('Erro de acesso.');
  expect(new FootballRequestError(body.error,body,502,'local').message).toBe('Erro de acesso.');expect(publicFootballBody({status:200,body:{items:[]}})).toEqual({items:[]});
 });
 it('request and headers remain unchanged for full and half; success preserves explicit periods',async()=>{
  const env=()=>({API_SPORTS_KEY:'dummy-provider-key',API_SPORTS_POC_TOKEN:'dummy-private-token'});const f=vi.fn().mockImplementation(async()=>new Response(JSON.stringify({errors:[],response:[{team:{id:1,name:'Simulada'},statistics:[{type:'Total Shots',value:9}],statistics_1h:[{type:'Total Shots',value:5}],statistics_2h:[{type:'Total Shots',value:4}]}]})));
  const s=createFootballService({env,fetcher:f});for(const half of ['false','true']){const r=await s(new URLSearchParams({kind:'statistics',fixture:'1492402',half}),'Bearer dummy-private-token');expect(r.status).toBe(200);expect(r.body.items[0].statistics_1h[0].value).toBe(5);}
  expect(f.mock.calls.map(c=>c[0])).toEqual(['https://v3.football.api-sports.io/fixtures/statistics?fixture=1492402&half=false','https://v3.football.api-sports.io/fixtures/statistics?fixture=1492402&half=true']);expect(f.mock.calls.every(c=>c[1].headers['x-apisports-key']==='dummy-provider-key')).toBe(true);
 });
});
it('client filters unexpected names/categories and keeps only the public vocabulary',()=>{
 const e=new FootballRequestError('Erro.',{code:'PROVIDER_ERRORS_OBJECT',errorCategory:'unclassified',knownProperties:['message','dummy-secret-key','message','unknown_private_name'],unknownPropertyCount:2,inspectionLimited:true},502,'local');
 expect(e.errorCategory).toBe('Não identificada');expect(e.knownProperties).toEqual(['message']);expect(e.unknownPropertyCount).toBe(2);expect(e.inspectionLimited).toBe(true);
 const bad=new FootballRequestError('Erro.',{errorCategory:'secret',knownProperties:['secret'],unknownPropertyCount:'2'},502,'local');expect(bad.errorCategory).toBeNull();expect(bad.knownProperties).toEqual([]);expect(bad.unknownPropertyCount).toBeNull();
});
