/**
 * Experimental, private-only, CC0 European leagues research catalogue.
 * Uses OpenFootball (public domain) for *scores* only. This module never
 * modifies the FutStats match history or Radar's saved forecasts.
 */
export const EUROPE_CC0_LICENSE='https://github.com/openfootball/football.json/blob/master/LICENSE.md';
export const EUROPE_RESEARCH_STORAGE='futstats:europe-research-cc0:v1';
export const EUROPE_LEAGUES=[
 {id:'serie-a',name:'Serie A italiana',competition:'Serie A italiana 2026/27',sourceName:'Italian Serie A 2026/27',
  url:'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/it.1.json',
  page:'https://github.com/openfootball/football.json/blob/master/2026-27/it.1.json',
  rounds:38,fixtures:380},
 {id:'la-liga',name:'La Liga espanhola',competition:'La Liga espanhola 2026/27',sourceName:'Spain Primera División 2026/27',
  url:'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/es.1.json',
  page:'https://github.com/openfootball/football.json/blob/master/2026-27/es.1.json',
  rounds:38,fixtures:380},
 {id:'ligue-1',name:'Ligue 1 francesa',competition:'Ligue 1 francesa 2026/27',sourceName:'French Ligue 1 2026/27',
  url:'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/fr.1.json',
  page:'https://github.com/openfootball/football.json/blob/master/2026-27/fr.1.json',
  rounds:34,fixtures:306}
] as const;
export type EuropeLeagueId=typeof EUROPE_LEAGUES[number]['id'];
export type ResultPair=[number,number];
export type EuropeMatch={
 id:string;league:EuropeLeagueId;competition:string;date:string;round:number;
 home:string;away:string;
 full:ResultPair|null;half:ResultPair|null;second:ResultPair|null;
};
export type EuropeanLeagueCatalog={
 league:EuropeLeagueId;matches:EuropeMatch[];completed:number;withHalves:number;
 lastResultDate:string|null;
};
export type StoredEuropeanResearch={
 format:'futstats:europe-research-cc0:v1';matches:EuropeMatch[];
};
const isObj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const validDate=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&
 !Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const validScore=(s:unknown):s is ResultPair=>Array.isArray(s)&&s.length===2&&
 s.every(v=>Number.isSafeInteger(v)&&v>=0&&v<=50);
const team=(t:unknown):t is string=>typeof t==='string'&&t.trim().length>0&&t.length<=120;
const findDef=(id:EuropeLeagueId)=>EUROPE_LEAGUES.find(x=>x.id===id)!;
const dateRoundId=(league:EuropeLeagueId,round:number,date:string,h:string,a:string)=>
 [league,round,date,h.toLowerCase(),a.toLowerCase()].join('|');

