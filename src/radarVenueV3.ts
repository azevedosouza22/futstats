import {type Data} from './model';
import {recentRadarMatches} from './radarFixtureUniqueness';
import {matchTotal, type RadarFixture} from './radar';
import {predictVenueV2,venueV2Markets,type VenueV2Decision} from './radarVenueV2';

// Exploratory confirmation, specified independently of the validation games.
// All inputs end STRICTLY before the fixture date. No odds or outcomes are used.
export const VENUE_V3_MIN_GAMES=3;
export const VENUE_V3_OVER_FREQUENCY=0.6;
export const VENUE_V3_UNDER_FREQUENCY=0.4;
export const VENUE_V3_VENUE_MEAN_MARGIN=0.05;

export const VENUE_V3_CHECKS = ['homeMean','awayMean','homeFrequency','awayFrequency'] as const;
export type VenueV3Check = typeof VENUE_V3_CHECKS[number];

export type VenueV3Prediction={
  marketId:string;decision:VenueV2Decision;
  v2Decision:VenueV2Decision;
  homeCount:number;awayCount:number;
  homeOverRate:number|null;awayOverRate:number|null;
  homeMean:number|null;awayMean:number|null;
  projectedTotal:number|null;
  reason:'insufficient_venue_history'|'v2_neutral'|'venue_disagreement'|'confirmed';
  failedChecks: VenueV3Check[];
};

function summarize(history:Data['matches'], market:(typeof venueV2Markets)[number]){
  const totals=history.map(m=>matchTotal(m,market.metric,market.period))
    .filter((x):x is number=>x!==null);
  const count=totals.length;
  return {count,mean:count?totals.reduce((a,b)=>a+b,0)/count:null,
    overRate:count?totals.filter(x=>x>market.line).length/count:null};
}

export function predictVenueV3(
  data:Data,fixture:RadarFixture,market:(typeof venueV2Markets)[number],
):VenueV3Prediction {
  const v2=predictVenueV2(data,fixture,market);
  const homeHistory=recentRadarMatches(data,fixture.home,10,fixture)
    .filter(m=>m.home===fixture.home);
  const awayHistory=recentRadarMatches(data,fixture.away,10,fixture)
    .filter(m=>m.away===fixture.away);
  const home=summarize(homeHistory,market);
  const away=summarize(awayHistory,market);
  const info={marketId:market.id,v2Decision:v2.decision,projectedTotal:v2.projectedTotal,
    homeCount:home.count,awayCount:away.count,
    homeOverRate:home.overRate,awayOverRate:away.overRate,
    homeMean:home.mean,awayMean:away.mean};
  if(home.count<VENUE_V3_MIN_GAMES||away.count<VENUE_V3_MIN_GAMES||
    v2.reason==='insufficient_venue_history'){
    return {...info,decision:'Sem sinal',reason:'insufficient_venue_history',failedChecks:[]};
  }
  if(v2.decision==='Sem sinal'){
    return {...info,decision:'Sem sinal',reason:'v2_neutral',failedChecks:[]};
  }
  // Record each violated condition separately; one rejected V2 prediction can
  // violate multiple conditions. These diagnostics do NOT change model decisions.
  const over=v2.decision==='Over';
  const meanLimit=market.line*(over?1+VENUE_V3_VENUE_MEAN_MARGIN:1-VENUE_V3_VENUE_MEAN_MARGIN);
  const frequencyLimit=over?VENUE_V3_OVER_FREQUENCY:VENUE_V3_UNDER_FREQUENCY;
  const failedChecks:VenueV3Check[]=[];
  if(home.mean===null||(over?home.mean<=meanLimit:home.mean>=meanLimit))
    failedChecks.push('homeMean');
  if(away.mean===null||(over?away.mean<=meanLimit:away.mean>=meanLimit))
    failedChecks.push('awayMean');
  if(home.overRate===null||(over?home.overRate<frequencyLimit:home.overRate>frequencyLimit))
    failedChecks.push('homeFrequency');
  if(away.overRate===null||(over?away.overRate<frequencyLimit:away.overRate>frequencyLimit))
    failedChecks.push('awayFrequency');
  return failedChecks.length===0
    ? {...info,decision:v2.decision,reason:'confirmed',failedChecks}
    : {...info,decision:'Sem sinal',reason:'venue_disagreement',failedChecks};
}
