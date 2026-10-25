/**
 * Transactional restore of the V4 integral archive into an EMPTY V4 profile.
 *
 * The application deliberately does not offer destructive merge/overwrite.
 * The user's pre-existing FutStats, Work and Radar localStorage is never
 * replaced, even with an identical archive. Unknown localStorage keys stay.
 * Import is a one-time, explicit user action, not part of PWA updates.
 */
import {
 SAFETY_KEYS,inspectSafetyArchive,inspectSafetyStorage,
 type SafetyArchiveFile,type SafetyInspection
} from './safetyArchive';

type RestoreStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type RestorePlan={
 inspection:SafetyInspection;
 existingKeys:string[];
 importKeys:string[];
 canRestore:boolean;
 reason:string;
};

const clean=(key:string)=>SAFETY_KEYS.includes(key as typeof SAFETY_KEYS[number]);
function validateExisting(storage:Pick<Storage,'getItem'>){
 const occupied:string[]=[];
 for(const key of SAFETY_KEYS){
  const value=storage.getItem(key);
  if(value!==null)occupied.push(key);
 }
 return occupied;
}

/** No mutations. In particular, never normalize or recompute saved signals. */
export function planSafetyRestore(
 archive:unknown,storage:Pick<Storage,'getItem'>
):RestorePlan{
 const inspection=inspectSafetyArchive(archive);
 const existingKeys=validateExisting(storage);
 const source=archive as SafetyArchiveFile;
 const stores=source.stores as Record<string,string|null>;
 const importKeys=SAFETY_KEYS.filter(key=>Object.hasOwn(stores,key)&&stores[key]!==null);
 const canRestore=existingKeys.length===0&&importKeys.length>0;
 return {
  inspection,existingKeys,importKeys,canRestore,
  reason:existingKeys.length?
   'O FutStats deste navegador já contém dados. Para protegê-los, a restauração V4 é permitida somente em um perfil vazio. Nenhum registro atual será substituído.':
   importKeys.length===0?'O arquivo não contém grupos de dados para recuperar.':
   'Arquivo validado. Este navegador não contém dados nos nove grupos protegidos (o backup V4 antigo inclui oito).'
 };
}
export type RestoreResult={
 restored:number;archivedMatches:number;archivedWork:number;
 archivedForecasts:number;archivedCalendarFixtures:number;verified:boolean;
};

/**
 * Two-phase restore: (1) full validation and empty-profile check, then
 * (2) write exact archived bytes, verify each key, validate final data.
 * On error, rollback all writes in reverse order.
 *
 * A failure in rollback is exposed as a critical error; never claim safe
 * restoration after that failure. Browser localStorage cannot guarantee
 * atomic durability on unexpected OS shutdowns, so retain the archive.
 */
export function restoreSafetyArchiveEmpty(
 storage:RestoreStorage,archive:unknown
):RestoreResult{
 const plan=planSafetyRestore(archive,storage);
 if(!plan.canRestore)throw Error(plan.reason);
 const data=archive as SafetyArchiveFile;
 const stores=data.stores as Record<string,string|null>;
 const previous=new Map<string,string|null>();
 // Take a second snapshot immediately before writing: any occupied key now
 // means abort. No merge, no replacement or deletion of existing data.
 for(const key of SAFETY_KEYS){
  const value=storage.getItem(key);
  previous.set(key,value);
  if(value!==null)throw Error('Os dados locais mudaram. A restauração foi cancelada sem substituir nenhuma informação.');
 }
 const written:string[]=[];
 try{
  for(const key of plan.importKeys){
   if(!clean(key))throw Error('Grupo desconhecido no arquivo.');
   // Protect against a change while the operation is running.
   if(storage.getItem(key)!==null)
    throw Error('Outro registro foi encontrado durante a restauração. Nenhum dado anterior pode ser substituído.');
   const raw=stores[key];
   if(raw===null)continue;
   // Keep key in rollback list even if setItem mutates and then throws.
   written.push(key);
   storage.setItem(key,raw);
   if(storage.getItem(key)!==raw)
    throw Error('O armazenamento não confirmou a integridade dos dados restaurados.');
  }
  const verified=inspectSafetyStorage(storage);
  // Verify ALL protected keys, including those explicitly absent in the
  // archive. A new unexpected value must not pass as a complete restoration.
  if(!verified.ok||verified.entries.some(e=>e.status==='invalid')||
   SAFETY_KEYS.some(key=>storage.getItem(key)!==(stores[key]??null)))
   throw Error('A verificação após restauração falhou.');
  return {
   restored:written.length,
   archivedMatches:plan.inspection.matches,
   archivedWork:plan.inspection.workMatches,
   archivedForecasts:plan.inspection.workForecasts,
   archivedCalendarFixtures:plan.inspection.calendarFixtures,
   verified:true
  };
 }catch(e){
  const failures:string[]=[];
  // Roll back every key that may have been written, including the
  // current key if setItem threw after mutating it.
  for(const key of [...new Set([...written])].reverse()){
   try{
    const old=previous.get(key)??null;
    if(old===null)storage.removeItem(key);else storage.setItem(key,old);
    if(storage.getItem(key)!==old)failures.push(key);
   }catch{failures.push(key);}
  }
  if(failures.length){
   throw Error('Falha crítica na recuperação: não foi possível reverter os grupos '+failures.join(', ')+'. Não reinicie nem apague dados; preserve o arquivo de segurança.');
  }
  throw Error('Não foi possível restaurar. As alterações feitas foram revertidas; mantenha o arquivo de segurança. Motivo: '+
   (e instanceof Error?e.message:'falha de armazenamento'));
 }
}
