/** Only GET endpoints on GitHub. Never create, change, merge or deploy. */
import {validateStackedPrChain} from './stackedPrAudit.mjs';
const fail=m=>{throw Error('Auditoria dos PRs: '+m)};
async function main(){
 const repository=process.env.GITHUB_REPOSITORY;
 const number=Number(process.env.CURRENT_PR_NUMBER);
 const sha=process.env.CURRENT_PR_SHA;
 const token=process.env.GITHUB_TOKEN;
 if(!/^[-\w.]+\/[-\w.]+$/.test(repository??'')||
  !Number.isSafeInteger(number)||number<48||
  !/^[0-9a-f]{40}$/.test(sha??'')||!token)
  fail('faltam repositório, token somente leitura, PR experimental ou HEAD');
 // Fail closed if triggered for a PR unrelated to the 48+ experimental chain.
 const base='https://api.github.com/repos/'+repository;
 const headers={
  Accept:'application/vnd.github+json',
  Authorization:'Bearer '+token,
  'X-GitHub-Api-Version':'2022-11-28',
  'User-Agent':'futstats-stacked-pr-audit'
 };
 const json=async route=>{
  const res=await fetch(base+route,{headers,redirect:'error'});
  if(!res.ok)fail('GitHub GET retornou '+res.status+' para '+route);
  return await res.json();
 };
 const pullNumbers=Array.from({length:number-47},(_,i)=>48+i);
 // Keep concurrency below API burst thresholds.
 const batch=async(items,fn,size=5)=>{
  const out=[];
  for(let i=0;i<items.length;i+=size)
   out.push(...await Promise.all(items.slice(i,i+size).map(fn)));
  return out;
 };
 const pulls=await batch(pullNumbers,n=>json('/pulls/'+n));
 const pairs=pulls.slice(1).map((p,i)=>({
  base:pulls[i].head?.sha,head:p.head?.sha
 }));
 const comparisons=await batch(pairs,async p=>{
  if(!/^[0-9a-f]{40}$/.test(p.base??'')||
     !/^[0-9a-f]{40}$/.test(p.head??''))
   fail('SHA ausente antes de verificar ancestralidade');
  const result=await json('/compare/'+p.base+'...'+p.head);
  return {base:p.base,head:p.head,status:result.status,
   ahead_by:result.ahead_by,behind_by:result.behind_by};
 },4);
 const result=validateStackedPrChain(pulls,comparisons,{
  firstNumber:48,lastNumber:number,headSha:sha,repoFullName:repository
 });
 console.log('CADEIA EXPERIMENTAL VALIDADA — PRs #'+result.first+' a #'+
  result.last+' ('+result.reviewed+' DRAFTs; '+result.ancestryChecked+
  ' relações de ancestralidade verificadas no GitHub).');
 console.log('PRODUÇÃO '+result.productionRelease+
  '. Ainda pendentes: '+result.pending.join('; ')+'.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
