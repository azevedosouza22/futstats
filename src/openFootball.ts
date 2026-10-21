/** Read-only CC0 Premier League catalogue; never imported into FutStats match statistics. */
export const OPENFOOTBALL_URL='https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.1.json';
export const OPENFOOTBALL_PAGE='https://github.com/openfootball/football.json/blob/master/2026-27/en.1.json';
export const OPENFOOTBALL_LICENSE='https://github.com/openfootball/football.json/blob/master/LICENSE.md';
const NAME='English Premier League 2026/27';
export type FreeFixture={
  id:string;round:number;date:string;sourceTime:string|null;home:string;away:string;
  fullTime:[number,number]|null;
};
export type FreeCatalogue={
  name:string;fixtures:FreeFixture[];clubs:number;rounds:number;
  ftCount:number;lastScoreDate:string|null;
};
const rec=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const dateOk=(s:string)=>/^\d{4}-\d\d-\d\d$/.test(s)&&!Number.isNaN(Date.parse(s))&&
  new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const scoreOk=(v:unknown):v is [number,number]=>Array.isArray(v)&&v.length===2&&
  v.every(x=>Number.isSafeInteger(x)&&x>=0&&x<=99);
export function parseFreePremier(payload:unknown):FreeCatalogue{
 if(!rec(payload)||payload.name!==NAME||!Array.isArray(payload.matches)||
  payload.matches.length===0||payload.matches.length>500)
   throw Error('Catálogo Premier League inválido ou indisponível.');
 const seen=new Set<string>(),clubs=new Set<string>(),rounds=new Set<number>();
 const fixtures:FreeFixture[]=payload.matches.map((m:unknown)=>{
  if(!rec(m)||typeof m.team1!=='string'||typeof m.team2!=='string'||
   !m.team1.trim()||!m.team2.trim()||m.team1.length>120||m.team2.length>120||
   m.team1===m.team2||typeof m.date!=='string'||!dateOk(m.date)||
   typeof m.round!=='string')throw Error('Partida com data ou equipes inválidas no catálogo.');
  const match=/^Matchday (\d{1,2})$/.exec(m.round),round=Number(match?.[1]);
  if(!match||round<1||round>38)throw Error('Rodada inválida no catálogo.');
  const sourceTime=m.time===undefined||m.time===null?null:m.time;
  if(sourceTime!==null&&(typeof sourceTime!=='string'||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(sourceTime)))
    throw Error('Horário inválido no catálogo.');
  const home=m.team1.trim(),away=m.team2.trim(),id=[m.date,round,home,away].join('|');
  if(seen.has(id))throw Error('Partida repetida no catálogo.');
  seen.add(id);clubs.add(home);clubs.add(away);rounds.add(round);
  // Some rows contain score: [0,0] without a final result marker.
  // Only score.ft is a result. All other shapes are N/D.
  const fullTime=rec(m.score)&&scoreOk(m.score.ft)?m.score.ft:null;
  if(rec(m.score)&&m.score.ft!==undefined&&!fullTime)
    throw Error('Resultado final malformado no catálogo.');
  return {id,round,date:m.date,sourceTime,home,away,fullTime};
 });
 fixtures.sort((a,b)=>a.date.localeCompare(b.date)||
  (a.sourceTime??'').localeCompare(b.sourceTime??'')||a.home.localeCompare(b.home));
 const scored=fixtures.filter(f=>f.fullTime!==null);
 return {name:NAME,fixtures,clubs:clubs.size,rounds:rounds.size,
  ftCount:scored.length,lastScoreDate:scored.length?
   scored.reduce((v,f)=>f.date>v?f.date:v,scored[0].date):null};
}
export function freePremierCoverage(c:FreeCatalogue,today:string){
 const past=c.fixtures.filter(m=>m.date<today);
 return {past:past.length,missingPast:past.filter(m=>m.fullTime===null).length,
  future:c.fixtures.filter(m=>m.date>=today).length};
}
