/** Read-only explanatory cross-check for an existing As Boas V2/V3 signal.
 * This intentionally NEVER filters, re-ranks, creates or saves a DailyGoodSignal:
 * four-lens support must be validated prospectively before affecting selection.
 */
import type {Data} from './model';
import type {ScheduledFixture} from './calendar';
import type {DailyGoodSignal} from './dailyGoodSignals';
import {resolveCalendarFixture} from './radarCalendarSelection';
import {analyzeFourLenses,type FourLensMetric,type LensSample} from './radarFourLenses';

export type HistoricalLensReviewStatus='aligned'|'divergent'|'insufficient'|'unavailable';
export type GoodPickLensRow={
  label:string;count:number;mean:number|null;
  over:number;under:number;overRate:number|null;underRate:number|null;
  lastTenCount:number;lastTenOverRate:number|null;lastTenUnderRate:number|null;
};
export type GoodPickHistoricalReview={
  status:HistoricalLensReviewStatus;
  direction:'Over'|'Under';
  line:number;
  metric:FourLensMetric|null;
  rows:GoodPickLensRow[];
  note:string;
  /** Includes H2H in the general samples; never count as four independent votes. */
  overlapping:true;
};
const metrics=['goals','shots','target','corners'] as const;
function readMetric(signal:DailyGoodSignal):FourLensMetric|null{
 const [metric,period,line]=signal.id.split('-');
 if(period!=='full'||Number(line)!==signal.line)return null;
 return metrics.find(m=>m===metric)??null;
}
const row=(label:string,last5:LensSample,last10:LensSample):GoodPickLensRow=>({
 label,count:last5.count,mean:last10.mean,
 over:last5.over,under:last5.under,overRate:last5.overRate,underRate:last5.underRate,
 lastTenCount:last10.count,lastTenOverRate:last10.overRate,lastTenUnderRate:last10.underRate
});
export function reviewDailyGoodFourLenses(
 data:Data,fixture:ScheduledFixture,signal:DailyGoodSignal
):GoodPickHistoricalReview{
 const base={direction:signal.direction,line:signal.line,overlapping:true as const};
 const metric=readMetric(signal);
 const selected=resolveCalendarFixture(data,fixture);
 if(!metric||!selected||!Number.isFinite(signal.line)||signal.line<=0){
   return {...base,metric,rows:[],status:'unavailable',
     note:'Confronto ou linha não reconhecido na base local. Revisão histórica N/D.'};
 }
 const comparison=analyzeFourLenses(data,{
   home:selected.homeId,away:selected.awayId,date:fixture.date,competition:fixture.competition
 },metric,'full',signal.line);
 const rows=comparison.lenses.map(lens=>row(lens.label,lens.last5,lens.last10));
 const h=comparison.lenses[0],a=comparison.lenses[2];
 if(h.last5.count<5||a.last5.count<5){
   return {...base,metric,rows,status:'insufficient',
     note:'Há menos de 5 jogos válidos para pelo menos um dos mandos. Não confirma a indicação.'};
 }
 if(comparison.historicalDirection==='Sem consenso'){
   return {...base,metric,rows,status:'insufficient',
     note:comparison.reason+' A seleção original V2/V3 não é alterada.'};
 }
 const aligned=comparison.historicalDirection===signal.direction;
 return {...base,metric,rows,status:aligned?'aligned':'divergent',
   note:aligned
    ?'A frequência dos jogos anteriores concorda com o sinal V2/V3. Não mede probabilidade futura.'
    :'A frequência dos jogos anteriores aponta direção contrária ao sinal V2/V3. Recomenda revisão, não altera a seleção.'};
}
