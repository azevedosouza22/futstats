/** Private Work CSV research additions, never uploaded or merged with FutStats user history.
 * Only explicit file selection may write. IndexedDB stores season packs separately.
 * The public Git repository contains ONLY code; no private Flashscore rows.
 */
import {validData,type Data,type Match,type Stats,type Team} from './model';
import {competitionParts,NO_SEASON} from './leagueCatalog';
import {normalizeTeam} from './calendar';
import {mergeResearchPacks} from './researchPacks';
import type {ResearchCatalog} from './researchCatalog';
import {parseWorkResearchCsv,type WorkResearchRow} from './workCsv';

export const PRIVATE_PACK_EVENT='futstats:private-season-updated';
const DB_NAME='futstats-private-research-v1';
const STORE='season-packs';
const isObject=(x:unknown):x is Record<string,unknown>=>
 !!x&&typeof x==='object'&&!Array.isArray(x);
type PrivatePack={format:'futstats-research-season-v1';version:1;competition:string;data:Data};
const metrics=['goals','shots','target','corners'] as const;
/** Exact 55-column FutStats contract, before any private write. */
export function requireFutStats55Columns(csv:string):void{
 const line=csv.replace(/^\uFEFF/,'').split(/\r?\n/,1)[0];
 const headers=line.split(',').map(s=>s.trim().replace(/^"|"$/g,''));
 if(headers.length!==55||new Set(headers).size!==55||
    headers[0]!=='id_fonte'||headers[54]!=='observacoes')
  throw Error('Este arquivo não segue o CSV FutStats original de 55 colunas.');
}


function assureFull(row:WorkResearchRow){
 for(const period of [row.full,row.first,row.second])
  for(const side of period)
   for(const metric of metrics)
    if(typeof side[metric]!=='number'||!Number.isSafeInteger(side[metric]))
     throw Error('Estatísticas por tempo incompletas para '+row.home+' × '+row.away+'.');
}

export function createPrivateSeasonPack(rows:readonly WorkResearchRow[],timestamp:string):PrivatePack{
 if(!rows.length||rows.length>1200)throw Error('Pacote sem partidas ou acima de 1.200 jogos.');
 if(Number.isNaN(Date.parse(timestamp)))throw Error('Data de conferência inválida.');
 const competition=rows[0].competition;
 if(!competition||competitionParts(competition).season===NO_SEASON)
  throw Error('Identifique a liga e a temporada do pacote.');
 const names=new Map<string,string>(),teams:Team[]=[],matches:Match[]=[];
 const ids=new Set<string>(),fingerprints=new Set<string>();
 const getTeamId=(name:string)=>{
  const key=normalizeTeam(name);
  if(!key)throw Error('Equipe sem nome.');
  const existing=names.get(key);
  if(existing)return existing;
  const id='private-season-team-'+(teams.length+1);
  teams.push({id,name,color:'#557e8d'});names.set(key,id);
  return id;
 };
 for(const row of rows){
  if(row.competition!==competition)throw Error('O arquivo deve conter somente uma liga e uma temporada.');
  if(row.sourceId.length<3||ids.has(row.sourceId))throw Error('ID repetido no arquivo.');
  assureFull(row);
  const key=[row.date,normalizeTeam(row.home),normalizeTeam(row.away)].join('|');
  if(fingerprints.has(key))throw Error('Confronto repetido na temporada.');
  ids.add(row.sourceId);fingerprints.add(key);
  matches.push({
   id:'research-private-'+row.sourceId,competition,date:row.date,
   home:getTeamId(row.home),away:getTeamId(row.away),
   first:row.first.map(s=>({...s})) as [Stats,Stats],
   second:row.second.map(s=>({...s})) as [Stats,Stats],
   research:{provider:'work-csv',source:'Flashscore',sourceId:row.sourceId,
    sourceUrl:row.sourceUrl,importedAt:timestamp,
    full:row.full.map(s=>({...s})) as [Stats,Stats],
    titleDate:row.titleDate,dateDiscrepancy:row.dateDiscrepancy}
  });
 }
 const data:Data={teams,matches};
 if(!validData(data))throw Error('Arquivo de temporada inválido.');
 return {format:'futstats-research-season-v1',version:1,competition,data};
}
function checkPack(x:unknown):asserts x is PrivatePack{
 if(!isObject(x)||x.format!=='futstats-research-season-v1'||
  x.version!==1||typeof x.competition!=='string'||!isObject(x.data)||
  !validData(x.data)||x.data.matches.length<1||x.data.matches.length>1200||
  x.data.matches.some(m=>m.competition!==x.competition||!m.research))
  throw Error('Pacote local inválido. Nada foi incorporado.');
}
function keyFor(m:Match){return m.research!.sourceId;}
const safeRecord=(m:Match,names:Map<string,string>)=>JSON.stringify({
 date:m.date,competition:m.competition,
 home:normalizeTeam(names.get(m.home)??''),
 away:normalizeTeam(names.get(m.away)??''),
 first:m.first,second:m.second,full:m.research?.full,
 sourceUrl:m.research?.sourceUrl,titleDate:m.research?.titleDate,
 dateDiscrepancy:m.research?.dateDiscrepancy
});
/** Adds a new round to an existing private season without replacing any match.
 * Identical IDs count as skipped; conflicts fail closed. Never rewrites existing values.
 */
