import type {Data,Team} from './model';

/** Only the matches from the exact competition/season identify its participating clubs.
 * Does not mutate the base or rely on team names (which may repeat).
 */
export function teamsInCompetition(data:Data,competition:string):Team[]{
 if(!competition)return [];
 const ids=new Set(data.matches.filter(m=>m.competition.trim()===competition.trim()).flatMap(m=>[m.home,m.away]));
 return data.teams.filter(t=>ids.has(t.id)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
}
