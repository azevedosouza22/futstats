import {describe,it,expect} from 'vitest';
import {STORAGE,type Data,type Stats} from './model';
import {RADAR_STORAGE} from './fullBackup';
import {CALENDAR_STORAGE} from './calendarStorage';
import {SAFETY_KEYS} from './safetyArchive';
import {dryRunV4Restore} from './safetyRestoreDryRun';

const emptyStats=():Stats=>({goals:1,shots:8,target:3,corners:4,yellow:0,red:0});
const base:Data={teams:[
 {id:'a',name:'Casa',color:'#112233'},{id:'b',name:'Fora',color:'#334455'}
],matches:Array.from({length:659},(_,i)=>({
 id:'synthetic-'+i,home:'a',away:'b',date:'2026-06-01',
 competition:'Liga sintética para teste',
 first:[emptyStats(),emptyStats()] as [Stats,Stats],
 second:[emptyStats(),emptyStats()] as [Stats,Stats]
}))};
const forecast={
 key:'frozen-001',savedAt:'2026-10-24T12:00:00.000Z',
 matchAt:'2026-10-30T19:30',competition:'Liga sintética para teste',
 home:'Casa',away:'Fora',homeCount:5,awayCount:5,
 markets:[{id:'goals-full-2.5',label:'Gols',line:2.5,
 historyRate:0.4,observed:10,overs:4,historicalMean:2.1}]
};
const store=(values:Record<string,string>)=>{
 const map=new Map(Object.entries(values));
 let reads=0,writes=0;
 return {
  getItem:(key:string)=>{reads++;return map.get(key)??null;},
  setItem:(_:string,__:string)=>{writes++;throw Error('FutStats NÃO deve tocar no armazenamento real');},
  removeItem:(_:string)=>{writes++;throw Error('FutStats NÃO deve apagar dados reais');},
  original:()=>Object.fromEntries(map),reads:()=>reads,writes:()=>writes
 };
};

describe('Etapa 54 — autoteste não destrutivo dos nove grupos V4',()=>{
 it('simula recuperação de 659 registros e previsão congelada sem nenhuma escrita real',()=>{
  const src=store({
   [STORAGE]:JSON.stringify(base),
   [RADAR_STORAGE]:JSON.stringify([forecast])
  });
  const snapshot=JSON.stringify(src.original());
  const result=dryRunV4Restore(src,new Date('2026-10-25T17:00:00Z'));
  expect(result).toEqual({
   status:'PASSOU',groups:9,restored:2,
   matches:659,workMatches:0,workForecasts:0,
   calendarFixtures:0,radarForecasts:1,
   originalUnchanged:true,simulatedOnly:true
  });
  expect(src.writes()).toBe(0);
  expect(JSON.stringify(src.original())).toBe(snapshot);
  expect(src.reads()).toBeGreaterThanOrEqual(SAFETY_KEYS.length*3);
 });
 it('conta agenda local e mantém zero previsão onde grupo não existe',()=>{
  const src=store({
   [STORAGE]:JSON.stringify({teams:[],matches:[]}),
   [RADAR_STORAGE]:'[]',
   [CALENDAR_STORAGE]:'[]'
  });
  const result=dryRunV4Restore(src);
  expect(result).toMatchObject({groups:9,restored:3,
   matches:0,radarForecasts:0,calendarFixtures:0,simulatedOnly:true});
  expect(src.writes()).toBe(0);
 });
 it('sem grupos protegidos presentes: recusa, não finge ter recuperado dados',()=>{
  const src=store({'outro-app':'não tocar'});
  expect(()=>dryRunV4Restore(src)).toThrow('não contém grupos');
  expect(src.original()).toEqual({'outro-app':'não tocar'});
  expect(src.writes()).toBe(0);
 });
 it('detecta previsão Radar corrompida e não simula sucesso',()=>{
  const src=store({[STORAGE]:JSON.stringify(base),[RADAR_STORAGE]:'[{"ruim":true}]'});
  expect(()=>dryRunV4Restore(src)).toThrow('inconsistente');
  expect(src.writes()).toBe(0);
 });
 it('detecta mudanças de dados enquanto captura a cópia, sem escrever nada',()=>{
  const values=store({[STORAGE]:JSON.stringify(base),[RADAR_STORAGE]:'[]'});
  let count=0;
  const changing={
   getItem:(key:string)=>{
    if(key===RADAR_STORAGE&&++count===2)return '[{"corrompido":true}]';
    return values.getItem(key);
   }
  };
  expect(()=>dryRunV4Restore(changing)).toThrow('mudaram durante o backup');
  expect(values.writes()).toBe(0);
 });
 it('preserva bytes e N/D nos dados sintéticos sem converter ausências em zero',()=>{
  const real=store({[STORAGE]:JSON.stringify(base)});
  const test=dryRunV4Restore(real);
  expect(test).toMatchObject({restored:1,radarForecasts:0,
   originalUnchanged:true,simulatedOnly:true});
  expect(real.getItem(RADAR_STORAGE)).toBeNull();
  expect(real.writes()).toBe(0);
 });
});
