import {describe,expect,it} from 'vitest';
import {summarizeRadarFollowup} from './radarFollowup';
import type {SavedRadarRecord} from './radarRecords';
import type {Settlement} from './radarProspective';

const record=(key:string):SavedRadarRecord=>({
  key,savedAt:'2026-10-21T12:00:00.000Z',
  matchAt:'2026-10-24T20:00:00',home:'Casa',away:'Fora',
  competition:'Brasileirão Série A',homeCount:5,awayCount:5,markets:[],
  venue:[
    {marketId:'goals-full-2.5',label:'Gols',line:2.5,v2:'Over',v3:'Sem sinal',projectedTotal:3,failedChecks:[]},
    {marketId:'shots-full-24.5',label:'Finalizações',line:24.5,v2:'Over',v3:'Over',projectedTotal:28,failedChecks:[]},
    {marketId:'target-full-7.5',label:'Chutes no gol',line:7.5,v2:'Over',v3:'Over',projectedTotal:9,failedChecks:[]},
  ],
});
const future: Settlement={status:'future',markets:[]};
const complete: Settlement={status:'complete',markets:[
  {marketId:'goals-full-2.5',label:'Gols',v2:'Acertou',v3:'Sem sinal',alwaysOver:'Acertou',alwaysUnder:'Errou'},
  {marketId:'shots-full-24.5',label:'Finalizações',v2:'Acertou',v3:'Acertou',alwaysOver:'Acertou',alwaysUnder:'Errou'},
  {marketId:'target-full-7.5',label:'Chutes',v2:'Errou',v3:'Errou',alwaysOver:'Errou',alwaysUnder:'Acertou'},
]};
describe('painel de acompanhamento do Radar',()=>{
  it('não apresenta acertos antes do jogo e mantém contagens por mercado',()=>{
    const {counts,statuses,byMarket}=summarizeRadarFollowup([record('a'),record('b')],[future,{status:'pending',markets:[]}]);
    expect(counts).toEqual({total:2,future:1,pending:1,scored:0,review:0});
    expect(statuses).toEqual(['future','pending']);
    expect(byMarket.map(m=>[m.v2Signals,m.v3Signals,m.v2Evaluated,m.v3Evaluated])).toEqual([[2,0,0,0],[2,2,0,0],[2,2,0,0]]);
  });
  it('contabiliza somente acertos com resultados efetivamente verificados',()=>{
    const {counts,byMarket}=summarizeRadarFollowup([record('a'),record('b')],[future,complete]);
    expect(counts.scored).toBe(1);
    expect(byMarket[0]).toMatchObject({v2Signals:2,v3Signals:0,v2Evaluated:1,v2Correct:1,v3Evaluated:0});
    expect(byMarket[1]).toMatchObject({v2Signals:2,v3Signals:2,v2Evaluated:1,v2Correct:1,v3Evaluated:1,v3Correct:1});
    expect(byMarket[2]).toMatchObject({v2Evaluated:1,v2Correct:0,v3Evaluated:1,v3Correct:0});
  });
  it('não pontua registros tardios, ambiguidades ou métricas ausentes',()=>{
    const records=[record('a'),record('b'),record('c')];
    const settlements: Settlement[]=[
      {status:'late',markets:[]},
      {status:'ambiguous',markets:[]},
      {status:'complete',markets:[{marketId:'shots-full-24.5',label:'Finalizações',v2:'N/D',v3:'N/D',alwaysOver:'N/D',alwaysUnder:'N/D'}]},
    ];
    const {counts,byMarket}=summarizeRadarFollowup(records,settlements);
    expect(counts).toEqual({total:3,future:0,pending:0,scored:0,review:3});
    expect(byMarket[1]).toMatchObject({v2Signals:2,v3Signals:2,v2Evaluated:0,v3Evaluated:0});
  });
  it('suporta base vazia e filtragem sem preencher números fictícios',()=>{
    const result=summarizeRadarFollowup([],[]);
    expect(result.counts.total).toBe(0);
    expect(result.byMarket.every(m=>m.v2Evaluated===0&&m.v3Evaluated===0)).toBe(true);
  });
});
