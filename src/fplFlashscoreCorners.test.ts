import {describe,expect,it} from 'vitest';
import {crossCheckSavedFlashscoreCorners} from './fplFlashscoreCorners';
import {unavailable,validData,type Data,type Match} from './model';
import type {FplPilotGame} from './fplFreePilot';

const game:FplPilotGame={
 id:'26-27-prem-a-vs-b',gw:7,date:'2026-10-18',
 sourceKickoff:'2026-10-18T18:00:00',
 home:'Equipe A',away:'Equipe B',goals:[1,0],shots:[10,8],
 onTarget:[4,3],corners:[6,4],sourceStatsProcessed:true
};
const stored=():Match=>({
 id:'original-match',home:'a',away:'b',date:'2026-10-18',
 competition:'Premier League 2026/27',
 first:[{...unavailable(),corners:2},{...unavailable(),corners:1}],
 second:[{...unavailable(),corners:4},{...unavailable(),corners:3}],
 research:{
  provider:'work-csv',source:'Flashscore',sourceId:'abcD5678',
  sourceUrl:'https://www.flashscore.com.br/jogo/futebol/exemplo/?mid=abcD5678',
  importedAt:'2026-10-20T00:00:00.000Z',dateDiscrepancy:false,
  full:[{...unavailable(),corners:6},{...unavailable(),corners:4}]
 }
});
const db=(matches:Match[]=[stored()]):Data=>({
 teams:[{id:'a',name:'Equipe A',color:'#225566'},
  {id:'b',name:'Equipe B',color:'#225566'}],
 matches
});
describe('Flashscore antigo: escanteios por tempo sem escrita no historico',()=>{
 it('reaproveita somente numeros exatos e conciliados com o total do piloto',()=>{
  const original=db();
  expect(validData(original)).toBe(true);
  const before=JSON.stringify(original);
  const out=crossCheckSavedFlashscoreCorners([game],original);
  expect(out.matched).toBe(1);
  expect(out.conflicting).toBe(0);
  expect(out.byId[game.id]).toMatchObject({
   first:[2,1],second:[4,3],
   sourceUrl:'https://www.flashscore.com.br/jogo/futebol/exemplo/?mid=abcD5678'
  });
  expect(JSON.stringify(original)).toBe(before);
 });
 it('não completa períodos se somas ou totais divergirem',()=>{
  const m=stored();m.first[0].corners=3;
  expect(crossCheckSavedFlashscoreCorners([game],db([m])).byId[game.id]).toBeUndefined();
  const n=stored();n.research!.full[1].corners=5;
  expect(crossCheckSavedFlashscoreCorners([game],db([n])).conflicting).toBe(1);
 });
 it('ignora partidas de outra temporada, data e equipe',()=>{
  const m=stored();m.competition='Premier League 2025/26';
  expect(crossCheckSavedFlashscoreCorners([game],db([m])).matched).toBe(0);
  const n=stored();n.date='2026-10-19';
  expect(crossCheckSavedFlashscoreCorners([game],db([n])).matched).toBe(0);
  const p=stored();p.home='b';p.away='a';
  expect(crossCheckSavedFlashscoreCorners([game],db([p])).matched).toBe(0);
 });
 it('não seleciona duas pesquisas conflitantes nem fonte com URL suspeita',()=>{
  const a=stored(),b=stored();b.id='duplicate';b.research!.sourceId='other12';
  b.research!.sourceUrl='https://www.flashscore.com.br/?mid=other12';
  const out=crossCheckSavedFlashscoreCorners([game],db([a,b]));
  expect(out.conflicting).toBe(1);expect(out.matched).toBe(0);
  const c=stored();c.research!.sourceUrl='https://other.example/?mid=abcD5678';
  expect(crossCheckSavedFlashscoreCorners([game],db([c])).matched).toBe(0);
 });
 it('não usa dados de jogo ainda não processado pela fonte principal',()=>{
  const out=crossCheckSavedFlashscoreCorners(
   [{...game,sourceStatsProcessed:false}],db()
  );
  expect(out.matched).toBe(0);expect(out.byId[game.id]).toBeUndefined();
 });
});
