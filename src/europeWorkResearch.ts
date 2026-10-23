/**
 * Work CSV enrichment of the SEPARATE European research base.
 * Do NOT write into the primary historical FutStats or Radar storage.
 * Never publish the original Flashscore data into GitHub or upload it to any server.
 */
import {parseWorkResearchCsv} from './workCsv';
import {EUROPE_LEAGUES,readStoredEuropeanResearch,type EuropeMatch,type StoredEuropeanResearch} from './europeLeagueResearch';

export const EUROPE_WORK_STORAGE='futstats:europe-work-stats:v1';
export const WORK_METRICS=['goals','shots','target','corners'] as const;
export type WorkMetric=typeof WORK_METRICS[number];
export type Pair=[number,number];
export type MetricPairs=Record<WorkMetric,Pair>;
export type WorkEuropeEntry={
 europeId:string;sourceId:string;sourceUrl:string;
 // A dated fixture with no published CC0 final score may be enriched from
 // locally researched Work data. Preserve that match only in this separate store.
 fixture?:EuropeMatch;
 first:MetricPairs;second:MetricPairs;full:MetricPairs;
};
export type WorkEuropeStore={format:typeof EUROPE_WORK_STORAGE;entries:WorkEuropeEntry[]};
export const emptyEuropeWork=():WorkEuropeStore=>({format:EUROPE_WORK_STORAGE,entries:[]});
const asRecord=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const pairOk=(p:unknown):p is Pair=>Array.isArray(p)&&p.length===2&&
 p.every(v=>Number.isSafeInteger(v)&&v>=0&&v<=999);
