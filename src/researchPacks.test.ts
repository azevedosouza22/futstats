import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseResearchCatalog} from './researchCatalog';
import {mergeResearchPacks,parseResearchPackManifest} from './researchPacks';
import {smartLeagueOptions,calculateSmartLeagueComparison,BOTH_SEASONS} from './leagueSmartComparison';
import type {Data,Match} from './model';

const main=JSON.parse(readFileSync(new URL(
 '../public/research/partidas-work-951-v1.json',import.meta.url),'utf8')) as unknown;
const recent=readFileSync(new URL(
 '../public/research/partidas-work-extras-68-v1.txt',import.meta.url),'utf8');
const baseline=parseResearchCatalog(main,recent);
const m=baseline.data.matches.find(v=>v.competition==='Bundesliga 2025/26')!;
const t=baseline.data.teams.filter(v=>v.id===m.home||v.id===m.away);
const entry={file:'bundesliga_2024_25.json',competition:'Bundesliga 2024/25',count:1};
function pack(){
 const game:Match={...m,id:'research-season-PACK001',
  date:'2025-03-01',competition:entry.competition,
  research:{...m.research!,sourceId:'PACK001',titleDate:'2025-03-01',
   dateDiscrepancy:false,sourceUrl:'https://www.flashscore.com.br/jogo/?mid=PACK001'}};
 return {format:'futstats-research-season-v1',version:1,
  competition:entry.competition,
  data:{teams:t.map(v=>({...v})),matches:[game]} as Data};
}
describe('Etapa 86 — catálogo extensível sem migrar o histórico',()=>{
 it('mantém 1.019 partidas e 48 divergências quando o índice está vazio',()=>{
  const index=parseResearchPackManifest({format:'futstats-research-packs-v1',
   version:1,packs:[]});
  const output=mergeResearchPacks(baseline,index,[]);
  expect(output.total).toBe(1019);
  expect(output.dateConflicts).toBe(48);
  expect(output.data.matches).toHaveLength(1019);
  expect(output.data.radarSnapshots).toBeUndefined();
 });
 it('adiciona a temporada antiga sem mudar originais e permite filtrá-la',()=>{
  const before=JSON.stringify(baseline.data);
  const output=mergeResearchPacks(baseline,[entry],[pack()]);
  expect(output.total).toBe(1020);
  expect(output.dateConflicts).toBe(48);
  expect(output.data.matches.filter(x=>x.competition===entry.competition)).toHaveLength(1);
  const opts=smartLeagueOptions(output.data,'Bundesliga');
  expect(opts.seasons).toEqual(['2026/27','2025/26']);
  expect(opts.archivedSeasons).toEqual(['2024/25']);
  const home=opts.teams.find(x=>x.name===t.find(y=>y.id===m.home)!.name)!;
  const away=opts.teams.find(x=>x.name===t.find(y=>y.id===m.away)!.name)!;
  const s={league:'Bundesliga',home:home.id,away:away.id,
   metric:'shots' as const,period:'full' as const,line:24.5,date:'2026-11-01'};
  const archive=calculateSmartLeagueComparison(output.data,{...s,season:'2024/25'});
  const standard=calculateSmartLeagueComparison(output.data,{...s,season:BOTH_SEASONS});
  expect(archive.matchCount).toBe(1);
  expect(standard.matchCount).toBeGreaterThan(1);
  expect(standard.matchCount).toBe(
   baseline.data.matches.filter(v=>v.competition.startsWith('Bundesliga ')&&
    ['Bundesliga 2025/26','Bundesliga 2026/27'].includes(v.competition)&&v.date<s.date).length
  );
  expect(JSON.stringify(baseline.data)).toBe(before);
 });
 it('rejeita duplicação por fonte e por confronto, e discrepância na contagem',()=>{
  const p=pack();
  expect(()=>mergeResearchPacks(baseline,[entry,entry],[p,p])).toThrow(/repetida/);
  expect(()=>mergeResearchPacks(baseline,[{...entry,count:2}],[p])).toThrow(/inválido/);
  expect(()=>mergeResearchPacks(baseline,[entry],[])).toThrow(/ausentes/);
  const colliding=pack();colliding.data.matches[0].id='research-'+m.research!.sourceId;
  expect(()=>mergeResearchPacks(baseline,[entry],[colliding])).toThrow(/repetida/);
 });
 it('bloqueia arquivos sem origem validada e nomes de arquivo maliciosos',()=>{
  expect(()=>parseResearchPackManifest({format:'futstats-research-packs-v1',version:1,
    packs:[{...entry,file:'../../secrets.json'}]})).toThrow(/Pacote/);
  const p=pack();delete (p.data.matches[0] as Partial<Match>).research;
  expect(()=>mergeResearchPacks(baseline,[entry],[p])).toThrow(/origem/);
 });
});
