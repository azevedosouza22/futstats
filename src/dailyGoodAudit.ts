/**
 * Read-only, prospective audit of "As Boas do Dia".
 *
 * Only explicit, pre-kickoff snapshots from the shortlist are evaluated.
 * Old Radar registrations and retrospective simulations are NOT classified
 * as Good Picks; no outcome, signal or historical mean is reconstructed.
 * Results must have a traceable, structurally valid original CSV source.
 * This is not an independent web verification of the source's contents.
 */
import type {Data, Match} from './model';
import {validateMatch} from './model';
import {brasiliaDate,normalizeTeam} from './calendar';
import {matchTotal} from './radar';
import type {SavedRadarRecord} from './radarRecords';
import {venueV2Markets} from './radarVenueV2';

export type PickVerdict='Acertou'|'Errou'|'N/D';
export type PickAuditStatus='legacy'|'invalid'|'late'|'future'|'waiting'|'ambiguous'|'source_missing'|'scored';
export type PickScore={hits:number;observed:number};
export type PickAuditMarket={
 id:string;label:string;line:number;actual:number|null;
 direction:'Over'|'Under';v2:PickVerdict;v3:PickVerdict;
 constantOver:PickVerdict;historicalBaseline:PickVerdict;
 historicalMean:number;historicalSample:number;leagueSample:number;
};
export type PickAuditRow={
 key:string;home:string;away:string;competition:string;matchAt:string;
 status:PickAuditStatus;reason:string;sourceUrl:string|null;markets:PickAuditMarket[];
};
export type PickAuditLeague={
 league:string;snapshots:number;scoredFixtures:number;scoredMarkets:number;
 picks:PickScore;constantOver:PickScore;historicalBaseline:PickScore;
 missingMarkets:number;
};
export type PickAuditReport={
 snapshots:number;attributed:number;scoredFixtures:number;
 rows:PickAuditRow[];leagues:PickAuditLeague[];
};

