import {describe,expect,it} from 'vitest';
import type {DailyGoodFixture} from './dailyGoodSignals';
import type {SavedRadarRecord} from './radarRecords';
import {savedGoodPickMatch} from './dailyGoodSavedMatch';

const fixture:DailyGoodFixture={
 fixture:{id:'test-1',date:'2026-10-25',time:'20:00',
  competition:'Liga X 2026/27',home:'Casa',away:'Fora',
  sourceUrl:'https://www.cbf.com.br/futebol-brasileiro/jogos/123'},
 verifiedAt:'2026-10-25',
 signals:[{id:'goals-full-2.5',label:'Gols',line:2.5,direction:'Under',
  projection:1.4,historicalMean:1.9,historicalSample:10,
  leagueSample:20,relativeDistance:0.44}]
};
const saved=():SavedRadarRecord=>({
 key:'frozen-01',savedAt:'2026-10-25T15:00:00.000Z',
 matchAt:'2026-10-25T20:00:00',competition:'Liga X 2026/27',
 home:'Casa',away:'Fora',homeCount:5,awayCount:5,markets:[],
 goodPicks:{verifiedAt:fixture.verifiedAt,
  sourceUrl:fixture.fixture.sourceUrl,
  signals:fixture.signals.map(s=>({...s}))}
});
describe('Etapa 47 — recuperar As Boas do Dia realmente salvas',()=>{
 it('identifica exatamente a seleção registrada antes do jogo, sem mutar registros',()=>{
  const s=saved(),before=JSON.stringify(s);
  expect(savedGoodPickMatch(fixture,[s])).toEqual({
   state:'from_good_picks',recordKey:'frozen-01'
  });
  expect(JSON.stringify(s)).toBe(before);
 });
 it('não atribui previsão antiga/manual do Radar à lista As Boas',()=>{
  expect(savedGoodPickMatch(fixture,[{...saved(),goodPicks:undefined}])).toEqual({
   state:'from_radar',recordKey:'frozen-01'
  });
  expect(savedGoodPickMatch(fixture,[])).toEqual({
   state:'not_saved',recordKey:null
  });
 });
 it('exige origem e sinais congelados, hora e verificação íntegra',()=>{
  const s=saved();
  const other={...s,goodPicks:{...s.goodPicks!,sourceUrl:'https://www.cbf.com.br/outro'}};
  const modified={...s,goodPicks:{...s.goodPicks!,
   signals:[{...fixture.signals[0],projection:99}]}};
  const late={...s,savedAt:'2026-10-26T02:00:00.000Z'};
  const stale={...s,goodPicks:{...s.goodPicks!,verifiedAt:'2026-10-22'}};
  const schedule={...s,matchAt:'2026-10-25T21:30:00'};
  for(const r of [other,modified,late,stale,schedule]){
   expect(savedGoodPickMatch(fixture,[r])).toEqual({
    state:'needs_review',recordKey:'frozen-01'
   });
  }
 });
 it('mesmo confronto com nomes normalizados, sem confundir partidas e campeonatos',()=>{
  const r={...saved(),home:'Cása',away:'FORA'};
  expect(savedGoodPickMatch(fixture,[r]).state).toBe('from_good_picks');
  expect(savedGoodPickMatch(fixture,[{...saved(),competition:'Liga X 2025/26'}]).state)
   .toBe('not_saved');
  expect(savedGoodPickMatch(fixture,[{...saved(),home:'Outro'}]).state).toBe('not_saved');
 });
 it('recupera nomes de clubes com alias EXPLÍCITO da mesma liga, sem adivinhar',()=>{
  const official={
   ...fixture,
   fixture:{...fixture.fixture,competition:'La Liga espanhola 2026/27',
    home:'FC Barcelona',away:'Real Madrid CF'}
  };
  const stored={...saved(),competition:'La Liga espanhola 2026/27',
   home:'Barcelona',away:'Real Madrid'};
  expect(savedGoodPickMatch(official,[stored])).toEqual({
   state:'from_good_picks',recordKey:'frozen-01'
  });
  expect(savedGoodPickMatch({...official,fixture:{...official.fixture,
   competition:'Liga desconhecida'}},[stored]).state).toBe('not_saved');
 });
 it('não escolhe arbitrariamente dois registros do mesmo confronto ou ID duplicado',()=>{
  const a=saved(),b={...saved(),key:'outro-registro'};
  expect(savedGoodPickMatch(fixture,[a,b])).toEqual({
   state:'duplicates',recordKey:null
  });
  const unrelated={...saved(),home:'Outro time'};
  expect(savedGoodPickMatch(fixture,[a,unrelated]).state).toBe('duplicates');
 });
});
