/**
 * Experimental, read-only FPL Core Insights 2026/27 evaluation.
 * This dataset's README permits reuse but publishes no standard licence;
 * upstream rights require independent review before any commercial ingestion.
 * Never mutate user Data or fabricate periods. All metrics here are full-time.
 */
export const FPL_PREVIEW_HOME='https://github.com/olbauday/FPL-Core-Insights';
export const FPL_PREVIEW_RAW='https://raw.githubusercontent.com/olbauday/FPL-Core-Insights/main/data/2026-2027/';
export const FPL_PREVIEW_ROUNDS=7;
export type Pair=[number,number];
export type FplPilotGame={
 id:string;gw:number;date:string;sourceKickoff:string;home:string;away:string;
 goals:Pair;shots:Pair;onTarget:Pair;corners:Pair;
 /** Upstream flag: false means the record is present but not validated by the provider. */
 sourceStatsProcessed:boolean;
};
export type FplAudit={games:FplPilotGame[];teams:number;lastDate:string;
 compared:number;agreed:number;disagreed:number;notLocated:number};
const validateInt=(s:string):number|null=>{
 if(!/^(?:0|[1-9]\d*)(?:\.0+)?$/.test(s.trim()))return null;
 const n=Number(s);return Number.isSafeInteger(n)&&n>=0&&n<=999?n:null;
};
export function parseCsv(text:string):Record<string,string>[]{
 if(text.length>250000)throw Error('Arquivo CSV acima do limite de segurança.');
 const rows:string[][]=[];let row:string[]=[],v='',q=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(ch==='"'){if(q&&text[i+1]==='"'){v+='"';i++;}else q=!q;}
  else if(ch===','&&!q){row.push(v);v='';}
  else if((ch==='\n'||ch==='\r')&&!q){
   if(ch==='\r'&&text[i+1]==='\n')i++;
   row.push(v);v='';
   if(row.some(x=>x.length))rows.push(row);
   row=[];
  }else v+=ch;
 }
 if(q)throw Error('CSV com aspas incompletas.');
 row.push(v);if(row.some(x=>x.length))rows.push(row);
 if(rows.length<2)throw Error('CSV vazio.');
 const headers=rows[0].map(x=>x.trim().replace(/^\uFEFF/,''));
 if(new Set(headers).size!==headers.length)throw Error('CSV com cabeçalhos repetidos.');
 return rows.slice(1).map(r=>{
  if(r.length!==headers.length)throw Error('CSV com quantidade de colunas inesperada.');
  return Object.fromEntries(headers.map((h,i)=>[h,r[i]]));
 });
}
const cols=['gameweek','kickoff_time','home_team','away_team','home_score','away_score',
 'finished','match_id','home_total_shots','away_total_shots','home_shots_on_target',
 'away_shots_on_target','home_corners','away_corners'];
const int=(r:Record<string,string>,k:string):number=>{
 const n=validateInt(r[k]??'');
 if(n===null)throw Error('O campo '+k+' está ausente ou inválido.');
 return n;
};
const fieldPair=(r:Record<string,string>,k:string):Pair=>
 [int(r,'home_'+k),int(r,'away_'+k)];
const matchDate=(s:string)=>/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(s)&&
 !Number.isNaN(Date.parse(s+'Z'))&&new Date(s+'Z').toISOString().slice(0,19)===s;