export function parseEuropeanLeague(source:unknown,league:EuropeLeagueId):EuropeanLeagueCatalog {
 const def=findDef(league);
 if(!isObj(source)||source.name!==def.sourceName||!Array.isArray(source.matches)||
    source.matches.length!==def.fixtures)
  throw Error('Fonte pública não retornou os '+def.fixtures+' jogos esperados da '+def.name+'.');
 const ids=new Set<string>(),clubs=new Set<string>(),matches:EuropeMatch[]=[];
 for(const item of source.matches){
  if(!isObj(item)||!team(item.team1)||!team(item.team2)||item.team1===item.team2||
    !validDate(item.date)||typeof item.round!=='string')
   throw Error('Data ou identidade de partida inválida em '+def.name+'.');
  const match=/^Matchday (\d{1,2})$/.exec(item.round);
  const round=Number(match?.[1]);
  if(!match||round<1||round>def.rounds)throw Error('Rodada inválida na fonte '+def.name+'.');
  const id=dateRoundId(league,round,item.date,item.team1,item.team2);
  if(ids.has(id))throw Error('Partida duplicada na fonte pública.');
  ids.add(id);clubs.add(item.team1);clubs.add(item.team2);
  let full:ResultPair|null=null,half:ResultPair|null=null,second:ResultPair|null=null;
  if(item.score!==undefined&&item.score!==null){
   if(Array.isArray(item.score)){
    // OpenFootball sometimes publishes [0,0] without the final-time marker.
    // This is an unconfirmed placeholder, NOT a proven goalless draw.
    if(!validScore(item.score))throw Error('Placar provisório inválido.');
   }else{
   if(!isObj(item.score))throw Error('Formato de placar desconhecido.');
   if(item.score.ft!==undefined){
    if(!validScore(item.score.ft))throw Error('Placar final malformado.');
    full=[item.score.ft[0],item.score.ft[1]];
    if(item.score.ht!==undefined){
     if(!validScore(item.score.ht)||
       item.score.ht.some((v,i)=>v>full![i]))
      throw Error('Placar de intervalo divergente do placar final.');
     half=[item.score.ht[0],item.score.ht[1]];
     second=[full[0]-half[0],full[1]-half[1]];
    }
   } else if(item.score.ht!==undefined) {
    // No final score: never mark as finished, nor treat HT as full time.
    if(!validScore(item.score.ht))throw Error('Intervalo malformado.');
   }
   }
  }
  matches.push({id,league,competition:def.competition,date:item.date,round,
   home:item.team1,away:item.team2,full,half,second});
 }
 if(clubs.size!== (league==='ligue-1'?18:20))
  throw Error('Quantidade inesperada de clubes: '+clubs.size+'.');
 matches.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const done=matches.filter(m=>m.full!==null);
 return {league,matches,completed:done.length,withHalves:done.filter(m=>m.half!==null).length,
  lastResultDate:done.length?done[done.length-1].date:null};
}
export function eligibleEuropeanResults(catalogs:EuropeanLeagueCatalog[],today:string):EuropeMatch[]{
 if(!validDate(today))throw Error('Data de comparação inválida.');
 return catalogs.flatMap(c=>c.matches).filter(m=>
  m.full!==null&&m.half!==null&&m.second!==null&&m.date<=today);
}
function validResearchMatch(item:unknown):item is EuropeMatch{
 if(!isObj(item)||!EUROPE_LEAGUES.some(l=>l.id===item.league)||
  !validDate(item.date)||typeof item.round!=='number'||!Number.isSafeInteger(item.round)||
  !team(item.home)||!team(item.away)||typeof item.id!=='string'||
  item.id!==dateRoundId(item.league as EuropeLeagueId,item.round,item.date,item.home,item.away)||
  !validScore(item.full)||!validScore(item.half)||!validScore(item.second))
  return false;
 const first=item.half,second=item.second,full=item.full;
 if(!validScore(first)||!validScore(second)||!validScore(full)||
    first.some((n,i)=>n+second[i]!==full[i]))return false;
 const def=findDef(item.league as EuropeLeagueId);
 return item.round>=1&&item.round<=def.rounds&&item.competition===def.competition;
}
export function readStoredEuropeanResearch(value:string|null):StoredEuropeanResearch{
 if(value===null)return {format:EUROPE_RESEARCH_STORAGE,matches:[]};
 let parsed:unknown;
 try{parsed=JSON.parse(value);}catch{throw Error('Base experimental não pôde ser lida. Não sobrescreva seus dados.');}
 if(!isObj(parsed)||parsed.format!==EUROPE_RESEARCH_STORAGE||
  !Array.isArray(parsed.matches)||parsed.matches.length>1100||
  !parsed.matches.every(validResearchMatch)||
  new Set(parsed.matches.map((m:EuropeMatch)=>m.id)).size!==parsed.matches.length)
  throw Error('Base experimental inconsistente. Nenhum dado será alterado.');
 return {format:EUROPE_RESEARCH_STORAGE,matches:parsed.matches as EuropeMatch[]};
}
export function stageEuropeanResults(
 current:StoredEuropeanResearch,entries:EuropeMatch[]
):{next:StoredEuropeanResearch;added:number;duplicates:number;conflicts:number}{
 // Revalidate caller input; no accidental writes to source history.
 readStoredEuropeanResearch(JSON.stringify(current));
 if(!entries.every(validResearchMatch)||entries.length>1100)throw Error('Lote experimental inválido.');
 const next:StoredEuropeanResearch={format:EUROPE_RESEARCH_STORAGE,matches:[...current.matches]};
 const existing=new Map(next.matches.map(m=>[m.id,m]));
 let added=0,duplicates=0,conflicts=0;
 for(const item of entries){
  const old=existing.get(item.id);
  if(!old){existing.set(item.id,item);next.matches.push(item);added++;}
  else if(JSON.stringify(old)===JSON.stringify(item))duplicates++;
  else conflicts++;
 }
 if(next.matches.length>1100)throw Error('Limite de armazenamento da pesquisa atingido.');
 if(conflicts)throw Error(conflicts+' partida(s) tiveram valores alterados na fonte. Não houve substituição.');
 readStoredEuropeanResearch(JSON.stringify(next));
 return {next,added,duplicates,conflicts};
}
