/**
 * Transparent, read-only chronological evaluation of Work V2/V3.
 * Do not tune model parameters on validation outcomes, pool partial games
 * with the Radar history, or count rejected V2 signals as V3 predictions.
 */
import {
 WORK_ANALYSIS_LEAGUES,type WorkAnalysisMatch,type WorkLeague
} from './workAnalysis';
import {workRadarData,backtestWorkRadar} from './workRadar';

export type WorkRadarCounts={signals:number;correct:number};
export type WorkRadarValidationLeague={
 id:WorkLeague;name:string;fixtures:number;
 trainingEnd:string|null;validationStart:string|null;
 v2:WorkRadarCounts;v3:WorkRadarCounts;baseline:WorkRadarCounts;
 markets:{name:string;v2:WorkRadarCounts;v3:WorkRadarCounts;baseline:WorkRadarCounts}[];
};
export type WorkRadarValidation={
 leagues:WorkRadarValidationLeague[];
 total: {fixtures:number;v2:WorkRadarCounts;v3:WorkRadarCounts;baseline:WorkRadarCounts};
};
const empty=():WorkRadarCounts=>({signals:0,correct:0});
function add(to:WorkRadarCounts,from:WorkRadarCounts):void{
 to.signals+=from.signals;to.correct+=from.correct;
}
export function validateWorkRadar(matches:readonly WorkAnalysisMatch[]):WorkRadarValidation{
 const leagues:WorkRadarValidationLeague[]=[];
 const total={fixtures:0,v2:empty(),v3:empty(),baseline:empty()};
 for(const league of WORK_ANALYSIS_LEAGUES){
  const data=workRadarData(matches,league.id);
  if(!data.matches.length)continue;
  const report=backtestWorkRadar(data);
  if(!report)continue;
  const leagueResult:WorkRadarValidationLeague={
   id:league.id,name:league.label,fixtures:report.fixtures,
   trainingEnd:report.trainingEnd,validationStart:report.validationStart,
   v2:empty(),v3:empty(),baseline:empty(),markets:[]
  };
  for(const m of report.markets){
   const item={
    name:m.label,
    v2:{signals:m.v2All.signals,correct:m.v2All.correct},
    v3:{signals:m.v3.signals,correct:m.v3.correct},
    baseline:{signals:m.constant.signals,correct:m.constant.correct}
   };
   leagueResult.markets.push(item);
   add(leagueResult.v2,item.v2);
   add(leagueResult.v3,item.v3);
   add(leagueResult.baseline,item.baseline);
  }
  add(total.v2,leagueResult.v2);
  add(total.v3,leagueResult.v3);
  add(total.baseline,leagueResult.baseline);
  total.fixtures+=report.fixtures;
  leagues.push(leagueResult);
 }
 return {leagues,total};
}
