/** Etapa 78 — four contextual lenses for an upcoming fixture.
 * READ ONLY. Uses only eligible matches before the target date, from the
 * selected season and its immediate predecessor. No odds, probabilities,
 * predictions saved, Work import or change to V2/V3 / As Boas.
 */
import {stats,type Data,type Match,type Metric,type Period} from './model';
import type {RadarFixture} from './radar';
import {comparisonTeamKey,directMatchSides,type DirectVenueMode} from './smartDirectH2H';
import {competitionParts} from './leagueCatalog';
import {radarMetricIntegrity} from './radarHistoricalIntegrity';

export type FourLensMetric='goals'|'shots'|'target'|'corners';
export type LensKind='home-any'|'home-direct'|'away-any'|'away-direct';
export type LensSample={
  count:number;mean:number|null;over:number;under:number;
  overRate:number|null;underRate:number|null;
};
export type ContextLens={
  id:LensKind;label:string;
  last5:LensSample;last10:LensSample;
  currentSeason:LensSample;previousSeason:LensSample;
  /** These rows show overlapping games. Direct views are the SAME fixtures. */
  matchIds:string[];
};
export type FourLensReport={
  competition:string;previousCompetition:string|null;date:string;
  metric:FourLensMetric;period:Period;line:number;
  lenses:ContextLens[];
  projection:number|null;
  historicalDirection:'Over'|'Under'|'Sem consenso';
  reason:string;
  /** Not distinct games across lenses; overlap must never be counted twice. */
  overlappingSamples:true;
  /** Unique eligible direct fixtures, not the number of lens views. */
  directMatchCount:number;
  directVenue:DirectVenueMode;
};

const label:Record<LensKind,string>={
  'home-any':'Mandante em casa · qualquer adversário',
  'home-direct':'Confrontos diretos · ações do mandante escolhido',
  'away-any':'Visitante fora · qualquer adversário',
  'away-direct':'Confrontos diretos · ações do visitante escolhido',
};
export const FOUR_LENS_LINES:Record<FourLensMetric,readonly number[]>={
  goals:[0.5,1.5,2.5,3.5],
  shots:[20.5,22.5,24.5,26.5,28.5,30.5],
  target:[5.5,6.5,7.5,8.5,9.5],
  corners:[6.5,7.5,8.5,9.5,10.5],
};
export const FOUR_LENS_METRICS:readonly {id:FourLensMetric;label:string}[]=[
  {id:'goals',label:'Gols'},
  {id:'shots',label:'Finalizações'},
  {id:'target',label:'Chutes no gol'},
  {id:'corners',label:'Escanteios'},
];
const validNumber=(n:number|null):n is number=>
  typeof n==='number'&&Number.isFinite(n)&&n>=0;

export function previousSeasonCompetition(competition:string):string|null{
  const parts=competition.match(/^(.*\s)(20\d{2})(?:\/(\d{2}))?$/);
  if(!parts)return null;
  const start=Number(parts[2])-1;
  if(start<2000)return null;
  return parts[1]+start+(parts[3]?'/'+String((Number(parts[3])+99)%100).padStart(2,'0'):'');
}
function sample(values:readonly number[],line:number):LensSample{
  const count=values.length,over=values.filter(v=>v>line).length,under=count-over;
  return {
    count,mean:count?values.reduce((sum,n)=>sum+n,0)/count:null,
    over,under,overRate:count?over/count:null,underRate:count?under/count:null
  };
}
function belongs(m:Match,homeKey:string,awayKey:string,kind:LensKind,
  teamKey:(id:string)=>string,directVenue:DirectVenueMode):boolean{
  const h=teamKey(m.home),a=teamKey(m.away);
  switch(kind){
    case 'home-any':return h===homeKey;
    case 'away-any':return a===awayKey;
    case 'home-direct':
    case 'away-direct':return directMatchSides(m,homeKey,awayKey,teamKey,directVenue)!==null;
  }
}

