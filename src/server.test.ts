import {describe,it,expect,vi} from 'vitest';
import {createService} from '../server/thesportsdb.js';
const params=(q='Arsenal')=>new URLSearchParams({kind:'teams',q});
describe('proxy de servidor',()=>{
 it('valida a busca antes de consultar a API',async()=>{const fetcher=vi.fn();const service=createService(fetcher);expect((await service(params('a'))).status).toBe(400);expect((await service(new URLSearchParams({kind:'evil',q:'Arsenal'}))).status).toBe(400);expect(fetcher).not.toHaveBeenCalled();});
 it('usa chave apenas upstream, reduz campos e reutiliza cache',async()=>{const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({teams:[{idTeam:'1',strTeam:'Arsenal',strSport:'Soccer',secret:'omitted'},{strSport:'Basketball'}]})));const service=createService(fetcher,()=>100000,()=> 'server-secret');const r=await service(params());expect(r.status).toBe(200);expect(r.body.items).toHaveLength(1);expect(JSON.stringify(r.body)).not.toContain('secret');await service(params());expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0][0]).toContain('/server-secret/');});
 it('trata respostas vazias, malformadas, falhas e timeout sem vazar credenciais',async()=>{for(const body of ['{"teams":null}','{"teams":{}}','not-json']){const s=createService(vi.fn().mockResolvedValue(new Response(body)));expect((await s(params())).status).toBe(body.includes('null')?200:502);}const s=createService(vi.fn().mockRejectedValue(Error('private-key')));const r=await s(params());expect(r.status).toBe(502);expect(JSON.stringify(r.body)).not.toContain('private-key');});
 it('aplica limite local e cooldown para HTTP 429 sem retentativas automáticas',async()=>{const fetcher=vi.fn().mockResolvedValue(new Response('',{status:429}));const s=createService(fetcher,()=>100000);expect((await s(params())).status).toBe(429);expect((await s(params('Chelsea'))).status).toBe(429);expect(fetcher).toHaveBeenCalledTimes(1);const ok=vi.fn().mockImplementation(()=>Promise.resolve(new Response('{"teams":null}')));const limited=createService(ok,()=>100000);for(let i=0;i<15;i++)await limited(params('Team'+i));expect((await limited(params('Team16'))).status).toBe(429);expect(ok).toHaveBeenCalledTimes(15);});
 it('deduplica requisições simultâneas e expira cache',async()=>{let time=100000;const f=vi.fn().mockImplementation(async()=>new Response('{"teams":null}'));const s=createService(f,()=>time);await Promise.all([s(params()),s(params())]);expect(f).toHaveBeenCalledTimes(1);time+=300001;await s(params());expect(f).toHaveBeenCalledTimes(2);});
});

describe('consultas pontuais autorizadas',()=>{
 it('usa endpoints fixos, distingue payloads e respeita o cache de 30 segundos',async()=>{
  let clock=100000; const f=vi.fn().mockImplementation(async (url:string)=>new Response(JSON.stringify(url.includes('lookupeventstats')?{eventstats:[{idEvent:'123',strStat:'Total Shots',intHome:'4',intAway:null},{idEvent:'456',strStat:'Total Shots',intHome:'99'}]}:{events:[{idEvent:'123',strSport:'Soccer',intHomeScore:'1'}]})));
  const s=createService(f,()=>clock);
  const p=new URLSearchParams({kind:'snapshot',q:'123'}),q=new URLSearchParams({kind:'statistics',q:'123'});
  const snapshot=await s(p);expect(snapshot.body.items).toHaveLength(1);expect(snapshot.body.fetchedAt).toBe(new Date(clock).toISOString());
  const result=await s(q);expect(result.body.items).toHaveLength(1);
  await s(p);await s(q);expect(f).toHaveBeenCalledTimes(2);
  clock+=30001;await s(p);expect(f).toHaveBeenCalledTimes(3);
 });
 it('rejeita URL e IDs inválidos sem acesso ao provedor',async()=>{
  const f=vi.fn();const s=createService(f);
  for(const q of ['https://flashscore.com','../secret','', '1'.repeat(21)])expect((await s(new URLSearchParams({kind:'snapshot',q}))).status).toBe(400);
  expect(f).not.toHaveBeenCalled();
 });
});
