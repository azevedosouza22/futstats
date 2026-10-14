import {unavailable,type ResolvedStats,type Metric} from './model';
export type AutoFixture={id:number;date:string|null;status:string|null;statusLabel:string|null;minute:number|null;league:string|null;country:string|null;home:{id:number;name:string|null};away:{id:number;name:string|null};goals:[number|null,number|null]};
export type StatRow={type:string;value:number|string|null};
export type StatTeam={team:{id:number;name:string|null};statistics:StatRow[]|null;statistics_1h:StatRow[]|null;statistics_2h:StatRow[]|null};
const mapping:Record<string,Metric>={'Goals':'goals','Total Shots':'shots','Shots on Goal':'target','Corner Kicks':'corners','Ball Possession':'possession','Yellow Cards':'yellow','Red Cards':'red','expected_goals':'xg','Expected Goals':'xg','Big Chances':'chances'};
export function statValue(v:unknown):number|null{
 if(typeof v==='string'&&!/^\d+(?:[.,]\d+)?%?$/.test(v))return null;
 if(typeof v!=='number'&&typeof v!=='string')return null;
 const n=typeof v==='number'?v:Number(v.replace('%','').replace(',','.'));return Number.isFinite(n)&&n>=0?n:null;
}
export function periodStats(rows:StatTeam[],fixture:AutoFixture,field:'statistics'|'statistics_1h'|'statistics_2h'):{values:[ResolvedStats,ResolvedStats];extra:[StatRow[],StatRow[]];available:boolean}{
 const values:[ResolvedStats,ResolvedStats]=[unavailable(),unavailable()],extra:[StatRow[],StatRow[]]=[[],[]];let available=false;
 for(const [side,team] of [fixture.home,fixture.away].entries()){
  const matches=rows.filter(r=>r.team.id===team.id);if(matches.length!==1||!Array.isArray(matches[0][field]))continue;
  const source=matches[0][field]!;const seen=new Set<Metric>();
  for(const row of source){const k=mapping[row.type];if(!k){extra[side].push(row);continue;}const v=statValue(row.value);if(seen.has(k)){values[side][k]=null;continue;}seen.add(k);values[side][k]=v!==null&&(k==='possession'?v<=100:k==='xg'||Number.isSafeInteger(v))?v:null;}
  available=available||Object.values(values[side]).some(v=>v!==null)||extra[side].some(r=>statValue(r.value)!==null);
 }
 return {values,extra,available};
}
export async function footballRequest(kind:'config'|'fixtures'|'statistics',token:string,params:Record<string,string>={},signal?:AbortSignal){
 const response=await fetch(`/api/api-football?${new URLSearchParams({kind,...params})}`,{headers:{Authorization:`Bearer ${token}`},signal,cache:'no-store'});
 let body;try{body=await response.json();}catch{throw Error('Integração de servidor indisponível nesta hospedagem.');}
 if(!response.ok)throw Error(typeof body.error==='string'?body.error:'Falha na consulta.');
 return body;
}
