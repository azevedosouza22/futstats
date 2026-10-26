/**
 * Etapa 64: detect a SOURCE-ID overlap between separately kept Main/Work
 * inventories; never merge, auto-fix, copy, or treat two records from the same
 * Flashscore ID as two independent witnesses of a final result.
 */
import {stats,type Data} from './model';
import {WORK_ANALYSIS_LEAGUES,type WorkAnalysisMatch} from './workAnalysis';
import {COVERAGE_METRICS,COVERAGE_PERIODS} from './leagueCoverageAudit';
import {canonicalTeamInCompetition} from './radarTeamAliases';
import {assessGapSource} from './statGapSource';

export type CrossStoreState=
 'same_values'|'different_values'|'incomplete_values'|'different_fixture'|'duplicate_work_id'|'unsafe_reference';
export type CrossStoreOverlap={
 key:string;sourceId:string;competition:string;mainId:string;workId:string;
 date:string;home:string;away:string;state:CrossStoreState;
 conflicts:number;unavailable:number;sourceUrl:string|null;
 verification:'PENDENTE';
};
export type CrossStoreReport={
 overlaps:CrossStoreOverlap[];sharedIds:number;
 identical:number;conflicting:number;incomplete:number;
 mismatchedFixtures:number;duplicateWorkIds:number;unsafeRefs:number;
 externalVerified:0;
};

const stateOrder:Record<CrossStoreState,number>={
 different_fixture:0,duplicate_work_id:1,unsafe_reference:2,
 different_values:3,incomplete_values:4,same_values:5
};
const csvValue=(value:string)=>{
 const safe=/^[\s\u0000-\u001f]*[=+\-@]/u.test(value)?"'"+value:value;
 return '"'+safe.replace(/"/g,'""')+'"';
};

/** Only exact provider sourceId within records already present in the device.
 * A shared ID never means Work is an independent provider: both are still
 * labelled Flashscore. Metadata mismatch prevents statistic comparison.
 */
export function reconcileMainWorkSources(
 data:Data,work:readonly WorkAnalysisMatch[],today:string
):CrossStoreReport{
 const workById=new Map<string,WorkAnalysisMatch[]>();
 for(const m of work){
  const group=workById.get(m.sourceId)??[];
  group.push(m);workById.set(m.sourceId,group);
 }
 const mainSeen=new Set<string>(),overlaps:CrossStoreOverlap[]=[];
 for(const m of data.matches){
  const r=m.research;
  if(!r||r.source!=='Flashscore'||r.provider!=='work-csv'||!r.sourceId||
   mainSeen.has(r.sourceId)||m.date>=today)continue;
  mainSeen.add(r.sourceId);
  const group=workById.get(r.sourceId);
  if(!group?.length)continue;
  const workMatch=group[0];
  const competition=WORK_ANALYSIS_LEAGUES.find(l=>l.id===workMatch.league)?.label??'';
  const mainHome=data.teams.find(t=>t.id===m.home)?.name??m.home;
  const mainAway=data.teams.find(t=>t.id===m.away)?.name??m.away;
  const aligned=group.length===1&&competition===m.competition&&
   m.date===workMatch.date&&
   canonicalTeamInCompetition(mainHome,competition)===
    canonicalTeamInCompetition(workMatch.home,competition)&&
   canonicalTeamInCompetition(mainAway,competition)===
    canonicalTeamInCompetition(workMatch.away,competition)&&
   workMatch.discrepancies.length===0&&!r.dateDiscrepancy;
  const mainSource=assessGapSource(r.sourceUrl,r.sourceId,false);
  const workSource=assessGapSource(workMatch.sourceUrl,workMatch.sourceId,false);
  let state:CrossStoreState;let conflicts=0,unavailable=0;
  if(group.length>1)state='duplicate_work_id';
  else if(!aligned)state='different_fixture';
  else if(!mainSource.mayOpenSource||!workSource.mayOpenSource)
   state='unsafe_reference';
  else {
   for(const metric of COVERAGE_METRICS)for(const period of COVERAGE_PERIODS)
    for(const side of [0,1] as const){
     const a=stats(m,side,period)[metric],b=workMatch[period][metric][side];
     if(a===null||!Number.isSafeInteger(a)||a<0||
        !Number.isSafeInteger(b)||b<0){unavailable++;continue;}
     if(a!==b)conflicts++;
    }
   state=conflicts>0?'different_values':unavailable>0?'incomplete_values':'same_values';
  }
  overlaps.push({key:r.sourceId+'|'+m.id,sourceId:r.sourceId,
   competition:m.competition,mainId:m.id,workId:workMatch.id,
   date:m.date,home:mainHome,away:mainAway,state,conflicts,unavailable,
   sourceUrl:aligned&&mainSource.mayOpenSource&&workSource.mayOpenSource?
    mainSource.sourceUrl:null,verification:'PENDENTE'});
 }
 overlaps.sort((a,b)=>stateOrder[a.state]-stateOrder[b.state]||
  b.date.localeCompare(a.date)||a.sourceId.localeCompare(b.sourceId));
 return {overlaps,sharedIds:overlaps.length,
  identical:overlaps.filter(e=>e.state==='same_values').length,
  conflicting:overlaps.filter(e=>e.state==='different_values').length,
  incomplete:overlaps.filter(e=>e.state==='incomplete_values').length,
  mismatchedFixtures:overlaps.filter(e=>e.state==='different_fixture').length,
  duplicateWorkIds:overlaps.filter(e=>e.state==='duplicate_work_id').length,
  unsafeRefs:overlaps.filter(e=>e.state==='unsafe_reference').length,
  externalVerified:0};
}
export function exportMainWorkReconciliationCsv(report:CrossStoreReport):string{
 const headers=['fonte_id','liga','data','mandante','visitante','main_id',
  'work_id','estado','divergencias','campos_nd','url_fonte_original','verificacao_externa'];
 const rows=[headers.map(csvValue).join(';')];
 for(const r of report.overlaps)rows.push([
  r.sourceId,r.competition,r.date,r.home,r.away,r.mainId,r.workId,
  r.state,String(r.conflicts),String(r.unavailable),r.sourceUrl??'N/D','PENDENTE'
 ].map(csvValue).join(';'));
 return '\uFEFF'+rows.join('\r\n')+'\r\n';
}
