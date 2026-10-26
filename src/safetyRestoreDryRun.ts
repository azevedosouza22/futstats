/**
 * Etapa 54: non-destructive dry-run of FULL V4 export -> JSON roundtrip ->
 * empty-profile restoration. All restore writes happen on an in-memory Map.
 * The user's localStorage is passed only to createSafetyArchive (read-only).
 *
 * This tests application-level restore logic, not Android/OS disk durability,
 * independent evidence, or the actual ability to save a downloaded backup.
 */
import {SAFETY_KEYS,createSafetyArchive,inspectSafetyArchive,type SafetyInspection} from './safetyArchive';
import {restoreSafetyArchiveEmpty} from './safetyRestore';

export type DryRunResult={
 status:'PASSOU';
 groups:number;restored:number;
 matches:number;workMatches:number;workForecasts:number;
 calendarFixtures:number;radarForecasts:number;
 originalUnchanged:true;simulatedOnly:true;
};

export function dryRunV4Restore(source:Pick<Storage,'getItem'>,now=new Date()):DryRunResult{
 // Builds and validates a stable byte snapshot without touching the source.
 const archive=createSafetyArchive(source,now);
 const encoded=JSON.stringify(archive);
 const decoded=JSON.parse(encoded) as unknown;
 const before:SafetyInspection=inspectSafetyArchive(decoded);
 if(!before.ok||before.invalid>0)
  throw Error('Autoteste cancelado: existem grupos locais inválidos.');
 // Destination has NO references to real localStorage; it is a private Map.
 const isolated=new Map<string,string>();
 const virtualStore={
  getItem:(key:string)=>isolated.get(key)??null,
  setItem:(key:string,value:string)=>{isolated.set(key,value);},
  removeItem:(key:string)=>{isolated.delete(key);}
 };
 const restored=restoreSafetyArchiveEmpty(virtualStore,decoded);
 if(!restored.verified)throw Error('Restauração simulada não foi confirmada.');
 for(const key of SAFETY_KEYS){
  if(virtualStore.getItem(key)!==archive.stores[key])
   throw Error('Falha de igualdade do grupo '+key+'. Nenhum dado real foi modificado.');
  // A source change during this test is not an automatic mutation by this tool.
  if(source.getItem(key)!==archive.stores[key])
   throw Error('Dados do navegador mudaram durante o autoteste. Repita a conferência.');
 }
 if(isolated.size!==restored.restored)
  throw Error('Quantidade de grupos simulados não confere.');
 return {status:'PASSOU',groups:SAFETY_KEYS.length,restored:restored.restored,
  matches:before.matches,workMatches:before.workMatches,
  workForecasts:before.workForecasts,calendarFixtures:before.calendarFixtures,
  radarForecasts:before.entries.find(e=>e.label==='Previsões originais V2/V3')?.count??0,
  originalUnchanged:true,simulatedOnly:true};
}
