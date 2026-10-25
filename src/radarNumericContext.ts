import {stats,type Data} from './model';
import {radarMarkets} from './radar';

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
  const seen=new Set<string>();
  const valid=data.matches.filter(m=>{
    if(m.competition.trim()!==competition.trim()||m.date>=beforeDate||
      (m.research?.titleDate!==undefined&&m.research.titleDate>=beforeDate)||
      (m.external&&!['FT','Match Finished'].includes(m.external.status))||
      seen.has(m.id))return false;
    seen.add(m.id);
    return true;
  });
  return radarMarkets.filter(m=>m.period==='full'&&
    ['goals','shots','target','corners'].includes(m.metric)).map(market=>{
    const totals=valid.map(match=>{
      const home=stats(match,0,'full')[market.metric];
      const away=stats(match,1,'full')[market.metric];
      return home===null||away===null?null:home+away;
    }).filter((v):v is number=>v!==null);
    return {
      id:market.id,
      mean:totals.length?totals.reduce((a,b)=>a+b,0)/totals.length:null,
      observed:totals.length,
    };
  });
}
