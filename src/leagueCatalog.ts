import type {Match} from './model';

export const ALL_LEAGUES='all';
export const NO_LEAGUE='Sem competição';
export const NO_SEASON='Sem temporada';

/**
 * Keep the original competition string untouched in every match/backup.
 * This is only a presentation filter, never a destructive migration.
 */
export function competitionParts(value:string):{league:string;season:string}{
 const label=value.trim().replace(/\s+/g,' ');
 if(!label)return {league:NO_LEAGUE,season:NO_SEASON};
 const matched=label.match(/^(.*?)\s+(20\d{2}(?:\/(?:20)?\d{2})?)$/);
 if(matched&&matched[1].trim())return {league:matched[1].trim(),season:matched[2]};
 return {league:label,season:NO_SEASON};
}

const order=(a:string,b:string)=>a.localeCompare(b,'pt-BR');
export function leagueOptions(matches:Match[]):string[]{
 return [...new Set(matches.map(m=>competitionParts(m.competition).league))].sort(order);
}
export function seasonOptions(matches:Match[],league:string):string[]{
 return [...new Set(matches.filter(m=>league===ALL_LEAGUES||
   competitionParts(m.competition).league===league)
   .map(m=>competitionParts(m.competition).season))].sort((a,b)=>b.localeCompare(a,'pt-BR'));
}
export function filterMatchesByLeague(matches:Match[],league:string,season:string):Match[]{
 return matches.filter(m=>{
   const item=competitionParts(m.competition);
   return (league===ALL_LEAGUES||item.league===league)&&
     (season===ALL_LEAGUES||item.season===season);
 });
}
export function paginateMatches<T>(items:T[],page:number,perPage=20){
 const count=Math.max(1,Math.ceil(items.length/perPage));
 const current=Math.min(count,Math.max(1,Math.trunc(page)||1));
 return {page:current,pages:count,total:items.length,items:items.slice((current-1)*perPage,current*perPage)};
}
