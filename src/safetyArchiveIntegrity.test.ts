import {describe,it,expect} from 'vitest';
import {STORAGE,validData,type Data,type Stats} from './model';
import {RADAR_STORAGE} from './fullBackup';
import {EUROPE_WORK_STORAGE} from './europeWorkResearch';
import {EUROPE_RESEARCH_STORAGE} from './europeLeagueResearch';
import {FPL_WORK_STORAGE} from './fplWorkStore';
import {WORK_RADAR_PROSPECTIVE_STORAGE} from './workRadarProspective';
import {AUTO_WORK_RADAR_SETTING} from './workRadarAutoFixtures';
import {EUROPE_VERIFIED_WORK_OPT_IN} from './verifiedEuropeWorkFixtures';
import {venueV2Markets} from './radarVenueV2';
import {
 SAFETY_KEYS,createSafetyArchive,inspectSafetyArchive,inspectSafetyStorage
} from './safetyArchive';
import {planSafetyRestore,restoreSafetyArchiveEmpty} from './safetyRestore';

const stats=(goals:number):Stats=>({
 goals,shots:8,target:2,corners:3,yellow:0,red:0
});
/** Synthetic stress fixtures only, never actual football research. */
const history:Data={
 teams:[{id:'h',name:'Casa',color:'#113355'},{id:'a',name:'Visitante',color:'#334466'}],
 matches:Array.from({length:659},(_,i)=>({
  id:'synthetic-history-'+(i+1),home:'h',away:'a',
  date:'2026-01-10',competition:'Campeonato sintético — SOMENTE TESTE',
  first:[stats(1),stats(0)] as [Stats,Stats],
  second:[stats(0),stats(1)] as [Stats,Stats]
 }))
};
const originalRadar=[{
 key:'synthetic-radar-1',savedAt:'2026-10-24T12:00:00Z',
 matchAt:'2026-10-28T18:30',competition:'Campeonato sintético — SOMENTE TESTE',
 home:'Casa',away:'Visitante',homeCount:5,awayCount:5,
 markets:[{id:'goals-full-2.5',label:'Gols',line:2.5,
  historyRate:0.6,observed:5,overs:3,historicalMean:2.8}],
 leagueContext:[{id:'goals-full-2.5',mean:2.4,observed:9}],
 lineExploration:[{metric:'corners',label:'Escanteios',observed:5,
  historicalMean:7,lines:[{line:8.5,overs:3}]}]
}];
const pair=(a:number,b:number)=>[a,b];
const first={goals:pair(1,0),shots:pair(5,4),target:pair(2,1),corners:pair(3,2)};
const second={goals:pair(0,1),shots:pair(5,6),target:pair(1,2),corners:pair(2,3)};
const full={goals:pair(1,1),shots:pair(10,10),target:pair(3,3),corners:pair(5,5)};
const workEurope={format:EUROPE_WORK_STORAGE,entries:[{
 europeId:'synthetic-work-one',sourceId:'synthetic-work-001',
 sourceUrl:'https://www.flashscore.com.br/?mid=synthetic-work-001',
 first,second,full
}]};
const frozenWork=[{
 id:'la-liga|2026-10-28|casa|visitante',league:'la-liga',
 home:'Casa',away:'Visitante',matchAt:'2026-10-28T18:30',
 savedAt:'2026-10-24T12:00:00Z',sourceCount:6,
 model:'venue-v2-v3-fixed-2026-10-23',
 markets:venueV2Markets.map(m=>({
  marketId:m.id,label:m.label,line:m.line,v2:'Sem sinal',v3:'Sem sinal',
  baseline:null,historicalObserved:4,projectedTotal:null,failedChecks:[]
 }))
}];
const contents:Record<string,string>={
 [STORAGE]:JSON.stringify(history),
 [RADAR_STORAGE]:JSON.stringify(originalRadar),
 [EUROPE_WORK_STORAGE]:JSON.stringify(workEurope),
 [EUROPE_RESEARCH_STORAGE]:JSON.stringify({format:EUROPE_RESEARCH_STORAGE,matches:[]}),
 [FPL_WORK_STORAGE]:JSON.stringify({format:FPL_WORK_STORAGE,entries:[]}),
 [WORK_RADAR_PROSPECTIVE_STORAGE]:JSON.stringify(frozenWork),
 [AUTO_WORK_RADAR_SETTING]:'enabled',
 [EUROPE_VERIFIED_WORK_OPT_IN]:'enabled'
};
function storage(initial:Record<string,string>={},failAt?:{
 key:string;writeFirst?:boolean;
}){
 const values=new Map(Object.entries(initial));let writes=0;
 return {
  getItem:(key:string)=>values.get(key)??null,
  setItem:(key:string,value:string)=>{
   writes++;
   if(key===failAt?.key){
    if(failAt?.writeFirst)values.set(key,value);
    throw Error('Test injected quota error');
   }
   values.set(key,value);
  },
  removeItem:(key:string)=>{values.delete(key);},
  entries:()=>Object.fromEntries(values),
  writes:()=>writes
 };
}
describe('Arquivo V4 — integridade e retomada sem perda',()=>{
 it('preserva bytes de 659 registros sintéticos, Radar V2/V3 congelado e Work separado',()=>{
  expect(validData(history)).toBe(true);
  const src=storage(contents);
  const untouched=JSON.stringify(src.entries());
  const archive=createSafetyArchive(src,new Date('2026-10-25T12:00:00Z'));
  expect(inspectSafetyArchive(archive)).toMatchObject({
   ok:true,invalid:0,matches:659,workMatches:1,workForecasts:1
  });
  expect(JSON.stringify(src.entries())).toBe(untouched);
  const destination=storage({'non-futstats':'untouched'});
  const plan=planSafetyRestore(archive,destination);
  expect(plan.canRestore).toBe(true);
  const result=restoreSafetyArchiveEmpty(destination,archive);
  expect(result).toMatchObject({
   verified:true,restored:8,archivedMatches:659,archivedWork:1,archivedForecasts:1,archivedCalendarFixtures:0
  });
  for(const key of SAFETY_KEYS)expect(destination.getItem(key)).toBe(contents[key]);
  expect(destination.getItem('non-futstats')).toBe('untouched');
  expect(JSON.parse(destination.getItem(STORAGE)!)?.matches).toHaveLength(659);
  expect(JSON.parse(destination.getItem(RADAR_STORAGE)!)).toEqual(originalRadar);
  expect(JSON.parse(destination.getItem(WORK_RADAR_PROSPECTIVE_STORAGE)!)).toEqual(frozenWork);
  expect(destination.writes()).toBe(8);
 });
 it('recusa backup se a fonte mudar entre validação e captura, sem realizar gravações',()=>{
  const safe=storage(contents);
  const changed=storage({...contents});
  let hits=0;
  const changing={
   getItem:(key:string)=>{
    const read=changed.getItem(key);
    if(key===RADAR_STORAGE&&++hits===2){
     return '[{"corrompido":true}]';
    }
    return read;
   }
  };
  // Snapshot itself is the validated first pass; mismatch is detected.
  expect(()=>createSafetyArchive(changing)).toThrow('mudaram durante o backup');
  expect(changed.entries()).toEqual(safe.entries());
  expect(changed.writes()).toBe(0);
 });
 it('rejeita dados Radar inválidos sem perder a base existente',()=>{
  const bad={...contents,[RADAR_STORAGE]:'[{"key":"duplicated"}]'};
  const existing=storage(contents);
  const before=existing.entries();
  expect(()=>createSafetyArchive(storage(bad))).toThrow('inconsistente');
  expect(existing.entries()).toEqual(before);
 });
 it('reverte integralmente mesmo se a escrita falhar depois de alterar a chave',()=>{
  const src=storage(contents);
  const archive=createSafetyArchive(src);
  const dest=storage({'outro-app':'keep'},{
   key:FPL_WORK_STORAGE,writeFirst:true
  });
  const before=dest.entries();
  expect(()=>restoreSafetyArchiveEmpty(dest,archive)).toThrow('revertidas');
  expect(dest.entries()).toEqual(before);
  expect(dest.getItem('outro-app')).toBe('keep');
 });
 it('bloqueia restauração se já existir qualquer dado protegido, sem sobrescrever previsão',()=>{
  const original=storage({
   [RADAR_STORAGE]:contents[RADAR_STORAGE],
   [WORK_RADAR_PROSPECTIVE_STORAGE]:contents[WORK_RADAR_PROSPECTIVE_STORAGE]
  });
  const before=original.entries();
  const archive=createSafetyArchive(storage(contents));
  expect(planSafetyRestore(archive,original).canRestore).toBe(false);
  expect(()=>restoreSafetyArchiveEmpty(original,archive)).toThrow();
  expect(original.entries()).toEqual(before);
  expect(original.writes()).toBe(0);
 });
 it('mantém grupos ausentes como ausentes; nunca inventa partidas ou previsões',()=>{
  const archive=createSafetyArchive(storage({[STORAGE]:contents[STORAGE]}));
  expect(archive.stores[RADAR_STORAGE]).toBeNull();
  expect(archive.stores[EUROPE_WORK_STORAGE]).toBeNull();
  const dest=storage();
  restoreSafetyArchiveEmpty(dest,archive);
  expect(dest.getItem(RADAR_STORAGE)).toBeNull();
  expect(dest.getItem(EUROPE_WORK_STORAGE)).toBeNull();
  expect(inspectSafetyStorage(dest).matches).toBe(659);
  expect(inspectSafetyStorage(dest).workMatches).toBe(0);
 });
});