export function parseFplPilot(teamsCsv:string,gwsCsv:string[]):FplPilotGame[]{
 if(gwsCsv.length<FPL_PREVIEW_ROUNDS||gwsCsv.length>38)throw Error('O piloto precisa de 7 a 38 rodadas completas e consecutivas.');
 const clubs=new Map<number,string>();
 const teamRows=parseCsv(teamsCsv);
 if(teamRows.length!==20)throw Error('A fonte não retornou os 20 clubes esperados.');
 for(const r of teamRows){
  const id=int(r,'code'),name=r.name;
  if(!name||name.length>120||clubs.has(id))throw Error('Identidade de equipe inválida.');
  clubs.set(id,name);
 }
 const games:FplPilotGame[]=[],unique=new Set<string>();
 for(let gw=1;gw<=gwsCsv.length;gw++){
  const rows=parseCsv(gwsCsv[gw-1]);
  if(rows.length!==10)throw Error('Rodada '+gw+' tem '+rows.length+' partidas, esperadas 10.');
  for(const r of rows){
   if(cols.some(k=>!(k in r)))throw Error('CSV sem as colunas estatísticas exigidas.');
   // Preserve independently marked pending rows without interpreting them as validated.
   // Previously one unprocessed match blocked all 70 results on mobile.
   if(int(r,'gameweek')!==gw||r.finished!=='True')
    throw Error('Rodada '+gw+' contém uma partida sem resultado final declarado.');
   if(r.stats_processed!=='True'&&r.stats_processed!=='False')
    throw Error('Rodada '+gw+' contém estado de processamento inválido.');
   const sourceStatsProcessed=r.stats_processed==='True';
   if(!matchDate(r.kickoff_time))throw Error('Data original da partida inválida.');
   const home=clubs.get(int(r,'home_team')),away=clubs.get(int(r,'away_team'));
   if(!home||!away||home===away)throw Error('Equipes não identificadas nesta rodada.');
   const id=r.match_id;
   if(!/^[a-z0-9-]{12,140}$/.test(id)||unique.has(id))throw Error('ID de partida inválido ou duplicado.');
   unique.add(id);
   const goals=fieldPair(r,'score'),shots=fieldPair(r,'total_shots'),
    onTarget=fieldPair(r,'shots_on_target'),corners=fieldPair(r,'corners');
   if(onTarget.some((x,i)=>x>shots[i]))throw Error('Chutes no gol excedem finalizações.');
   games.push({id,gw,date:r.kickoff_time.slice(0,10),sourceKickoff:r.kickoff_time,
    home,away,goals,shots,onTarget,corners,sourceStatsProcessed});
  }
 }
 return games.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
const aliases:Record<string,string>={
 'Arsenal FC':'Arsenal','Coventry City FC':'Coventry City','Hull City AFC':'Hull City',
 'AFC Bournemouth':'Bournemouth','Tottenham Hotspur FC':'Spurs',
 'Brighton & Hove Albion FC':'Brighton','Leeds United FC':'Leeds',
 'Manchester City FC':'Man City','Manchester United FC':'Man Utd',
 'Nottingham Forest FC':"Nott'm Forest",'Liverpool FC':'Liverpool',
 'Newcastle United FC':'Newcastle','Everton FC':'Everton','Chelsea FC':'Chelsea',
 'Ipswich Town FC':'Ipswich Town','Fulham FC':'Fulham','Sunderland AFC':'Sunderland',
 'Crystal Palace FC':'Crystal Palace','Brentford FC':'Brentford','Aston Villa FC':'Aston Villa',
};
const canon=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]+/g,' ').trim();
export function crossCheckFpl(games:FplPilotGame[],other:unknown):Pick<FplAudit,'compared'|'agreed'|'disagreed'|'notLocated'>{
 if(!other||typeof other!=='object'||!('matches' in other)||
   !Array.isArray(other.matches))throw Error('Catálogo independente indisponível.');
 const seen=new Map(games.map(g=>[[g.date,canon(g.home),canon(g.away)].join('|'),g]));
 let compared=0,agreed=0,disagreed=0,notLocated=0;
 for(const m of other.matches){
  if(!m||typeof m!=='object'||!('score' in m)||!m.score||typeof m.score!=='object'||
   !('ft' in m.score)||!Array.isArray(m.score.ft)||m.score.ft.length!==2)continue;
  if(!('date' in m)||!('team1' in m)||!('team2' in m)||
     typeof m.date!=='string'||typeof m.team1!=='string'||typeof m.team2!=='string')continue;
  const h=aliases[m.team1]??m.team1,a=aliases[m.team2]??m.team2;
  const found=seen.get([m.date,canon(h),canon(a)].join('|'));
  if(!found){notLocated++;continue;}
  compared++;
  if(found.goals[0]===m.score.ft[0]&&found.goals[1]===m.score.ft[1])agreed++;
  else disagreed++;
 }
 return {compared,agreed,disagreed,notLocated};
}
