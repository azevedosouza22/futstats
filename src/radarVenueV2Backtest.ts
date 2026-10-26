import type {Data} from './model';
import {matchTotal} from './radar';
import {predictVenueV2,venueV2Markets,type VenueV2Decision} from './radarVenueV2';
import {duplicateRadarFixtureIds} from './radarFixtureUniqueness';

export type VenueV2Score={signals:number;correct:number;incorrect:number;over:number;under:number};
export type VenueV2MarketReport={
 id:string;label:string;line:number;
 evaluated:number;missing:number;neutral:number;
 development:VenueV2Score;
 validation:VenueV2Score;
 constant:VenueV2Score;
 baseline:'Over'|'Under'|null;
 trainingObserved:number;trainingOver:number;
};
export type VenueV2Report={
 fixtureCount:number;
 excludedAmbiguousDates:number;
 excludedDuplicateFixtureRows:number;
 developmentEnd:string|null;
 validationStart:string|null;
 markets:VenueV2MarketReport[];
};

const empty=():VenueV2Score=>({signals:0,correct:0,incorrect:0,over:0,under:0});
function add(score:VenueV2Score,decision:Exclude<VenueV2Decision,'Sem sinal'>,over:boolean){
 score.signals++;
 if(decision==='Over')score.over++;else score.under++;
 if((decision==='Over')===over)score.correct++;else score.incorrect++;
}
export function evaluateVenueV2(data:Data,competition:string):VenueV2Report {
 const suspicious=duplicateRadarFixtureIds(data.matches,competition,'9999-12-31');
 const matches=data.matches.filter(m=>m.research&&m.competition===competition&&
   !suspicious.has(m.id))
  .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 // Use a calendar-day split, so matches from the same day never straddle the boundary.
 const dates=[...new Set(matches.map(m=>m.date))];
 const boundary=Math.floor(dates.length*2/3);
 const splitDate=dates[boundary]??null;
 const developmentEnd=dates[boundary-1]??null;
 const reports:VenueV2MarketReport[]=venueV2Markets.map(m=>({
  id:m.id,label:m.label,line:m.line,evaluated:0,missing:0,neutral:0,
  development:empty(),validation:empty(),constant:empty(),
  baseline:null,trainingObserved:0,trainingOver:0,
 }));
 let excludedAmbiguousDates=0;
 for(const match of matches){
  if(match.research?.dateDiscrepancy){excludedAmbiguousDates++;continue;}
  const validation=splitDate!==null&&match.date>=splitDate;
  for(let i=0;i<venueV2Markets.length;i++){
   const market=venueV2Markets[i],report=reports[i];
   const actual=matchTotal(match,market.metric,market.period);
   if(actual===null){report.missing++;continue;}
   report.evaluated++;
   const over=actual>market.line;
   if(!validation){report.trainingObserved++;if(over)report.trainingOver++;}
   const prediction=predictVenueV2(data,match,market);
   if(prediction.decision==='Sem sinal'){
    if(prediction.reason==='insufficient_venue_history')report.missing++;
    else report.neutral++;
    continue;
   }
   add(validation?report.validation:report.development,prediction.decision,over);
  }
 }
 // The constant comparator is selected ONLY from known results in development.
 // Because evaluation is a later, separate pass, it cannot use held-out results.
 for(const report of reports){
  if(report.trainingObserved>0)report.baseline=report.trainingOver*2>=report.trainingObserved?'Over':'Under';
 }
 // Compare on exactly the same VALIDATION fixtures where the venue model emitted a signal.
 for(const match of matches){
  if(match.research?.dateDiscrepancy||splitDate===null||match.date<splitDate)continue;
  for(let i=0;i<venueV2Markets.length;i++){
   const market=venueV2Markets[i],report=reports[i];
   if(report.baseline===null)continue;
   const actual=matchTotal(match,market.metric,market.period);
   if(actual===null)continue;
   const signal=predictVenueV2(data,match,market);
   if(signal.decision==='Sem sinal')continue;
   add(report.constant,report.baseline,actual>market.line);
  }
 }
 return {fixtureCount:matches.length,excludedAmbiguousDates,
  excludedDuplicateFixtureRows:suspicious.size,
  developmentEnd,validationStart:splitDate,markets:reports};
}
