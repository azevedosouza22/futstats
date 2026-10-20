import type {Data} from './model';
import {matchTotal} from './radar';
import {venueV2Markets} from './radarVenueV2';
import {predictVenueV3, VENUE_V3_CHECKS, type VenueV3Check} from './radarVenueV3';
import type {VenueV2Score} from './radarVenueV2Backtest';

export type VenueV3FailedCheck = {rejections:number;v2Correct:number;v2Incorrect:number};
export type VenueV3MarketReport={
 id:string;label:string;line:number;baseline:'Over'|'Under'|null;
 trainingObserved:number;trainingOver:number;
 eligibleValidation:number;
 v2:VenueV2Score;v3:VenueV2Score;constant:VenueV2Score;
 v2All:VenueV2Score;v2Rejected:VenueV2Score;
 insufficient:number;v2Neutral:number;disagreement:number;
 failedChecks:Record<VenueV3Check,VenueV3FailedCheck>;
};
export type VenueV3Report={fixtures:number;trainingEnd:string|null;validationStart:string|null;
 excludedAmbiguousDates:number;markets:VenueV3MarketReport[]};
const empty=():VenueV2Score=>({signals:0,correct:0,incorrect:0,over:0,under:0});
function record(to:VenueV2Score, call:'Over'|'Under', actualOver:boolean) {
 to.signals++;
 if(call==='Over')to.over++;else to.under++;
 if((call==='Over')===actualOver)to.correct++;else to.incorrect++;
}
export function evaluateVenueV3(data:Data,competition:string):VenueV3Report {
 const fixtures=data.matches.filter(m=>m.research&&m.competition===competition)
  .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const dates=[...new Set(fixtures.map(m=>m.date))];
 const boundary=Math.floor(2*dates.length/3);
 const validationStart=dates[boundary]??null;
 const trainingEnd=dates[boundary-1]??null;
 const markets:VenueV3MarketReport[]=venueV2Markets.map(m=>({id:m.id,label:m.label,line:m.line,
  baseline:null,trainingObserved:0,trainingOver:0,eligibleValidation:0,
  v2:empty(),v3:empty(),constant:empty(),v2All:empty(),v2Rejected:empty(),
  insufficient:0,v2Neutral:0,disagreement:0,
  failedChecks:Object.fromEntries(VENUE_V3_CHECKS.map(k=>[k,{rejections:0,v2Correct:0,v2Incorrect:0}])) as Record<VenueV3Check,VenueV3FailedCheck>}));
 let excludedAmbiguousDates=0;
 // Baseline direction uses development data only, not validation outcomes.
 for(const match of fixtures){
  if(match.research?.dateDiscrepancy){excludedAmbiguousDates++;continue;}
  if(validationStart!==null&&match.date>=validationStart)continue;
  for(let i=0;i<markets.length;i++){
   const market=venueV2Markets[i];
   const actual=matchTotal(match,market.metric,market.period);
   if(actual===null)continue;
   markets[i].trainingObserved++;
   if(actual>market.line)markets[i].trainingOver++;
  }
 }
 for(const m of markets)if(m.trainingObserved){
  m.baseline=m.trainingOver*2>=m.trainingObserved?'Over':'Under';
 }
 // V2 overall vs. V3 retained vs. V2 rejected measures whether the
 // *filter* improves selection, not merely whether V3 agrees with V2
 // on fixtures V3 kept (which is true by construction).
 // The constant comparator is scored only on V3-retained fixtures.
 for(const match of fixtures){
  if(match.research?.dateDiscrepancy||validationStart===null||match.date<validationStart)continue;
  for(let i=0;i<markets.length;i++){
   const market=venueV2Markets[i],report=markets[i];
   const actual=matchTotal(match,market.metric,market.period);
   if(actual===null) {report.insufficient++;continue;}
   report.eligibleValidation++;
   const v3=predictVenueV3(data,match,market);
   const over=actual>market.line;
   if(v3.v2Decision!=='Sem sinal')record(report.v2All,v3.v2Decision,over);
   if(v3.decision==='Sem sinal'){
    if(v3.v2Decision!=='Sem sinal') {
     record(report.v2Rejected,v3.v2Decision,over);
     const v2WasCorrect=(v3.v2Decision==='Over')===over;
     for(const check of v3.failedChecks){
      const bucket=report.failedChecks[check];
      bucket.rejections++;
      if(v2WasCorrect)bucket.v2Correct++;else bucket.v2Incorrect++;
     }
    }
    if(v3.reason==='insufficient_venue_history')report.insufficient++;
    else if(v3.reason==='v2_neutral')report.v2Neutral++;
    else report.disagreement++;
    continue;
   }
   record(report.v3,v3.decision,over);
   if(v3.v2Decision!=='Sem sinal')record(report.v2,v3.v2Decision,over);
   if(report.baseline!==null)record(report.constant,report.baseline,over);
  }
 }
 return {fixtures:fixtures.length,trainingEnd,validationStart,excludedAmbiguousDates,markets};
}
