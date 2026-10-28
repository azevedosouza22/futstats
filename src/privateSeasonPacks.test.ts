import {describe,it,expect} from 'vitest';
import {createPrivateSeasonPack,combinePrivateSeasonPacks} from './privateSeasonPacks';
import {mergeResearchPacks} from './researchPacks';
import {parseWorkResearchCsv,type WorkResearchRow} from './workCsv';
import type {Data,Stats} from './model';

const st=(goals:number,shots:number,target:number,corners:number):Stats=>({
 goals,shots,target,corners,yellow:null,red:null
});
const a=st(1,6,3,2),b=st(0,3,1,1),c=st(1,5,2,3),d=st(1,4,2,4);
const row=(id:string,date:string,home:string,away:string):WorkResearchRow=>({
 sourceId:id,date,titleDate:date,dateDiscrepancy:false,home,away,
 competition:'Premier League inglesa 2025/26',
 sourceUrl:'https://www.flashscore.com.br/jogo/futebol/teste/resumo/estatisticas/total/?mid='+id,
 first:[a,b],second:[c,d],full:[st(2,11,5,5),st(1,7,3,5)]
});
const label='2026-10-28T11:33:00.000Z';
const empty:Data={teams:[],matches:[]};
const baseline={data:empty,total:0,dateConflicts:0,leagues:[]};
describe('Etapa 88: inclusão privada por liga/temporada',()=>{
 it('valida duas partidas e soma à pesquisa sem alterar dados originais',()=>{
  const before=JSON.stringify(baseline);
  const pack=createPrivateSeasonPack([
   row('match001','2025-08-15','Liverpool','Bournemouth'),
   row('match002','2025-08-16','Chelsea','Crystal Palace')
  ],label);
  expect(pack.data.matches).toHaveLength(2);
  expect(pack.data.teams).toHaveLength(4);
  const added=mergeResearchPacks(baseline,[{
   file:'private_season_1.json',competition:pack.competition,count:2
  }],[pack]);
  expect(added.total).toBe(2);
  expect(added.leagues[0]).toMatchObject({count:2});
  expect(JSON.stringify(baseline)).toBe(before);
 });
 it('aceita reimportação idêntica e pequenos lotes novos sem sobrescrever partidas',()=>{
  const first=createPrivateSeasonPack([
   row('match001','2025-08-15','Liverpool','Bournemouth')
  ],label);
  const repeat=createPrivateSeasonPack([
   row('match001','2025-08-15','Liverpool','Bournemouth')
  ],new Date().toISOString());
  const nochange=combinePrivateSeasonPacks(first,repeat);
  expect(nochange).toMatchObject({added:0,skipped:1});
  expect(nochange.pack.data.matches).toHaveLength(1);
  const next=createPrivateSeasonPack([
   row('match002','2025-08-16','Liverpool','Arsenal')
  ],label);
  const merged=combinePrivateSeasonPacks(nochange.pack,next);
  expect(merged).toMatchObject({added:1,skipped:0});
  expect(merged.pack.data.matches).toHaveLength(2);
  expect(merged.pack.data.teams).toHaveLength(3);
  expect(first.data.matches).toHaveLength(1);
 });
 it('recusa sobrescrever dados já existentes e dois IDs para o mesmo confronto',()=>{
  const first=createPrivateSeasonPack([row('match001','2025-08-15','Liverpool','Bournemouth')],label);
  const bad=row('match001','2025-08-15','Liverpool','Bournemouth');
  bad.first=[st(2,6,3,2),b];
  expect(()=>combinePrivateSeasonPacks(first,createPrivateSeasonPack([bad],label)))
   .toThrow(/Conflito/);
  const duplicated=createPrivateSeasonPack([
    row('match002','2025-08-15','Liverpool','Bournemouth')
  ],label);
  expect(()=>combinePrivateSeasonPacks(first,duplicated)).toThrow(/duplicado/);
 });
 it('não aceita N/D, mistura de temporada ou estatísticas inconsistentes',()=>{
  const missing=row('match001','2025-08-15','Liverpool','Bournemouth');
  missing.first=[{...a,shots:null},b];
  expect(()=>createPrivateSeasonPack([missing],label)).toThrow(/incompletas/);
  const invalid=row('match003','2025-08-15','Liverpool','Bournemouth');
  invalid.competition='La Liga espanhola 2025/26';
  expect(()=>createPrivateSeasonPack([row('match001','2025-08-15','Liverpool','Bournemouth'),invalid],label))
   .toThrow(/somente uma liga/);
 });
 it('reutiliza a validação original de CSV do FutStats',()=>{
  expect(()=>parseWorkResearchCsv('id_fonte,fonte\\nabc,Flashscore')).toThrow();
 });
});
