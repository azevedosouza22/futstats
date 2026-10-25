/**
 * Read-only, source-centric on-demand official schedule review.
 * The bundled `verifiedAt` is evidence of a PAST, dated lookup, not a renewed
 * check. Opening/exporting any group never visits URLs or updates credibility.
 */
import type {OfficialCalendarItem} from './officialCalendar';
import {officialRecheckQueue,type OfficialRecheckReason,type OfficialRecheckEntry} from './officialRecheckQueue';
import {officialSnapshotFreshAt,safeOfficialFixtureUrl} from './officialSourceTrust';
import {brasiliaDate} from './calendar';

export type OfficialSourceBatch={
 key:string;competition:string;sourceUrl:string;
 fixtures:OfficialRecheckEntry[];
 count:number;expired:number;soon:number;later:number;
 checkedDates:string[];
 reviewStatus:'PENDENTE';
};
export type OfficialSourceBatchPlan={
 groups:OfficialSourceBatch[];totalFixtures:number;excludedUnsafe:number;
 distinctSources:number;totalExpired:number;totalSoon:number;totalLater:number;
};

const order:Record<OfficialRecheckReason,number>={expired:0,soon:1,later:2};
const safeCell=(value:string)=>{
 // Spreadsheet formula injection is dangerous EVEN in quoted CSV cells.
 const cleaned=/^[\s\u0000-\u001f]*[=+\-@]/u.test(value)?"'"+value:value;
 return '"'+cleaned.replace(/"/g,'""')+'"';
};

/** One visit to one source page can allow checking several fixture lines.
 * Trusted URL *shape* does not establish the page content or any new check.
 */
export function prepareOfficialSourceBatches(
 fixtures:readonly OfficialCalendarItem[],now=new Date()
):OfficialSourceBatchPlan{
 const today=brasiliaDate(now).date;
 const queue=officialRecheckQueue(fixtures,now);
 const batches=new Map<string,OfficialSourceBatch>();
 let excludedUnsafe=0;
 for(const raw of queue.entries){
  const f=raw.item.fixture;
  if(!safeOfficialFixtureUrl(f.sourceUrl)){
   excludedUnsafe++;continue;
  }
  // Fail closed if an injected/stale item erroneously says "fresh".
  const fresh=raw.item.fresh&&
    officialSnapshotFreshAt(raw.item.verifiedAt,today)&&f.time!==null;
  const reason:OfficialRecheckReason=fresh?raw.reason:'expired';
  const entry:OfficialRecheckEntry={item:raw.item,reason};
  const key=f.competition+'\u0000'+f.sourceUrl;
  let batch=batches.get(key);
  if(!batch){
   batch={key,competition:f.competition,sourceUrl:f.sourceUrl,fixtures:[],
    count:0,expired:0,soon:0,later:0,checkedDates:[],reviewStatus:'PENDENTE'};
   batches.set(key,batch);
  }
  batch.fixtures.push(entry);
  batch.count++;
  batch[reason]++;
  if(!batch.checkedDates.includes(raw.item.verifiedAt))
   batch.checkedDates.push(raw.item.verifiedAt);
 }
 const groups=[...batches.values()];
 for(const g of groups){
  g.checkedDates.sort();
  g.fixtures.sort((a,b)=>order[a.reason]-order[b.reason]||
   a.item.fixture.date.localeCompare(b.item.fixture.date)||
   a.item.fixture.id.localeCompare(b.item.fixture.id));
 }
 groups.sort((a,b)=>{
  const rank=(v:OfficialSourceBatch)=>v.expired>0?0:v.soon>0?1:2;
  const first=(v:OfficialSourceBatch)=>
   v.fixtures.map(x=>x.item.fixture.date).sort()[0]??'';
  return rank(a)-rank(b)||first(a).localeCompare(first(b))||
   a.competition.localeCompare(b.competition,'pt-BR')||
   a.sourceUrl.localeCompare(b.sourceUrl);
 });
 return {groups,totalFixtures:groups.reduce((sum,g)=>sum+g.count,0),
  excludedUnsafe,distinctSources:groups.length,
  totalExpired:groups.reduce((sum,g)=>sum+g.expired,0),
  totalSoon:groups.reduce((sum,g)=>sum+g.soon,0),
  totalLater:groups.reduce((sum,g)=>sum+g.later,0)};
}

/** One CSV row PER ORIGINAL PAGE, not nine tabs for nine DFL fixtures.
 * Descriptive only; PENDENTE always; N/D is never restored to a time.
 * Zero storage writes, source fetches or changes to the actual schedule.
 */
export function exportOfficialSourceBatchesCsv(plan:OfficialSourceBatchPlan):string{
 const columns=['campeonato','url_fonte_original','partidas_na_fonte',
  'horarios_vencidos','proximas_48h','outros_jogos','datas_verificacao_original',
  'confrontos_e_horarios_brasilia','reconferencia_atual'];
 const rows=[columns.map(safeCell).join(';')];
 for(const g of plan.groups){
  const games=g.fixtures.map(({item,reason})=>{
   const f=item.fixture;
   return f.date+' '+f.home+' x '+f.away+' ('+
    (reason==='expired'?'N/D':f.time??'N/D')+' Brasília, '+
    reason+')';
  }).join(' | ');
  rows.push([g.competition,g.sourceUrl,String(g.count),String(g.expired),
   String(g.soon),String(g.later),g.checkedDates.join(' | '),games,
   'PENDENTE'].map(safeCell).join(';'));
 }
 return '\uFEFF'+rows.join('\r\n')+'\r\n';
}
