/**
 * Additional local provenance checks for prospective outcome audits.
 * A valid CSV structure alone cannot prove that one source fixture belongs
 * to exactly one in-app match. These checks are LOCAL only: they never claim
 * to have verified a provider's content or to know any real final result.
 */
import type {Data,Match} from './model';

export type ResultProvenanceBlock='reused_source_id'|'future_import';
export type ResultProvenanceCheck={
 block:ResultProvenanceBlock|null;
 collidingMatchIds:readonly string[];
};

/** Never repair collisions or infer which fixture an ID really represents.
 * Fail closed: a reused Flashscore source ID invalidates ALL affected rows,
 * including the otherwise correctly labelled fixture.
 */
export function checkProspectiveResultProvenance(
 data:Data,match:Match,now=new Date()
):ResultProvenanceCheck{
 const research=match.research;
 if(!research)return {block:null,collidingMatchIds:[]};
 const matches=data.matches.filter(m=>m.research&&
  m.research.provider===research.provider&&
  m.research.source===research.source&&
  m.research.sourceId===research.sourceId);
 if(matches.length!==1||matches[0]!==match)
  return {block:'reused_source_id',collidingMatchIds:matches.map(m=>m.id)};
 if(Date.parse(research.importedAt)>now.getTime())
  return {block:'future_import',collidingMatchIds:[]};
 return {block:null,collidingMatchIds:[]};
}