const pairsOk=(v:unknown):v is MetricPairs=>asRecord(v)&&WORK_METRICS.every(k=>pairOk(v[k]));
const sourceUrlOk=(v:string,id:string)=>{
 try{const u=new URL(v);
  return u.protocol==='https:'&&
   ['www.flashscore.com.br','flashscore.com.br','www.flashscore.com','flashscore.com'].includes(u.hostname)&&
   !u.username&&!u.password&&u.searchParams.get('mid')===id;
 }catch{return false;}
};
const validSnapshot=(match:unknown,europeId:string):match is EuropeMatch=>{
 if(!asRecord(match)||match.id!==europeId||
    !EUROPE_LEAGUES.some(l=>l.id===match.league&&l.competition===match.competition&&
      Number.isInteger(match.round)&&Number(match.round)>=1&&Number(match.round)<=l.rounds)||
    typeof match.round!=='number'||!Number.isInteger(match.round)||
    typeof match.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(match.date)||
    Number.isNaN(Date.parse(match.date))||
    typeof match.home!=='string'||typeof match.away!=='string'||
    match.id!==[match.league,match.round,match.date,match.home.toLowerCase(),match.away.toLowerCase()].join('|')||
    !pairOk(match.full)||!pairOk(match.half)||!pairOk(match.second))return false;
 const a=match.half as Pair,b=match.second as Pair,c=match.full as Pair;
 return [0,1].every(i=>a[i]+b[i]===c[i]);
};
const validEntry=(v:unknown):v is WorkEuropeEntry=>{
 if(!asRecord(v)||typeof v.europeId!=='string'||typeof v.sourceId!=='string'||
   !/^[a-zA-Z0-9_-]{3,80}$/.test(v.sourceId)||typeof v.sourceUrl!=='string'||
   !sourceUrlOk(v.sourceUrl,v.sourceId)||!pairsOk(v.first)||
   !pairsOk(v.second)||!pairsOk(v.full))return false;
 if(v.fixture!==undefined){
  if(!validSnapshot(v.fixture,v.europeId))return false;
  for(const side of [0,1]){
   if(v.fixture.full![side]!==v.full.goals[side]||
      v.fixture.half![side]!==v.first.goals[side]||
      v.fixture.second![side]!==v.second.goals[side])return false;
  }
 }
 for(const metric of WORK_METRICS)for(const side of [0,1]){
  if(v.first[metric][side]+v.second[metric][side]!==v.full[metric][side])return false;
 }
 for(const period of [v.full,v.first,v.second])
  for(const side of [0,1])if(period.target[side]>period.shots[side])return false;
 return true;
};
export function readEuropeWork(text:string|null):WorkEuropeStore{
 if(text===null)return emptyEuropeWork();
 let value:unknown;
 try{value=JSON.parse(text);}catch{throw Error('Pesquisa Work local inválida. Nenhuma informação será substituída.');}
 if(!asRecord(value)||value.format!==EUROPE_WORK_STORAGE||!Array.isArray(value.entries)||
  value.entries.length>1100||!value.entries.every(validEntry)||
  new Set(value.entries.map((e:WorkEuropeEntry)=>e.europeId)).size!==value.entries.length||
  new Set(value.entries.map((e:WorkEuropeEntry)=>e.sourceId)).size!==value.entries.length)
  throw Error('Pesquisa Work existente é incompatível. Nenhum dado será sobrescrito.');
 return {format:EUROPE_WORK_STORAGE,entries:value.entries as WorkEuropeEntry[]};
}
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases:Record<string,string>={
 'udinese':'udinese calcio','como':'como 1907',
 'inter':'fc internazionale milano','internazionale':'fc internazionale milano',
 'monza':'ac monza','genoa':'genoa cfc','napoli':'ssc napoli',
 // Explicit provider-name variants for the remaining seven games in matchday 1.
 'parma':'parma calcio 1913','cagliari':'cagliari calcio',
 'frosinone':'frosinone calcio','juventus':'juventus fc',
 'venezia':'venezia fc','lecce':'us lecce',
 'atalanta':'atalanta bc','sassuolo':'us sassuolo calcio',
 'torino':'torino fc','milan':'ac milan','bologna':'bologna fc 1909',
 'lazio':'ss lazio','roma':'as roma','fiorentina':'acf fiorentina',
 // La Liga 2026/27: Flashscore's short club names mapped to OpenFootball.
 'alaves':'deportivo alaves','getafe':'getafe cf',
 'sevilla':'sevilla fc','rayo vallecano':'rayo vallecano de madrid',
 'racing santander':'real racing club de santander',
 'villarreal':'villarreal cf','espanyol':'rcd espanyol de barcelona',
 'levante':'levante ud','a coruna':'rc deportivo la coruna',
 'elche':'elche cf','atl madrid':'club atletico de madrid',
 'malaga':'malaga cf','betis':'real betis balompie',
 'real sociedad':'real sociedad de futbol','ath bilbao':'athletic club',
 'valencia':'valencia cf','celta de vigo':'rc celta de vigo',
 'real madrid':'real madrid cf','osasuna':'ca osasuna','barcelona':'fc barcelona'
};
const teamName=(s:string)=>aliases[normal(s)]??normal(s);
const metricColumn:Record<WorkMetric,'goals'|'shots'|'target'|'corners'>={
 goals:'goals',shots:'shots',target:'target',corners:'corners'
};
const copyPairs=(p:import('./model').Stats[]):MetricPairs=>{
 const result={} as MetricPairs;
 for(const metric of WORK_METRICS){
  const col=metricColumn[metric];
  const a=p[0][col],b=p[1][col];
  if(!pairOk([a,b]))throw Error('Indicador '+metric+' ausente (N/D).');
  result[metric]=[a!,b!];
 }
 return result;
};

const headerPrefix=['id_fonte','tipo_amostra','equipe_amostra','competicao','data',
 'data_titulo_fonte','hora_exibida_fonte','fuso_horario_fonte','divergencia_data',
 'mandante','visitante'];
const csvMetricNames=['gols','finalizacoes','chutes_no_alvo','escanteios'];
const headerMetrics=['jogo','1t','2t'].flatMap(period=>
 csvMetricNames.flatMap(metric=>['mandante','visitante','total'].map(side=>metric+'_'+side+'_'+period)));
const headerSuffix=['fonte','url_fonte','url_fonte_1t','url_fonte_2t',
 'url_fonte_gols_por_tempo','sofascore_status','sofascore_url_partida','observacoes'];