export function analyzeFourLenses(
  data:Data,fixture:RadarFixture,metric:FourLensMetric='shots',
  period:Period='full',line=FOUR_LENS_LINES[metric][2],
  options:{directVenue?:DirectVenueMode;useScopedSeasons?:boolean}={}
):FourLensReport{
  const previousCompetition=previousSeasonCompetition(fixture.competition);
  const validLine=Number.isFinite(line)&&line>0&&line%1===0.5;
  if(!validLine)throw Error('Linha inválida: utilize um limite positivo terminado em ,5.');
  // The imported season may allocate different local team IDs to the same
  // named club. Match only normalized names within the two selected leagues.
  const teams=new Map(data.teams.map(t=>[t.id,comparisonTeamKey(t.name,fixture.competition)]));
  const teamKey=(id:string)=>teams.get(id)??comparisonTeamKey(id,fixture.competition);
  const directVenue=options.directVenue??'all';
  const homeKey=teamKey(fixture.home),awayKey=teamKey(fixture.away);
  const eligible=data.matches.filter(m=>
    (m.competition===fixture.competition||m.competition===previousCompetition||
      (options.useScopedSeasons===true&&competitionParts(m.competition).league===
        competitionParts(fixture.competition).league))&&
    m.date<fixture.date&&
    (!m.research?.titleDate||m.research.titleDate<fixture.date)&&
    !m.research?.dateDiscrepancy&&
    (!m.external||['FT','Match Finished'].includes(m.external.status))&&
    radarMetricIntegrity(m,metric)==='ok'&&
    validNumber(stats(m,0,period)[metric])&&
    validNumber(stats(m,1,period)[metric])
  );
  // Different IDs claiming the same fixture/date are ALL excluded, not
  // preferentially selected or counted as independent evidence.
  const repeats=new Map<string,Match[]>();
  for(const m of eligible){
    const key=[m.competition,m.date,...[teamKey(m.home),teamKey(m.away)].sort()].join('|');
    const found=repeats.get(key)??[];
    found.push(m);repeats.set(key,found);
  }
  const blocked=new Set<Match>();
  for(const rows of repeats.values())if(rows.length>1)for(const row of rows)blocked.add(row);
  const valid=eligible.filter(m=>!blocked.has(m))
    .sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  const total=(m:Match)=>stats(m,0,period)[metric]!+stats(m,1,period)[metric]!;
  const kinds:LensKind[]=['home-any','home-direct','away-any','away-direct'];
  const lenses=kinds.map(id=>{
    const rows=valid.filter(m=>belongs(m,homeKey,awayKey,id,teamKey,directVenue));
    const recent=rows.slice(0,10),last5=recent.slice(0,5);
    return {
      id,label:label[id],
      last5:sample(last5.map(total),line),
      last10:sample(recent.map(total),line),
      currentSeason:sample(rows.filter(m=>m.competition===fixture.competition).slice(0,10).map(total),line),
      previousSeason:sample(rows.filter(m=>m.competition===previousCompetition).slice(0,10).map(total),line),
      matchIds:recent.map(m=>m.id),
    };
  });
  const home=lenses[0],away=lenses[2],direct=lenses[1];
  const projection=home.last10.count>=3&&away.last10.count>=3
    ?(home.last10.mean!+away.last10.mean!)/2:null;
  let historicalDirection:FourLensReport['historicalDirection']='Sem consenso';
  let reason='Amostra insuficiente ou frequências divergentes entre mandante em casa e visitante fora.';
  if(home.last5.count===5&&away.last5.count===5&&
    home.last10.count>=5&&away.last10.count>=5){
    const over=[home,away].every(v=>v.last5.overRate!>=0.7&&v.last10.overRate!>=0.7);
    const under=[home,away].every(v=>v.last5.underRate!>=0.7&&v.last10.underRate!>=0.7);
    const possible=over?'Over':under?'Under':null;
    // Direct history is a cross-check only. It NEVER provides a separate
    // independent vote and cannot strengthen a sample of fewer than 3 games.
    const contradictory=possible&&direct.last10.count>=3&&
      (possible==='Over'?direct.last10.underRate!>=0.7:direct.last10.overRate!>=0.7);
    if(possible&&!contradictory){
      historicalDirection=possible;
      reason='Frequências observadas concordam nos recortes gerais de 5 e até 10 jogos; tendência exploratória, não probabilidade.';
    }else if(contradictory){
      reason='Confrontos diretos (mínimo de 3) contradizem as tendências gerais: sem consenso.';
    }
  }
  return {
    competition:fixture.competition,previousCompetition,date:fixture.date,
    metric,period,line,lenses,projection,historicalDirection,reason,
    overlappingSamples:true,
    directVenue,directMatchCount:valid.filter(m=>
      directMatchSides(m,homeKey,awayKey,teamKey,directVenue)!==null).length,
  };
}
