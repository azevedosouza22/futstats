import {metrics, labels, unavailable, type Metric, type Period, type ResolvedStats} from '../model';
export type Extraction = {
  period: Period | null; values: [ResolvedStats, ResolvedStats]; recognized: Metric[];
  home: string; away: string; date: string; competition: string;
  headerScore: [number, number] | null; warnings: string[];
};
export const clean = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const aliases: Record<Metric,string[]> = {
  goals:['gols','golos','goals'], shots:['total de finalizacoes','total finalizacoes','finalizacoes totais','finalizacoes','total de remates','remates','total shots','total de chutes','chutes totais'],
  target:['finalizacoes no alvo','finalizacoes a baliza','remates a baliza','remates enquadrados','shots on target','shots on goal','no alvo','chutes no alvo'],
  corners:['escanteios','cantos','corner kicks','corners'],yellow:['cartoes amarelos','yellow cards'],red:['cartoes vermelhos','red cards'],
  possession:['posse de bola','posse','ball possession','possession'],xg:['gols esperados xg','golos esperados xg','gols esperados','golos esperados','expected goals xg','expected goals','xg'],chances:['chances claras','grandes chances','big chances','oportunidades claras']
};
const numbers = (line:string) => [...line.matchAll(/(?<![\w])\d+(?:[.,]\d+)?%?(?![\w])/g)].map(m=>Number(m[0].replace('%','').replace(',','.')));
function metric(line:string):Metric|null {
  const label=clean(line.replace(/\d+(?:[.,]\d+)?%?/g,'').replace(/[():–—-]/g,' '));
  return metrics.find(k=>aliases[k].some(a=>label===a))??null;
}
export function identifyPeriod(text:string):Period|null {
  const value=clean(text); const candidates=new Set<Period>();
  if (/(?:\b1\s*[º°oa]?\s*(?:tempo|parte|half)|primeiro tempo|first half)/.test(value)) candidates.add('first');
  if (/(?:\b2\s*[º°oa]?\s*(?:tempo|parte|half)|segundo tempo|second half)/.test(value)) candidates.add('second');
  if (text.split(/\n/).some(line=>/^(?:jogo|jogo completo|partida completa|full time|match)$/i.test(clean(line)))) candidates.add('full');
  return candidates.size===1?[...candidates][0]:null;
}
export function extract(text:string):Extraction {
  const lines=text.split(/\n/).map(s=>s.trim()).filter(Boolean);
  const result:Extraction={period:identifyPeriod(text),values:[unavailable(),unavailable()],recognized:[],home:'',away:'',date:'',competition:'',headerScore:null,warnings:[]};
  if (!result.period) result.warnings.push('Período não determinado: selecione manualmente. Abas visíveis não indicam qual está ativa.');
  const date=text.match(/\b(\d{2})[/.](\d{2})[/.](\d{4})\b/);
  if (date) result.date=`${date[3]}-${date[2]}-${date[1]}`;
  const iso=text.match(/\b\d{4}-\d{2}-\d{2}\b/);if(!result.date&&iso)result.date=iso[0];
  for(let i=0;i<lines.length;i++) {
    const line=lines[i];
    const home=line.match(/^mandante\s*:\s*(.+)$/i),away=line.match(/^visitante\s*:\s*(.+)$/i),competition=line.match(/^(?:competi[cç][aã]o|campeonato|liga)\s*:\s*(.+)$/i);
    const countryCompetition=line.match(/^(?:inglaterra|england|brasil|brazil|espanha|spain|portugal|italia|italy|alemanha|germany|franca|france|mundo|world)\s*:\s*(.+)$/i);
    if(countryCompetition)result.competition=countryCompetition[1];
    if(home)result.home=home[1];if(away)result.away=away[1];if(competition)result.competition=competition[1];
    const header=line.match(/^([\p{L}][\p{L}\d .'-]+?)\s+(\d+)\s*[×x:–-]\s*(\d+)\s+([\p{L}][\p{L}\d .'-]+)$/u);
    if(header){result.home=header[1].trim();result.away=header[4].trim();result.headerScore=[Number(header[2]),Number(header[3])];}
    const score=line.match(/^(?:placar final\s*:?\s*)?(\d+)\s*[×x:–-]\s*(\d+)$/i);
    if(score)result.headerScore=[Number(score[1]),Number(score[2])];
    const k=metric(line);if(!k)continue;
    let pair=numbers(line);
    // Conservative support for a wrapped row: bare number / label / bare number.
    if(pair.length===0&&/^\d+(?:[.,]\d+)?%?$/.test(lines[i-1]??'')&&/^\d+(?:[.,]\d+)?%?$/.test(lines[i+1]??''))pair=[...numbers(lines[i-1]),...numbers(lines[i+1])];
    if(pair.length!==2||pair.some(n=>!Number.isFinite(n)||n<0||(k!=='xg'&&k!=='possession'&&!Number.isInteger(n))||(k==='possession'&&n>100))) {result.warnings.push(`Não foi possível ler os dois valores de ${labels[k]}.`);continue;}
    if(result.recognized.includes(k)){result.values[0][k]=null;result.values[1][k]=null;result.warnings.push(`Linha duplicada de ${labels[k]}; confira os valores manualmente.`);continue;}
    result.recognized.push(k);result.values[0][k]=pair[0];result.values[1][k]=pair[1];
  }
  if(result.headerScore&&result.period==='full'&&/\b(?:encerrado|finalizado|placar final|ft)\b/i.test(text)&&!result.recognized.includes('goals')) {
    result.values[0].goals=result.headerScore[0];result.values[1].goals=result.headerScore[1];result.recognized.push('goals');
  }
  if(!result.recognized.length)result.warnings.push('Nenhuma linha estatística reconhecida. Preencha somente o que conseguir confirmar na imagem.');
  return result;
}