const HEADER=[...headerPrefix,...headerMetrics,...headerSuffix];
export function isWork55Header(csv:string):boolean{
 const line=csv.replace(/^\uFEFF/,'').split(/\r?\n/,1)[0];
 return line.split(',').length===55&&line.split(',').every((x,i)=>x===HEADER[i]);
}
export type WorkEuropeReview={
 checked:number;newEntries:WorkEuropeEntry[];duplicates:number;
 matched:{game:string;sourceId:string;round:number;league:EuropeMatch['league']}[];
};
export function reviewEuropeWorkCsv(
 csv:string,base:StoredEuropeanResearch,current:WorkEuropeStore,
 // All scheduled fixtures, including matches still missing results in the
 // CC0 feed. Caller obtains these from the same three verified league files.
 fixtures:EuropeMatch[]=[]
):WorkEuropeReview{
 readStoredEuropeanResearch(JSON.stringify(base));
 readEuropeWork(JSON.stringify(current));
 if(!isWork55Header(csv))throw Error('O arquivo não possui o cabeçalho original de 55 colunas do FutStats.');
 const rows=parseWorkResearchCsv(csv);
 const newEntries:WorkEuropeEntry[]=[],matched:WorkEuropeReview['matched']=[];
 const used=new Set<string>(),ids=new Set<string>();
 let duplicates=0;
 for(const row of rows){
  if(row.dateDiscrepancy)throw Error('Datas divergentes no Flashscore: '+row.sourceId+'.');
  if(normal(row.competition)!==normal('Serie A italiana 2026/27')&&
     !EUROPE_LEAGUES.some(l=>normal(l.competition)===normal(row.competition)))
   throw Error('Competição incompatível: '+row.competition+'.');
  const matches=base.matches.filter(g=>normal(g.competition)===normal(row.competition)&&
   g.date===row.date&&teamName(g.home)===teamName(row.home)&&
   teamName(g.away)===teamName(row.away));
  // A match missing from the stored results may still be present as an
  // unscored fixture in OpenFootball. Do not require the user to add it to
  // the 155 results nor count it as a duplicate.
  if(matches.length===0){
   matches.push(...fixtures.filter(g=>normal(g.competition)===normal(row.competition)&&
    g.date===row.date&&teamName(g.home)===teamName(row.home)&&
    teamName(g.away)===teamName(row.away)));
  }
  if(matches.length!==1)throw Error('Partida não identificada no calendário validado: '+row.home+' × '+row.away+'.');
  const game=matches[0];
  if(used.has(game.id)||ids.has(row.sourceId))throw Error('Partida ou ID duplicado dentro do CSV.');
  used.add(game.id);ids.add(row.sourceId);
  const first=copyPairs(row.first),second=copyPairs(row.second),full=copyPairs(row.full);
  const hasReference=!!game.full&&!!game.half&&!!game.second;
  if(hasReference)for(const side of [0,1]){
   if(first.goals[side]!==game.half![side]||second.goals[side]!==game.second![side]||
     full.goals[side]!==game.full![side])
    throw Error('Placar do Work difere da base pública em '+row.home+' × '+row.away+'.');
  }
  // When OpenFootball has not published the result, save the Work score and
  // provenance only as a separate local supplement, never as a CC0 score.
  const fixture=hasReference?undefined:{...game,full:full.goals,half:first.goals,second:second.goals};
  const item:WorkEuropeEntry={europeId:game.id,sourceId:row.sourceId,
   sourceUrl:row.sourceUrl,first,second,full,...(fixture?{fixture}:{})};
  const previous=current.entries.find(x=>x.europeId===game.id||x.sourceId===row.sourceId);
  if(previous){
   if(previous.europeId!==item.europeId||previous.sourceId!==item.sourceId||
      JSON.stringify(previous.first)!==JSON.stringify(item.first)||
      JSON.stringify(previous.second)!==JSON.stringify(item.second)||
      JSON.stringify(previous.full)!==JSON.stringify(item.full))
    throw Error('Conflito com pesquisa já salva: '+row.sourceId+'. Nenhum valor será substituído.');
   // If a source now publishes the result, verify it before accepting
   // the older Work-only snapshot. Never silently overwrite.
   if(previous.fixture&&hasReference&&
      (JSON.stringify(previous.fixture.full)!==JSON.stringify(game.full)||
       JSON.stringify(previous.fixture.half)!==JSON.stringify(game.half)))
    throw Error('Placar publicado diverge do jogo já pesquisado: '+row.sourceId+'.');
   duplicates++;
  }else newEntries.push(item);
  matched.push({game:game.home+' × '+game.away,sourceId:row.sourceId,round:game.round,league:game.league});
 }
 if(current.entries.length+newEntries.length>1100)throw Error('Limite da pesquisa Work atingido.');
 return {checked:rows.length,newEntries,duplicates,matched};
}
export function stageEuropeWork(
 original:WorkEuropeStore,review:WorkEuropeReview
):WorkEuropeStore{
 readEuropeWork(JSON.stringify(original));
 const next:WorkEuropeStore={format:EUROPE_WORK_STORAGE,entries:[...original.entries,...review.newEntries]};
 readEuropeWork(JSON.stringify(next));
 return next;
}
