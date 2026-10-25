/**
 * Safe, pure CSV supplement preflight for an EXISTING researched fixture.
 *
 * NEVER writes to localStorage, data arrays or Work records. A structurally
 * consistent CSV is NOT proof that the source really published its values.
 * Human/source confirmation and a separate authorized import are still needed.
 */
import {stats,type Data,type Match} from './model';
import type {WorkResearchRow} from './workCsv';
import type {WorkAnalysisMatch} from './workAnalysis';
import {WORK_ANALYSIS_LEAGUES} from './workAnalysis';
import {canonicalTeamInCompetition,resolveTeamInCompetition} from './radarTeamAliases';
import {assessGapSource} from './statGapSource';
import type {GapQueueItem,GapSourceStatus} from './statGapQueue';
import {COVERAGE_METRICS,COVERAGE_PERIODS,type CoverageMetric,type CoveragePeriod} from './leagueCoverageAudit';

export type PreflightState='blocked'|'needs-source-confirmation'|'no-new-fields';
export type PreflightResult={
 state:PreflightState;
 problems:string[];
 fillable:number;
 identical:number;
 skippedMissing:number;
 /** Never means data has been authenticated or actually imported. */
 written:false;
};
const fail=(...problems:string[]):PreflightResult=>({
 state:'blocked',problems,fillable:0,identical:0,skippedMissing:0,written:false
});
const name=(v:string,competition:string)=>canonicalTeamInCompetition(v,competition);
const good=(v:unknown):v is number=>
 typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=999;
type StatKey=CoverageMetric;
type StatPeriod=CoveragePeriod;
type Side=0|1;

function getOldMain(m:Match,metric:StatKey,period:StatPeriod,side:Side):number|null{
 return stats(m,side,period)[metric];
}
function getOldWork(m:WorkAnalysisMatch,metric:StatKey,period:StatPeriod,side:Side):unknown{
 return m[period]?.[metric]?.[side];
}
function getIncoming(row:WorkResearchRow,metric:StatKey,period:StatPeriod,side:Side):unknown{
 return row[period]?.[side]?.[metric];
}

/**
 * Preflight requires a link that was already stored on the selected match,
 * not a newly supplied or unverified lookalike. Never guess identity by date.
 */
