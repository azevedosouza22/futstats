/**
 * Private FPL Work 2026/27 research store. Replaces the PILOT DISPLAY only
 * after explicit local CSV import; never mutates main history, Radar, or
 * the separate CC0/European Work research stores.
 */
import {parseWorkResearchCsv} from './workCsv';
import {isWork55Header} from './europeWorkResearch';
import type {FplPilotGame,Pair} from './fplFreePilot';

export const FPL_WORK_STORAGE='futstats:fpl-work-research:v1';
export const METRICS=['goals','shots','target','corners'] as const;
export type Metric=typeof METRICS[number];
export type Period=Record<Metric,Pair>;
export type FplWorkEntry={
 gameId:string;gw:number;date:string;home:string;away:string;
 sourceId:string;sourceUrl:string;
 full:Period;first:Period;second:Period;
 discrepancies:string[];pilotUnprocessed:boolean;
};
export type FplWorkStore={format:typeof FPL_WORK_STORAGE;entries:FplWorkEntry[]};
export const emptyFplWork=():FplWorkStore=>({format:FPL_WORK_STORAGE,entries:[]});
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const normal=(input:string):string=>input.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const nicknames:Record<string,string>={
 'spurs':'tottenham','tottenham hotspur':'tottenham',
 'coventry city':'coventry','coventry city fc':'coventry',
 'man utd':'manchester united','manchester utd':'manchester united',
 'manchester united fc':'manchester united','man city':'manchester city',
 'manchester city fc':'manchester city',
 'hull city':'hull','hull city afc':'hull',
 'nottingham forest':'nottingham','nott m forest':'nottingham',
 'nottingham forest fc':'nottingham',
 'ipswich town':'ipswich','ipswich town fc':'ipswich',
 'brighton hove albion':'brighton','brighton and hove albion':'brighton',
 'brighton hove albion fc':'brighton',
 'leeds united':'leeds','newcastle united':'newcastle',
 'sunderland afc':'sunderland','fulham fc':'fulham',
 'everton fc':'everton','chelsea fc':'chelsea','arsenal fc':'arsenal',
 'liverpool fc':'liverpool','brentford fc':'brentford',
 'aston villa fc':'aston villa','crystal palace fc':'crystal palace',
 'bournemouth afc':'bournemouth','afc bournemouth':'bournemouth'
};
const team=(s:string)=>nicknames[normal(s)]??normal(s);
const validPair=(p:unknown):p is Pair=>Array.isArray(p)&&p.length===2&&
 p.every(x=>Number.isSafeInteger(x)&&x>=0&&x<=999);
const validPeriod=(p:unknown):p is Period=>obj(p)&&METRICS.every(k=>validPair(p[k]));
const urlOk=(value:string,id:string):boolean=>{
 try{
  const u=new URL(value);
  return u.protocol==='https:'&&!u.username&&!u.password&&
   ['www.flashscore.com.br','flashscore.com.br','www.flashscore.com','flashscore.com'].includes(u.hostname)&&
   u.searchParams.get('mid')===id;
 }catch{return false;}
};
const validEntry=(x:unknown):x is FplWorkEntry=>{
 if(!obj(x)||typeof x.gameId!=='string'||!/^26-27-prem-[a-z0-9-]+$/.test(x.gameId)||
  typeof x.gw!=='number'||!Number.isInteger(x.gw)||x.gw<1||x.gw>38||
  typeof x.date!=='string'||!/^2026-\d\d-\d\d$|^2027-\d\d-\d\d$/.test(x.date)||
  typeof x.home!=='string'||!x.home.trim()||typeof x.away!=='string'||!x.away.trim()||
  typeof x.sourceId!=='string'||! /^[a-zA-Z0-9_-]{3,80}$/.test(x.sourceId)||
  typeof x.sourceUrl!=='string'||!urlOk(x.sourceUrl,x.sourceId)||
  !validPeriod(x.full)||!validPeriod(x.first)||!validPeriod(x.second)||
  !Array.isArray(x.discrepancies)||!x.discrepancies.every(z=>typeof z==='string'&&z.length<150)||
  typeof x.pilotUnprocessed!=='boolean')return false;
 for(const k of METRICS)for(const side of [0,1]){
  if(x.first[k][side]+x.second[k][side]!==x.full[k][side])return false;
 }
 for(const p of [x.full,x.first,x.second])for(const side of [0,1]){
  if(p.target[side]>p.shots[side])return false;
 }
 return true;
};
export function readFplWork(raw:string|null):FplWorkStore{
 if(raw===null)return emptyFplWork();
 let parsed:unknown;
 try{parsed=JSON.parse(raw);}catch{throw Error('Pesquisa anterior da Premier League não pôde ser lida. Não sobrescreva dados.');}
 if(!obj(parsed)||parsed.format!==FPL_WORK_STORAGE||!Array.isArray(parsed.entries)||
   parsed.entries.length>380||!parsed.entries.every(validEntry)||
   new Set(parsed.entries.map((x:FplWorkEntry)=>x.gameId)).size!==parsed.entries.length||
   new Set(parsed.entries.map((x:FplWorkEntry)=>x.sourceId)).size!==parsed.entries.length)
  throw Error('Pesquisa privada da Premier League inconsistente. Nenhum dado será alterado.');
 return {format:FPL_WORK_STORAGE,entries:parsed.entries as FplWorkEntry[]};
}
const asPair=(a:number|null,b:number|null,metric:string):Pair=>{
 if(!validPair([a,b]))throw Error('N/D em '+metric+'. O jogo não será importado como completo.');
 return [a!,b!];
};
const pack=(s:import('./model').Stats[]):Period=>{
 const out={} as Period;
 for(const k of METRICS)out[k]=asPair(s[0][k],s[1][k],k);
 return out;
};
type Divergence={indicator:string;flashscore:number;piloto:number};
const labels:Record<Metric,string>={goals:'gols',shots:'finalizacoes',
 target:'chutes_no_alvo',corners:'escanteios'};
