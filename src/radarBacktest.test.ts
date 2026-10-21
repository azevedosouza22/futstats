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
  it('não cria seis partidas únicas artificialmente a partir de confrontos repetidos',()=>{
    const games=Array.from({length:9},(_,i)=>game(String(i+1),'2026-08-'+String(i+1).padStart(2,'0'),2));
    const report=evaluateRadarBacktest(dataset(games),'Liga');
    const market=report.markets.find(m=>m.id==='goals-first-0.5')!;
    expect(report.fixtures).toBe(9);
    expect(market.signals).toBe(0);
    expect(market.insufficient).toBe(9);
  });
  it('avalia um confronto somente após seis partidas independentes anteriores',()=>{
    const history:Match[]=[
      ...Array.from({length:4},(_,i)=>({...game('a'+i,'2026-08-'+String(i+1).padStart(2,'0'),2),away:'c'+i})),
      ...Array.from({length:4},(_,i)=>({...game('b'+i,'2026-08-'+String(i+1).padStart(2,'0'),2),home:'d'+i})),
    ];
    const last=game('final','2026-08-12',0);
    const report=evaluateRadarBacktest(dataset([...history,last]),'Liga');
    const result=report.markets.find(m=>m.id==='goals-first-0.5')!;
    expect(result.eligible).toBe(1);
    expect(result.signals).toBe(1);
    expect(result.correct).toBe(0);
    expect(result.incorrect).toBe(1);
    expect(result.sample['8–10'].signals).toBe(1);
    expect(result.overSignals.signals).toBe(1);
    expect(result.alwaysOverSameMatches.signals).toBe(1);
    expect(result.alwaysOverSameMatches.correct).toBe(0);
    expect(result.alwaysUnderSameMatches.correct).toBe(1);
    expect(result.alwaysUnderSameMatches.signals).toBe(result.signals);
    expect(result.holdout.baseline).toBe('Over');
    expect(result.holdout.radar.signals).toBe(1);
    expect(result.holdout.constant.signals).toBe(1);
    expect(result.holdout.constant.correct).toBe(0);
    expect(result.realFrequency.observed).toBe(9);
    expect(result.realFrequency.over).toBe(8);
    expect(result.periods.map(p=>p.radar.signals).reduce((a,b)=>a+b,0)).toBe(1);
  });
  it('exclui resultados com data ambígua e não preenche N/D como zero',()=>{
    const games=Array.from({length:8},(_,i)=>game(String(i+1),'2026-08-'+String(i+1).padStart(2,'0'),2));
    games[6].research!.dateDiscrepancy=true;
    games[6].research!.titleDate='2026-08-08';
    games[7]=game('8','2026-08-08',2,true);
    const report=evaluateRadarBacktest(dataset(games),'Liga');
    expect(report.excludedAmbiguousDates).toBe(1);
    expect(report.markets.find(m=>m.id==='goals-first-0.5')!.realFrequency.observed).toBe(7);
    const goals=report.markets.find(m=>m.id==='goals-first-0.5')!;
    expect(goals.signals).toBe(0);
    expect(goals.insufficient).toBeGreaterThan(0);
  });
  it('não usa jogos de outras competições',()=>{
    const games=Array.from({length:8},(_,i)=>game(String(i+1),'2026-08-'+String(i+1).padStart(2,'0'),2));
    games[0].competition='Copa';
    const report=evaluateRadarBacktest(dataset(games),'Liga');
    expect(report.fixtures).toBe(7);
    expect(report.markets.find(m=>m.id==='goals-first-0.5')!.eligible).toBe(0);
  });
  it('separa sinais Under e compara sempre Over nas mesmas partidas',()=>{
    const history:Match[]=[
      ...Array.from({length:4},(_,i)=>({...game('a'+i,'2026-08-'+String(i+1).padStart(2,'0'),0),away:'c'+i})),
      ...Array.from({length:4},(_,i)=>({...game('b'+i,'2026-08-'+String(i+1).padStart(2,'0'),0),home:'d'+i})),
    ];
    const last=game('final','2026-08-12',0);
    const report=evaluateRadarBacktest(dataset([...history,last]),'Liga');
    const m=report.markets.find(m=>m.id==='goals-first-0.5')!;
    expect(m.signals).toBe(1);
    expect(m.underSignals.signals).toBe(1);
    expect(m.underSignals.correct).toBe(1);
    expect(m.overSignals.signals).toBe(0);
    expect(m.alwaysOverSameMatches.correct).toBe(0);
    expect(m.alwaysUnderSameMatches.correct).toBe(1);
    expect(m.holdout.baseline).toBe('Under');
    expect(m.holdout.radar.signals).toBe(1);
    expect(m.holdout.constant.correct).toBe(1);
    expect(m.realFrequency.over).toBe(0);
    expect(m.periods.reduce((sum,p)=>sum+p.underSignals.signals,0)).toBe(1);
  });
  it('mantém todas as partidas da mesma data no mesmo período',()=>{
    const games=Array.from({length:9},(_,i)=>game(String(i+1),'2026-08-'+String(Math.floor(i/3)+1).padStart(2,'0'),0));
    const report=evaluateRadarBacktest(dataset(games),'Liga');
    const p=report.markets[0].periods;
    expect(p.map(x=>[x.start,x.end])).toEqual([
      ['2026-08-01','2026-08-01'],
      ['2026-08-02','2026-08-02'],
      ['2026-08-03','2026-08-03'],
    ]);
  });

});