export function preflightStatSupplement(
 data:Data,workMatches:readonly WorkAnalysisMatch[]|null,
 task:GapQueueItem,row:WorkResearchRow
):PreflightResult{
 if(task.sourceStatus!=='linked-unchecked'||!task.sourceUrl||!task.sourceId||
    task.reviewReason!==null)
   return fail('A origem desta partida exige revisão antes da conferência dos números.');
 if(row.sourceId!==task.sourceId||row.sourceUrl!==task.sourceUrl)
   return fail('A URL e o ID do complemento não correspondem à fonte já cadastrada.');
 const source=assessGapSource(row.sourceUrl,row.sourceId,false);
 if(source.status!=='linked-unchecked'||source.sourceUrl!==task.sourceUrl)
   return fail('Link Flashscore incompatível ou inseguro.');
 if(task.date!==row.date||row.dateDiscrepancy||row.titleDate&&row.titleDate!==task.date||
   task.competition.trim()!==row.competition.trim())
   return fail('A data ou competição do complemento não corresponde ao jogo selecionado.');
 if(name(row.home,row.competition)===name(row.away,row.competition))
   return fail('Mandante e visitante não podem ser a mesma equipe.');

 let getOld:(metric:StatKey,period:StatPeriod,side:Side)=>unknown;
 if(task.source==='main'){
   const candidates=data.matches.filter(m=>m.id===task.matchId);
   if(candidates.length!==1)return fail('O ID da partida é duplicado ou não existe no Histórico principal.');
   const m=candidates[0];
   if(!m.research||m.research.dateDiscrepancy||
      m.research.sourceId!==task.sourceId||
      m.research.sourceUrl!==task.sourceUrl||
      m.date!==row.date||m.competition.trim()!==row.competition.trim()||
      data.matches.filter(x=>x.research?.sourceId===task.sourceId).length!==1)
     return fail('Identidade ou procedência do Histórico principal inconsistente.');
   const storedHome=resolveTeamInCompetition(data,m.competition,data.teams.find(t=>t.id===m.home)?.name??'');
   const storedAway=resolveTeamInCompetition(data,m.competition,data.teams.find(t=>t.id===m.away)?.name??'');
   const csvHome=resolveTeamInCompetition(data,m.competition,row.home);
   const csvAway=resolveTeamInCompetition(data,m.competition,row.away);
   if(!storedHome||!storedAway||!csvHome||!csvAway||
      storedHome.id!==m.home||storedAway.id!==m.away||
      csvHome.id!==m.home||csvAway.id!==m.away)
     return fail('Não foi possível confirmar equipes e mando sem ambiguidades.');
   getOld=(metric,period,side)=>getOldMain(m,metric,period,side);
 }else if(task.source==='work'){
   if(workMatches===null)return fail('A pesquisa Work não está disponível neste navegador.');
   const league=WORK_ANALYSIS_LEAGUES.find(l=>l.label===task.competition);
   if(!league)return fail('A competição não pertence à base Work identificada.');
   const candidates=workMatches.filter(m=>m.league===league.id&&m.sourceId===task.sourceId);
   if(candidates.length!==1||
      workMatches.filter(m=>m.sourceId===task.sourceId).length!==1)
     return fail('O ID da pesquisa Work é ausente ou duplicado.');
   const m=candidates[0];
   if(m.discrepancies.length||m.date!==row.date||m.sourceUrl!==task.sourceUrl||
      name(m.home,task.competition)!==name(row.home,task.competition)||
      name(m.away,task.competition)!==name(row.away,task.competition))
     return fail('Os clubes, o mando, a data ou a procedência Work não conferem.');
   const allNames=[...new Set(workMatches.filter(x=>x.league===league.id)
      .flatMap(x=>[x.home,x.away]))];
   if([row.home,row.away].some(team=>allNames.filter(existing=>
      name(existing,task.competition)===name(team,task.competition)).length!==1))
     return fail('Nomes de clubes ambíguos na pesquisa Work.');
   getOld=(metric,period,side)=>getOldWork(m,metric,period,side);
 }else return fail('Base de origem não reconhecida.');

 let fillable=0,identical=0,skippedMissing=0;
 const errors:string[]=[];
 const combined={} as Record<StatKey,Record<StatPeriod,[number|null,number|null]>>;
 for(const metric of COVERAGE_METRICS){
   combined[metric]={} as Record<StatPeriod,[number|null,number|null]>;
   for(const period of COVERAGE_PERIODS){
     const current:[number|null,number|null]=[null,null];
     for(const side of [0,1] as const){
       const old=getOld(metric,period,side);
       const incoming=getIncoming(row,metric,period,side);
       const loc=metric+' '+period+' '+(side===0?'mandante':'visitante');
       if(old!==null&&old!==undefined&&!good(old))
         errors.push('Valor existente inválido: '+loc);
       if(incoming!==null&&incoming!==undefined&&!good(incoming))
         errors.push('Valor complementar inválido: '+loc);
       if(!good(incoming)){
         if(incoming===null||incoming===undefined)skippedMissing++;
         current[side]=good(old)?old:null;
         continue;
       }
       if(good(old)&&old!==incoming)
         errors.push('Tentativa de substituir estatística já registrada: '+loc);
       if(good(old)&&old===incoming)identical++;
       if(old===null||old===undefined)fillable++;
       current[side]=incoming;
     }
     combined[metric][period]=current;
   }
 }
 // Verify temporal consistency of the projected result, without deriving any
 // missing values from the sum, and without writing to a local store.
 for(const metric of COVERAGE_METRICS)for(const side of [0,1] as const){
   const full=combined[metric].full[side];
   const first=combined[metric].first[side];
   const second=combined[metric].second[side];
   const label=metric+' '+(side===0?'mandante':'visitante');
   if(full!==null){
     if((first!==null&&first>full)||(second!==null&&second>full)||
        (first!==null&&second!==null&&first+second!==full))
       errors.push('Jogo completo diferente da soma dos tempos: '+label);
   }
 }
 for(const period of COVERAGE_PERIODS)for(const side of [0,1] as const){
   const shots=combined.shots[period][side],target=combined.target[period][side];
   if(shots!==null&&target!==null&&target>shots)
     errors.push('Chutes no alvo excedem finalizações: '+period+' '+(side===0?'mandante':'visitante'));
 }
 if(errors.length)return fail(...errors);
 return {
   state:fillable>0?'needs-source-confirmation':'no-new-fields',
   problems:[],fillable,identical,skippedMissing,written:false
 };
}
