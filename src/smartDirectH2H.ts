/** Confrontos diretos da Comparação Inteligente: identidade conservadora por liga.
 * Uma partida real é vista uma vez, ainda que os mandos estejam invertidos.
 * Nomes persistidos e outras competições nunca são alterados.
 */
import type {Match} from './model';
import {competitionParts} from './leagueCatalog';
import {basicTeamName,canonicalTeamInCompetition} from './radarTeamAliases';

export type DirectVenueMode='all'|'current';

/** Reuse only explicitly known aliases; never fuzzy-match clubs. */
export function comparisonTeamKey(name:string,competition:string):string{
 const league=competitionParts(competition).league;
 const literal=basicTeamName(name);
 for(const context of [league,league+' 2026/27',competition]){
  const candidate=canonicalTeamInCompetition(name,context);
  if(candidate!==literal)return candidate;
 }
 return literal;
}
/** Return the real index of each selected team, including reversed mandos. */
export function directMatchSides(
 match:Pick<Match,'home'|'away'>,home:string,away:string,
 teamKey:(id:string)=>string,mode:DirectVenueMode='all'
):readonly [number,number]|null{
 const h=teamKey(match.home),a=teamKey(match.away);
 if(h===home&&a===away)return [0,1];
 if(mode==='all'&&h===away&&a===home)return [1,0];
 return null;
}