export function combinePrivateSeasonPacks(
 old:PrivatePack|undefined,incoming:PrivatePack
):{pack:PrivatePack;added:number;skipped:number}{
 checkPack(incoming);
 if(!old)return {pack:incoming,added:incoming.data.matches.length,skipped:0};
 checkPack(old);
 if(old.competition!==incoming.competition)
  throw Error('Não misture campeonatos ou temporadas.');
 const teams=old.data.teams.map(t=>({...t}));
 const matches=[...old.data.matches];
 const oldNames=new Map(teams.map(t=>[t.id,t.name]));
 const newNames=new Map(incoming.data.teams.map(t=>[t.id,t.name]));
 const byId=new Map(matches.map(m=>[keyFor(m),m]));
 const fingerprint=(m:Match,names:Map<string,string>)=>
  [m.date,normalizeTeam(names.get(m.home)??''),normalizeTeam(names.get(m.away)??'')].join('|');
 const fixtures=new Set(matches.map(m=>fingerprint(m,oldNames)));
 const teamsByName=new Map(teams.map(t=>[normalizeTeam(t.name),t.id]));
 let skipped=0,added=0;
 for(const match of incoming.data.matches){
  const same=byId.get(keyFor(match));
  if(same){
   if(safeRecord(same,oldNames)!==safeRecord(match,newNames))
    throw Error('Conflito no ID '+keyFor(match)+'. Arquivo anterior preservado.');
   skipped++;continue;
  }
  if(fixtures.has(fingerprint(match,newNames)))
   throw Error('Confronto duplicado com ID diferente: '+match.date);
  const assigned=(teamId:string)=>{
   const name=newNames.get(teamId);
   if(!name)throw Error('Equipe ausente.');
   const key=normalizeTeam(name);
   let id=teamsByName.get(key);
   if(!id){
    id='private-season-team-'+(teams.length+1);
    teams.push({id,name,color:'#557e8d'});
    teamsByName.set(key,id);
    oldNames.set(id,name);
   }
   return id;
  };
  const copy={...match,home:assigned(match.home),away:assigned(match.away)};
  matches.push(copy);byId.set(keyFor(copy),copy);
  fixtures.add(fingerprint(copy,oldNames));added++;
 }
 if(matches.length>1200)throw Error('Temporada ultrapassa o limite por pacote.');
 const pack:PrivatePack={...old,data:{teams,matches}};
 checkPack(pack);
 return {pack,added,skipped};
}

