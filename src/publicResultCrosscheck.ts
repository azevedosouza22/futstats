/**
 * Etapa 70. Compare two *documented* public source observations for a played
 * match. URL metadata alone is NEVER proof of fetching/validating the page.
 * A real manual source inspection can be recorded separately in research.
 * This is not a user forecast, imported Match or independent accuracy score.
 */
export type PublicScoreObservation={
  sourceName:string;sourceUrl:string;checkedDate:string;
  date:string;competition:string;home:string;away:string;
  full:readonly [number,number];half:readonly [number,number]|null;
};
export type PublicResultCrosscheck={
  status:'COINCIDE_DOCUMENTADO'|'DIVERGENTE';
  date:string;competition:string;home:string;away:string;
  full:readonly [number,number]|null;
  half:readonly [number,number]|null;
  second:readonly [number,number]|null;
  secondPeriodMethod:'SUBTRACAO_ARITMETICA'|'N/D';
  missingMetrics:readonly ['finalizações','chutes no alvo','escanteios'];
  sources:readonly {name:string;url:string;checkedDate:string}[];
  eligibleForProspectiveCohort:false;
  registeredForecasts:0;
  externalAccuracy:'N/D';
  warning:'CASO PÚBLICO DOCUMENTADO — NÃO É PREVISÃO SALVA';
};
const allowedHosts=new Set(['www.laliga.com','www.fcbarcelona.com']);
const iso=(s:string)=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s)&&
  Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const date=(s:string)=>/^\d{4}-\d\d-\d\d$/.test(s)&&
 Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const score=(v:readonly number[])=>v.length===2&&v.every(
 n=>Number.isSafeInteger(n)&&n>=0&&n<=99);
export function checkPublicResultPair(
 sources:readonly PublicScoreObservation[],now=new Date()
):PublicResultCrosscheck{
 if(sources.length!==2)throw Error('Exatamente duas páginas públicas distintas são necessárias.');
 const hosts:string[]=[];
 for(const s of sources){
  let u:URL;
  try{u=new URL(s.sourceUrl);}catch{throw Error('Endereço da página inválido.');}
  if(u.protocol!=='https:'||u.username||u.password||
    !allowedHosts.has(u.hostname.toLowerCase())||u.pathname.length<2)
    throw Error('URL de resultado fora dos domínios públicos permitidos.');
  hosts.push(u.hostname.toLowerCase());
  if(!s.sourceName.trim()||!date(s.checkedDate)||!date(s.date)||
    s.checkedDate>now.toISOString().slice(0,10)||s.checkedDate<s.date||
    !s.competition.trim()||!s.home.trim()||!s.away.trim()||
    s.home.trim()===s.away.trim()||!score(s.full)||
    (s.half!==null&&(!score(s.half)||s.half.some((n,i)=>n>s.full[i]))))
   throw Error('Observação de fonte com identidade, data ou placar inválidos.');
 }
 if(hosts[0]===hosts[1])throw Error('Páginas do mesmo domínio não contam como duas fontes.');
 const [a,b]=sources;
 const identity=(s:PublicScoreObservation)=>
  [s.date,s.competition.trim(),s.home.trim(),s.away.trim()].join('|');
 if(identity(a)!==identity(b))throw Error('As duas páginas não descrevem a mesma partida.');
 const equal=(x:readonly number[],y:readonly number[])=>x.every((v,i)=>v===y[i]);
 const fullAgrees=equal(a.full,b.full);
 const halfAgrees=a.half!==null&&b.half!==null&&equal(a.half,b.half);
 const consistent=fullAgrees&&(a.half===null||b.half===null||halfAgrees);
 const full=consistent?a.full:null;
 const half=consistent&&halfAgrees?a.half:null;
 const second=full!==null&&half!==null?
   [full[0]-half[0],full[1]-half[1]] as const:null;
 return {
  status:consistent?'COINCIDE_DOCUMENTADO':'DIVERGENTE',
  date:a.date,competition:a.competition,home:a.home,away:a.away,
  full,half,second,
  secondPeriodMethod:second?'SUBTRACAO_ARITMETICA':'N/D',
  missingMetrics:['finalizações','chutes no alvo','escanteios'],
  sources:sources.map(s=>({name:s.sourceName,url:s.sourceUrl,checkedDate:s.checkedDate})),
  registeredForecasts:0,eligibleForProspectiveCohort:false,externalAccuracy:'N/D',
  warning:'CASO PÚBLICO DOCUMENTADO — NÃO É PREVISÃO SALVA'
 };
}
