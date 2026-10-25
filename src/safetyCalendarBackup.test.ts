import {describe,it,expect} from 'vitest';
import {STORAGE,type Data} from './model';
import {RADAR_STORAGE} from './fullBackup';
import {EUROPE_WORK_STORAGE} from './europeWorkResearch';
import {CALENDAR_STORAGE,parseStoredCalendar} from './calendarStorage';
import {normalizeTeam,type ScheduledFixture} from './calendar';
import {
 SAFETY_ARCHIVE_FORMAT,SAFETY_ARCHIVE_V1_FORMAT,SAFETY_KEYS,SAFETY_V1_KEYS,
 createSafetyArchive,inspectSafetyArchive,inspectSafetyStorage
} from './safetyArchive';
import {planSafetyRestore,restoreSafetyArchiveEmpty} from './safetyRestore';

const fixture=(date:string,home:string,away:string):ScheduledFixture=>{
 const f={date,time:null,competition:'Brasileirão Série A',home,away,
  sourceUrl:'https://www.cbf.com.br/fixture?team=match'};
 return {...f,id:[date,f.competition,home,away].map(normalizeTeam).join('|')};
};
const fixtures=[
 fixture('2026-10-29','Clube Azul','Clube Verde'),
 {...fixture('2026-10-30','Clube Amarelo','Clube Laranja'),time:'18:30'}
];
const csvBytes=JSON.stringify(fixtures);
const rawHistory=JSON.stringify({teams:[],matches:[]} satisfies Data);
function memory(initial:Record<string,string>={},failKey?:string){
 const values=new Map(Object.entries(initial));let writes=0;
 return {
  getItem:(k:string)=>values.get(k)??null,
  setItem:(k:string,v:string)=>{writes++;if(k===failKey){values.set(k,v);throw Error('QuotaExceededError');}values.set(k,v);},
  removeItem:(k:string)=>{values.delete(k);},
  snapshot:()=>Object.fromEntries(values),
  writes:()=>writes
 };
}
describe('Backup V4 v2 inclui agenda CSV sem perder formato v1',()=>{
 it('salva e restaura bytes exatos dos nove grupos, com agenda e Radar intactos',()=>{
  const saved={
   [STORAGE]:rawHistory,
   [RADAR_STORAGE]:'[]',
   [EUROPE_WORK_STORAGE]:JSON.stringify({format:EUROPE_WORK_STORAGE,entries:[]}),
   [CALENDAR_STORAGE]:csvBytes
  };
  const disk=memory(saved);const before=disk.snapshot();
  const archive=createSafetyArchive(disk,new Date('2026-10-25T12:00:00Z'));
  expect(archive.format).toBe(SAFETY_ARCHIVE_FORMAT);
  expect(archive.version).toBe(2);
  expect(Object.keys(archive.stores)).toHaveLength(9);
  expect(archive.stores[CALENDAR_STORAGE]).toBe(csvBytes);
  expect(inspectSafetyArchive(archive)).toMatchObject({
   ok:true,calendarFixtures:2,matches:0,workMatches:0,invalid:0
  });
  expect(disk.snapshot()).toEqual(before);
  const dest=memory({'other-app':'preserve'});
  expect(planSafetyRestore(archive,dest).canRestore).toBe(true);
  const result=restoreSafetyArchiveEmpty(dest,archive);
  expect(result).toMatchObject({restored:4,archivedCalendarFixtures:2,verified:true});
  expect(dest.snapshot()).toEqual({...before,'other-app':'preserve'});
  expect(dest.getItem(CALENDAR_STORAGE)).toBe(csvBytes);
  expect(dest.getItem(RADAR_STORAGE)).toBe('[]');
  expect(parseStoredCalendar(dest.getItem(CALENDAR_STORAGE)!)).toEqual(fixtures);
 });
 it('lê e restaura backup antigo V4 v1 de oito grupos, sem inventar agenda',()=>{
  const current=createSafetyArchive(memory({[STORAGE]:rawHistory,[RADAR_STORAGE]:'[]',
   [CALENDAR_STORAGE]:csvBytes}));
  const legacy={
   format:SAFETY_ARCHIVE_V1_FORMAT,version:1,
   exportedAt:current.exportedAt,
   stores:Object.fromEntries(SAFETY_V1_KEYS.map(k=>[k,current.stores[k]]))
  };
  expect(Object.keys(legacy.stores)).toHaveLength(8);
  expect(inspectSafetyArchive(legacy)).toMatchObject({ok:true,calendarFixtures:0});
  const dest=memory();
  expect(planSafetyRestore(legacy,dest).canRestore).toBe(true);
  const result=restoreSafetyArchiveEmpty(dest,legacy);
  expect(result).toMatchObject({restored:2,archivedCalendarFixtures:0,verified:true});
  expect(dest.getItem(STORAGE)).toBe(rawHistory);
  expect(dest.getItem(CALENDAR_STORAGE)).toBeNull();
  expect(()=>inspectSafetyArchive({...legacy,stores:{
   ...legacy.stores,[CALENDAR_STORAGE]:csvBytes
  }})).toThrow();
 });
 it('recusa restaurar mesmo v1 em perfil que contém SOMENTE agenda CSV',()=>{
  const archive=createSafetyArchive(memory({[STORAGE]:rawHistory}));
  const legacy={format:SAFETY_ARCHIVE_V1_FORMAT,version:1,
   exportedAt:archive.exportedAt,
   stores:Object.fromEntries(SAFETY_V1_KEYS.map(k=>[k,archive.stores[k]]))};
  const dest=memory({[CALENDAR_STORAGE]:csvBytes});const before=dest.snapshot();
  const plan=planSafetyRestore(legacy,dest);
  expect(plan.canRestore).toBe(false);
  expect(plan.existingKeys).toContain(CALENDAR_STORAGE);
  expect(()=>restoreSafetyArchiveEmpty(dest,legacy)).toThrow('perfil vazio');
  expect(dest.snapshot()).toEqual(before);
  expect(dest.writes()).toBe(0);
 });
 it('mantém agenda ausente como ausente e evita inventar confrontos',()=>{
  const archive=createSafetyArchive(memory({[STORAGE]:rawHistory}));
  expect(archive.stores[CALENDAR_STORAGE]).toBeNull();
  const dest=memory();
  restoreSafetyArchiveEmpty(dest,archive);
  expect(dest.getItem(CALENDAR_STORAGE)).toBeNull();
  expect(inspectSafetyStorage(dest).calendarFixtures).toBe(0);
 });
 it('bloqueia agenda inválida: ID, duplicata, data, URL e JSON danificado',()=>{
  const mutations=[
   '{não-json',
   JSON.stringify([{...fixtures[0],id:'id-forjado'}]),
   JSON.stringify([fixtures[0],fixtures[0]]),
   JSON.stringify([{...fixtures[0],date:'2026-02-30'}]),
   JSON.stringify([{...fixtures[0],sourceUrl:'http://untrusted.example.net'}]),
   JSON.stringify([{...fixtures[0],time:'25:99'}]),
   JSON.stringify([{...fixtures[0],home:'Clube Verde'}])
  ];
  for(const payload of mutations){
   expect(()=>parseStoredCalendar(payload)).toThrow();
   expect(()=>createSafetyArchive(memory({[CALENDAR_STORAGE]:payload}))).toThrow('inconsistente');
  }
 });
 it('rejeita adulteração do grupo da agenda no arquivo sem tocar no destino',()=>{
  const archive=createSafetyArchive(memory({[STORAGE]:rawHistory,[CALENDAR_STORAGE]:csvBytes}));
  const bad={...archive,stores:{...archive.stores,[CALENDAR_STORAGE]:'invalid'}};
  const dest=memory({'other-app':'keep'});
  expect(()=>planSafetyRestore(bad,dest)).toThrow();
  expect(dest.snapshot()).toEqual({'other-app':'keep'});
  expect(dest.writes()).toBe(0);
 });
 it('detecta alteração da agenda entre captura e conferência final do backup',()=>{
  let reads=0;const disk=memory({[STORAGE]:rawHistory,[CALENDAR_STORAGE]:csvBytes});
  expect(()=>createSafetyArchive({
   getItem:(key:string)=>{
    const original=disk.getItem(key);
    if(key===CALENDAR_STORAGE&&++reads===2)return JSON.stringify([]);
    return original;
   }
  })).toThrow('mudaram durante o backup');
  expect(disk.getItem(CALENDAR_STORAGE)).toBe(csvBytes);
 });
 it('em erro de gravação da nona chave, reverte todos os grupos sem perda',()=>{
  const archive=createSafetyArchive(memory({[STORAGE]:rawHistory,[RADAR_STORAGE]:'[]',
   [CALENDAR_STORAGE]:csvBytes}));
  const dest=memory({'foreign':'untouched'},CALENDAR_STORAGE);
  expect(()=>restoreSafetyArchiveEmpty(dest,archive)).toThrow('revertidas');
  expect(dest.snapshot()).toEqual({'foreign':'untouched'});
 });
 it('aceita agenda CSV local vazia sem criar novas partidas',()=>{
  expect(parseStoredCalendar('[]')).toEqual([]);
  const archive=createSafetyArchive(memory({[CALENDAR_STORAGE]:'[]'}));
  expect(inspectSafetyArchive(archive).calendarFixtures).toBe(0);
  const dest=memory();
  expect(restoreSafetyArchiveEmpty(dest,archive).restored).toBe(1);
  expect(dest.getItem(CALENDAR_STORAGE)).toBe('[]');
 });
});
