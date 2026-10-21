import {describe,it,expect} from 'vitest';
import {STORAGE,type Data} from './model';
import {createFullBackup,parseFullBackup,restoreFullBackup,RADAR_STORAGE} from './fullBackup';
import type {SavedRadarRecord} from './radarRecords';

const data:Data={teams:[],matches:[]};
const record:SavedRadarRecord={
  key:'test-record',savedAt:'2026-10-21T15:00:00.000Z',
  matchAt:'2026-10-24T20:00:00',competition:'Brasileirão Série A',
  home:'Palmeiras',away:'Bahia',homeCount:5,awayCount:5,markets:[],
};
function storage(initial:Record<string,string>={},failKey?:string){
 const values=new Map(Object.entries(initial));
 return {
   getItem:(key:string)=>values.get(key)??null,
   setItem:(key:string,value:string)=>{if(key===failKey)throw Error('Sem espaço');values.set(key,value);},
   removeItem:(key:string)=>{values.delete(key);},
 };
}
describe('backup completo',()=>{
 it('preserva partidas e previsões sem recalcular sinais',()=>{
   const original=createFullBackup(data,[record]);
   const parsed=parseFullBackup(JSON.parse(JSON.stringify(original)));
   expect(parsed).toEqual({kind:'full',data,radarRecords:[record]});
   const disk=storage();
   restoreFullBackup(disk,parsed);
   expect(JSON.parse(disk.getItem(STORAGE)??'')).toEqual(data);
   expect(JSON.parse(disk.getItem(RADAR_STORAGE)??'')).toEqual([record]);
 });
 it('importa backup antigo apenas de jogos sem alterar Radar',()=>{
   const disk=storage({[RADAR_STORAGE]:'previsoes-inalteradas'});
   restoreFullBackup(disk,parseFullBackup(data));
   expect(disk.getItem(RADAR_STORAGE)).toBe('previsoes-inalteradas');
 });
 it('rejeita arquivos incorretos sem tocar no navegador',()=>{
   expect(()=>parseFullBackup({format:'futstats-completo-v1',version:1,data,radarRecords:{}})).toThrow();
   expect(()=>parseFullBackup({format:'futstats-completo-v1',version:2,data,radarRecords:[]})).toThrow();
   expect(()=>parseFullBackup([])).toThrow();
 });
 it('desfaz a alteração dos jogos quando não consegue armazenar previsões',()=>{
   const before='base-original',forecasts='previsoes-originais';
   const disk=storage({[STORAGE]:before,[RADAR_STORAGE]:forecasts},RADAR_STORAGE);
   expect(()=>restoreFullBackup(disk,{kind:'full',data,radarRecords:[record]})).toThrow('preservados');
   expect(disk.getItem(STORAGE)).toBe(before);
   expect(disk.getItem(RADAR_STORAGE)).toBe(forecasts);
 });
});
