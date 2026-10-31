/** Immutable, dated laboratory archive: show pregame decisions AFTER kickoff without recalculation.
 * No writes to browser storage or Radar V2/V3. Only explicitly published dates load.
 */
import type {V4FixtureReport,V4Period,V4Metric,V4Pick} from './radarV4LabToday';
import {V4_PERIODS,V4_METRICS} from './radarV4LabToday';

export const V4_ARCHIVED_DAYS=['2026-10-30'] as const;
export const V4_20261030_SOURCE=
 'https://github.com/azevedosouza22/futstats/blob/f0274c218c2cca184f95059df2244098b953ee91/research/radar-v4-lab/PREVISOES_PROSPECTIVAS_2026-10-30.json';
export type V4DayArchive={
 date:string;createdAt:string;reports:V4FixtureReport[];
 signals:number;abstentions:number;origin:'historical-pregame-github';
};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const string=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=160;
const validNumber=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const uniq=(xs:string[])=>new Set(xs).size===xs.length;
const period=(s:unknown):s is V4Period=>V4_PERIODS.some(p=>p===s);
const metric=(s:unknown):s is V4Metric=>V4_METRICS.some(m=>m===s);
function validHistory(rows:unknown,date:string):rows is {id:string;date:string}[]{
 return Array.isArray(rows)&&rows.length===5&&rows.every(x=>obj(x)&&
  string(x.id)&&typeof x.date==='string'&&/^20\d\d-\d\d-\d\d$/.test(x.date)&&x.date<date);
}
export function parseV4Archive(raw:unknown):V4DayArchive {
 if(!obj(raw)||raw.format!=='futstats-radar-v4-prospectiva-experimental-v1'||
  raw.date!=='2026-10-30'||raw.fixtures_count!==10||
  raw.signal_count!==105||raw.abstention_count!==15||
  typeof raw.generated_at_utc!=='string'||raw.generated_at_utc!=='2026-10-30T08:55:11.563Z'||
  !Array.isArray(raw.fixtures)||raw.fixtures.length!==10)
  throw Error('Registro histórico V4 inválido ou modificado.');
 const reports:V4FixtureReport[]=[];
 const identities=new Set<string>();
 let signals=0,abstentions=0;
 for(const f of raw.fixtures){
  if(!obj(f)||!string(f.home)||!string(f.away)||!string(f.competition)||
   f.date!==raw.date||!validHistory(f.home_history,f.date)||
   !validHistory(f.away_history,f.date)||!Array.isArray(f.picks)||f.picks.length!==12)
   throw Error('Confronto inválido no registro histórico V4.');
  const history=[...f.home_history,...f.away_history];
  const ids=[...new Set(history.map(h=>h.id))];
  if(f.unique_history_count!==ids.length||ids.length<8||ids.length>10)
   throw Error('Histórico não corresponde aos IDs originais.');
  const identity=[f.competition,f.home,f.away].join('|');
  if(identities.has(identity))throw Error('Confronto repetido no histórico V4.');
  identities.add(identity);
  const pairs=new Set<string>();
  const picks:V4Pick[]=[];
  for(const row of f.picks){
   if(!obj(row)||!period(row.period)||!metric(row.metric)||
    !validNumber(row.mean)||row.frequency_n!==ids.length||
    !(row.status==='sinal'||row.status==='sem_sinal'))
    throw Error('Sinal V4 inválido no arquivo congelado.');
   const key=row.period+'|'+row.metric;
   if(pairs.has(key))throw Error('Mercado/tempo duplicado no arquivo V4.');
   pairs.add(key);
   const yes=row.status==='sinal';
   if(yes){
    const freq=row.frequency_hits;
    if(!validNumber(row.line)||typeof freq!=='number'||!Number.isSafeInteger(freq)||
     freq<0||freq>ids.length||freq/ids.length<.7)
     throw Error('Frequência do sinal congelado inválida.');
   }
   if(!yes&&(row.line!==null||row.frequency_hits!==null))
    throw Error('Abstenção histórica adulterada.');
   if(yes)signals++;else abstentions++;
   picks.push({period:row.period,metric:row.metric,
    line:yes?row.line as number:null,overs:yes?row.frequency_hits as number:null,
    observed:ids.length,mean:row.mean as number,reason:yes?'qualified':'below_70'});
  }
  if(V4_PERIODS.some(p=>V4_METRICS.some(m=>!pairs.has(p+'|'+m))))
   throw Error('Arquivo histórico V4 sem todos os 12 mercados.');
  reports.push({
   fixture:{id:'archive|'+f.date+'|'+identity,date:f.date,time:null,
    competition:f.competition,home:f.home,away:f.away,sourceUrl:V4_20261030_SOURCE},
   competition:f.competition,status:'ready',
   reason:'Análise original registrada em 30/10/2026 às 05h55 de Brasília. Não recalculada.',
   homeHistoryCount:5,awayHistoryCount:5,historyIds:ids,picks
  });
 }
 if(signals!==105||abstentions!==15)
  throw Error('Totais do arquivo pré-jogo divergentes do registro original.');
 return {date:raw.date as string,createdAt:raw.generated_at_utc,reports,
  signals,abstentions,origin:'historical-pregame-github'};
}
/** Restrict paths to an allowlist; never construct URLs from arbitrary dates. */
export async function loadV4Archive(day:string,signal?:AbortSignal):Promise<V4DayArchive|null>{
 if(day!=='2026-10-30')return null;
 const response=await fetch('/research/v4-lab/2026-10-30.json',{signal,cache:'no-store'});
 if(!response.ok)throw Error('Registro histórico V4 indisponível. Nenhum dado foi recriado.');
 return parseV4Archive(await response.json() as unknown);
}