const sideLabels=['m','v'] as const;
function notes(value:string,sourceId:string):{
 pilotId:string;round:number;divergences:Divergence[];unprocessed:boolean
}{
 let data:unknown;
 try{data=JSON.parse(value);}catch{throw Error('Observações do Work inválidas no jogo '+sourceId+'.');}
 if(!obj(data)||data.temporada!=='2026/2027'||
  typeof data.piloto_id!=='string'||!Number.isInteger(data.rodada)||
  !Array.isArray(data.divergencias_piloto)||!['True','False'].includes(String(data.piloto_stats_processed)))
  throw Error('Metadados do piloto não identificados no jogo '+sourceId+'.');
 const list=data.divergencias_piloto as unknown[];
 if(!list.every(x=>obj(x)&&typeof x.indicator==='string'&&
  Number.isSafeInteger(x.flashscore)&&Number.isSafeInteger(x.piloto)))
  throw Error('Divergência documentada inválida: '+sourceId+'.');
 return {pilotId:data.piloto_id,round:data.rodada as number,
  divergences:list as Divergence[],unprocessed:data.piloto_stats_processed==='False'};
}
export type FplWorkPreview={
 checked:number;additions:FplWorkEntry[];duplicates:number;
 notes:string[];discrepancies:number;unprocessed:number;
};
export function previewFplWorkCsv(
 csv:string,games:FplPilotGame[],existing:FplWorkStore
):FplWorkPreview{
 readFplWork(JSON.stringify(existing));
 if(!isWork55Header(csv))throw Error('É obrigatório o CSV original de 55 colunas do FutStats.');
 const parsed=parseWorkResearchCsv(csv);
 const observationsForId=parseObservations(csv);
 const additions:FplWorkEntry[]=[];
 const seen=new Set<string>(),seenIds=new Set<string>(),notices:string[]=[];
 let duplicates=0,discrepancies=0,unprocessed=0;
 for(const row of parsed){
  if(row.dateDiscrepancy||normal(row.competition)!=='premier league inglesa 2026 27')
   throw Error('Competição ou data inválida: '+row.sourceId+'.');
  const gameCandidates=games.filter(g=>g.date===row.date&&team(g.home)===team(row.home)&&team(g.away)===team(row.away));
  if(gameCandidates.length!==1)throw Error('Jogo não reconhecido pelo piloto: '+row.home+' × '+row.away+'.');
  const game=gameCandidates[0],obs=notes(observationsForId.get(row.sourceId)??'',row.sourceId);
  if(obs.pilotId!==game.id||obs.round!==game.gw||obs.unprocessed===game.sourceStatsProcessed)
   throw Error('Rodada ou referência do piloto incompatível: '+row.sourceId+'.');
  if(seen.has(game.id)||seenIds.has(row.sourceId))
   throw Error('Partida duplicada no mesmo CSV: '+row.sourceId+'.');
  seen.add(game.id);seenIds.add(row.sourceId);
  const full=pack(row.full),first=pack(row.first),second=pack(row.second);
  const expected:Record<Metric,Pair>={goals:game.goals,shots:game.shots,
   target:game.onTarget,corners:game.corners};
  const differences:string[]=[];
  if(full.goals.some((x,i)=>x!==game.goals[i]))
   throw Error('Placar divergente do piloto: '+row.sourceId+'.');
  if(game.sourceStatsProcessed){
   for(const k of METRICS)for(const side of [0,1] as const)
    if(full[k][side]!==expected[k][side]){
     const indicator=labels[k]+'_'+sideLabels[side];
     const found=obs.divergences.find(d=>d.indicator===indicator&&
      d.flashscore===full[k][side]&&d.piloto===expected[k][side]);
     if(!found)throw Error('Diferença sem justificativa de origem: '+row.sourceId+' / '+indicator+'.');
     differences.push(indicator+': Work '+full[k][side]+' × piloto '+expected[k][side]);
    }
   if(obs.divergences.length!==differences.length)
    throw Error('Divergência documentada não confere com o piloto: '+row.sourceId+'.');
  }else if(obs.divergences.length){
   throw Error('Não é possível conferir divergência com jogo não processado: '+row.sourceId+'.');
  }
  const entry:FplWorkEntry={gameId:game.id,gw:game.gw,date:row.date,
   home:game.home,away:game.away,sourceId:row.sourceId,sourceUrl:row.sourceUrl,
   first,second,full,discrepancies:differences,
   pilotUnprocessed:!game.sourceStatsProcessed};
  const old=existing.entries.find(x=>x.gameId===entry.gameId||x.sourceId===entry.sourceId);
  if(old){
   if(old.gameId!==entry.gameId||old.sourceId!==entry.sourceId||
     JSON.stringify(old.full)!==JSON.stringify(entry.full)||
     JSON.stringify(old.first)!==JSON.stringify(entry.first)||
     JSON.stringify(old.second)!==JSON.stringify(entry.second)||
     JSON.stringify(old.discrepancies)!==JSON.stringify(entry.discrepancies))
    throw Error('Jogo pesquisado tem valores diferentes dos armazenados: '+row.sourceId+'. Nenhuma substituição automática.');
   duplicates++;
  }else additions.push(entry);
  if(differences.length){discrepancies++;notices.push(row.home+' × '+row.away+': '+differences.join(', '));}
  if(!game.sourceStatsProcessed){unprocessed++;notices.push(row.home+' × '+row.away+': piloto não processado; pesquisa Work mantida como fonte separada.');}
 }
 // Helper declaration is hoisted; it parses the source CSV once without
 // changing the original parser's validated statistics.
 function parseObservations(src:string):Map<string,string>{
  const out=new Map<string,string>();let fields:string[]=[],cell='',quoted=false;
  const records:string[][]=[];
  for(let i=0;i<src.length;i++){
   const ch=src[i];
   if(ch==='"'){if(quoted&&src[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
   else if(ch===','&&!quoted){fields.push(cell);cell='';}
   else if((ch==='\r'||ch==='\n')&&!quoted){
    if(ch==='\r'&&src[i+1]==='\n')i++;
    fields.push(cell);cell='';if(fields.some(x=>x.trim()))records.push(fields);fields=[];
   }else cell+=ch;
  }
  fields.push(cell);if(fields.some(x=>x.trim()))records.push(fields);
  const headers=records.shift()?.map(x=>x.replace(/^\uFEFF/,''))??[];
  const idIndex=headers.indexOf('id_fonte'),notesIndex=headers.indexOf('observacoes');
  if(idIndex<0||notesIndex<0)throw Error('O CSV não contém as observações de conciliação.');
  for(const record of records)out.set(record[idIndex],record[notesIndex]);
  return out;
 }
 return {checked:parsed.length,additions,duplicates,notes:notices,discrepancies,unprocessed};
}
export function addFplWork(
 current:FplWorkStore,preview:FplWorkPreview
):FplWorkStore{
 readFplWork(JSON.stringify(current));
 const next:FplWorkStore={format:FPL_WORK_STORAGE,
  entries:[...current.entries,...preview.additions]};
 readFplWork(JSON.stringify(next));
 return next;
}
