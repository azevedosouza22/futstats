/** Separate, opt-in, append-only laboratory records.
 * Does not read/write V2/V3, Work, backups, personal matches or any Radar key.
 */
import type {OfficialCalendarItem} from './officialCalendar';
import type {V4FixtureReport} from './radarV4LabToday';
import {brasiliaDate} from './calendar';

export const RADAR_V4_LAB_STORAGE='futstats:radar-v4-lab-frozen:v1';
export type V4FrozenRecord={
 id:string;savedAt:string;date:string;fixtureId:string;competition:string;
 home:string;away:string;time:string;sourceUrl:string;verifiedAt:string;
 homeHistoryCount:number;awayHistoryCount:number;historyIds:string[];
 picks:V4FixtureReport['picks'];origin:'v4-lab-experimental';
};
const isObj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function readV4Frozen(raw:string|null):V4FrozenRecord[]{
 if(raw===null)return [];
 const x:unknown=JSON.parse(raw);
 if(!Array.isArray(x)||x.length>250||!x.every(y=>isObj(y)&&
  typeof y.id==='string'&&typeof y.fixtureId==='string'&&typeof y.savedAt==='string'&&
  typeof y.date==='string'&&y.origin==='v4-lab-experimental'&&Array.isArray(y.picks)))
  throw Error('Arquivo do Laboratório V4 inválido. Nenhum registro será substituído.');
 return x as V4FrozenRecord[];
}
export function freezeV4Report(
 existing:string|null,report:V4FixtureReport,reference:OfficialCalendarItem,now:Date
):V4FrozenRecord[]{
 const fixture=reference.fixture;
 const br=brasiliaDate(now);
 if(!reference.fresh||!fixture.time||report.status!=='ready'||fixture.id!==report.fixture.id||
  report.picks.length!==12||report.picks.every(p=>p.line===null)||
  fixture.date<br.date||(fixture.date===br.date&&fixture.time<=br.time))
  throw Error('A previsão só pode ser congelada antes do jogo com agenda recente e horário confirmado.');
 const records=readV4Frozen(existing);
 if(records.some(r=>r.fixtureId===fixture.id))
  throw Error('Este confronto já possui um teste V4. O registro anterior foi preservado.');
 if(records.length>=250)throw Error('Limite de 250 testes V4. Exporte os registros antes de prosseguir.');
 const record:V4FrozenRecord={
  id:'v4-'+fixture.id,savedAt:now.toISOString(),date:fixture.date,fixtureId:fixture.id,
  competition:report.competition!,home:fixture.home,away:fixture.away,time:fixture.time,
  sourceUrl:fixture.sourceUrl,verifiedAt:reference.verifiedAt,
  homeHistoryCount:report.homeHistoryCount,awayHistoryCount:report.awayHistoryCount,
  historyIds:[...report.historyIds],picks:report.picks.map(p=>({...p})),
  origin:'v4-lab-experimental'
 };
 return [...records,record];
}
