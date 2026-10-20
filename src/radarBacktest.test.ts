import {describe,it,expect} from 'vitest';
import {empty,type Data,type Match} from './model';
import {backtestDecision,evaluateRadarBacktest} from './radarBacktest';

const game=(id:string,date:string,goals:number,missing=false):Match=>({
  id,home:'a',away:'b',date,competition:'Liga',
  first:[{...empty(),goals:missing?null:goals,shots:missing?null:5,target:2,corners:3}, {...empty(),goals:0,shots:5,target:2,corners:3}],
  second:[{...empty(),goals:0,shots:5,target:2,corners:3},{...empty(),goals:0,shots:5,target:2,corners:3}],
  research:{provider:'work-csv',source:'Flashscore',sourceId:'source-'+id,
    sourceUrl:'https://www.flashscore.com.br/jogo/?mid=source-'+id,
    importedAt:'2026-10-20T00:00:00.000Z',dateDiscrepancy:false,
    full:[{...empty(),goals:missing?null:goals,shots:missing?null:10,target:4,corners:6},
      {...empty(),goals:0,shots:10,target:4,corners:6}]}
});
const dataset=(matches:Match[]):Data=>({teams:[{id:'a',name:'A',color:'#23573b'},{id:'b',name:'B',color:'#23573b'}],matches});
describe('Backtest cronológico do Radar',()=>{
  it('não emite sinal com taxa neutra ou amostra insuficiente',()=>{
    expect(backtestDecision(.8,5)).toBe('Sem sinal');
    expect(backtestDecision(.5,10)).toBe('Sem sinal');
    expect(backtestDecision(.7,6)).toBe('Over');
    expect(backtestDecision(.3,6)).toBe('Under');
  });
  it('conta acertos, erros e falta de histórico somente após reunir partidas anteriores',()=>{
    const games=Array.from({length:9},(_,i)=>game(String(i+1),'2026-08-'+String(i+1).padStart(2,'0'),i===8?0:2));
    const report=evaluateRadarBacktest(dataset(games),'Liga');
    const first=report.markets.find(m=>m.id==='goals-first-0.5')!;
    // First six games have under 6 previous unique fixtures; the last three qualify.
    expect(report.fixtures).toBe(9);
    expect(first.eligible).toBe(3);
    expect(first.insufficient).toBe(6);
    expect(first.signals).toBe(3);
    expect(first.correct).toBe(2);
    expect(first.incorrect).toBe(1);
    expect(first.sample['6–7'].signals).toBe(2);
    expect(first.sample['8–10'].signals).toBe(1);
  });
  it('exclui resultados com data ambígua e não preenche N/D como zero',()=>{
    const games=Array.from({length:8},(_,i)=>game(String(i+1),'2026-08-'+String(i+1).padStart(2,'0'),2));
    games[6].research!.dateDiscrepancy=true;
    games[6].research!.titleDate='2026-08-08';
    games[7]=game('8','2026-08-08',2,true);
    const report=evaluateRadarBacktest(dataset(games),'Liga');
    expect(report.excludedAmbiguousDates).toBe(1);
    const goals=report.markets.find(m=>m.id==='goals-first-0.5')!;
    expect(goals.signals).toBe(0);
    expect(goals.insufficient).toBeGreaterThan(0);
  });
  it('não usa jogos de outras competições',()=>{
    const games=Array.from({length:8},(_,i)=>game(String(i+1),'2026-08-'+String(i+1).padStart(2,'0'),2));
    games[0].competition='Copa';
    const report=evaluateRadarBacktest(dataset(games),'Liga');
    expect(report.fixtures).toBe(7);
    expect(report.markets.find(m=>m.id==='goals-first-0.5')!.eligible).toBe(1);
  });
});
