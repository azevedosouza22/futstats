import type {Row} from './spatial';
export type Header={home:string;away:string;date:string;competition:string;country:string;round:string;finalScore:[number,number]|null;warnings:string[]};
export const normalizeName=(s:string)=>s.normalize('NFC').replace(/\s+/g,' ').trim();
const countryKey=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const countryNames=new Set(['inglaterra','england','escocia','scotland','pais de gales','wales','irlanda do norte','northern ireland','brasil','brazil','espanha','spain','italia','italy','portugal','franca','france','alemanha','germany','eua','usa','holanda']);
// Validate a country heading locally; never treat arbitrary labels as countries.
try{
 const codes='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
 for(const locale of ['pt-BR','en']){const names=new Intl.DisplayNames([locale],{type:'region'});for(const code of codes){const name=names.of(code);if(name)countryNames.add(countryKey(name));}}
}catch{/* Older browsers keep the small conservative fallback, plus explicit País labels. */}
export const finished=(text:string)=>text.split('\n').some(s=>/^(?:encerrado|finalizado|terminado|ft)$|^(?:placar final|resultado final)\s*:/i.test(s.trim()));
export const extraTime=(text:string)=>/prorroga[cç][aã]o|ap[oó]s p[eê]naltis|disputa de p[eê]naltis/i.test(text);
export function readHeaderText(text:string):Header {
 const h:Header={home:'',away:'',date:'',competition:'',country:'',round:'',finalScore:null,warnings:[]};
 const scores:[number,number][]=[];
 const lines=text.split('\n');
 for(let index=0;index<lines.length;index++){
  const line=normalizeName(lines[index]).replace(/^(?:futebol|football)\s*[:>›]\s*/i,'');
  const labeled=line.match(/^(mandante|visitante|competi[cç][aã]o|campeonato|liga|pa[ií]s|rodada)\s*:\s*(.+)$/i);
  if(labeled){const key=/mandante/i.test(labeled[1])?'home':/visitante/i.test(labeled[1])?'away':/pa[ií]s/i.test(labeled[1])?'country':/rodada/i.test(labeled[1])?'round':'competition';h[key]=normalizeName(labeled[2]);continue;}
  const country=line.match(/^([\p{L} .'-]{2,40}):\s*(.+)$/u);
  if(country&&countryNames.has(countryKey(country[1]))&&(!h.country||!h.competition)){
   const competition=country[2].match(/^(.+?)\s*[-–·]\s*(?:rodada|round)\s*(.+)$/i);
   h.country=country[1];h.competition=normalizeName(competition?.[1]??country[2]);if(competition)h.round=normalizeName(competition[2]);continue;
  }
  const inline=line.match(/^([\p{L}\d][\p{L}\d .'-]+?)\s+(\d+)\s*[×x:–-]\s*(\d+)\s+([\p{L}\d][\p{L}\d .'-]+)$/u);
  if(inline&&/\p{L}/u.test(inline[1])&&/\p{L}/u.test(inline[4])){h.home=normalizeName(inline[1]);h.away=normalizeName(inline[4]);scores.push([Number(inline[2]),Number(inline[3])]);}
  const score=line.match(/^(?:(?:placar final|resultado final)\s*:\s*)?(\d+)\s*[×x:–-]\s*(\d+)$/i);
  if(score&&!/^(?:intervalo|ht|[12]\s*[º°o]?\s*tempo)\s*:?(?:\s|$)/i.test(lines[index-1]??''))scores.push([Number(score[1]),Number(score[2])]);
 }
 const date=text.match(/\b(\d{2})[/.](\d{2})[/.](\d{4})\b/);if(date)h.date=`${date[3]}-${date[2]}-${date[1]}`;
 else h.date=text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0]??'';
 if(finished(text)&&scores.length){
  if(scores.every(s=>s[0]===scores[0][0]&&s[1]===scores[0][1]))h.finalScore=scores[0];
  else h.warnings.push('Placares de cabeçalho divergentes: confira o placar final.');
 }
 if(extraTime(text))h.warnings.push('Há referência a prorrogação/pênaltis. Cálculo automático dos gols dos tempos desativado.');
 return h;
}
// Restrict name candidates to the header before navigation; require a paired row.
export function spatialHeader(rows:Row[],width:number):string {
 const stop=rows.findIndex(r=>/sum[aá]rio|estat[ií]sticas|jogo\s+1/i.test(r.text));
 const header=stop<0?rows:rows.slice(0,stop);
 const score=header.find(r=>/^\d+\s*[×x:–-]\s*\d+$/.test(r.text.trim()));
 if(!score)return '';
 const pairs:{home:string;away:string}[]=[];
 for(const row of header){
  const distance=(row.bbox.y0+row.bbox.y1-score.bbox.y0-score.bbox.y1)/2;
  if(distance< -20||distance>Math.max(100,(score.bbox.y1-score.bbox.y0)*3.5))continue;
  const left=row.words.filter(w=>w.bbox.x1<width*.4),right=row.words.filter(w=>w.bbox.x0>width*.6);
  const names=[left,right].map(ws=>normalizeName(ws.map(w=>w.text).join(' ')));
  if(left.length&&right.length&&[...left,...right].every(w=>w.confidence>=70)&&names.every(n=>/\p{L}/u.test(n)&&/^[\p{L}\d][\p{L}\d .'-]{1,79}$/u.test(n)&&!/mandante|visitante|encerrado|sum[aá]rio|estat[ií]sticas|rodada/i.test(n)))pairs.push({home:names[0],away:names[1]});
 }
 if(pairs.length!==1)return '';
 return `Mandante: ${pairs[0].home}\nVisitante: ${pairs[0].away}`;
}
