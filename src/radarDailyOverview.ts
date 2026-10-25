import type {Data} from './model';
import {type ScheduledFixture} from './calendar';
import {resolveCalendarFixture} from './radarCalendarSelection';
import {radarUpcoming} from './radar';
import {leagueNumericContext} from './radarNumericContext';
import {captureVenuePredictions} from './radarProspective';

export const DAILY_INDICATORS=[
  {id:'goals-full-2.5',name:'Gols'},
  {id:'shots-full-24.5',name:'Finalizações'},
  {id:'target-full-7.5',name:'Chutes no gol'},
  {id:'corners-full-8.5',name:'Escanteios'},
] as const;

type Signal='Over'|'Under'|'Sem sinal';

export type DailyIndicator={
  id:string;name:string;line:number;
  historicalMean:number|null;historicalSample:number;
  leagueMean:number|null;leagueSample:number;
  projectedTotal:number|null;
  v2:Signal|null;v3:Signal|null;
};

export type RadarDailyOverview={
  homeCount:number;awayCount:number;
  hasKickoffTime:boolean;
  indicators:DailyIndicator[];
};

/**
 * Descriptive read-only overview; only previously recorded matches.
 * No prediction is registered, no league/season merged and no market signals
 * are synthesized where the existing V2/V3 models don't support a market.
 */
export function buildRadarDailyOverview(data:Data,f:ScheduledFixture):RadarDailyOverview|null {
  const selection=resolveCalendarFixture(data,f);
  if(!selection)return null;
  const fixture={home:selection.homeId,away:selection.awayId,date:f.date,competition:f.competition};
  const history=radarUpcoming(data,fixture);
  const league=leagueNumericContext(data,f.competition,f.date);
  const venues=captureVenuePredictions(data,fixture);
  return {
    homeCount:history.homeHistory.length,
    awayCount:history.awayHistory.length,
    hasKickoffTime:selection.hasKickoffTime,
    indicators:DAILY_INDICATORS.map(item=>{
      const previous=history.markets.find(m=>m.id===item.id);
      const leagueRow=league.find(m=>m.id===item.id);
      const projection=venues.find(m=>m.marketId===item.id);
      return {
        id:item.id,name:item.name,line:previous?.line??0,
        historicalMean:previous?.historicalMean??null,
        historicalSample:previous?.observed??0,
        leagueMean:leagueRow?.mean??null,leagueSample:leagueRow?.observed??0,
        projectedTotal:projection?.projectedTotal??null,
        v2:projection?.v2??null,v3:projection?.v3??null,
      };
    }),
  };
}
