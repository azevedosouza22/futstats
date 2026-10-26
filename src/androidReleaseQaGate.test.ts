import {describe,it,expect} from 'vitest';
import type {SafetyInspection} from './safetyArchive';
import type {DryRunResult} from './safetyRestoreDryRun';
import {assessAndroidQaGate,exportAndroidQaGateCsv} from './androidReleaseQaGate';
const safety:SafetyInspection={
 entries:[],ok:true,present:2,missing:7,invalid:0,matches:659,
 workMatches:222,workForecasts:14,calendarFixtures:10
};
const recovery:DryRunResult={
 status:'PASSOU',groups:9,restored:2,
 matches:659,workMatches:222,workForecasts:14,calendarFixtures:10,
 radarForecasts:7,originalUnchanged:true,simulatedOnly:true
};
const env={viewportWidth:390,documentWidth:390,randomUUID:true,sha256:true};
const now=new Date('2026-10-26T12:00:00Z');

describe('Etapa 61 — bloqueio explícito de liberação Android',()=>{
 it('4/4 checagens locais ainda bloqueiam produção e QA físico permanece pendente',()=>{
  const r=assessAndroidQaGate(safety,recovery,env,now);
  expect(r).toMatchObject({
   localStatus:'APTO_PARA_TESTE_FISICO',releaseStatus:'NAO_LIBERADO_PARA_PRODUCAO',
   releaseBlocked:true,localPassed:4,localTotal:4,
   createdAt:'2026-10-26T12:00:00.000Z'
  });
  expect(r.checks).toHaveLength(8);
  expect(r.checks.slice(0,4).every(c=>c.status==='OK')).toBe(true);
  expect(r.checks.slice(4).every(c=>c.status==='PENDENTE')).toBe(true);
  expect(r.counts).toEqual({historical:659,work:222,workForecasts:14,calendar:10});
 });
 it('desconhece backup externo e não transforma autoteste em durabilidade real',()=>{
  const csv=exportAndroidQaGateCsv(assessAndroidQaGate(safety,recovery,env,now));
  expect(csv).toContain('"NAO LIBERADO"');
  expect(csv).toContain('"PENDENTE"');
  expect(csv).toContain('Arquivo de backup guardado fora do aparelho');
  expect(csv).toContain('Teste em Android físico');
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(10); // 1 header, 8 checks, 1 verdict
  expect(csv).not.toContain('futstats:v1');
  expect(csv).not.toContain('frozen-001');
  expect(csv).not.toContain('"659"'); // counts remain on-device UI, not sent in CSV
 });
 it('sem grupos presentes, nunca declara apto, mesmo se ambiente for perfeito',()=>{
  const a=assessAndroidQaGate({...safety,present:0,missing:9},null,env,now);
  expect(a).toMatchObject({localPassed:2,localStatus:'REVISAR_ANTES_DO_TESTE',
   releaseBlocked:true});
  expect(a.checks[0].status).toBe('REVISAR');
  expect(a.checks[1].status).toBe('REVISAR');
 });
 it('grupo inválido impede aprovação apesar de ensaio artificial positivo',()=>{
  const corrupt=assessAndroidQaGate({...safety,ok:false,invalid:1},recovery,env,now);
  expect(corrupt).toMatchObject({localPassed:3,releaseBlocked:true});
  expect(corrupt.checks[0].status).toBe('REVISAR');
 });
 it('ensaio de recuperação com contagens ou grupos diferentes não aprova',()=>{
  for(const x of [{...recovery,matches:658},{...recovery,restored:1},
   {...recovery,groups:8},{...recovery,simulatedOnly:false as true}]){
    const r=assessAndroidQaGate(safety,x,env,now);
    expect(r.checks[1].status).toBe('REVISAR');
    expect(r.localPassed).toBe(3);
  }
 });
 it('largura estreita, rolagem global e navegador sem criptografia bloqueiam a etapa',()=>{
  const report=assessAndroidQaGate(safety,recovery,
   {...env,viewportWidth:310,documentWidth:480,sha256:false},now);
  expect(report).toMatchObject({localPassed:2,localStatus:'REVISAR_ANTES_DO_TESTE',
   releaseStatus:'NAO_LIBERADO_PARA_PRODUCAO'});
  expect(report.checks[2].status).toBe('REVISAR');
  expect(report.checks[3].status).toBe('REVISAR');
 });
 it('os registros e a inspeção originais não sofrem mutação',()=>{
  const before=JSON.stringify({safety,recovery,env});
  const report=assessAndroidQaGate(safety,recovery,env,now);
  exportAndroidQaGateCsv(report);
  expect(JSON.stringify({safety,recovery,env})).toBe(before);
 });
 it('CSV protege texto de fórmula caso mensagem seja externa, mas não expõe conteúdo',()=>{
  const report=assessAndroidQaGate(safety,recovery,env,now);
  const injected={...report,checks:report.checks.map((c,i)=>
   i===0?{...c,label:'=HYPERLINK("https://bad.invalid";"x")'}:c)};
  const csv=exportAndroidQaGateCsv(injected);
  expect(csv).toContain('"\'=HYPERLINK(""https://bad.invalid"";""x"")"');
  expect(csv).toContain('"NAO LIBERADO"');
 });
});
