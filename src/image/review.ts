import {additiveMetrics, metrics, labels, unavailable, validateMatch, type Data, type FieldOrigin, type ImageOrigin, type Metric, type Period, type ResolvedStats, type Match} from '../model';
import {extract, type Extraction} from './parser';
import {readSummary,combineEvents,countEvents,type Summary,type EventCoverage} from './summary';
import {normalizeName} from './header';
export type ImageDraft = {id:string; kind:'stats'|'summary';summary:Summary;period:Period|null; original:Extraction; values:[ResolvedStats,ResolvedStats]; origins:Record<Metric,[FieldOrigin|null,FieldOrigin|null]>; confidence:number};
export type PeriodData = {values:[ResolvedStats,ResolvedStats]; origins:Record<Metric,[FieldOrigin|null,FieldOrigin|null]>};
export type Review = Record<Period,PeriodData>;
export const blankPeriod = ():PeriodData=>({values:[unavailable(),unavailable()],origins:Object.fromEntries(metrics.map(k=>[k,[null,null]])) as PeriodData['origins']});
export function draftFromText(id:string,text:string,confidence=100,periodEvidence:Period|null=null,summaryEvidence=false):ImageDraft {
  const original=extract(text,periodEvidence);const period=blankPeriod();period.values=structuredClone(original.values);
  for(const k of metrics)for(const side of [0,1])if(period.values[side][k]!==null)period.origins[k][side]='recognized';
  const summary=readSummary(text,original.home,original.away,summaryEvidence);
  const kind=summary.identified&&!original.recognized.some(k=>!['goals','yellow','red'].includes(k))?'summary':'stats';
  if(kind==='summary')original.warnings=original.warnings.filter(w=>!w.startsWith('Período não determinado')&&!w.startsWith('Nenhuma linha'));
  return {id,kind,summary,period:original.period,original,...period,confidence};
}
export function correctField(draft:ImageDraft,k:Metric,side:number,value:number|null):ImageDraft {
  const next=structuredClone(draft);next.values[side][k]=value;next.origins[k][side]=value===null?null:'corrected';return next;
}
export function changePeriod(draft:ImageDraft,period:Period|null):ImageDraft {
  const next=structuredClone(draft);next.period=period;
  if(period!=='full'&&next.original.goalsFromFinalHeader)for(const side of [0,1]){
    if(next.origins.goals[side]==='recognized'){next.values[side].goals=null;next.origins.goals[side]=null;}
  }
  return next;
}
export function mergeDrafts(drafts:ImageDraft[],coverage:EventCoverage={first:false,second:false}) {
  const review:Review={first:blankPeriod(),second:blankPeriod(),full:blankPeriod()};const errors:string[]=[];
  const conflicts:{period:Period;metric:Metric;side:number;message:string}[]=[];
  const periods=new Set<Period>();
  const write=(p:Period,k:Metric,side:number,v:number,origin:FieldOrigin='recognized')=>{
    const old=review[p].values[side][k];if(old!==null&&old!==v){const message=`Fontes com valores diferentes para ${labels[k]} (${p}). Corrija a leitura ou confira o SUMÁRIO.`;conflicts.push({period:p,metric:k,side,message});return;}
    if(old===v){if(origin==='corrected')review[p].origins[k][side]=origin;return;}
    review[p].values[side][k]=v;review[p].origins[k][side]=origin;
  };
  for(const d of drafts){if(d.kind==='summary')continue;if(!d.period){errors.push('Confirme o período de cada imagem.');continue;}periods.add(d.period);
    for(const k of metrics)for(const side of [0,1]){const v=d.values[side][k];if(v===null)continue;const old=review[d.period].values[side][k];
      if(old!==null&&old!==v){const message=`Imagens com valores diferentes para ${labels[k]} no mesmo período. Corrija ou deixe um dos campos N/D.`;conflicts.push({period:d.period,metric:k,side,message});continue;}
      write(d.period,k,side,v,d.origins[k][side]??'recognized');
    }
  }
  // A finished header is match-level evidence, independent of the statistics tab.
  const finalScores=drafts.filter(d=>d.confidence>=65).map(d=>d.original.finalScore).filter((s):s is [number,number]=>s!==null);
  if(drafts.some(d=>d.original.warnings.some(w=>w.startsWith('Placares de cabeçalho divergentes'))))for(const side of [0,1])conflicts.push({period:'full',metric:'goals',side,message:'Cabeçalho com placares conflitantes. Corrija o placar final.'});
  if(finalScores.length)for(const side of [0,1]){
    if(finalScores.some(s=>s[side]!==finalScores[0][side]))conflicts.push({period:'full',metric:'goals',side,message:'Placares finais divergentes entre imagens. Corrija o campo do placar final.'});
    else write('full','goals',side,finalScores[0][side]);
  }
  const summaries=drafts.filter(d=>d.kind==='summary'&&d.confidence>=65).map(d=>d.summary);
  for(const summary of summaries)if(summary.interval)for(const side of [0,1])write('first','goals',side,summary.interval[side]);
  const events=combineEvents(summaries);
  const warnings=[...summaries.flatMap(s=>s.warnings),...events.warnings];
  const unsafe=summaries.some(s=>s.extraTime||s.warnings.some(w=>/não identificada|ambígua|fora dos|não reconhecido/.test(w)))||drafts.some(d=>d.kind==='summary'&&d.confidence<65);
  if(!unsafe&&!events.warnings.length)for(const p of ['first','second'] as const)if(coverage[p])for(const k of ['goals','yellow','red'] as const)for(const side of [0,1])write(p,k,side,countEvents(events.events,p,k,side));
  const noExtraTime=!drafts.some(d=>d.summary.extraTime||d.original.warnings.some(w=>w.includes('prorrogação')));
  // Only goals are filled automatically by arithmetic; other calculations remain explicit.
  if(noExtraTime)for(const side of [0,1]){
    const first=review.first.values[side].goals,full=review.full.values[side].goals;
    if(first!==null&&full!==null&&full>=first&&review.second.values[side].goals===null){review.second.values[side].goals=full-first;review.second.origins.goals[side]='calculated';}
  }
  if(coverage.first&&coverage.second&&!unsafe&&!events.warnings.length)for(const k of ['yellow','red'] as const)for(const side of [0,1])if(review.full.values[side][k]===null){review.full.values[side][k]=review.first.values[side][k]!+review.second.values[side][k]!;review.full.origins[k][side]='calculated';}
  return {review,errors:[...new Set([...errors,...conflicts.map(c=>c.message)])],periodErrors:errors,conflicts,autoGoalsEnabled:noExtraTime,warnings:[...new Set(warnings)],events:events.events,periods:[...periods]};
}
export function inconsistencies(review:Review):string[] {
  const errors:string[]=[];
  const names={first:'1º tempo',second:'2º tempo',full:'jogo completo'};
  for(const p of ['first','second','full'] as const)for(const side of [0,1]){
    const s=review[p].values[side];
    if(s.shots!==null&&s.target!==null&&s.target>s.shots)errors.push(`${names[p]}: finalizações no alvo superam as finalizações (${side?'visitante':'mandante'}).`);
    for(const k of metrics){const v=s[k];if(v!==null&&(!Number.isFinite(v)||v<0||(k!=='xg'&&k!=='possession'&&!Number.isSafeInteger(v))||(k==='possession'&&v>100)))errors.push(`${labels[k]} inválido (${names[p]}).`);}
  }
  for(const k of additiveMetrics)for(const side of [0,1]){
    const a=review.first.values[side][k],b=review.second.values[side][k],c=review.full.values[side][k];
    if(a!==null&&b!==null&&c!==null&&a+b!==c)errors.push(`${labels[k]}: 1º tempo (${a}) + 2º tempo (${b}) ≠ completo (${c}), ${side?'visitante':'mandante'}.`);
    if(a!==null&&c!==null&&c<a)errors.push(`${labels[k]}: completo menor que 1º tempo, ${side?'visitante':'mandante'}. Não é possível calcular diferença negativa.`);
    if(b!==null&&c!==null&&c<b)errors.push(`${labels[k]}: completo menor que 2º tempo, ${side?'visitante':'mandante'}. Não é possível calcular diferença negativa.`);
  }
  return [...new Set(errors)];
}
export function completeSecondGoals(input:Review,enabled=true):Review{
 const next=structuredClone(input);if(!enabled)return next;
 for(const side of [0,1]){
  const a=next.first.values[side].goals,c=next.full.values[side].goals;
  if(next.second.values[side].goals===null||next.second.origins.goals[side]==='calculated'){
   const value=a!==null&&c!==null&&c>=a?c-a:null;
   next.second.values[side].goals=value;next.second.origins.goals[side]=value===null?null:'calculated';
  }
 }
 return next;
}
export function calculateDifferences(input:Review,target:'first'|'second'='second'):Review {
  const next=structuredClone(input);
  for(const k of additiveMetrics)for(const side of [0,1]){
    const other=next[target==='second'?'first':'second'].values[side][k],full=next.full.values[side][k];
    if(next[target].values[side][k]===null&&other!==null&&full!==null&&full>=other){next[target].values[side][k]=full-other;next[target].origins[k][side]='calculated';}
  }
  return next;
}
export function calculateTotals(input:Review):Review {
  const next=structuredClone(input);
  for(const k of additiveMetrics)for(const side of [0,1]){
    const a=next.first.values[side][k],b=next.second.values[side][k];
    if(next.full.values[side][k]===null&&a!==null&&b!==null){next.full.values[side][k]=a+b;next.full.origins[k][side]='calculated';}
  }
  return next;
}
export type MatchInfo={home:string;away:string;date:string;competition:string;country?:string;round?:string};
export function possibleDuplicates(data:Data,info:MatchInfo):Match[] {
  const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const names=new Map(data.teams.map(t=>[t.id,norm(t.name)]));
  const home=norm(info.home),away=norm(info.away);
  return data.matches.filter(m=>m.date===info.date&&((names.get(m.home)===home&&names.get(m.away)===away)||(names.get(m.home)===away&&names.get(m.away)===home)));
}
export function saveImageMatch(data:Data,info:MatchInfo,review:Review,confirmed:boolean,matchFields:ImageOrigin['matchFields']):Data {
  if(!confirmed)throw Error('Confirme a revisão antes de salvar.');
  if(!info.home.trim()||!info.away.trim()||info.home.trim().toLocaleLowerCase()===info.away.trim().toLocaleLowerCase())throw Error('Informe duas equipes diferentes.');
  if(info.home.length>80||info.away.length>80||info.competition.length>100)throw Error('Nome de equipe ou competição muito longo.');
  if(possibleDuplicates(data,info).length)throw Error('Possível duplicata: já existe uma partida dessas equipes nesta data. Confira o histórico. Nenhum registro foi sobrescrito.');
  const errors=inconsistencies(review);if(errors.length)throw Error(errors.join(' '));
  const periods=(['first','second','full'] as const).filter(p=>review[p].values.some(s=>metrics.some(k=>s[k]!==null)));
  if(!periods.length)throw Error('Não há estatísticas confirmadas para salvar.');
  const teams=[...data.teams];const resolve=(name:string)=>{let t=teams.find(t=>normalizeName(t.name).toLocaleLowerCase()===normalizeName(name).toLocaleLowerCase());if(!t){t={id:crypto.randomUUID(),name:name.trim(),color:'#23875b'};teams.push(t);}return t.id;};
  const home=resolve(normalizeName(info.home)),away=resolve(normalizeName(info.away));
  const match:Match={id:crypto.randomUUID(),home,away,date:info.date,competition:info.competition.trim(),first:structuredClone(review.first.values),second:structuredClone(review.second.values),image:{importedAt:new Date().toISOString(),confirmed:true,periods,full:structuredClone(review.full.values),fields:structuredClone(Object.fromEntries((['first','second','full'] as const).map(p=>[p,review[p].origins]))),matchFields}};
  if(info.country)match.country=normalizeName(info.country);if(info.round)match.round=normalizeName(info.round);
  const error=validateMatch(match);if(error)throw Error(error);
  return {teams,matches:[...data.matches,match]};
}
