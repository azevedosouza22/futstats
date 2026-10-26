import {describe,it,expect} from 'vitest';
import {empty,type Data,type Match} from './model';
import {radarUpcoming} from './radar';
import {duplicateRadarFixtureIds,recentRadarMatches,radarSelectedDuplicateCount} from './radarFixtureUniqueness';
import {leagueNumericContext} from './radarNumericContext';
import {predictVenueV2,venueV2Markets} from './radarVenueV2';
import {predictVenueV3} from './radarVenueV3';
import {compareRadarLines} from './radarLineExplorer';
import {radarPeriodCoverage} from './radarPeriodCoverage';

const competition='Liga de teste 2026/27';
const fixture={home:'a',away:'b',competition,date:'2026-10-25'};
const sample=(id:string,date:string,home:string,away:string):Match=>({
 id,date,home,away,competition,
 first:[{...empty(),goals:1,shots:10,target:4,corners:3},
        {...empty(),goals:0,shots:3,target:1,corners:2}],
 second:[{...empty(),goals:0,shots:7,target:3,corners:2},
         {...empty(),goals:0,shots:3,target:1,corners:2}]
});
const data=(...matches:Match[]):Data=>({teams:[],matches});
const market=venueV2Markets.find(m=>m.id==='shots-full-24.5')!;
describe('Etapa 67 — dois IDs diferentes para o MESMO confronto não contam duas vezes',()=>{
 it('quarentena dos dois IDs da mesma liga/data/mandante/visitante, sem escolher original',()=>{
  const one=sample('orig-001','2026-10-20','a','x');
  const two={...one,id:'csv-002',research:{
    provider:'work-csv' as const,source:'Flashscore' as const,sourceId:'csv-002',
    sourceUrl:'https://www.flashscore.com.br/jogo/?mid=csv-002',
    importedAt:'2026-10-24T12:00:00Z',dateDiscrepancy:false,
    full:[{...empty(),goals:1,shots:17,target:7,corners:5},
          {...empty(),goals:0,shots:6,target:2,corners:4}] as [ReturnType<typeof empty>,ReturnType<typeof empty>]
  }};
  const orig=JSON.stringify([one,two]);
  const d=data(one,two);
  expect([...duplicateRadarFixtureIds(d.matches,competition,fixture.date)].sort())
   .toEqual(['csv-002','orig-001']);
  expect(recentRadarMatches(d,'a',5,fixture)).toHaveLength(0);
  expect(radarSelectedDuplicateCount(d,'a',5,fixture)).toBe(2);
  const r=radarUpcoming(d,fixture);
  expect(r).toMatchObject({excludedDuplicateFixtureRows:2,
   distinctHistoryCount:0,homeHistory:[],awayHistory:[]});
  expect(r.markets.find(x=>x.id==='shots-full-24.5'))
   .toMatchObject({observed:0,historicalMean:null});
  expect(leagueNumericContext(d,competition,fixture.date)
   .find(x=>x.id==='shots-full-24.5')).toMatchObject({observed:0,mean:null});
  expect(JSON.stringify([one,two])).toBe(orig);
 });
 it('filtra DEPOIS do corte dos cinco, sem substituir pelas partidas mais antigas',()=>{
  const home=Array.from({length:6},(_,i)=>sample('h'+i,
   '2026-10-'+String(10+i).padStart(2,'0'),'a','x'+i));
  const copy={...home[5],id:'copy-15'};
  const d=data(...home,copy);
  // The last 5 selected are the two Oct15 entries and Oct14/13/12;
  // both Oct15 entries are quarantined, even though Oct11 exists.
  expect(recentRadarMatches(d,'a',5,fixture).map(m=>m.id)).toEqual(['h4','h3','h2']);
  const r=radarUpcoming(d,fixture);
  expect(r).toMatchObject({excludedDuplicateFixtureRows:2,
   homeHistory:[{id:'h4'},{id:'h3'},{id:'h2'}]});
  expect(r.markets.find(x=>x.id==='shots-full-24.5')).toMatchObject({observed:3});
 });
 it('não junta outras temporadas, mandos invertidos ou duas partidas em dias distintos',()=>{
  const one=sample('original','2026-10-20','a','x');
  const reverse=sample('reverse','2026-10-20','x','a');
  const nextDay=sample('nextday','2026-10-21','a','x');
  const otherSeason={...one,id:'other-season',competition:'Liga de teste 2025/26'};
  const d=data(one,reverse,nextDay,otherSeason);
  expect(duplicateRadarFixtureIds(d.matches,competition,fixture.date).size).toBe(0);
  expect(recentRadarMatches(d,'a',5,fixture).map(m=>m.id))
   .toEqual(['nextday','original','reverse']);
 });
 it('V2/V3 deixam de emitir sinais quando duplicatas falseavam mínimo por mando',()=>{
  const home=Array.from({length:2},(_,i)=>sample('home-'+i,
   '2026-10-0'+(i+1),'a','x'+i));
  const away=Array.from({length:4},(_,i)=>sample('away-'+i,
   '2026-10-0'+(i+1),'y'+i,'b'));
  const extra=sample('home-reported','2026-10-10','a','z');
  const copy={...extra,id:'same-match-different-id'};
  const d=data(...home,...away,extra,copy);
  const base=predictVenueV2(d,fixture,market),v3=predictVenueV3(d,fixture,market);
  expect(base).toMatchObject({decision:'Sem sinal',projectedTotal:null,
   homeAtHomeValid:2,awayAtAwayValid:4,reason:'insufficient_venue_history'});
  expect(v3).toMatchObject({decision:'Sem sinal',reason:'insufficient_venue_history',
   homeCount:2,awayCount:4});
  expect(radarPeriodCoverage(d,fixture).distinct).toBe(6);
  expect(compareRadarLines(d,fixture).find(x=>x.metric==='shots')!.observed).toBe(6);
 });
 it('exclusão segue só a liga e corte FUTURO, sem remodelar dados originais',()=>{
  const existing=sample('one','2026-10-20','a','b');
  const after={...existing,id:'another',date:'2026-10-26'};
  const d=data(existing,after);
  expect(duplicateRadarFixtureIds(d.matches,competition,fixture.date).size).toBe(0);
  expect(recentRadarMatches(d,'a',5,fixture)).toHaveLength(1);
 });
 it('mesmo ID local repetido é responsabilidade do validador global, sem aumentar falso conflito aqui',()=>{
  const one=sample('one','2026-10-20','a','b');
  const d=data(one,{...one});
  expect(duplicateRadarFixtureIds(d.matches,competition,fixture.date).size).toBe(0);
 });
});
