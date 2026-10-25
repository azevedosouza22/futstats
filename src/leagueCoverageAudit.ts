/**
 * Read-only league inventory, not a download or a claim of fixture coverage.
 * Reports completeness ONLY among locally registered, dated matches.
 *
 * Critical isolation: main FutStats history and Work research produce separate
 * rows. Never merge match IDs, statistics, competitions or predictions.
 */
import {stats,type Data,type Match} from './model';
import {WORK_ANALYSIS_LEAGUES,type WorkAnalysisMatch} from './workAnalysis';

export const COVERAGE_METRICS=['goals','shots','target','corners'] as const;
export const COVERAGE_PERIODS=['full','first','second'] as const;
export type CoverageMetric=typeof COVERAGE_METRICS[number];
export type CoveragePeriod=typeof COVERAGE_PERIODS[number];
export type CoverageSource='main'|'work';
export type CoverageCounts=Record<CoverageMetric,Record<CoveragePeriod,number>>;
export type CoverageRow={
  competition:string;
  source:CoverageSource;
  eligible:number;
  review:number;
  duplicates:number;
  completeFull:number;
  completeAll:number;
  counts:CoverageCounts;
  /** Up to three existing games lacking complete FT corners, newest first. */
  cornerGaps:{id:string;date:string;label:string}[];
};

const zeroCounts=():CoverageCounts=>({
  goals:{full:0,first:0,second:0},
  shots:{full:0,first:0,second:0},
  target:{full:0,first:0,second:0},
  corners:{full:0,first:0,second:0}
});
const pairOk=(v:unknown):v is [number,number]=>Array.isArray(v)&&v.length===2&&
  v.every(x=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0);

type Observed={
  id:string;date:string;label:string;
  values:Record<CoverageMetric,Record<CoveragePeriod,boolean>>;
};
type Acc={source:CoverageSource;competition:string;review:number;duplicates:number;games:Observed[];seen:Set<string>};
const create=(source:CoverageSource,competition:string):Acc=>({
  source,competition,review:0,duplicates:0,games:[],seen:new Set()
});
const dateOk=(date:string,beforeDate:string)=>
  /^\d{4}-\d{2}-\d{2}$/.test(date)&&date<beforeDate;
const fromMain=(m:Match,data:Data):Observed=>{
  const values={} as Observed['values'];
  for(const metric of COVERAGE_METRICS){
    values[metric]={} as Record<CoveragePeriod,boolean>;
    for(const period of COVERAGE_PERIODS)
      values[metric][period]=pairOk([
        stats(m,0,period)[metric],
        stats(m,1,period)[metric]
      ]);
  }
  const home=data.teams.find(t=>t.id===m.home)?.name??m.home;
  const away=data.teams.find(t=>t.id===m.away)?.name??m.away;
  return {id:m.id,date:m.date,label:home+' × '+away,values};
};
const fromWork=(m:WorkAnalysisMatch):Observed=>{
  const values={} as Observed['values'];
  for(const metric of COVERAGE_METRICS){
    values[metric]={} as Record<CoveragePeriod,boolean>;
    for(const period of COVERAGE_PERIODS)
      values[metric][period]=pairOk(m[period]?.[metric]);
  }
  return {id:m.sourceId,date:m.date,label:m.home+' × '+m.away,values};
};
const output=(acc:Acc[]):CoverageRow[]=>
  acc.map(a=>{
    const counts=zeroCounts();
    let completeFull=0,completeAll=0;
    const gaps:CoverageRow['cornerGaps']=[];
    for(const game of a.games){
      for(const metric of COVERAGE_METRICS)
        for(const period of COVERAGE_PERIODS)
          if(game.values[metric][period])counts[metric][period]++;
      if(COVERAGE_METRICS.every(metric=>game.values[metric].full))completeFull++;
      if(COVERAGE_METRICS.every(metric=>
        COVERAGE_PERIODS.every(period=>game.values[metric][period])))completeAll++;
      if(!game.values.corners.full)
        gaps.push({id:game.id,date:game.date,label:game.label});
    }
    return {source:a.source,competition:a.competition,eligible:a.games.length,
      review:a.review,duplicates:a.duplicates,completeFull,completeAll,
      counts,cornerGaps:gaps.sort((x,y)=>y.date.localeCompare(x.date)||
        x.id.localeCompare(y.id)).slice(0,3)};
  }).sort((a,b)=>{
    const aMissing=a.eligible-a.counts.corners.full;
    const bMissing=b.eligible-b.counts.corners.full;
    return bMissing-aMissing||b.eligible-a.eligible||
      a.competition.localeCompare(b.competition,'pt-BR');
  });

export function auditMainLeagueCoverage(data:Data,beforeDate:string):CoverageRow[]{
  const byLeague=new Map<string,Acc>();
  for(const m of data.matches){
    if(!m.competition.trim()||!dateOk(m.date,beforeDate))continue;
    const league=m.competition.trim();
    let a=byLeague.get(league);
    if(!a){a=create('main',league);byLeague.set(league,a);}
    if(a.seen.has(m.id)){a.duplicates++;continue;}
    a.seen.add(m.id);
    if(m.research?.dateDiscrepancy||
      (m.external&&!['FT','Match Finished'].includes(m.external.status))){
      a.review++;continue;
    }
    a.games.push(fromMain(m,data));
  }
  return output([...byLeague.values()]);
}

export function auditWorkLeagueCoverage(matches:readonly WorkAnalysisMatch[],beforeDate:string):CoverageRow[]{
  const byLeague=new Map(WORK_ANALYSIS_LEAGUES.map(l=>
    [l.id,create('work',l.label)] as const));
  for(const m of matches){
    if(!dateOk(m.date,beforeDate))continue;
    const a=byLeague.get(m.league);
    if(!a)continue;
    if(a.seen.has(m.sourceId)){a.duplicates++;continue;}
    a.seen.add(m.sourceId);
    if(m.discrepancies.length){a.review++;continue;}
    a.games.push(fromWork(m));
  }
  return output([...byLeague.values()].filter(a=>
    a.games.length>0||a.review>0||a.duplicates>0));
}
