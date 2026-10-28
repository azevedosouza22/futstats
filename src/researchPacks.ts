/** Optional per-league / per-season research packs (READ ONLY).
 * The original 951+68 matches stay immutable. Nothing touches browser storage.
 * For now, only the already-audited full-period Flashscore research schema is
 * supported. Missing metrics from other public datasets must not be invented.
 */
import {validData,type Data,type Match,type Team} from './model';
import {competitionParts,NO_SEASON} from './leagueCatalog';
import {normalizeTeam} from './calendar';
import type {ResearchCatalog} from './researchCatalog';

type PackEntry={file:string;competition:string;count:number};
type PackManifest={format:string;version:number;packs:PackEntry[]};
type PackFile={format:string;version:number;competition:string;data:Data};
const indexPath='/research/packs/manifest-v1.json';
const isObj=(x:unknown):x is Record<string,unknown>=>
 !!x&&typeof x==='object'&&!Array.isArray(x);
const fingerprint=(m:Match,names:Map<string,string>)=>[
 m.competition,m.date,normalizeTeam(names.get(m.home)??''),
 normalizeTeam(names.get(m.away)??'')
].join('|');

export function parseResearchPackManifest(raw:unknown):PackEntry[]{
 if(!isObj(raw)||raw.format!=='futstats-research-packs-v1'||
  raw.version!==1||!Array.isArray(raw.packs)||raw.packs.length>100)
  throw Error('Índice de expansão histórica inválido.');
 const result:PackEntry[]=[];
 const seen=new Set<string>();
 for(const item of raw.packs){
  if(!isObj(item)||typeof item.file!=='string'||
   !/^[a-z0-9][a-z0-9_-]*\.json$/.test(item.file)||
   seen.has(item.file)||typeof item.competition!=='string'||
   !item.competition.trim()||item.competition.length>150||
   competitionParts(item.competition).season===NO_SEASON||
   (typeof item.count!=='number'||!Number.isSafeInteger(item.count)||item.count<1||item.count>1200))
   throw Error('Pacote histórico sem nome, temporada ou quantidade válida.');
  seen.add(item.file);
  result.push({file:item.file,competition:item.competition,count:item.count as number});
 }
 return result;
}
export function mergeResearchPacks(
 baseline:ResearchCatalog, entries:PackEntry[], rawFiles:unknown[]
):ResearchCatalog{
 if(entries.length!==rawFiles.length)throw Error('Há pacotes de pesquisa ausentes.');
 const teams:Team[]=[...baseline.data.teams];
 const matches:Match[]=[...baseline.data.matches];
 const names=new Map(teams.map(t=>[t.id,t.name]));
 const canonical=new Map(teams.map(t=>[
  competitionParts(
   baseline.data.matches.find(m=>m.home===t.id||m.away===t.id)?.competition??''
  ).league+'|'+normalizeTeam(t.name),t.id
 ]));
 const matchIds=new Set(matches.map(m=>m.id));
 const sourceIds=new Set(matches.map(m=>m.research?.sourceId).filter(Boolean));
 const fingerprints=new Set(matches.map(m=>fingerprint(m,names)));
 let nextTeam=0;
 for(let index=0;index<entries.length;index++){
  const entry=entries[index],file=rawFiles[index];
  if(!isObj(file)||file.format!=='futstats-research-season-v1'||
   file.version!==1||file.competition!==entry.competition||
   !isObj(file.data)||!validData(file.data)||
   file.data.matches.length!==entry.count)
   throw Error('Pacote de pesquisa inválido: '+entry.file);
  const data=file.data as Data;
  const fromNames=new Map(data.teams.map(t=>[t.id,t.name]));
  const idMap=new Map<string,string>();
  for(const t of data.teams){
   const k=competitionParts(entry.competition).league+'|'+normalizeTeam(t.name);
   if(!normalizeTeam(t.name))throw Error('Equipe sem nome no pacote.');
   let id=canonical.get(k);
   if(!id){
    do{id='research-pack-team-'+(++nextTeam)}while(names.has(id));
    teams.push({...t,id});names.set(id,t.name);canonical.set(k,id);
   }
   idMap.set(t.id,id);
  }
  for(const m of data.matches){
   if(m.competition!==entry.competition||!m.research||
    m.research.source!=='Flashscore'||m.research.provider!=='work-csv')
    throw Error('Partida sem origem Flashscore validada: '+entry.file);
   const home=idMap.get(m.home),away=idMap.get(m.away);
   if(!home||!away||home===away||matchIds.has(m.id)||
    sourceIds.has(m.research.sourceId))
    throw Error('Partida repetida ou equipe inválida: '+entry.file);
   const copy={...m,home,away};
   const key=fingerprint(copy,names);
   if(fingerprints.has(key))
    throw Error('Confronto já registrado; revisar duplicação: '+entry.file);
   matches.push(copy);matchIds.add(copy.id);
   sourceIds.add(copy.research.sourceId);fingerprints.add(key);
  }
 }
 const data:Data={teams,matches};
 if(!validData(data))throw Error('Integridade geral dos pacotes inválida.');
 const counts=new Map<string,number>();
 for(const m of matches)counts.set(m.competition,(counts.get(m.competition)??0)+1);
 return {data,total:matches.length,
  dateConflicts:matches.filter(m=>m.research?.dateDiscrepancy).length,
  leagues:[...counts].map(([competition,count])=>({competition,count}))
   .sort((a,b)=>a.competition.localeCompare(b.competition,'pt-BR'))};
}
export async function loadResearchPacks(
 baseline:ResearchCatalog,signal?:AbortSignal
):Promise<ResearchCatalog>{
 const response=await fetch(indexPath,{signal,cache:'no-store'});
 if(!response.ok)throw Error('Índice de pacotes de pesquisa indisponível.');
 const entries=parseResearchPackManifest(await response.json() as unknown);
 // Sequential fetch: avoid downloading every archived season concurrently.
 const payloads:unknown[]=[];
 for(const entry of entries){
  const result=await fetch('/research/packs/'+entry.file,{signal,cache:'no-store'});
  if(!result.ok)throw Error('Pacote não encontrado: '+entry.file);
  payloads.push(await result.json() as unknown);
 }
 return mergeResearchPacks(baseline,entries,payloads);
}
