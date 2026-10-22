/**
 * Read-only reuse of private Flashscore research that was *already* reviewed
 * and saved in this browser. Never fetches/scrapes Flashscore, persists FPL
 * results, or overrides existing user/forecast data.
 */
import type {Data,Match} from './model';
import type {FplPilotGame,Pair} from './fplFreePilot';

export type VerifiedFlashscoreCorners={
 first:Pair;second:Pair;sourceUrl:string;
};
export type FlashscoreCornerAudit={
 byId:Record<string,VerifiedFlashscoreCorners>;
 matched:number;conflicting:number;
};

const normal=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const validCorner=(v:number|null|undefined):v is number=>
 typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=999;

function verified(game:FplPilotGame,match:Match):VerifiedFlashscoreCorners|null{
 if(!match.research||match.research.source!=='Flashscore')return null;
 const homeFirst=match.first[0].corners,awayFirst=match.first[1].corners;
 const homeSecond=match.second[0].corners,awaySecond=match.second[1].corners;
 const values=[homeFirst,awayFirst,homeSecond,awaySecond,
  match.research.full[0].corners,match.research.full[1].corners];
 if(!values.every(validCorner))return null;
 if(match.research.full[0].corners!==game.corners[0]||
    match.research.full[1].corners!==game.corners[1])return null;
 if(homeFirst!+homeSecond! !== game.corners[0]||
    awayFirst!+awaySecond! !== game.corners[1])return null;
 try{
  const url=new URL(match.research.sourceUrl);
  if(url.protocol!=='https:'||
    !['www.flashscore.com.br','flashscore.com.br','www.flashscore.com','flashscore.com'].includes(url.hostname)||
    url.username||url.password||url.searchParams.get('mid')!==match.research.sourceId)
   return null;
 }catch{return null;}
 return {first:[homeFirst!,awayFirst!],second:[homeSecond!,awaySecond!],
  sourceUrl:match.research.sourceUrl};
}

/**
 * Only exact team/date/season matches qualify. If more than one candidate
 * exists, reject the entire match rather than picking a source arbitrarily.
 */
export function crossCheckSavedFlashscoreCorners(
 games:FplPilotGame[],data:Data
):FlashscoreCornerAudit{
 const byId:Record<string,VerifiedFlashscoreCorners>={};
 let matched=0,conflicting=0;
 for(const game of games){
  if(!game.sourceStatsProcessed)continue;
  const candidates=data.matches.filter(m=>
   !!m.research&&m.date===game.date&&
   normal(m.competition)==='premier league 2026 27'&&
   normal(data.teams.find(t=>t.id===m.home)?.name??'')===normal(game.home)&&
   normal(data.teams.find(t=>t.id===m.away)?.name??'')===normal(game.away)
  );
  if(candidates.length>1){conflicting++;continue;}
  if(candidates.length!==1)continue;
  const result=verified(game,candidates[0]);
  if(result){byId[game.id]=result;matched++;}
  else conflicting++;
 }
 return {byId,matched,conflicting};
}
