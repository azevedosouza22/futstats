import {stats, type Data, type Metric} from './model';
import {recentMatches} from './pregame';
import {radarMarkets, type RadarFixture} from './radar';

// Exploratory, fixed heuristic. Do not choose margins after viewing holdout outcomes.
export const VENUE_V2_LAST_GAMES = 10;
export const VENUE_V2_MIN_VALID_VENUE_GAMES = 3;
export const VENUE_V2_MARGIN_RATIO = 0.15;

export const venueV2Markets = radarMarkets.filter(m =>
  m.period === 'full' && (m.metric === 'goals' || m.metric === 'shots' || m.metric === 'target')
);

export type VenueV2Decision = 'Over' | 'Under' | 'Sem sinal';
export type VenueV2Prediction = {
  marketId: string;
  decision: VenueV2Decision;
  projectedTotal: number | null;
  margin: number;
  homeAtHomeValid: number;
  awayAtAwayValid: number;
  reason: 'ok' | 'insufficient_venue_history' | 'close_to_line';
};

function venuePair(matches: Data['matches'], side: 0 | 1, metric: Metric) {
  const values = matches.map(m => [stats(m,side,'full')[metric],stats(m,1-side,'full')[metric]])
    .filter((pair):pair is [number,number] => pair[0] !== null && pair[1] !== null);
  const valid = values.length;
  return {
    valid,
    forMean: valid ? values.reduce((n,v)=>n+v[0],0)/valid : null,
    againstMean: valid ? values.reduce((n,v)=>n+v[1],0)/valid : null,
  };
}

export function predictVenueV2(data: Data, fixture: RadarFixture, market: (typeof venueV2Markets)[number]): VenueV2Prediction {
  const homeTen = recentMatches(data.matches,fixture.home,10,fixture.date,{competition:fixture.competition});
  const awayTen = recentMatches(data.matches,fixture.away,10,fixture.date,{competition:fixture.competition});
  const home = venuePair(homeTen.filter(m=>m.home===fixture.home),0,market.metric);
  const away = venuePair(awayTen.filter(m=>m.away===fixture.away),1,market.metric);
  const margin = market.line*VENUE_V2_MARGIN_RATIO;
  const base = {
    marketId:market.id,margin,
    homeAtHomeValid:home.valid,awayAtAwayValid:away.valid,
  };
  if(home.valid<VENUE_V2_MIN_VALID_VENUE_GAMES ||
    away.valid<VENUE_V2_MIN_VALID_VENUE_GAMES ||
    home.forMean===null||home.againstMean===null||away.forMean===null||away.againstMean===null) {
    return {...base,decision:'Sem sinal',projectedTotal:null,reason:'insufficient_venue_history'};
  }
  // Estimate contributions using attack-for and opponent-conceded means in
  // equivalent venues. Only dated matches strictly prior to kickoff are used.
  const projectedTotal =
    (home.forMean+away.againstMean)/2+(away.forMean+home.againstMean)/2;
  const decision = projectedTotal > market.line + margin ? 'Over'
    : projectedTotal < market.line - margin ? 'Under' : 'Sem sinal';
  return {...base,decision,projectedTotal,reason:decision==='Sem sinal'?'close_to_line':'ok'};
}
