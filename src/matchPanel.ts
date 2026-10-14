import {periodStats,statValue,type AutoFixture,type StatTeam} from './apiFootball';
import {metrics,labels} from './model';
export type PanelPeriod='statistics'|'statistics_1h'|'statistics_2h';
export type PanelCard={key:string;label:string;values:[number|null,number|null];unit?:string;total?:number|null};
const translated:Record<string,string>={
 'Shots off Goal':'Finalizações para fora','Blocked Shots':'Finalizações bloqueadas','Shots insidebox':'Finalizações dentro da área','Shots outsidebox':'Finalizações fora da área',
 'Fouls':'Faltas','Offsides':'Impedimentos','Free Kicks':'Tiros livres','Goalkeeper Saves':'Defesas do goleiro',
 'Total passes':'Passes totais','Total Passes':'Passes totais','Passes accurate':'Passes certos','Accurate Passes':'Passes certos','Passes %':'Precisão dos passes (%)',
 'Goals prevented':'Gols evitados','Throw-ins':'Laterais','Goal Kicks':'Tiros de meta','Tackles':'Desarmes','Interceptions':'Interceptações','Crosses':'Cruzamentos',
 'Shots on Goal':'Chutes no alvo','Total Shots':'Finalizações','Corner Kicks':'Escanteios','Goals':'Gols',
};
export function statisticLabel(type:string){return translated[type]??`Indicador da fonte: ${type}`;}
export function buildMatchPanel(rows:StatTeam[],fixture:AutoFixture,field:PanelPeriod){
 const p=periodStats(rows,fixture,field);
 // Only the accumulated score may use the fixtures header. Half goals require explicit period data.
 const goals: [number|null,number|null]=field==='statistics'?[fixture.goals[0]??p.values[0].goals,fixture.goals[1]??p.values[1].goals]:[p.values[0].goals,p.values[1].goals];
 const summary:PanelCard[]=(['goals','shots','target','corners'] as const).map(key=>{
  const values:[number|null,number|null]=key==='goals'?goals:[p.values[0][key],p.values[1][key]];
  const total=values.every(v=>v!==null&&Number.isSafeInteger(v)&&v>=0)&&Number.isSafeInteger(values[0]!+values[1]!)?values[0]!+values[1]!:null;
  return {key,label:key==='target'?'Chutes no alvo':labels[key],values,total};
 });
 const more:PanelCard[]=metrics.filter(k=>!['goals','shots','target','corners'].includes(k)).map(key=>({key,label:labels[key],values:[p.values[0][key],p.values[1][key]]}));
 for(const type of new Set(p.extra.flatMap(r=>r.map(x=>x.type)))){
  const values=p.extra.map(rs=>{const matches=rs.filter(r=>r.type===type);return matches.length===1?statValue(matches[0].value):null;}) as [number|null,number|null];
  more.push({key:`source:${type}`,label:statisticLabel(type),values,unit:p.extra.some(rs=>rs.some(r=>r.type===type&&typeof r.value==='string'&&r.value.endsWith('%')))?'%':undefined});
 }
 return {summary,more,statisticsAvailable:p.available};
}
