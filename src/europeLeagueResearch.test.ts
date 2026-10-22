import {describe,expect,it} from 'vitest';
import {
 EUROPE_LEAGUES,EUROPE_RESEARCH_STORAGE,parseEuropeanLeague,
 eligibleEuropeanResults,readStoredEuropeanResearch,stageEuropeanResults
} from './europeLeagueResearch';

function sample(id:'serie-a'|'la-liga'|'ligue-1'='serie-a'){
 const league=EUROPE_LEAGUES.find(x=>x.id===id)!;
 const clubs=id==='ligue-1'?18:20;
 const rows=Array.from({length:league.fixtures},(_,i)=>{
  const round=Math.floor(i/(clubs/2))+1;
  const j=i%(clubs/2);
  const date=new Date(Date.UTC(2026,7,22)+(round-1)*604800000+(j%3)*86400000).toISOString().slice(0,10);
  return {round:'Matchday '+round,date,team1:'Team '+(j*2+1),team2:'Team '+(j*2+2),
   ...(i<2?{score:{ht:[1,0],ft:[2,1]}}:{})};
 });
 return {name:league.sourceName,matches:rows};
}

describe('Base de pesquisa CC0: três ligas novas',()=>{
 it('valida 380 partidas italianas e calcula o segundo tempo sem estimar escanteios',()=>{
  const result=parseEuropeanLeague(sample(),'serie-a');
  expect(result.matches).toHaveLength(380);
  expect(result.completed).toBe(2);
  expect(result.withHalves).toBe(2);
  const game=result.matches[0];
  expect(game.full).toEqual([2,1]);
  expect(game.half).toEqual([1,0]);
  expect(game.second).toEqual([1,1]);
  expect('corners' in game).toBe(false);
 });
 it('valida quantidades por campeonato sem inventar placares futuros',()=>{
  expect(parseEuropeanLeague(sample('la-liga'),'la-liga').matches).toHaveLength(380);
  expect(parseEuropeanLeague(sample('ligue-1'),'ligue-1').matches).toHaveLength(306);
  const x=sample('ligue-1');
  x.matches[0].date='2027-13-31';
  expect(()=>parseEuropeanLeague(x,'ligue-1')).toThrow('Data ou identidade');
 });
 it('ignora placares [0,0] sem indicação de fim de jogo, mantendo as demais partidas',()=>{
  const es=sample('la-liga');
  es.matches[0].score=[0,0] as unknown as {ht:number[];ft:number[]};
  const out=parseEuropeanLeague(es,'la-liga');
  expect(out.matches[0].full).toBeNull();
  expect(out.matches[0].half).toBeNull();
  expect(out.completed).toBe(1);
  expect(eligibleEuropeanResults([out],'2026-10-22')).toHaveLength(1);
  const fr=sample('ligue-1');
  fr.matches[0].score=[0,0] as unknown as {ht:number[];ft:number[]};
  expect(parseEuropeanLeague(fr,'ligue-1').completed).toBe(1);
 });
 it('bloqueia placares parciais incoerentes e fontes diferentes',()=>{
  const x=sample();
  x.matches[0].score={ht:[3,0],ft:[2,1]};
  expect(()=>parseEuropeanLeague(x,'serie-a')).toThrow('divergente');
  const y:{name:string;matches:ReturnType<typeof sample>['matches']}=sample();y.name='Outra temporada';
  expect(()=>parseEuropeanLeague(y,'serie-a')).toThrow('Fonte pública');
 });
 it('permite salvamento separado do histórico, rejeita cópias e divergências',()=>{
  const r=parseEuropeanLeague(sample(),'serie-a');
  const rows=eligibleEuropeanResults([r],'2026-10-22');
  expect(rows).toHaveLength(2);
  const original=readStoredEuropeanResearch(null);
  const before=JSON.stringify(original);
  const saved=stageEuropeanResults(original,rows);
  expect(saved.added).toBe(2);
  expect(saved.duplicates).toBe(0);
  expect(JSON.stringify(original)).toBe(before);
  const second=stageEuropeanResults(saved.next,rows);
  expect(second.added).toBe(0);
  expect(second.duplicates).toBe(2);
  const wrong={...rows[0],full:[3,1] as [number,number],second:[2,1] as [number,number]};
  expect(()=>stageEuropeanResults(saved.next,[wrong])).toThrow('alterados');
  expect(saved.next.matches).toHaveLength(2);
  expect(saved.next.format).toBe(EUROPE_RESEARCH_STORAGE);
 });
 it('nunca substitui uma base experimental inválida nem usa gols de jogos futuros',()=>{
  const r=parseEuropeanLeague(sample(),'serie-a');
  expect(eligibleEuropeanResults([r],'2026-08-01')).toHaveLength(0);
  expect(()=>readStoredEuropeanResearch('{')).toThrow('Não sobrescreva');
  expect(()=>readStoredEuropeanResearch('{"matches":[]}')).toThrow('inconsistente');
  const base=readStoredEuropeanResearch(null);
  const match=eligibleEuropeanResults([r],'2026-10-22')[0];
  const invalid={...match,half:[3,0] as [number,number]};
  expect(()=>stageEuropeanResults(base,[invalid])).toThrow('inválido');
 });
});
