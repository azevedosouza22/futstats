/** Etapa 81 — historical Work research catalog, separate from device storage.
 * A static, immutable preview asset. Never writes localStorage, app history,
 * frozen Radar forecasts, or automated As Boas. Requires BOTH assets.
 */
import {validData,type Data,type Match,type Stats} from './model';
import {competitionParts} from './leagueCatalog';
import {normalizeTeam} from './calendar';

export const RESEARCH_COUNTS={consolidated:951,rounds:68,total:1019} as const;
export type ResearchCatalog={
  data:Data;total:number;dateConflicts:number;
  leagues:{competition:string;count:number}[];
};
const leagueByTag:Record<string,string>={
 BR:'Brasileirão Série A 2026',
 BL:'Bundesliga 2026/27',
 LL:'La Liga espanhola 2026/27',
 PL:'Premier League inglesa 2026/27',
 SA:'Serie A italiana 2026/27',
 L1:'Ligue 1 francesa 2026/27'
};
const metrics=['goals','shots','target','corners'] as const;
const validDate=(s:string)=>/^20\d\d-\d\d-\d\d$/.test(s)&&
 !Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const identity=(league:string,name:string)=>
 competitionParts(league).league+'|'+normalizeTeam(name);
const statsAt=(ns:number[],period:0|1|2,side:0|1):Stats=>{
 const n=period*8+side*4;
 return {goals:ns[n],shots:ns[n+1],target:ns[n+2],
   corners:ns[n+3],yellow:null,red:null};
};
const isObj=(x:unknown):x is Record<string,unknown>=>
 !!x&&typeof x==='object'&&!Array.isArray(x);

export function parseResearchCatalog(main:unknown,compact:string):ResearchCatalog{
 if(!isObj(main)||main.format!=='futstats-work-research-2026-10-27'||
    main.version!==1||!isObj(main.data)||!validData(main.data)||
    main.data.matches.length!==RESEARCH_COUNTS.consolidated)
  throw Error('Arquivo consolidado de pesquisa inválido ou incompleto.');
 const source=main.data as Data;
 const teams=[...source.teams],matches=[...source.matches];
 const teamNames=new Map(source.teams.map(t=>[t.id,t.name]));
 const identities=new Map<string,string>();
 for(const m of source.matches){
   const a=teamNames.get(m.home),b=teamNames.get(m.away);
   if(!a||!b||!m.research||m.research.source!=='Flashscore')
     throw Error('Origem incompleta no histórico consolidado.');
   identities.set(identity(m.competition,a),m.home);
   identities.set(identity(m.competition,b),m.away);
 }
 const matchIds=new Set(matches.map(m=>m.id));
 const sourceIds=new Set(matches.map(m=>m.research!.sourceId));
 function getId(competition:string,name:string){
   const key=identity(competition,name);
   const existing=identities.get(key);if(existing)return existing;
   const id='work-round-team-'+(teams.length+1);
   teams.push({id,name,color:'#557e8d'});identities.set(key,id);
   return id;
 }
 const rows=compact.trim().split(/\r?\n/).filter(Boolean);
 if(rows.length!==RESEARCH_COUNTS.rounds)
   throw Error('Rodadas recentes incompletas; a pesquisa não será carregada.');
 for(const [index,row] of rows.entries()){
  const fields=row.split('|');
  if(fields.length!==8)throw Error('Estrutura da rodada '+(index+1)+' inválida.');
  const [tag,sourceId,date,titleDate,homeName,awayName,numbers,relativeUrl]=fields;
  const competition=leagueByTag[tag];
  if(!competition||!/^[-_a-zA-Z0-9]{3,80}$/.test(sourceId)||
     !validDate(date)||(titleDate!==''&&!validDate(titleDate))||
     !homeName||!awayName||!relativeUrl.startsWith('/jogo/futebol/')||
     !relativeUrl.endsWith('?mid='+sourceId)||
     matchIds.has('research-'+sourceId)||sourceIds.has(sourceId))
      throw Error('Partida recente com identidade, data ou origem inválida.');
  const ns=numbers.split(',').map(Number);
  if(ns.length!==24||ns.some(n=>!Number.isSafeInteger(n)||n<0))
    throw Error('Números inválidos na rodada '+(index+1));
  for(let side=0;side<=1;side++)for(let metric=0;metric<4;metric++){
    const all=ns[side*4+metric],first=ns[8+side*4+metric],
      second=ns[16+side*4+metric];
    if(all!==first+second)throw Error('Inconsistência entre períodos: '+sourceId);
  }
  for(let side=0;side<=1;side++)for(let per=0;per<=2;per++){
    const offset=per*8+side*4;
    if(ns[offset+2]>ns[offset+1])throw Error('Chutes no gol excedem finalizações.');
  }
  const match:Match={
   id:'research-'+sourceId,home:getId(competition,homeName),
   away:getId(competition,awayName),date,competition,
   first:[statsAt(ns,1,0),statsAt(ns,1,1)],
   second:[statsAt(ns,2,0),statsAt(ns,2,1)],
   research:{
    provider:'work-csv',source:'Flashscore',sourceId,
    sourceUrl:'https://www.flashscore.com.br'+relativeUrl,
    importedAt:'2026-10-27T00:00:00Z',
    full:[statsAt(ns,0,0),statsAt(ns,0,1)],
    titleDate:titleDate||date,dateDiscrepancy:!!titleDate&&titleDate!==date
   }
  };
  matchIds.add(match.id);sourceIds.add(sourceId);matches.push(match);
 }
 const data:Data={teams,matches};
 if(matches.length!==RESEARCH_COUNTS.total||!validData(data))
   throw Error('Catálogo de pesquisa não passou pela validação de integridade.');
 const counts=new Map<string,number>();
 for(const m of matches)counts.set(m.competition,(counts.get(m.competition)??0)+1);
 const leagues=[...counts].map(([competition,count])=>({competition,count}))
   .sort((a,b)=>a.competition.localeCompare(b.competition,'pt-BR'));
 return {data,total:matches.length,
   dateConflicts:matches.filter(m=>m.research?.dateDiscrepancy).length,leagues};
}
export async function loadResearchCatalog(signal?:AbortSignal):Promise<ResearchCatalog>{
 const base='/'; // FutStats V4 is served at site root in the preview.
 const [main,recent]=await Promise.all([
  fetch(base+'research/partidas-work-951-v1.json',{signal,cache:'no-store'}),
  fetch(base+'research/partidas-work-extras-68-v1.txt',{signal,cache:'no-store'})
 ]);
 if(!main.ok||!recent.ok)throw Error('Arquivos de pesquisa indisponíveis.');
 return parseResearchCatalog(await main.json() as unknown,await recent.text());
}
