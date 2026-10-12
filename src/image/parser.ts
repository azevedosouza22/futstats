import {metrics, labels, unavailable, type Metric, type Period, type ResolvedStats} from '../model';
export type Extraction = {
  period: Period | null; values: [ResolvedStats, ResolvedStats]; recognized: Metric[];
  home: string; away: string; date: string; competition: string;
  headerScore: [number, number] | null; warnings: string[]; suspect: Metric[];
};
export const clean = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const aliases: Record<Metric,string[]> = {
  goals:['gols','golos','goals'], shots:['total de finalizacoes','total finalizacoes','finalizacoes totais','finalizacoes','total de remates','remates','total shots','total de chutes','chutes totais'],
  target:['finalizacoes no alvo','finalizacoes certas','chutes a gol','remates no alvo','finalizacoes a baliza','remates a baliza','remates enquadrados','shots on target','shots on goal','no alvo','chutes no alvo'],
  corners:['escanteios','cantos','corner kicks','corners'],yellow:['cartoes amarelos','yellow cards'],red:['cartoes vermelhos','red cards'],
  possession:['posse de bola','posse','ball possession','possession'],xg:['gols esperados xg','golos esperados xg','gols esperados','golos esperados','expected goals xg','expected goals','xg'],chances:['chances claras','grandes chances','big chances','oportunidades claras']
};
// Only repair spacing around a visible decimal separator; never insert one.
export const normalizeNumbers=(line:string)=>line.replace(/(\d)\s*([.,])\s*(?=\d)/g,'$1$2').replace(/(\d)\s+%/g,'$1%');
const numbers = (line:string) => [...normalizeNumbers(line).matchAll(/(?<![\w.,+-])\d+(?:[.,]\d+)?%?(?![\w.,])/g)].map(m=>Number(m[0].replace('%','').replace(',','.')));
function metric(line:string):Metric|null {
  const label=clean(normalizeNumbers(line).replace(/\b(?:n\/d|nd|O)\b|[?]/gi,'').replace(/\d+(?:[.,]\d+)?%?/g,'').replace(/[():–—-]/g,' '));
  return metrics.find(k=>aliases[k].some(a=>label===a))??null;
}
function columnValues(line:string,k:Metric):[number|null,number|null]|null {
  const text=clean(line.replace(/[()]/g,' '));
  for(const alias of [...aliases[k]].sort((a,b)=>b.length-a.length)){
    const at=text.indexOf(alias);if(at<0)continue;
    const parts=[text.slice(0,at).trim(),text.slice(at+alias.length).trim()];
    if(parts.every(s=>/^(?:\d+(?:[.,]\d+)?%?|n\/d|nd|o|\?|[-–—])$/.test(s)))return parts.map(s=>/^\d/.test(s)?Number(s.replace('%','').replace(',','.')):null) as [number|null,number|null];
  }
  return null;
}
export function identifyPeriod(text:string):Period|null {
  const value=clean(text); const candidates=new Set<Period>();
  if (/(?:\b1\s*[º°oa]?\s*(?:tempo|parte|half)\b|primeiro tempo|first half|\b1\s*[º°o]?\s*t\b)/.test(value)) candidates.add('first');
  if (/(?:\b2\s*[º°oa]?\s*(?:tempo|parte|half)\b|segundo tempo|second half|\b2\s*[º°o]?\s*t\b)/.test(value)) candidates.add('second');
  if (text.split(/\n/).some(line=>/^(?:jogo|jogo completo|partida completa|full time|match)$/i.test(clean(line)))) candidates.add('full');
  return candidates.size===1?[...candidates][0]:null;
}
export function extract(text:string):Extraction {
  const rawLines=text.split(/\n/).map(s=>s.trim()).filter(Boolean);
  const lines:string[]=[];
  for(let i=0;i<rawLines.length;i++){
    const joined=`${rawLines[i]} ${rawLines[i+1]??''}`;
    // Join only an exact known label split over two lines, never two statistics.
    if(!metric(rawLines[i])&&/[a-zÀ-ÿ]/i.test(rawLines[i])&&i+1<rawLines.length&&metric(joined)){lines.push(joined);i++;}
    else lines.push(rawLines[i]);
  }
  const result:Extraction={period:identifyPeriod(text),values:[unavailable(),unavailable()],recognized:[],home:'',away:'',date:'',competition:'',headerScore:null,warnings:[],suspect:[]};
  if (!result.period) result.warnings.push('Período não determinado: selecione manualmente. Abas visíveis não indicam qual está ativa.');
  const date=text.match(/\b(\d{2})[/.](\d{2})[/.](\d{4})\b/);
  if (date) result.date=`${date[3]}-${date[2]}-${date[1]}`;
  const iso=text.match(/\b\d{4}-\d{2}-\d{2}\b/);if(!result.date&&iso)result.date=iso[0];
  for(let i=0;i<lines.length;i++) {
    const line=normalizeNumbers(lines[i]);
    const home=line.match(/^mandante\s*:\s*(.+)$/i),away=line.match(/^visitante\s*:\s*(.+)$/i),competition=line.match(/^(?:competi[cç][aã]o|campeonato|liga)\s*:\s*(.+)$/i);
    const countryCompetition=line.match(/^(?:inglaterra|england|brasil|brazil|espanha|spain|portugal|italia|italy|alemanha|germany|franca|france|mundo|world)\s*:\s*(.+)$/i);
    if(countryCompetition)result.competition=countryCompetition[1];
    if(home)result.home=home[1];if(away)result.away=away[1];if(competition)result.competition=competition[1];
    const header=line.match(/^([\p{L}][\p{L}\d .'-]+?)\s+(\d+)\s*[×x:–-]\s*(\d+)\s+([\p{L}][\p{L}\d .'-]+)$/u);
    if(header){result.home=header[1].trim();result.away=header[4].trim();result.headerScore=[Number(header[2]),Number(header[3])];}
    const score=line.match(/^(?:(?:placar final|resultado final)\s*:?\s*)?(\d+)\s*[×x:–-]\s*(\d+)$/i);
    if(score)result.headerScore=[Number(score[1]),Number(score[2])];
    // Period scores require an explicit label on the same row, never the final header.
    const periodScore=line.match(/^(?:placar|gols|resultado)\s+(?:do\s+)?((?:1|2)\s*[º°o]?\s*tempo|primeiro tempo|segundo tempo)\s*:?\s*(\d+)\s*[×x:–-]\s*(\d+)$/i);
    if(periodScore&&identifyPeriod(periodScore[1])===result.period){result.values[0].goals=Number(periodScore[2]);result.values[1].goals=Number(periodScore[3]);if(!result.recognized.includes('goals'))result.recognized.push('goals');}
    const k=metric(line);if(!k)continue;
    let pair:(number|null)[]=columnValues(line,k)??numbers(line);
    // Conservative support for a wrapped row: bare number / label / bare number.
    if((pair.length===0||pair.every(n=>n===null))&&/^\d+(?:[.,]\d+)?%?$/.test(normalizeNumbers(lines[i-1]??''))&&/^\d+(?:[.,]\d+)?%?$/.test(normalizeNumbers(lines[i+1]??'')))pair=[...numbers(lines[i-1]),...numbers(lines[i+1])];
    if(pair.length!==2||pair.some(n=>n!==null&&(!Number.isFinite(n)||n<0||(k!=='xg'&&k!=='possession'&&!Number.isSafeInteger(n))||(k==='possession'&&n>100)))) {result.warnings.push(`Não foi possível ler os dois valores de ${labels[k]}.`);continue;}
    if(pair.includes(null))result.warnings.push(`${labels[k]}: uma ou mais colunas não foram reconhecidas; mantidas N/D.`);
    if(result.recognized.includes(k)){result.values[0][k]=null;result.values[1][k]=null;result.warnings.push(`Linha duplicada de ${labels[k]}; confira os valores manualmente.`);continue;}
    result.recognized.push(k);
    for(const side of [0,1]){
      // xG >= 10 is suspicious, not mathematically impossible. Ask for manual confirmation.
      if(k==='xg'&&pair[side]!==null&&pair[side]!>=10){result.suspect.push(k);result.warnings.push(`xG ${side?'visitante':'mandante'}: leitura ${pair[side]} suspeita; confira o separador decimal na imagem. Mantido N/D, sem inserir vírgula automaticamente.`);continue;}
      result.values[side][k]=pair[side];
    }
  }
  for(const side of [0,1])if(result.values[side].target!==null&&result.values[side].shots!==null&&result.values[side].target!>result.values[side].shots!){result.suspect.push('shots','target');result.warnings.push('Finalizações no alvo superam o total: confira as duas linhas.');}
  if(result.values.every(s=>s.possession!==null)&&Math.abs(result.values[0].possession!+result.values[1].possession!-100)>1){result.suspect.push('possession');result.warnings.push('Posse de bola não soma aproximadamente 100%. Confira os valores e a definição da fonte.');}
  if(result.headerScore&&result.period==='full'&&/\b(?:encerrado|finalizado|terminado|placar final|resultado final|ft)\b/i.test(text)&&!result.recognized.includes('goals')) {
    result.values[0].goals=result.headerScore[0];result.values[1].goals=result.headerScore[1];result.recognized.push('goals');
  }
  if(!result.recognized.length)result.warnings.push('Nenhuma linha estatística reconhecida. Preencha somente o que conseguir confirmar na imagem.');
  return result;
}
