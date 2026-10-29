import {researchDateBefore} from './model';
import type {Data} from './model';
import {radarMarkets,matchTotal} from './radar';
import {duplicateRadarFixtureIds} from './radarFixtureUniqueness';

/**
 * Observed full-match averages for the exact competition and season label.
 * Exclude fixtures on/after the analyzed day, any ambiguous source date,
 * unfinished external results and duplicate match IDs.
 *
 * These are descriptive averages only, not probabilities or odds.
 */
export type LeagueNumericMarket = {id:string; mean:number|null; observed:number};

export function leagueNumericContext(
  data:Data,competition:string,beforeDate:string
):LeagueNumericMarket[]{
  const excluded=duplicateRadarFixtureIds(data.matches,competition,beforeDate);
  const seen=new Set<string>();
  const valid=data.matches.filter(m=>{
    if(m.competition.trim()!==competition.trim()||m.date>=beforeDate||
      m.research?.dateDiscrepancy||
      !researchDateBefore(m,beforeDate)||
      (m.external&&!['FT','Match Finished'].includes(m.external.status))||
      seen.has(m.id)||excluded.has(m.id))return false;
    seen.add(m.id);
    return true;
  });
  return radarMarkets.filter(m=>m.period==='full'&&
    ['goals','shots','target','corners'].includes(m.metric)).map(market=>{
    const totals=valid.map(match=>matchTotal(match,market.metric,'full'))
      .filter((v):v is number=>v!==null);
    return {
      id:market.id,
      mean:totals.length?totals.reduce((a,b)=>a+b,0)/totals.length:null,
      observed:totals.length,
    };
  });
}

