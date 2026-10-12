import {additiveMetrics, metrics, labels, unavailable, validateMatch, type Data, type FieldOrigin, type ImageOrigin, type Metric, type Period, type ResolvedStats, type Match} from '../model';
import {extract, type Extraction} from './parser';
export type ImageDraft = {id:string; period:Period|null; original:Extraction; values:[ResolvedStats,ResolvedStats]; origins:Record<Metric,[FieldOrigin|null,FieldOrigin|null]>; confidence:number};
export type PeriodData = {values:[ResolvedStats,ResolvedStats]; origins:Record<Metric,[FieldOrigin|null,FieldOrigin|null]>};
export type Review = Record<Period,PeriodData>;
export const blankPeriod = ():PeriodData=>({values:[unavailable(),unavailable()],origins:Object.fromEntries(metrics.map(k=>[k,[null,null]])) as PeriodData['origins']});
export function draftFromText(id:string,text:string,confidence=0):ImageDraft {
  const original=extract(text);const period=blankPeriod();period.values=structuredClone(original.values);
  for(const k of metrics)for(const side of [0,1])if(period.values[side][k]!==null)period.origins[k][side]='recognized';
  return {id,period:original.period,original,...period,confidence};
}
export function correctField(draft:ImageDraft,k:Metric,side:number,value:number|null):ImageDraft {
  const next=structuredClone(draft);next.values[side][k]=value;next.origins[k][side]=value===null?null:'corrected';return next;
}
export function mergeDrafts(drafts:ImageDraft[]) {
  const review:Review={first:blankPeriod(),second:blankPeriod(),full:blankPeriod()};const errors:string[]=[];
  const periods=new Set<Period>();
  for(const d of drafts){if(!d.period){errors.push('Confirme o período de cada imagem.');continue;}periods.add(d.period);
    for(const k of metrics)for(const side of [0,1]){const v=d.values[side][k];if(v===null)continue;const old=review[d.period].values[side][k];
      if(old!==null&&old!==v){errors.push(`Imagens com valores diferentes para ${labels[k]} no mesmo período. Corrija ou deixe um dos campos N/D.`);continue;}
      review[d.period].values[side][k]=v;review[d.period].origins[k][side]=d.origins[k][side];
    }
  }
  return {review,errors:[...new Set(errors)],periods:[...periods]};
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
  }
  return [...new Set(errors)];
}
export function calculateDifferences(input:Review):Review {
  const next=structuredClone(input);
  for(const k of additiveMetrics)for(const side of [0,1]){
    const first=next.first.values[side][k],full=next.full.values[side][k];
    if(next.second.values[side][k]===null&&first!==null&&full!==null&&full>=first){next.second.values[side][k]=full-first;next.second.origins[k][side]='calculated';}
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
export type MatchInfo={home:string;away:string;date:string;competition:string};
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
  const teams=[...data.teams];const resolve=(name:string)=>{let t=teams.find(t=>t.name.trim().toLocaleLowerCase()===name.trim().toLocaleLowerCase());if(!t){t={id:crypto.randomUUID(),name:name.trim(),color:'#23875b'};teams.push(t);}return t.id;};
  const home=resolve(info.home),away=resolve(info.away);
  const match:Match={id:crypto.randomUUID(),home,away,date:info.date,competition:info.competition.trim(),first:structuredClone(review.first.values),second:structuredClone(review.second.values),image:{importedAt:new Date().toISOString(),confirmed:true,periods,full:structuredClone(review.full.values),fields:structuredClone(Object.fromEntries((['first','second','full'] as const).map(p=>[p,review[p].origins]))),matchFields}};
  const error=validateMatch(match);if(error)throw Error(error);
  return {teams,matches:[...data.matches,match]};
}
