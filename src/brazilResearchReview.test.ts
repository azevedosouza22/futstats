import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseResearchCatalog} from './researchCatalog';
import {mergeResearchPacks,parseResearchPackManifest,loadResearchPacks} from './researchPacks';
import {applyBrazilResearchDateReview} from './brazilResearchReview';
import {validData,validateMatch} from './model';
import {unpublishedPrivatePacks} from './privateSeasonPacks';
const root='../public/research/';
const source=(p:string)=>JSON.parse(readFileSync(new URL(root+p,import.meta.url),'utf8'));
const baseline=parseResearchCatalog(source('partidas-work-951-v1.json'),readFileSync(new URL(root+'partidas-work-extras-68-v1.txt',import.meta.url),'utf8'));
const entries=parseResearchPackManifest(source('packs/manifest-v1.json'));
const packs=entries.map(e=>source('packs/'+e.file));
const merged=mergeResearchPacks(baseline,entries,packs);
const review=source('brasileirao-2026-review-20261029.json');
const effective=applyBrazilResearchDateReview(merged,review);
describe('Brasileirão 2026: incremento e revisão rastreável de 29/10',()=>{
 it('preserva originais e estatísticas; resolve 48 antigas e duas novas datas de título',()=>{
  const before=JSON.stringify(merged);
  const result=applyBrazilResearchDateReview(merged,review);
  expect(JSON.stringify(merged)).toBe(before);
  expect(baseline.total).toBe(1019);
  expect(baseline.dateConflicts).toBe(48);
  expect(merged.dateConflicts).toBe(50);
  expect(result.total).toBe(2775);
  expect(result.dateConflicts).toBe(0);
  expect(validData(result.data)).toBe(true);
  expect(result.data.matches.filter(m=>m.research?.dateReview)).toHaveLength(50);
  for(const m of result.data.matches){
   const old=merged.data.matches.find(x=>x.id===m.id)!;
   expect({...m,research:old.research}).toEqual(old);
   expect(m.research?.full).toEqual(old.research?.full);
   expect(m.research?.titleDate).toBe(old.research?.titleDate);
  }
  expect(applyBrazilResearchDateReview(result,review)).toEqual(result);
 });
 it('inclui só cinco novos IDs, 324 jogos, 20 equipes e as datas Santos conferidas',()=>{
  const games=effective.data.matches.filter(m=>m.competition==='Brasileirão Série A 2026');
  const old=new Set(baseline.data.matches.map(m=>m.research?.sourceId));
  expect(games).toHaveLength(324);
  expect(new Set(games.map(m=>m.research?.sourceId)).size).toBe(324);
  expect(new Set(games.flatMap(m=>[m.home,m.away])).size).toBe(20);
  expect(games.filter(m=>!old.has(m.research?.sourceId)).map(m=>m.research!.sourceId).sort())
   .toEqual(['21vH6po9','UsHUp3Ok','WpKydlll','faJea2wq','nDr51AQQ'].sort());
  const names=new Map(effective.data.teams.map(t=>[t.id,t.name]));
  const santos=games.filter(m=>names.get(m.home)==='Santos');
  expect(santos.some(m=>m.date==='2026-10-28'&&names.get(m.away)==='Palmeiras')).toBe(true);
  expect(santos.some(m=>m.date==='2026-10-24'&&names.get(m.away)==='Bahia')).toBe(true);
  expect(santos.some(m=>m.date==='2026-09-12'&&names.get(m.away)==='Cruzeiro')).toBe(true);
  expect(santos.some(m=>m.date==='2026-09-09'&&names.get(m.away)==='Atlético-MG')).toBe(false);
  expect(games.every(m=>m.date<='2026-10-28')).toBe(true);
 });
 it.each(['sourceId','date','titleDate','home','away','officialSource'])('bloqueia revisão adulterada em %s',field=>{
  const changed=structuredClone(review);changed.entries[0][field]='inválido';
  expect(()=>applyBrazilResearchDateReview(merged,changed)).toThrow();
 });
 it('bloqueia duplicação, valores divergentes, revisão ausente e origem não oficial',()=>{
  const duplicate=structuredClone(review);duplicate.entries[1]=duplicate.entries[0];
  expect(()=>applyBrazilResearchDateReview(merged,duplicate)).toThrow();
  const bad=structuredClone(review);bad.entries[0].expected.first[0].shots++;
  expect(()=>applyBrazilResearchDateReview(merged,bad)).toThrow(/Estatísticas/);
  const missing=structuredClone(review);missing.entries.pop();
  expect(()=>applyBrazilResearchDateReview(merged,missing)).toThrow();
  const link=structuredClone(review);link.entries[0].officialSource='https://www.cbf.com.br.evil.example/jogo';
  expect(()=>applyBrazilResearchDateReview(merged,link)).toThrow(/proveniência/);
 });
 it('não permite retirar quarentena sem revisão válida ou alterar sua data',()=>{
  const m=structuredClone(merged.data.matches.find(m=>m.research?.dateDiscrepancy)!);
  m.research!.dateDiscrepancy=false;
  expect(validateMatch(m)).toBeTruthy();
  const revised=structuredClone(effective.data.matches.find(m=>m.research?.dateReview)!);
  revised.research!.dateReview!.date='2026-10-30';
  expect(validateMatch(revised)).toBeTruthy();
 });
 it('ignora cópia privada idêntica anterior à revisão, mas rejeita mudança estatística',()=>{
  const m=merged.data.matches.find(m=>m.research?.dateDiscrepancy)!;
  const pack={format:'futstats-research-season-v1' as const,version:1 as const,competition:m.competition,
   data:{teams:merged.data.teams,matches:[m]}};
  expect(unpublishedPrivatePacks(effective,[pack])).toEqual([]);
  const bad=structuredClone(pack);bad.data.matches[0].first[0].corners!++;
  bad.data.matches[0].research!.full[0].corners!++;
  expect(()=>unpublishedPrivatePacks(effective,[bad])).toThrow(/Conflito/);
 });
 it('o carregador real aplica revisão depois dos pacotes, sem escrever armazenamento',async()=>{
  const oldFetch=globalThis.fetch;
  const payloads=new Map<string,unknown>([
   ['/research/packs/manifest-v1.json',source('packs/manifest-v1.json')],
   ['/research/brasileirao-2026-review-20261029.json',review],
   ...entries.map((e,i):[string,unknown]=>['/research/packs/'+e.file,packs[i]])
  ]);
  try{
   globalThis.fetch=async input=>new Response(JSON.stringify(payloads.get(String(input))));
   expect(await loadResearchPacks(baseline)).toEqual(effective);
  }finally{globalThis.fetch=oldFetch;}
 });
});
