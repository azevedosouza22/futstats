import {describe,it,expect} from 'vitest';
import type {WorkAnalysisMatch,WorkLeague} from './workAnalysis';
import type {MetricPairs} from './europeWorkResearch';
import {
 VERIFIED_EUROPE_FIXTURES,fixtureWithOfficialTime,captureVerifiedEuropeFixtures
} from './verifiedEuropeWorkFixtures';

const first:MetricPairs={goals:[1,0],shots:[6,5],target:[2,1],corners:[3,3]};
const second:MetricPairs={goals:[0,1],shots:[7,4],target:[3,2],corners:[2,1]};
const full:MetricPairs={goals:[1,1],shots:[13,9],target:[5,3],corners:[5,4]};
function previous(league:WorkLeague,home:string,away:string):WorkAnalysisMatch[]{
 return Array.from({length:12},(_,i)=>({
  id:league+'|test|'+i,league,
  date:'2026-10-'+String(i+1).padStart(2,'0'),
  home:i%2?home:away,away:i%2?away:home,
  sourceId:'FakeTest'+i+league,sourceUrl:'https://www.flashscore.com.br/?mid=FakeTest'+i,
  first,second,full,discrepancies:[]
 }));
}
const matches=[
 ...previous('serie-a','SSC Napoli','AS Roma'),
 ...previous('la-liga','FC Barcelona','Real Madrid CF'),
 ...previous('ligue-1','Toulouse FC','ES Troyes AC')
];
const before=new Date('2026-10-23T22:00:00.000Z');
describe('Horários oficiais europeus e captura prospectiva pontual',()=>{
 it('verifica fuso e transição de horário de verão europeu em 25/10/2026',()=>{
  const times=VERIFIED_EUROPE_FIXTURES.map(f=>fixtureWithOfficialTime(f,before)?.matchAt);
  expect(times).toEqual([
   '2026-10-24T13:00',
   '2026-10-25T13:15',
   '2026-10-25T17:00'
  ]);
  expect(VERIFIED_EUROPE_FIXTURES.every(f=>f.officialUrl.startsWith('https://'))).toBe(true);
 });
 it('recusa data/fuso contraditório, sem converter horário às cegas',()=>{
  const original=VERIFIED_EUROPE_FIXTURES[1];
  expect(fixtureWithOfficialTime({...original,localDate:'2026-10-24'},before)).toBeNull();
  expect(fixtureWithOfficialTime({...original,timezone:'Europe/Rome',localTime:'00:00'},before)).toBeNull();
  expect(fixtureWithOfficialTime(original,new Date('2026-10-26T01:00:00Z'))).toBeNull();
 });
 it('registra apenas as três partidas verificadas e mantém o snapshot imutável',()=>{
  const snapshot=JSON.stringify(matches);
  const firstCapture=captureVerifiedEuropeFixtures(matches,null,before);
  expect(firstCapture.added).toBe(3);
  expect(firstCapture.eligible).toBe(3);
  expect(firstCapture.notMatched).toBe(0);
  expect(firstCapture.failed).toEqual([]);
  expect(firstCapture.saved).toHaveLength(3);
  expect(JSON.stringify(matches)).toBe(snapshot);
  expect(firstCapture.saved.every(s=>s.markets.length===3)).toBe(true);
  const secondCapture=captureVerifiedEuropeFixtures(matches,JSON.stringify(firstCapture.saved),before);
  expect(secondCapture.added).toBe(0);
  expect(secondCapture.duplicate).toBe(3);
  expect(secondCapture.saved).toEqual(firstCapture.saved);
 });
 it('não inventa equipes nem sobrescreve arquivos antigos malformados',()=>{
  const partial=captureVerifiedEuropeFixtures(previous('serie-a','SSC Napoli','AS Roma'),null,before);
  expect(partial.added).toBe(1);
  expect(partial.notMatched).toBe(2);
  expect(()=>captureVerifiedEuropeFixtures(matches,'broken JSON',before)).toThrow();
 });
 it('não gera previsão retroativa depois do pontapé inicial',()=>{
  const result=captureVerifiedEuropeFixtures(matches,null,new Date('2026-10-26T20:00:00Z'));
  expect(result.eligible).toBe(0);
  expect(result.added).toBe(0);
  expect(result.saved).toEqual([]);
 });
});
