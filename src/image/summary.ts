import type {Period} from '../model';
import {extraTime} from './header';
export type EventMetric='goals'|'yellow'|'red';
export type SummaryEvent={key:string;minute:string;period:'first'|'second';metric:EventMetric;side:0|1;description:string};
export type Summary={identified:boolean;interval:[number,number]|null;events:SummaryEvent[];warnings:string[];extraTime:boolean};
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
export function readSummary(text:string,home:string,away:string,force=false):Summary{
 const result:Summary={identified:false,interval:null,events:[],warnings:[],extraTime:extraTime(text)};
 const intervals:[number,number][]=[];let evidence=false;
 const stamp=(line:string)=>{const m=line.match(/^(\d{1,3})(?:\s*\+\s*(\d{1,2}))?\s*['’]?\s+/);return m?Number(m[1])+Number(m[2]??0)/100:null;};
 const raw=text.split('\n'),lines:string[]=[];
 for(let i=0;i<raw.length;i++){if(/^(?:intervalo|ht|1\s*[º°o]?\s*tempo)\s*:?$/i.test(raw[i].trim())&&/^\d+\s*[-–:×]\s*\d+$/.test(raw[i+1]?.trim()??'')){lines.push(`${raw[i]} ${raw[++i]}`);}else lines.push(raw[i]);}
 const ordered=lines.sort((a,b)=>{const x=stamp(a),y=stamp(b);return x===null?(y===null?0:-1):y===null?1:x-y;});
 let lastScore:[number,number]|null=null,secondStarted=false;
 for(const line of ordered){
  const normalized=norm(line);
  const interval=normalized.match(/^(?:intervalo|ht|(?:placar (?:do )?)?1\s*[º°o]?\s*tempo)\s*:?\s*\(?(\d+)\s*[×x:–-]\s*(\d+)\)?$/);
  if(interval){intervals.push([Number(interval[1]),Number(interval[2])]);evidence=true;continue;}
  if(/^(?:intervalo|ht)\s*:/i.test(normalized)&&/[-–:]/.test(normalized)){result.warnings.push('Intervalo ilegível: mantido N/D. Não convertemos letras em gols.');continue;}
  const time=normalized.match(/^(\d{1,3})(?:\s*\+\s*(\d{1,2}))?\s*['’]?\s+(.+)$/);if(!time)continue;
  const description=time[3];
  if(/anulado|cancelado|revisao|perdido|defendido|substituicao/.test(description))continue;
  if(/treinador|comissao|banco|coach|staff/.test(description)){result.warnings.push('Evento de banco/comissão: definição ambígua para totais da equipe. Confira manualmente.');continue;}
  let metric:EventMetric|null=/cartao vermelho|red card|tarjeta roja/.test(description)?'red':/cartao amarelo|yellow card|tarjeta amarilla/.test(description)?'yellow':/\bgol\b|\bgoal\b/.test(description)?'goals':null;
  const minute=Number(time[1]);let creditedSide:0|1|null=null;
  if(minute>45&&!secondStarted){secondStarted=true;if(intervals.length&&intervals.every(s=>s[0]===intervals[0][0]&&s[1]===intervals[0][1]))lastScore=intervals[0];}
  const score=description.match(/(?:^|\s|\()(\d+)\s*[-:–]\s*(\d+)(?:\s|\)|$)/);
  if(score&&(!metric||metric==='goals')){
   const current:[number,number]=[Number(score[1]),Number(score[2])];
   if(lastScore){if(current[0]===lastScore[0]+1&&current[1]===lastScore[1])creditedSide=0;else if(current[1]===lastScore[1]+1&&current[0]===lastScore[0])creditedSide=1;}
   else if(current[0]+current[1]===1)creditedSide=current[0]===1?0:1;
   if(creditedSide!==null)metric='goals';lastScore=current;
  }
  if(!metric){if(!/substitui|entra|sai|assist[eê]ncia/.test(description))result.warnings.push(`Evento não reconhecido em ${time[1]}': não é seguro contar os totais.`);continue;}evidence=true;
  if(/segundo amarelo|2[º°o]? amarelo/.test(description)){result.warnings.push('Segundo amarelo: definição de contagem ambígua; confira os cartões manualmente.');continue;}
  if(minute>90){result.warnings.push('Evento fora dos 90 minutos: confirme prorrogação e períodos.');result.extraTime=true;continue;}
  const named=(name:string)=>!!name&&(description.startsWith(`${norm(name)}:`)||description.includes(`[${norm(name)}]`));
  const sides=creditedSide!==null?[creditedSide===0,creditedSide===1]:[/\bmandante\b|\bhome\b/.test(description)||named(home),/\bvisitante\b|\baway\b/.test(description)||named(away)];
  if(sides.filter(Boolean).length!==1){result.warnings.push(`Evento em ${time[1]}': equipe não identificada. Mantido N/D.`);continue;}
  let side=(sides[0]?0:1) as 0|1;
  if(creditedSide===null&&metric==='goals'&&/gol contra|own goal/.test(description))side=side===0?1:0;
  const period=minute<=45?'first':'second',stamp=time[1]+(time[2]?`+${time[2]}`:'');
  const event:SummaryEvent={minute:stamp,period,metric,side,description:line.trim(),key:`${stamp}|${metric}|${side}|${description}`};
  if(!result.events.some(e=>e.key===event.key))result.events.push(event);
 }
 result.identified=force||text.split('\n').some(s=>/^sum[aá]rio$|^summary$/i.test(s.trim()))&&evidence;
 if(intervals.length){if(intervals.every(p=>p[0]===intervals[0][0]&&p[1]===intervals[0][1]))result.interval=intervals[0];else result.warnings.push('Placares do intervalo divergentes. Confira manualmente.');}
 if(result.identified&&result.events.length)result.warnings.push('Eventos visíveis são parciais até confirmar que a lista de cada tempo está completa.');
 return result;
}
export type EventCoverage=Record<'first'|'second',boolean>;
export function combineEvents(summaries:Summary[]):{events:SummaryEvent[];warnings:string[]}{
 const events:SummaryEvent[]=[],warnings:string[]=[];
 for(const s of summaries)for(const e of s.events)if(!events.some(old=>old.key===e.key))events.push(e);
 for(const e of events)if(events.filter(old=>old.minute===e.minute&&old.metric===e.metric&&old.side===e.side).length>1)warnings.push(`Eventos potencialmente duplicados em ${e.minute}' (${e.metric}). Confira os recortes ou use correção manual.`);
 return {events,warnings:[...new Set(warnings)]};
}
export function countEvents(events:SummaryEvent[],period:Period,metric:EventMetric,side:number):number{
 return events.filter(e=>(period==='full'||e.period===period)&&e.metric===metric&&e.side===side).length;
}
