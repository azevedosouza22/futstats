import {describe,it,expect} from 'vitest';
import {STORAGE,type Data} from './model';
import {RADAR_STORAGE,parseFullBackup} from './fullBackup';
import {EUROPE_WORK_STORAGE} from './europeWorkResearch';
import {EUROPE_RESEARCH_STORAGE} from './europeLeagueResearch';
import {FPL_WORK_STORAGE} from './fplWorkStore';
import {WORK_RADAR_PROSPECTIVE_STORAGE} from './workRadarProspective';
import {AUTO_WORK_RADAR_SETTING} from './workRadarAutoFixtures';
import {EUROPE_VERIFIED_WORK_OPT_IN} from './verifiedEuropeWorkFixtures';
import {
 SAFETY_KEYS,SAFETY_ARCHIVE_FORMAT,createSafetyArchive,
 inspectSafetyStorage,inspectSafetyArchive
} from './safetyArchive';

const data:Data={teams:[],matches:[]};
const all:Record<string,string>={
 [STORAGE]:JSON.stringify(data),
 [RADAR_STORAGE]:'[]',
 [EUROPE_WORK_STORAGE]:JSON.stringify({format:EUROPE_WORK_STORAGE,entries:[]}),
 [EUROPE_RESEARCH_STORAGE]:JSON.stringify({format:EUROPE_RESEARCH_STORAGE,matches:[]}),
 [FPL_WORK_STORAGE]:JSON.stringify({format:FPL_WORK_STORAGE,entries:[]}),
 [WORK_RADAR_PROSPECTIVE_STORAGE]:'[]',
 [AUTO_WORK_RADAR_SETTING]:'enabled',
 [EUROPE_VERIFIED_WORK_OPT_IN]:'enabled'
};
const disk=(values:Record<string,string|null>)=>{
 let reads=0;
 return {
  getItem:(key:string)=>{reads++;return values[key]??null;},
  reads:()=>reads
 };
};
describe('Backup integral FutStats V4 — apenas leitura',()=>{
 it('agrupa as nove bases, incluindo agenda quando presente sem sobrescrever e valida a própria cópia',()=>{
  const source=disk(all);
  const before=JSON.stringify(all);
  const backup=createSafetyArchive(source,new Date('2026-10-24T12:00:00Z'));
  expect(backup.format).toBe(SAFETY_ARCHIVE_FORMAT);
  expect(backup.version).toBe(2);
  expect(backup.exportedAt).toBe('2026-10-24T12:00:00.000Z');
  expect(Object.keys(backup.stores)).toHaveLength(9);
  for(const key of SAFETY_KEYS)expect(backup.stores[key]).toBe(all[key]??null);
  expect(JSON.stringify(all)).toBe(before);
  expect(source.reads()).toBeGreaterThan(0);
  const roundTrip=JSON.parse(JSON.stringify(backup)) as unknown;
  const inspection=inspectSafetyArchive(roundTrip);
  expect(inspection.ok).toBe(true);
  expect(inspection.missing).toBe(1); // CSV local ausente nesta amostra antiga
  expect(inspection.invalid).toBe(0);
  expect(inspection.workMatches).toBe(0);
  expect(inspection.workForecasts).toBe(0);
 });
 it('marca fontes não encontradas como ausentes, sem inventar 292 jogos',()=>{
  const report=inspectSafetyStorage(disk({[STORAGE]:JSON.stringify(data)}));
  expect(report.ok).toBe(true);
  expect(report.present).toBe(1);
  expect(report.missing).toBe(8);
  expect(report.matches).toBe(0);
  expect(report.workMatches).toBe(0);
  const backup=createSafetyArchive(disk({[STORAGE]:JSON.stringify(data)}));
  expect(backup.stores[EUROPE_WORK_STORAGE]).toBeNull();
  expect(backup.stores[WORK_RADAR_PROSPECTIVE_STORAGE]).toBeNull();
 });
 it('rejeita corrupção, formatos desconhecidos e arquivo incompleto',()=>{
  const values={...all,[RADAR_STORAGE]:'not json'};
  const report=inspectSafetyStorage(disk(values));
  expect(report.ok).toBe(false);
  expect(report.invalid).toBe(1);
  expect(()=>createSafetyArchive(disk(values))).toThrow('inconsistente');
  const backup=createSafetyArchive(disk(all));
  expect(()=>inspectSafetyArchive({...backup,version:1})).toThrow();
  expect(()=>inspectSafetyArchive({...backup,stores:{[STORAGE]:'{}'}})).toThrow();
  expect(()=>inspectSafetyArchive({...backup,stores:{
   ...backup.stores,[FPL_WORK_STORAGE]:'not json'
  }})).toThrow();
 });
 it('não apresenta a cópia V4 como backup restaurável pelo sistema antigo',()=>{
  const backup=createSafetyArchive(disk(all));
  expect(()=>parseFullBackup(backup)).toThrow();
  expect(backup.stores[STORAGE]).toBe(JSON.stringify(data));
  expect(backup.stores[WORK_RADAR_PROSPECTIVE_STORAGE]).toBe('[]');
 });
});