const zero=():PickScore=>({hits:0,observed:0});
const validNumber=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const officialHost=new Set(['www.cbf.com.br','www.laliga.com','www.lfp.fr','www.asroma.com']);
const safeOfficialUrl=(s:string)=>{
 try{const url=new URL(s);return url.protocol==='https:'&&!url.username&&!url.password&&officialHost.has(url.hostname.toLowerCase());}
 catch{return false;}
};
function evidence(record:SavedRadarRecord):boolean{
 const proof=record.goodPicks;
 if(!proof||!safeOfficialUrl(proof.sourceUrl)||!/^\d{4}-\d{2}-\d{2}$/.test(proof.verifiedAt)||
    !Array.isArray(proof.signals)||proof.signals.length<1||proof.signals.length>3||
    !record.venue||!record.leagueContext)return false;
 const saved=brasiliaDate(new Date(record.savedAt));
 if(proof.verifiedAt>saved.date||record.matchAt.slice(0,10)!==saved.date)return false;
 if(new Set(proof.signals.map(s=>s.id)).size!==proof.signals.length)return false;
 return proof.signals.every(s=>{
   const venue=record.venue!.find(m=>m.marketId===s.id);
   const market=record.markets.find(m=>m.id===s.id);
   const league=record.leagueContext!.find(m=>m.id===s.id);
   return venue&&market&&league&&
    venue.v2===s.direction&&venue.v3===s.direction&&
    s.direction!=='Sem sinal'&&venue.line===s.line&&market.line===s.line&&
    venue.projectedTotal===s.projection&&
    market.historicalMean===s.historicalMean&&market.observed===s.historicalSample&&
    league.observed===s.leagueSample&&s.historicalSample>=8&&s.leagueSample>=10&&
    validNumber(s.projection)&&validNumber(s.historicalMean)&&s.line>0&&
    (s.direction==='Over'?s.projection>s.line:s.projection<s.line)&&
    Math.abs(s.projection-s.line)/s.line>=0.15&&
    venueV2Markets.some(m=>m.id===s.id&&m.line===s.line);
 });
}
function fixtureIdentity(r:SavedRadarRecord){
 return [r.matchAt.slice(0,10),r.competition,r.home,r.away].map(normalizeTeam).join('|');
}
function linked(data:Data,match:Match,record:SavedRadarRecord):boolean{
 const home=data.teams.find(t=>t.id===match.home)?.name??'';
 const away=data.teams.find(t=>t.id===match.away)?.name??'';
 return match.date===record.matchAt.slice(0,10)&&
   match.competition.trim()===record.competition.trim()&&
   normalizeTeam(home)===normalizeTeam(record.home)&&
   normalizeTeam(away)===normalizeTeam(record.away);
}
function verdict(direction:'Over'|'Under',actual:number|null,line:number):PickVerdict{
 if(actual===null)return 'N/D';
 return ((actual>line)===(direction==='Over'))?'Acertou':'Errou';
}
function score(s:PickScore,v:PickVerdict){
 if(v==='N/D')return;
 s.observed++;
 if(v==='Acertou')s.hits++;
}
export function auditDailyGoodPicks(
 data:Data,records:readonly SavedRadarRecord[],now=new Date()
):PickAuditReport{
 const time=brasiliaDate(now);
 const nowLocal=time.date+'T'+time.time;
 const identities=new Map<string,number>();
 for(const record of records)if(record.goodPicks){
  const id=fixtureIdentity(record);
  identities.set(id,(identities.get(id)??0)+1);
 }
 const rows:PickAuditRow[]=[];
 for(const record of records){
  const row:PickAuditRow={key:record.key,home:record.home,away:record.away,
   competition:record.competition,matchAt:record.matchAt,
   status:'legacy',reason:'Registro sem evidência de seleção em As Boas do Dia',
   sourceUrl:null,markets:[]};
  rows.push(row);
  if(!record.goodPicks)continue;
  if(!evidence(record)){
   row.status='invalid';row.reason='Seleção ou referências congeladas inconsistentes';continue;
  }
  const saved=brasiliaDate(new Date(record.savedAt));
  if(saved.date+'T'+saved.time>=record.matchAt.slice(0,16)){
   row.status='late';row.reason='Registro não anterior ao início';continue;
  }
  if((identities.get(fixtureIdentity(record))??0)>1){
   row.status='ambiguous';row.reason='Várias previsões atribuídas ao mesmo jogo';continue;
  }
  if(nowLocal<=record.matchAt.slice(0,16)){
   row.status='future';row.reason='Jogo ainda não iniciado';continue;
  }
  const matches=data.matches.filter(m=>linked(data,m,record));
  if(matches.length===0){row.status='waiting';row.reason='Aguardando resultado cadastrado';continue;}
  if(matches.length!==1||matches[0].research?.dateDiscrepancy){
   row.status='ambiguous';row.reason='Partida duplicada ou data conflitante';continue;
  }
  const match=matches[0];
  // A local/manual/demo score without traceable original-source metadata
  // must NEVER be treated as a verified real-world result.
  const source=match.research;
  if(!source||validateMatch(match)||Date.parse(source.importedAt)<Date.parse(record.matchAt+'-03:00')){
   row.status='source_missing';row.reason='Resultado sem procedência CSV válida posterior ao jogo';continue;
  }
  row.sourceUrl=source.sourceUrl;
  for(const s of record.goodPicks.signals){
   const metric=venueV2Markets.find(m=>m.id===s.id&&m.line===s.line);
   const actual=metric?matchTotal(match,metric.metric,metric.period):null;
   const count=actual!==null&&Number.isFinite(actual)&&actual>=0?actual:null;
   const baseline:'Over'|'Under'=s.historicalMean>s.line?'Over':'Under';
   // If the historical mean equals the line, there is no baseline signal.
   row.markets.push({
    id:s.id,label:s.label,line:s.line,actual:count,direction:s.direction,
    v2:verdict(s.direction,count,s.line),v3:verdict(s.direction,count,s.line),
    constantOver:verdict('Over',count,s.line),
    historicalBaseline:s.historicalMean===s.line?'N/D':verdict(baseline,count,s.line),
    historicalMean:s.historicalMean,historicalSample:s.historicalSample,
    leagueSample:s.leagueSample
   });
  }
  row.status='scored';row.reason=row.markets.some(m=>m.actual!==null)?
   'Resultado com origem CSV documentada; conteúdo não revisado na web':
   'Estatísticas do resultado N/D';
 }
 const leagues=new Map<string,PickAuditLeague>();
 for(const row of rows){
  if(row.status==='legacy')continue;
  let league=leagues.get(row.competition);
  if(!league){
   league={league:row.competition,snapshots:0,scoredFixtures:0,
    scoredMarkets:0,picks:zero(),constantOver:zero(),historicalBaseline:zero(),missingMarkets:0};
   leagues.set(row.competition,league);
  }
  league.snapshots++;
  if(row.status!=='scored')continue;
  league.scoredFixtures++;
  for(const market of row.markets){
   if(market.v3==='N/D'){league.missingMarkets++;continue;}
   league.scoredMarkets++;
   score(league.picks,market.v3);
   score(league.constantOver,market.constantOver);
   score(league.historicalBaseline,market.historicalBaseline);
  }
 }
 return {snapshots:records.length,attributed:rows.filter(r=>r.status!=='legacy').length,
  scoredFixtures:rows.filter(r=>r.status==='scored'&&r.markets.some(m=>m.actual!==null)).length,
  rows,leagues:[...leagues.values()].sort((a,b)=>a.league.localeCompare(b.league,'pt-BR'))};
}