/** Opens isolated storage, never storage keys for history, Radar or backups. */
function dbOpen():Promise<IDBDatabase>{
 if(typeof indexedDB==='undefined')return Promise.reject(Error('Armazenamento privado indisponível.'));
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'competition'});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(Error('Não foi possível abrir a pesquisa privada.'));
  req.onblocked=()=>reject(Error('Armazenamento privado em uso por outra aba.'));
 });
}
async function listPacks():Promise<PrivatePack[]>{
 const db=await dbOpen();
 try{return await new Promise<PrivatePack[]>((resolve,reject)=>{
   const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();
   req.onsuccess=()=>resolve(req.result as PrivatePack[]);
   req.onerror=()=>reject(Error('Não foi possível ler as temporadas privadas.'));
  });}finally{db.close();}
}
async function putPack(pack:PrivatePack):Promise<void>{
 const db=await dbOpen();
 try{return await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put(pack);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(Error('Armazenamento privado cheio ou indisponível.'));
  tx.onabort=()=>reject(Error('A gravação privada foi interrompida.'));
 });}finally{db.close();}
}
/** Keep only private matches that are not already present in the published research.
 * Raises an error on contradictory duplicates; never silently overwrites.
 */
export function unpublishedPrivatePacks(
 base:ResearchCatalog,stored:readonly PrivatePack[]
):PrivatePack[]{
 const published=new Map(base.data.matches.filter(m=>m.research)
  .map(m=>[m.research!.sourceId,m]));
 // Compare semantic values, not JSON key order. Older CSV imports may carry
 // extra optional N/D fields absent from the published lean research packs.
 const samePair=(a:Match['first'],b:Match['first'])=>
  a.every((side,i)=>['goals','shots','target','corners'].every(key=>
   side[key as 'goals']===b[i][key as 'goals']));
 const sameStats=(a:Match,b:Match)=>
  a.date===b.date&&a.competition===b.competition&&
  a.research?.sourceUrl===b.research?.sourceUrl&&
  a.research?.titleDate===b.research?.titleDate&&
  samePair(a.first,b.first)&&samePair(a.second,b.second)&&
  !!a.research&&!!b.research&&samePair(a.research.full,b.research.full);
 const extra:PrivatePack[]=[];
 for(const file of stored){
  checkPack(file);
  const matches=file.data.matches.filter(m=>{
   const existing=published.get(m.research!.sourceId);
   if(!existing)return true;
   if(!sameStats(existing,m))
    throw Error('Conflito entre pesquisa pública e privada: '+m.research!.sourceId);
   return false;
  });
  if(matches.length)extra.push({...file,data:{...file.data,matches}});
 }
 return extra;
}
export async function loadPrivateSeasonResearch(
 base:ResearchCatalog,signal?:AbortSignal
):Promise<ResearchCatalog>{
 // Private storage may be unavailable in restricted/incognito browsers.
 // Baseline research must continue to work without any optional local season.
 let stored:PrivatePack[];
 try{stored=await listPacks();}catch{return base;}
 if(signal?.aborted)throw Error('Consulta cancelada.');
 if(!stored.length)return base;
 // A season may have been imported privately before it became part of the
 // published research. Keep the browser copy, but do not count it twice.
 const extra=unpublishedPrivatePacks(base,stored);
 if(!extra.length)return base;
 const files=extra.sort((a,b)=>a.competition.localeCompare(b.competition));
 return mergeResearchPacks(base,
  files.map((f,i)=>({file:'private_season_'+(i+1)+'.json',
   competition:f.competition,count:f.data.matches.length})),files);
}
export async function savePrivateSeasonCsv(
 csv:string,base:ResearchCatalog
):Promise<{added:number;skipped:number;total:number;competition:string}>{
 requireFutStats55Columns(csv);
 const rows=parseWorkResearchCsv(csv);
 const incoming=createPrivateSeasonPack(rows,new Date().toISOString());
 const old=(await listPacks()).find(p=>p.competition===incoming.competition);
 const combination=combinePrivateSeasonPacks(old,incoming);
 const others=(await listPacks()).filter(p=>p.competition!==incoming.competition);
 // Preflight complete merged catalog before writing a single byte.
 const all=[...others,combination.pack];
 for(const f of all)checkPack(f);
 const combined=mergeResearchPacks(base,
  all.map((f,i)=>({file:'private_season_'+(i+1)+'.json',
   competition:f.competition,count:f.data.matches.length})),all);
 if(combination.added>0)await putPack(combination.pack);
 return {...combination,total:combined.total,competition:incoming.competition};
}


