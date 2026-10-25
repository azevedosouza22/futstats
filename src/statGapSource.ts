/**
 * Conservative provenance triage for already stored historical records.
 * A syntactically valid URL is only a lead for manual research: no HTTP request
 * is made and NO missing statistic is declared recoverable or verified.
 */
export type GapSourceStatus=
  'needs-review'|'linked-unchecked'|'missing-source'|'invalid-source';
export type GapSourceAssessment={
  status:GapSourceStatus;
  sourceUrl:string|null;
  sourceId:string|null;
  /** Data remains N/D until independent confirmation of each missing cell. */
  mayOpenSource:boolean;
};
const allowedHosts=new Set([
  'flashscore.com','www.flashscore.com',
  'flashscore.com.br','www.flashscore.com.br'
]);
const plausibleId=(id:unknown):id is string=>
  typeof id==='string'&&/^[a-zA-Z0-9_-]{3,80}$/.test(id);

/**
 * Only expose a URL where the stored Flashscore mid equals the saved source ID.
 * Never trust host suffixes, user-info, non-HTTPS, multiple mid or fragments.
 * Incomplete source metadata is NOT equivalent to verified coverage.
 */
export function assessGapSource(
  url:unknown,sourceId:unknown,needsReview:boolean
):GapSourceAssessment{
  const id=plausibleId(sourceId)?sourceId:null;
  if(url===null||url===undefined||url===''){
    return {status:needsReview?'needs-review':'missing-source',
      sourceUrl:null,sourceId:id,mayOpenSource:false};
  }
  if(typeof url!=='string'||!id)
    return {status:'invalid-source',sourceUrl:null,sourceId:id,mayOpenSource:false};
  try{
    const parsed=new URL(url);
    if(parsed.protocol!=='https:'||parsed.username||parsed.password||
      !allowedHosts.has(parsed.hostname.toLowerCase())||
      parsed.searchParams.getAll('mid').length!==1||
      parsed.searchParams.get('mid')!==id||parsed.hash||
      parsed.port!==''){
      return {status:'invalid-source',sourceUrl:null,sourceId:id,mayOpenSource:false};
    }
    return {status:needsReview?'needs-review':'linked-unchecked',
      sourceUrl:url,sourceId:id,mayOpenSource:true};
  }catch{
    return {status:'invalid-source',sourceUrl:null,sourceId:id,mayOpenSource:false};
  }
}
