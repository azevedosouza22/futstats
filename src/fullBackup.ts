import {STORAGE,validData,type Data} from './model';
import {parseRadarRecords,type SavedRadarRecord} from './radarRecords';

export const RADAR_STORAGE = 'futstats-radar-previews-v1';
export const FULL_BACKUP_FORMAT = 'futstats-completo-v1';

export type ParsedBackup =
  | {kind:'full';data:Data;radarRecords:SavedRadarRecord[]}
  | {kind:'legacy';data:Data};

export function createFullBackup(data:Data,radar:unknown){
  if(!validData(data))throw Error('A base de jogos local é inválida. Nenhum backup foi gerado.');
  const radarRecords=parseRadarRecords(radar);
  return {format:FULL_BACKUP_FORMAT,version:1,exportedAt:new Date().toISOString(),data,radarRecords};
}

/** Never guess whether a file contains forecasts. Legacy game-only JSON is supported. */
export function parseFullBackup(input:unknown):ParsedBackup{
  if(validData(input))return {kind:'legacy',data:input};
  if(!input||typeof input!=='object'||Array.isArray(input))
    throw Error('Arquivo inválido. Selecione um backup completo ou um backup antigo de jogos.');
  const obj=input as Record<string,unknown>;
  if(obj.format!==FULL_BACKUP_FORMAT||obj.version!==1||!validData(obj.data))
    throw Error('Arquivo de backup desconhecido ou dados de jogos inválidos.');
  return {kind:'full',data:obj.data,radarRecords:parseRadarRecords(obj.radarRecords)};
}

type BackupStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;

/** Validate before calling this; keep the old state if either storage write fails. */
export function restoreFullBackup(storage:BackupStorage,backup:ParsedBackup){
  const previousData=storage.getItem(STORAGE);
  const previousRadar=storage.getItem(RADAR_STORAGE);
  const nextData=JSON.stringify(backup.data);
  const nextRadar=backup.kind==='full'?JSON.stringify(backup.radarRecords):null;
  let wroteData=false,wroteRadar=false;
  try{
    storage.setItem(STORAGE,nextData);wroteData=true;
    if(nextRadar!==null){storage.setItem(RADAR_STORAGE,nextRadar);wroteRadar=true;}
  }catch{
    try{
      if(wroteData){
        if(previousData===null)storage.removeItem(STORAGE);
        else storage.setItem(STORAGE,previousData);
      }
      if(wroteRadar){
        if(previousRadar===null)storage.removeItem(RADAR_STORAGE);
        else storage.setItem(RADAR_STORAGE,previousRadar);
      }
    }catch{throw Error('Falha na restauração. Verifique os dados neste navegador antes de continuar e mantenha o arquivo de backup.');}
    throw Error('Não foi possível restaurar. Os dados anteriores foram preservados.');
  }
}
