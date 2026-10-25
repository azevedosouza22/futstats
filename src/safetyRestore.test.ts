import {describe,it,expect} from 'vitest';
import {STORAGE,type Data} from './model';
import {RADAR_STORAGE} from './fullBackup';
import {EUROPE_WORK_STORAGE} from './europeWorkResearch';
import {EUROPE_RESEARCH_STORAGE} from './europeLeagueResearch';
import {FPL_WORK_STORAGE} from './fplWorkStore';
import {WORK_RADAR_PROSPECTIVE_STORAGE} from './workRadarProspective';
import {AUTO_WORK_RADAR_SETTING} from './workRadarAutoFixtures';
import {EUROPE_VERIFIED_WORK_OPT_IN} from './verifiedEuropeWorkFixtures';
import {
 SAFETY_KEYS,createSafetyArchive,inspectSafetyStorage
} from './safetyArchive';
import {planSafetyRestore,restoreSafetyArchiveEmpty} from './safetyRestore';

const data:Data={teams:[],matches:[]};
const samples:Record<string,string>={
 [STORAGE]:JSON.stringify(data),
 [RADAR_STORAGE]:'[]',
 [EUROPE_RESEARCH_STORAGE]:JSON.stringify({format:EUROPE_RESEARCH_STORAGE,matches:[]}),
 [EUROPE_WORK_STORAGE]:JSON.stringify({format:EUROPE_WORK_STORAGE,entries:[]}),
 [FPL_WORK_STORAGE]:JSON.stringify({format:FPL_WORK_STORAGE,entries:[]}),
 [WORK_RADAR_PROSPECTIVE_STORAGE]:'[]',
 [AUTO_WORK_RADAR_SETTING]:'enabled',
 [EUROPE_VERIFIED_WORK_OPT_IN]:'enabled'
};
function makeStore(initial:Record<string,string>={},failure?:{
 key:string;writeThenThrow?:boolean;failRollback?:boolean;
}){
 const map=new Map(Object.entries(initial));
 let writes=0,deletes=0;
 return {
  getItem:(key:string)=>map.get(key)??null,
  setItem:(key:string,value:string)=>{
   writes++;
   if(failure?.key===key){
    if(failure.writeThenThrow)map.set(key,value);
    throw Error('QuotaExceededError');
   }
   map.set(key,value);
  },
  removeItem:(key:string)=>{
   deletes++;
   if(failure?.failRollback)throw Error('RollbackBlocked');
   map.delete(key);
  },
  entries:()=>Object.fromEntries(map),
  writes:()=>writes,deletes:()=>deletes
 };
}
const src=makeStore(samples);
const archive=createSafetyArchive(src,new Date('2026-10-24T12:00:00Z'));

describe('Recuperação transacional V4 — somente perfil vazio',()=>{
 it('recupera nove grupos em perfil vazio e verifica conteúdo exato',()=>{
  const dest=makeStore({'unrelated:personal':'preserve'});
  const before=dest.entries();
  const plan=planSafetyRestore(archive,dest);
  expect(plan.canRestore).toBe(true);
  expect(plan.inspection.ok).toBe(true);
  expect(plan.inspection.workMatches).toBe(0);
  expect(dest.entries()).toEqual(before);
  const result=restoreSafetyArchiveEmpty(dest,archive);
  expect(result).toEqual({
   restored:8,archivedMatches:0,archivedWork:0,
   archivedForecasts:0,archivedCalendarFixtures:0,verified:true
  });
  expect(dest.getItem('unrelated:personal')).toBe('preserve');
  for(const key of SAFETY_KEYS)expect(dest.getItem(key)).toBe(samples[key]);
  expect(inspectSafetyStorage(dest).ok).toBe(true);
 });
 it('recusa sobrescrever mesmo uma única chave FutStats existente sem escrever nada',()=>{
  const existing=makeStore({[STORAGE]:JSON.stringify(data),'unrelated':'safe'});
  const before=existing.entries();
  const plan=planSafetyRestore(archive,existing);
  expect(plan.canRestore).toBe(false);
  expect(plan.existingKeys).toEqual([STORAGE]);
  expect(()=>restoreSafetyArchiveEmpty(existing,archive)).toThrow('somente em um perfil vazio');
  expect(existing.entries()).toEqual(before);
  expect(existing.writes()).toBe(0);
 });
 it('reverte tudo se falhar após gravar alguns grupos',()=>{
  const fail=makeStore({'foreign':'never touch'},{key:FPL_WORK_STORAGE});
  const before=fail.entries();
  expect(()=>restoreSafetyArchiveEmpty(fail,archive)).toThrow('revertidas');
  expect(fail.entries()).toEqual(before);
  expect(fail.writes()).toBeGreaterThan(0);
  expect(fail.deletes()).toBeGreaterThan(0);
 });
 it('inclui chave cujo setItem grava e em seguida lança exceção no rollback',()=>{
  const fail=makeStore({}, {key:EUROPE_RESEARCH_STORAGE,writeThenThrow:true});
  const before=fail.entries();
  expect(()=>restoreSafetyArchiveEmpty(fail,archive)).toThrow('revertidas');
  expect(fail.entries()).toEqual(before);
 });
 it('quando falhar rollback, nunca afirma que dados foram preservados',()=>{
  const broken=makeStore({}, {key:EUROPE_RESEARCH_STORAGE,writeThenThrow:true,failRollback:true});
  expect(()=>restoreSafetyArchiveEmpty(broken,archive)).toThrow('Falha crítica');
 });
 it('não escreve chave ausente no arquivo nem apaga chaves desconhecidas',()=>{
  const partial=createSafetyArchive(makeStore({[STORAGE]:JSON.stringify(data)}));
  const disk=makeStore({'outsider':'keep'});
  const restored=restoreSafetyArchiveEmpty(disk,partial);
  expect(restored.restored).toBe(1);
  expect(disk.getItem(STORAGE)).toBe(JSON.stringify(data));
  expect(disk.getItem(RADAR_STORAGE)).toBeNull();
  expect(disk.getItem('outsider')).toBe('keep');
 });
 it('recusa arquivo adulterado e grupo inválido sem modificar o destino',()=>{
  const invalid={...archive,stores:{...archive.stores,[WORK_RADAR_PROSPECTIVE_STORAGE]:'wrong'}};
  const dest=makeStore();
  expect(()=>planSafetyRestore(invalid,dest)).toThrow();
  expect(()=>restoreSafetyArchiveEmpty(dest,invalid)).toThrow();
  expect(dest.entries()).toEqual({});
  expect(dest.writes()).toBe(0);
 });
 it('se detectar outro registro entre conferência e restauração, cancela sem sobrescrever',()=>{
  const store=makeStore();
  const preview=planSafetyRestore(archive,store);
  expect(preview.canRestore).toBe(true);
  store.setItem(RADAR_STORAGE,'[]');
  expect(()=>restoreSafetyArchiveEmpty(store,archive)).toThrow('somente em um perfil vazio');
  expect(store.getItem(RADAR_STORAGE)).toBe('[]');
 });
 it('restaurar é idempotente no sentido de recusar uma segunda execução',()=>{
  const store=makeStore();
  restoreSafetyArchiveEmpty(store,archive);
  const prior=store.entries();
  expect(()=>restoreSafetyArchiveEmpty(store,archive)).toThrow('somente em um perfil vazio');
  expect(store.entries()).toEqual(prior);
 });
});
