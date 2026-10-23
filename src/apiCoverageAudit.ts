/**
 * Read-only completeness audit for authorized, individual API-Football fixtures.
 * No network requests, user data mutation, quota changes or assumed statistics.
 */
import {periodStats,type AutoFixture,type StatTeam} from './apiFootball';

export type CoverageResult={
 status:'ready'|'incomplete'|'conflict'|'not-final';
 available:number;expected:24;issues:string[];
 periods:{period:'Jogo completo'|'1º tempo'|'2º tempo';found:number;expected:8}[];
};

type CheckedMetric='goals'|'shots'|'target'|'corners';
const metrics:[CheckedMetric,string][]=[
 ['goals','Gols'],['shots','Finalizações'],
 ['target','Chutes no gol'],['corners','Escanteios']
];
type Values=Record<'goals'|'shots'|'target'|'corners',[number|null,number|null]>;
const periodValues=(rows:StatTeam[],fixture:AutoFixture,field:'statistics'|'statistics_1h'|'statistics_2h'):Values=>{
 const stats=periodStats(rows,fixture,field).values;
 const value={} as Values;
 for(const [key] of metrics)
  value[key]=[stats[0][key],stats[1][key]];
 return value;
};
const int=(n:number|null|undefined):n is number=>
 n!==null&&n!==undefined&&Number.isSafeInteger(n)&&n>=0;
export function auditFixtureCoverage(fixture:AutoFixture,fullRows:StatTeam[],halfRows:StatTeam[]):CoverageResult {
 const full=periodValues(fullRows,fixture,'statistics');
 const first=periodValues(halfRows,fixture,'statistics_1h');
 const second=periodValues(halfRows,fixture,'statistics_2h');
 const finished=fixture.status==='FT';
 const issues:string[]=[];
 for(const side of [0,1] as const){
  const g=fixture.goals[side];
  // The score is obtained from the fixtures endpoint. Never use an empty
  // value or an in-progress score as a completed-match goal.
  if(finished&&int(g))full.goals[side]=g;
  const halfGoal=fixture.halfGoals?.[side];
  if(finished&&int(halfGoal))first.goals[side]=halfGoal;
  const f=full.goals[side],h=first.goals[side],s=second.goals[side];
  if(finished&&int(f)&&int(h)){
   if(h>f)issues.push('Gols do intervalo excedem o resultado final.');
   // A second-half goals value may be derived from two *explicit* scoreboard
   // values; do not imply that this number was returned by the statistics API.
   else if(!int(s))second.goals[side]=f-h;
  }
 }
 const periods=[
  {period:'Jogo completo' as const,values:full},
  {period:'1º tempo' as const,values:first},
  {period:'2º tempo' as const,values:second}
 ];
 const summary=periods.map(({period,values})=>({
  period,found:metrics.reduce((n,[key])=>n+values[key].filter(int).length,0),
  expected:8 as const
 }));
 const label=['mandante','visitante'];
 for(const [key,display] of metrics)for(const side of [0,1] as const){
  const f=full[key][side],h=first[key][side],s=second[key][side];
  if(int(f)&&int(h)&&int(s)&&h+s!==f)
   issues.push(display+' do '+label[side]+': 1º + 2º tempo diferente do jogo.');
 }
 for(const {period,values} of periods)for(const side of [0,1] as const){
  const shots=values.shots[side],target=values.target[side];
  if(int(shots)&&int(target)&&target>shots)
   issues.push(period+': chutes no gol excedem finalizações do '+label[side]+'.');
 }
 const available=summary.reduce((n,p)=>n+p.found,0);
 const status:CoverageResult['status']=!finished?'not-final':
  issues.length?'conflict':available===24?'ready':'incomplete';
 return {status,available,expected:24,periods:summary,issues};
}
