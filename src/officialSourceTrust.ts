/**
 * Single, conservative policy for sources of manually checked kickoff times.
 * This verifies URL structure and snapshot date ONLY, never the content of
 * a remote site. Read-only; there is no fetch or automatic renewal.
 */
const officialHosts=new Set([
  'www.cbf.com.br','www.laliga.com','www.lfp.fr','www.asroma.com',
  'www.premierleague.com','www.legaseriea.it',
  'credencial.cbf.com.br'
]);
export function safeOfficialFixtureUrl(value:string):boolean{
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&!url.username&&!url.password&&
    officialHosts.has(url.hostname.toLowerCase());
 }catch{return false;}
}
const dateValid=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&
  !Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;

/** A dated official check is eligible only from its day through day +2.
 * The second argument is a Brasília calendar day, not UTC milliseconds.
 */
export function officialSnapshotFreshAt(verifiedAt:string,brasiliaDay:string):boolean{
 if(!dateValid(verifiedAt)||!dateValid(brasiliaDay))return false;
 const delta=(Date.parse(brasiliaDay+'T00:00:00Z')-
   Date.parse(verifiedAt+'T00:00:00Z'))/86400000;
 return Number.isInteger(delta)&&delta>=0&&delta<=2;
}
