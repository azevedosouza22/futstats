/** Work audited outcomes, kept SEPARATE from immutable prospective picks and user's data. */
export type AuditPeriod='full'|'first'|'second';
export type AuditMetric='goals'|'shots'|'target'|'corners';
export type AuditDecision={
  fixture:string;competition:string;forecast_date:string;
  source_id:string;original_pick_index:number;
  original_pick:{period:AuditPeriod;metric:AuditMetric;status:'sinal'|'sem_sinal';
    line:number|null;frequency_hits:number|null;frequency_n:number;mean:number|null};
  decision:'ACERTO'|'ERRO'|'SEM SINAL'|'PENDENTE'|'N/D';
  actual_total:number|null;match_status:string;historical_odds:string;
};
export type V4Audit={
  format:string;day:string;status:string;consultation_cutoff_utc:string;
  summary:{fixtures:number;games_complete:number;games_pending:number;opportunities:number;
    signals:number;abstentions:number;evaluated_signals:number;hits:number;misses:number;
    pending_signals:number;observed_hit_rate:number;duplicates:number};
  decisions:AuditDecision[];
};
export type AuditGroup={label:string;acertos:number;erros:number;abstencoes:number;
  pendentes:number;n:number;jogos:number;taxa:number|null;roi150:number|null};
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const periods:readonly string[]=['full','first','second'];
const metrics:readonly string[]=['goals','shots','target','corners'];
/** Refuse malformed/stale postgame data instead of silently using it as pregame research. */
export function parseV4Audit(raw:unknown):V4Audit{
 if(!obj(raw)||raw.format!=='futstats-radar-v4-auditoria-visual-v1'||
  raw.day!=='2026-10-31'||!obj(raw.summary)||!Array.isArray(raw.decisions)||
  raw.decisions.length!==360||raw.summary.fixtures!==30||
  raw.summary.signals!==328||raw.summary.abstentions!==32||
  raw.summary.opportunities!==360)
   throw Error('Auditoria LV4 não corresponde às decisões congeladas de 31/10.');
 const keys=new Set<string>();let hits=0,misses=0,abs=0,pending=0;
 for(const d of raw.decisions){
  if(!obj(d)||typeof d.fixture!=='string'||typeof d.competition!=='string'||
   typeof d.source_id!=='string'||!obj(d.original_pick)||
   !periods.includes(String(d.original_pick.period))||
   !metrics.includes(String(d.original_pick.metric))||
   !['ACERTO','ERRO','SEM SINAL','PENDENTE','N/D'].includes(String(d.decision)))
   throw Error('Mercado inválido no relatório LV4.');
  const key=d.fixture+'|'+d.original_pick.period+'|'+d.original_pick.metric;
  if(keys.has(key))throw Error('Mercado duplicado no relatório LV4.');
  keys.add(key);
  if(d.original_pick.status==='sem_sinal'){
   if(d.decision!=='SEM SINAL'||d.original_pick.line!==null)
    throw Error('Abstenção alterada na auditoria LV4.');
   abs++;continue;
  }
  if(d.original_pick.status!=='sinal'||typeof d.original_pick.line!=='number')
   throw Error('Linha Over inválida na auditoria LV4.');
  if(d.decision==='ACERTO'||d.decision==='ERRO'){
   if(typeof d.actual_total!=='number'||d.actual_total<0||
    (d.actual_total>d.original_pick.line)!==(d.decision==='ACERTO'))
    throw Error('Resultado do mercado não corresponde à linha congelada.');
   if(d.decision==='ACERTO')hits++;else misses++;
  }else pending++;
 }
 const s=raw.summary;
 if(hits!==s.hits||misses!==s.misses||abs!==s.abstentions||
  hits+misses!==s.evaluated_signals||pending!==s.pending_signals||
  s.duplicates!==0||s.games_complete+s.games_pending!==30)
  throw Error('Totais do LV4 não conferem com as 360 decisões.');
 return raw as unknown as V4Audit;
}
const periodName:Record<string,string>={full:'Jogo completo',first:'1º tempo',second:'2º tempo'};
const marketName:Record<string,string>={goals:'Gols',shots:'Finalizações',target:'Chutes no gol',corners:'Escanteios'};
export function auditPeriodName(key:string){return periodName[key]??key;}
export function auditMarketName(key:string){return marketName[key]??key;}
export type GroupDimension='period'|'metric'|'league'|'line'|'fixture'|'league-period-metric';
/** Exploratory breakdown; derived ONLY from original picks, never optimizes forecasts retroactively. */
export function summarizeV4Audit(audit:V4Audit,dimension:GroupDimension):AuditGroup[]{
 const groups=new Map<string,{a:number;e:number;b:number;p:number;games:Set<string>}>();
 for(const d of audit.decisions){
  const pick=d.original_pick;
  const label=dimension==='period'?auditPeriodName(pick.period):
   dimension==='metric'?auditMarketName(pick.metric):
   dimension==='league'?d.competition:
   dimension==='fixture'?d.fixture:
   dimension==='line'?auditMarketName(pick.metric)+' · '+auditPeriodName(pick.period)+' · '+(pick.line===null?'Sem sinal':'Over '+pick.line.toFixed(1).replace('.',',')):
   d.competition+' · '+auditMarketName(pick.metric)+' · '+auditPeriodName(pick.period);
  const g=groups.get(label)??{a:0,e:0,b:0,p:0,games:new Set<string>()};
  g.games.add(d.fixture);
  if(d.decision==='ACERTO')g.a++;
  else if(d.decision==='ERRO')g.e++;
  else if(d.decision==='SEM SINAL')g.b++;
  else g.p++;
  groups.set(label,g);
 }
 return [...groups].map(([label,g])=>{
  const n=g.a+g.e;
  return {label,acertos:g.a,erros:g.e,abstencoes:g.b,pendentes:g.p,n,
   jogos:g.games.size,taxa:n?g.a/n:null,roi150:n?(g.a-2*g.e)/(2*n):null};
 }).sort((a,b)=>b.n-a.n||b.acertos-a.acertos||a.label.localeCompare(b.label,'pt-BR'));
}
