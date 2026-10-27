/**
 * Etapa 72 — point-in-time public reference for all 4 FutStats indicators.
 * Two public pages were ACTUALLY READ on 2026-10-26, but the application
 * NEVER fetches their content, imports a match or authenticates a prediction.
 * A common underlying data feed cannot be ruled out.
 */
import type {PublicResultCrosscheck} from './publicResultCrosscheck';
export type PublicMetric='goals'|'shots'|'target'|'corners';
export type PublicPeriod='full'|'first'|'second';
export type StatPair=readonly [number,number];
export type PublicStatsPage={
 sourceName:string;sourceUrl:string;checkedDate:string;
 date:string;competition:string;home:string;away:string;
 full:Record<PublicMetric,StatPair|null>;
 halfGoals:StatPair|null;
};
export type PublicCellState='DUAS_PAGINAS'|'DERIVADO'|'N/D'|'DIVERGENTE';
export type PublicPeriodCell={metric:PublicMetric;period:PublicPeriod;
 value:StatPair|null;status:PublicCellState};
export type PublicStatsResult={
 rows:{metric:PublicMetric;name:string;cells:Record<PublicPeriod,PublicPeriodCell>}[];
 corroboratedFields:number;derivedFields:number;
 missingFields:number;disputedFields:number;totalFields:24;
 sources:{name:string;url:string;checkedDate:string}[];
 registeredForecasts:0;verifiedForecasts:0;modelAccuracy:'N/D';
 warning:'REFERÊNCIA PÚBLICA — NÃO É PREVISÃO SALVA';
};
const metrics:readonly PublicMetric[]=['goals','shots','target','corners'];
const labels:Record<PublicMetric,string>={
 goals:'Gols',shots:'Finalizações',target:'Chutes no alvo',corners:'Escanteios'
};
const domainPaths:Record<string,string>={
 'scoutpicks.app':'/matches/laliga/',
 'noataque.com.br':'/jogo/campeonato-espanhol/'
};
const validDate=(s:string)=>/^\d{4}-\d\d-\d\d$/.test(s)&&
 Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const validPair=(v:StatPair|null,max:number)=>
 v===null||(Array.isArray(v)&&v.length===2&&v.every(n=>
 Number.isSafeInteger(n)&&n>=0&&n<=max));
const equal=(a:StatPair,b:StatPair)=>a[0]===b[0]&&a[1]===b[1];
const notGreater=(a:StatPair,b:StatPair)=>a.every((v,i)=>v<=b[i]);
const N=(metric:PublicMetric,period:PublicPeriod,status:PublicCellState='N/D'):
PublicPeriodCell=>({metric,period,value:null,status});

/** Manually documented observation comparison, never a live site fetch. */
export function comparePublicDetailedStats(
 official:PublicResultCrosscheck,observations:readonly PublicStatsPage[],
 now=new Date()
):PublicStatsResult{
 if(official.status!=='COINCIDE_DOCUMENTADO'||official.full===null||
   official.half===null)throw Error('Resultado oficial parcial ou divergente.');
 if(observations.length!==2)
  throw Error('Exatamente duas referências públicas distintas são necessárias.');
 const hosts=new Set<string>();
 for(const page of observations){
  let url:URL;
  try{url=new URL(page.sourceUrl);}catch{throw Error('Link de estatísticas inválido.');}
  const host=url.hostname.toLowerCase(),path=domainPaths[host];
  if(url.protocol!=='https:'||url.username||url.password||
     !path||!url.pathname.startsWith(path))
   throw Error('Origem HTTPS da estatística não é uma das páginas revisadas.');
  if(hosts.has(host))throw Error('Duas páginas do mesmo domínio não são duas origens.');
  hosts.add(host);
  if(!page.sourceName.trim()||!validDate(page.date)||
     !validDate(page.checkedDate)||page.checkedDate>now.toISOString().slice(0,10)||
     page.checkedDate<page.date||page.date!==official.date||
     page.competition!==official.competition||
     page.home!==official.home||page.away!==official.away)
   throw Error('Fonte de estatística com data ou identidade divergente.');
  if(!page.full||Object.keys(page.full).sort().join('|')!==[...metrics].sort().join('|')||
     metrics.some(metric=>!validPair(page.full[metric],metric==='goals'?99:500))||
     !validPair(page.halfGoals,99))
   throw Error('Métrica não observada ou inválida; informe N/D explicitamente.');
  const goals=page.full.goals,shots=page.full.shots,target=page.full.target;
  if(goals&&!equal(goals,official.full))
   throw Error('Placar da segunda referência discorda das páginas oficiais.');
  if(page.halfGoals&&!equal(page.halfGoals,official.half))
   throw Error('Intervalo da referência discorda do resultado oficial.');
  if(shots&&target&&!notGreater(target,shots))
   throw Error('Chutes no alvo acima das finalizações.');
  if(goals&&page.halfGoals&&!notGreater(page.halfGoals,goals))
   throw Error('Gols de intervalo superiores ao total.');
 }
 const [a,b]=observations;
 let corroboratedFields=0,derivedFields=0,missingFields=0,disputedFields=0;
 const confirmed=(metric:PublicMetric,period:PublicPeriod,x:StatPair|null,
  y:StatPair|null):PublicPeriodCell=>{
  const result=x===null||y===null?N(metric,period):
   !equal(x,y)?N(metric,period,'DIVERGENTE'):
   {metric,period,value:x,status:'DUAS_PAGINAS' as const};
  if(result.status==='DUAS_PAGINAS')corroboratedFields+=2;
  else if(result.status==='DIVERGENTE')disputedFields+=2;
  else missingFields+=2;
  return result;
 };
 const rows=metrics.map(metric=>{
  const full=confirmed(metric,'full',a.full[metric],b.full[metric]);
  const first=metric==='goals'
   ?confirmed('goals','first',a.halfGoals,b.halfGoals):N(metric,'first');
  if(metric!=='goals')missingFields+=2;
  let second=N(metric,'second');
  if(metric==='goals'&&full.value!==null&&first.value!==null){
   second={metric,period:'second',
    value:[full.value[0]-first.value[0],full.value[1]-first.value[1]],
    status:'DERIVADO'};
   derivedFields+=2;
  }else missingFields+=2;
  return {metric,name:labels[metric],cells:{full,first,second}};
 });
 if(corroboratedFields+derivedFields+missingFields+disputedFields!==24)
  throw Error('Falha no controle dos 24 campos da partida.');
 return {rows,corroboratedFields,derivedFields,missingFields,disputedFields,
  totalFields:24,sources:observations.map(p=>({name:p.sourceName,
   url:p.sourceUrl,checkedDate:p.checkedDate})),
  registeredForecasts:0,verifiedForecasts:0,modelAccuracy:'N/D',
  warning:'REFERÊNCIA PÚBLICA — NÃO É PREVISÃO SALVA'};
}
