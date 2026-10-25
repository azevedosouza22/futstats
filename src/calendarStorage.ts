/**
 * Canonical local CSV agenda store. The serialized fixture array is backed up
 * byte-for-byte; validation never reconstructs, rewrites or auto-imports it.
 */
import {normalizeTeam,type ScheduledFixture} from './calendar';

export const CALENDAR_STORAGE='futstats-calendar-csv-v1';
const isDate=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&
 !Number.isNaN(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
const validUrl=(url:string)=>{
 try{
  const parsed=new URL(url);
  return parsed.protocol==='https:'&&!parsed.username&&!parsed.password&&
   parsed.hostname.includes('.')&&url.length<=2048;
 }catch{return false;}
};
const validTeam=(name:unknown):name is string=>typeof name==='string'&&
 !!name.trim()&&name.length<=120;

/** Conservative schema check: accept the exact values created by parseCalendarCsv. */
export function parseStoredCalendar(raw:string):ScheduledFixture[]{
 if(raw.length>2_000_000)throw Error('Agenda CSV local acima do limite de 2 MB');
 let parsed:unknown;
 try{parsed=JSON.parse(raw);}catch{throw Error('Agenda CSV local com JSON inválido');}
 if(!Array.isArray(parsed)||parsed.length>1000)
  throw Error('Agenda CSV local deve conter até 1.000 confrontos');
 const ids=new Set<string>();
 return parsed.map((entry:unknown,index)=>{
  if(!entry||typeof entry!=='object'||Array.isArray(entry))
   throw Error('Confronto inválido na agenda: posição '+(index+1));
  const f=entry as Partial<ScheduledFixture>;
  if(typeof f.id!=='string'||typeof f.date!=='string'||!isDate(f.date)||
    !validTeam(f.home)||!validTeam(f.away)||!validTeam(f.competition)||
    typeof f.sourceUrl!=='string'||!validUrl(f.sourceUrl)||
    !(f.time===null||typeof f.time==='string'&&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)))
   throw Error('Campos inválidos na agenda: posição '+(index+1));
  if(normalizeTeam(f.home)===normalizeTeam(f.away))
   throw Error('Mandante e visitante iguais na agenda');
  const canonical=[f.date,f.competition,f.home,f.away].map(normalizeTeam).join('|');
  if(f.id!==canonical||ids.has(f.id))
   throw Error('Identificador ou jogo duplicado na agenda');
  ids.add(f.id);
  return f as ScheduledFixture;
 });
}