/**
 * Stage multiple league/season files as one atomic private browser import.
 * Existing rounds are preserved byte-for-byte on duplicate IDs.
 */
export function stagePrivateSeasonRows(
 stored:readonly PrivatePack[],rows:readonly WorkResearchRow[],timestamp:string
):{all:PrivatePack[];writes:PrivatePack[];added:number;skipped:number;
    seasons:{competition:string;added:number;skipped:number;count:number}[]}{
 if(!rows.length||rows.length>1200)throw Error('Limite de 1.200 partidas por pacote.');
 const grouped=new Map<string,WorkResearchRow[]>();
 const ids=new Set<string>();
 for(const row of rows){
  if(ids.has(row.sourceId))throw Error('ID repetido entre temporadas: '+row.sourceId);
  ids.add(row.sourceId);
  const group=grouped.get(row.competition)??[];
  group.push(row);grouped.set(row.competition,group);
 }
 if(grouped.size>20)throw Error('Limite de 20 temporadas por arquivo.');
 const byCompetition=new Map<string,PrivatePack>();
 for(const pack of stored){
  checkPack(pack);
  if(byCompetition.has(pack.competition))throw Error('Temporada privada duplicada.');
  byCompetition.set(pack.competition,pack);
 }
 const writes:PrivatePack[]=[];
 const seasons:{competition:string;added:number;skipped:number;count:number}[]=[];
 let added=0,skipped=0;
 for(const [competition,items] of grouped){
  const fresh=createPrivateSeasonPack(items,timestamp);
  const combined=combinePrivateSeasonPacks(byCompetition.get(competition),fresh);
  byCompetition.set(competition,combined.pack);
  if(combined.added>0)writes.push(combined.pack);
  seasons.push({competition,added:combined.added,skipped:combined.skipped,
   count:combined.pack.data.matches.length});
  added+=combined.added;skipped+=combined.skipped;
 }
 return {all:[...byCompetition.values()],writes,added,skipped,seasons};
}
async function putPacksAtomically(packs:readonly PrivatePack[]):Promise<void>{
 if(!packs.length)return;
 const db=await dbOpen();
 try{return await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  for(const pack of packs)tx.objectStore(STORE).put(pack);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(Error('Falha ao salvar temporadas privadas.'));
  tx.onabort=()=>reject(Error('Nenhuma alteração parcial foi confirmada.'));
 });}finally{db.close();}
}
/** Validate both leagues against the public 1,019 before a single IDB write. */
export async function savePrivateSeasonsCsv(
 csv:string,base:ResearchCatalog
):Promise<{added:number;skipped:number;total:number;
 seasons:{competition:string;added:number;skipped:number;count:number}[]}>{
 requireFutStats55Columns(csv);
 const rows=parseWorkResearchCsv(csv,1200);
 const existing=await listPacks();
 const staged=stagePrivateSeasonRows(existing,rows,new Date().toISOString());
 const all=staged.all.sort((a,b)=>a.competition.localeCompare(b.competition));
 const merged=mergeResearchPacks(base,
  all.map((pack,i)=>({
   file:'private_season_'+(i+1)+'.json',
   competition:pack.competition,count:pack.data.matches.length
  })),all);
 await putPacksAtomically(staged.writes);
 return {added:staged.added,skipped:staged.skipped,total:merged.total,
  seasons:staged.seasons};
}

