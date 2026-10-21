import type {SavedRadarRecord} from './radarRecords';
import type {Settlement,SignalVerdict} from './radarProspective';

export type FollowupStatus = 'future' | 'pending' | 'scored' | 'review';
export type FollowupFilter = FollowupStatus | 'all';

const evaluated=(v:SignalVerdict)=>v==='Acertou'||v==='Errou';
const markets=[
  {id:'goals-full-2.5',label:'Gols · jogo completo'},
  {id:'shots-full-24.5',label:'Finalizações · jogo completo'},
  {id:'target-full-7.5',label:'Chutes no gol · jogo completo'},
] as const;

export function summarizeRadarFollowup(records:SavedRadarRecord[],settlements:Settlement[]){
  const statuses:FollowupStatus[]=records.map((_,i)=>{
    const result=settlements[i];
    if(result?.status==='future')return 'future';
    if(result?.status==='pending')return 'pending';
    if(result?.status==='complete'&&result.markets.some(m=>evaluated(m.v2)||evaluated(m.v3)))
      return 'scored';
    return 'review';
  });
  const counts={
    total:records.length,
    future:statuses.filter(x=>x==='future').length,
    pending:statuses.filter(x=>x==='pending').length,
    scored:statuses.filter(x=>x==='scored').length,
    review:statuses.filter(x=>x==='review').length,
  };
  const byMarket=markets.map(m=>{
    const row={...m,v2Signals:0,v3Signals:0,v2Evaluated:0,v3Evaluated:0,v2Correct:0,v3Correct:0};
    records.forEach((record,i)=>{
      const settled=settlements[i];
      // Invalid late snapshots and old records never count as pre-match signals.
      if(!settled||settled.status==='late'||settled.status==='legacy')return;
      const original=record.venue?.find(p=>p.marketId===m.id);
      if(!original)return;
      if(original.v2!=='Sem sinal')row.v2Signals++;
      if(original.v3!=='Sem sinal')row.v3Signals++;
      if(settled.status!=='complete')return;
      const actual=settled.markets.find(p=>p.marketId===m.id);
      if(!actual)return;
      if(original.v2!=='Sem sinal'&&evaluated(actual.v2)){
        row.v2Evaluated++;
        if(actual.v2==='Acertou')row.v2Correct++;
      }
      if(original.v3!=='Sem sinal'&&evaluated(actual.v3)){
        row.v3Evaluated++;
        if(actual.v3==='Acertou')row.v3Correct++;
      }
    });
    return row;
  });
  return {statuses,counts,byMarket};
}
