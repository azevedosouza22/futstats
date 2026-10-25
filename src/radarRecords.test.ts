import {describe,expect,it} from 'vitest';
import {mergeRadarRecords,parseRadarRecords,type SavedRadarRecord} from './radarRecords';

const record=(key:string,home='Cruzeiro'):SavedRadarRecord=>({
  key,savedAt:'2026-10-20T12:00:00.000Z',matchAt:'2026-10-23T20:00:00',
  competition:'Brasileirão Série A',home,away:'Remo',homeCount:5,awayCount:5,
  markets:[{id:'goals-full-2.5',label:'Gols',line:2.5,historyRate:.4,observed:10,overs:4,historicalMean:2.6}],
  venue:[{marketId:'shots-full-24.5',label:'Finalizações',line:24.5,
    v2:'Over',v3:'Sem sinal',projectedTotal:23,failedChecks:[]}],
});

describe('recuperação segura dos registros pré-jogo',()=>{
 it('aceita um backup válido e conserva todos os valores originais',()=>{
  const a=record('x');
  expect(parseRadarRecords(JSON.parse(JSON.stringify([a])))).toEqual([a]);
 });
 it('restaura só registros faltantes; nunca troca uma previsão já existente',()=>{
  const original=record('original');
  const changed={...record('outro'),savedAt:'2026-10-22T19:00:00.000Z'};
  const more={...record('novo','Palmeiras'),away:'Bahia'};
  const merged=mergeRadarRecords([original],[changed,more]);
  expect(merged).toMatchObject({added:1,skipped:1});
  expect(merged.entries).toEqual([original,more]);
  expect(mergeRadarRecords(merged.entries,[original,more]).added).toBe(0);
 });
 it('rejeita arquivo corrompido sem substituir os registros existentes',()=>{
  expect(()=>parseRadarRecords({matches:[]})).toThrow('inválido');
  expect(()=>parseRadarRecords([{...record('bad'),matchAt:'2026-02-31T20:00:00'}])).toThrow('inválido');
  expect(()=>parseRadarRecords([{...record('bad'),venue:[{...record('bad').venue![0],v3:'Garantido'}]}])).toThrow('inválido');
  expect(()=>parseRadarRecords([record('dup'),record('dup','Palmeiras')])).toThrow('repetidos');
  expect(()=>mergeRadarRecords([record('x')],[record('x','Palmeiras')])).toThrow('Conflito');
 });
 it('preserva a origem de As Boas na exportação/restauração sem atribuir registros antigos',()=>{
  const original=record('valid');
  const withPick={...original,goodPicks:{
   verifiedAt:'2026-10-20',sourceUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/teste',
   signals:[{id:'shots-full-24.5',label:'Finalizações',line:24.5,direction:'Over' as const,
    projection:31,historicalMean:29,historicalSample:10,leagueSample:22,relativeDistance:.26}]
  }};
  expect(parseRadarRecords(JSON.parse(JSON.stringify([withPick])))[0].goodPicks).toEqual(withPick.goodPicks);
  expect(parseRadarRecords([original])[0].goodPicks).toBeUndefined();
  expect(()=>parseRadarRecords([{...withPick,goodPicks:{...withPick.goodPicks,
    sourceUrl:'http://site-falso.invalid'}}])).toThrow('inválido');
 });
 it('conserva cópia da indicação de Serie A italiana e Premier League ao restaurar',()=>{
  const base=record('italia');
  const signals=[{id:'goals-full-2.5',label:'Gols',line:2.5,
    direction:'Under' as const,projection:1.1,historicalMean:2,
    historicalSample:10,leagueSample:20,relativeDistance:.56}];
  const italian={...base,goodPicks:{
    verifiedAt:'2026-10-25',
    sourceUrl:'https://www.legaseriea.it/serie-a/news/quando-si-gioca-anticipi-e-posticipi-fino-alla-12a-giornata',
    signals}};
  const premier={...record('premier','Chelsea'),away:'Manchester United',
    goodPicks:{verifiedAt:'2026-10-25',
      sourceUrl:'https://www.premierleague.com/en/news/4688862/fixture-amendments-for-premier-league-matches-in-october-and-november',
      signals}};
  const copy=JSON.parse(JSON.stringify([italian,premier]));
  expect(parseRadarRecords(copy)).toEqual([italian,premier]);
  expect(()=>parseRadarRecords([{...italian,goodPicks:{
    ...italian.goodPicks,sourceUrl:'https://www.legaseriea.it.evil.invalid/x'
  }}])).toThrow('inválido');
 });
 it('respeita o limite do armazenamento e não remove previsões existentes',()=>{
  const existing=Array.from({length:50},(_,i)=>({...record('old-'+i,'Casa'+i),away:'Fora'+i}));
  const merged=mergeRadarRecords(existing,[record('new')]);
  expect(merged.added).toBe(0);
  expect(merged.entries).toEqual(existing);
 });
});
