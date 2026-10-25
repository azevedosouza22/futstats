/**
 * Read-only work queue based solely on records already present in THIS browser.
 * No crawling, filling, importing, uploading, or predictions.
 * The primary FutStats history and Work research remain entirely separate.
 */
import {stats,type Data,type Match} from './model';
import {COVERAGE_METRICS,COVERAGE_PERIODS,type CoverageMetric,type CoveragePeriod} from './leagueCoverageAudit';
import type {WorkAnalysisMatch} from './workAnalysis';
import {WORK_ANALYSIS_LEAGUES} from './workAnalysis';

export type GapSide='home'|'away';
export type MissingField={metric:CoverageMetric;period:CoveragePeriod;side:GapSide};
export type GapPriority='corners-full'|'corners-period'|'source-review'|'other';
export type GapQueueItem={
  key:string;source:'main'|'work';competition:string;
  matchId:string;date:string;label:string;
  priority:GapPriority;
  missing:MissingField[];
  reviewReason:string|null;
  sourceUrl:string|null;
};
const priorityRank:Record<GapPriority,number>={
  'corners-full':0,'corners-period':1,'source-review':2,'other':3
};
const dateOk=(value:string,beforeDate:string)=>
  /^\d{4}-\d{2}-\d{2}$/.test(value)&&value<beforeDate;
const validNumber=(v:unknown):v is number=>
  typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;

/** Only use a source URL stored with that particular match. Never fabricate it. */
const safeSource=(url:unknown):string|null=>{
  if(typeof url!=='string')return null;
  try{
    const parsed=new URL(url);
    return parsed.protocol==='https:'&&!parsed.username&&!parsed.password&&
      ['flashscore.com','www.flashscore.com','flashscore.com.br','www.flashscore.com.br'].includes(parsed.hostname)
      ?url:null;
  }catch{return null;}
};

function missingCells(read:(metric:CoverageMetric,period:CoveragePeriod,side:0|1)=>unknown):MissingField[]{
  const result:MissingField[]=[];
  for(const metric of COVERAGE_METRICS)
    for(const period of COVERAGE_PERIODS)
      for(const side of [0,1] as const)
        if(!validNumber(read(metric,period,side)))
          result.push({metric,period,side:side===0?'home':'away'});
  return result;
}
function classified(missing:MissingField[],review:string|null):GapPriority{
  if(missing.some(f=>f.metric==='corners'&&f.period==='full'))return 'corners-full';
  if(missing.some(f=>f.metric==='corners'))return 'corners-period';
  if(review!==null)return 'source-review';
  return 'other';
}
const sorted=(items:GapQueueItem[])=>items.sort((a,b)=>
  priorityRank[a.priority]-priorityRank[b.priority]||
  b.date.localeCompare(a.date)||
  a.competition.localeCompare(b.competition,'pt-BR')||
  a.matchId.localeCompare(b.matchId));

function mainItem(m:Match,data:Data):GapQueueItem|null{
  const review=m.research?.dateDiscrepancy?'Data divergente na fonte':
    m.external&&!['FT','Match Finished'].includes(m.external.status)?
    'Resultado externo não confirmado como encerrado':null;
  // When the fixture is unconfirmed, report a verification task only:
  // the absence of period metrics must not be mistaken for a finished game.
  const missing=review?[]:missingCells((metric,period,side)=>stats(m,side,period)[metric]);
  if(missing.length===0&&review===null)return null;
  const home=data.teams.find(t=>t.id===m.home)?.name??m.home;
  const away=data.teams.find(t=>t.id===m.away)?.name??m.away;
  return {
    key:'main|'+m.competition+'|'+m.id,
    source:'main',competition:m.competition.trim(),
    matchId:m.id,date:m.date,label:home+' × '+away,
    priority:classified(missing,review),missing,reviewReason:review,
    sourceUrl:safeSource(m.research?.sourceUrl)
  };
}
function workItem(m:WorkAnalysisMatch,competition:string):GapQueueItem|null{
  const review=m.discrepancies.length?'Diferença documentada na pesquisa Work':null;
  const missing=review?[]:missingCells((metric,period,side)=>m[period]?.[metric]?.[side]);
  if(missing.length===0&&review===null)return null;
  return {
    key:'work|'+m.league+'|'+m.sourceId,
    source:'work',competition,
    matchId:m.sourceId,date:m.date,label:m.home+' × '+m.away,
    priority:classified(missing,review),missing,reviewReason:review,
    sourceUrl:safeSource(m.sourceUrl)
  };
}

export function prioritizeMainGaps(data:Data,beforeDate:string):GapQueueItem[]{
  const seen=new Set<string>(),items:GapQueueItem[]=[];
  for(const m of data.matches){
    if(!m.competition.trim()||!dateOk(m.date,beforeDate)||seen.has(m.id))continue;
    seen.add(m.id);
    const task=mainItem(m,data);
    if(task)items.push(task);
  }
  return sorted(items);
}
export function prioritizeWorkGaps(matches:readonly WorkAnalysisMatch[],beforeDate:string):GapQueueItem[]{
  const seen=new Set<string>(),items:GapQueueItem[]=[];
  for(const m of matches){
    if(!dateOk(m.date,beforeDate)||!WORK_ANALYSIS_LEAGUES.some(l=>l.id===m.league)||
      seen.has(m.league+'|'+m.sourceId))continue;
    seen.add(m.league+'|'+m.sourceId);
    const league=WORK_ANALYSIS_LEAGUES.find(l=>l.id===m.league)!;
    const task=workItem(m,league.label);
    if(task)items.push(task);
  }
  return sorted(items);
}
