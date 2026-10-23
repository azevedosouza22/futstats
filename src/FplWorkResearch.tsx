import type {FplPilotGame} from './fplFreePilot';
export default function FplWorkResearch({games,onStoredCount}:{games:FplPilotGame[];onStoredCount:(n:number)=>void}){
 void onStoredCount;
 return <section><h3>Pesquisa Work · Premier League</h3><p>{games.length} jogos do piloto disponíveis.</p></section>;
}
