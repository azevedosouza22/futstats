/**
 * Etapa 62 — verificador PURE das dependências de PRs experimentais.
 * Sem API, sem efeitos colaterais, sem qualquer permissão para merge/deploy.
 * `ahead` no compare API prova ancestralidade dos commits; base.ref sozinha não.
 */
const shaOk=s=>typeof s==='string'&&/^[0-9a-f]{40}$/.test(s);
const check=(ok,msg)=>{if(!ok)throw Error('Cadeia de PRs BLOQUEADA: '+msg);};
export function validateStackedPrChain(pulls,comparisons,{
 firstNumber=48,lastNumber,anchorBase='feat/v4-good-picks-saved-return',
 headSha,repoFullName='azevedosouza22/futstats',excludedNumbers=[]
}={}){
 check(Number.isSafeInteger(lastNumber)&&lastNumber>=firstNumber,
  'faixa de PRs inválida');
 check(Array.isArray(excludedNumbers)&&excludedNumbers.every(n=>
   Number.isSafeInteger(n)&&n>=firstNumber&&n<lastNumber),
  'exclusão de PR inválida');
 const excluded=new Set(excludedNumbers);
 check(excluded.size===excludedNumbers.length,'exclusão de PR repetida');
 const expectedNumbers=Array.from({length:lastNumber-firstNumber+1},
  (_,i)=>firstNumber+i).filter(n=>!excluded.has(n));
 check(Array.isArray(pulls)&&pulls.length===expectedNumbers.length,
  'a sequência tem PR faltante, adicional ou não encontrado');
 check(Array.isArray(comparisons)&&comparisons.length===pulls.length-1,
  'falta verificar ancestralidade de commits');
 let prior=null;
 const ids=new Set(),branches=new Set(),heads=new Set();
 for(let i=0;i<pulls.length;i++){
  const p=pulls[i],expected=expectedNumbers[i];
  check(p&&p.number===expected,'PR #'+expected+' ausente ou fora de ordem');
  check(!ids.has(p.number),'PR #'+expected+' repetido');ids.add(p.number);
  check(p.state==='open'&&p.draft===true&&!p.merged_at&&p.merged!==true,
   'PR #'+expected+' não está aberto e em rascunho');
  check(p.head?.repo?.full_name===repoFullName&&
    p.base?.repo?.full_name===repoFullName,
   'PR #'+expected+' pertence a outro repositório ou fork');
  // Explicit one-PR naming exception for the mobile-loading repair.
  // All other PRs remain on feat/v4-*; every ancestry, SHA and DRAFT check
  // below remains mandatory (including for #97).
  const experimentalBranch=typeof p.head?.ref==='string'&&
   (p.head.ref.startsWith('feat/v4-')||
    (p.number===97&&p.head.ref==='fix/v4-research-loading-mobile-2775'));
  check(experimentalBranch&&
    typeof p.base?.ref==='string'&&p.base.ref.length>0,
   'PR #'+expected+' tem branch inválida');
  check(shaOk(p.head.sha),'SHA de origem inválido no PR #'+expected);
  check(!branches.has(p.head.ref)&&!heads.has(p.head.sha),
   'branch ou commit duplicado no PR #'+expected);
  branches.add(p.head.ref);heads.add(p.head.sha);
  check(p.base.ref===(prior?prior.head.ref:anchorBase),
   'PR #'+expected+' não deriva da branch anterior');
  if(prior){
   const cmp=comparisons[i-1];
   check(cmp?.base===prior.head.sha&&cmp?.head===p.head.sha,
    'comparação de commits não corresponde a #'+prior.number+' → #'+expected);
   check(cmp.status==='ahead'&&Number.isSafeInteger(cmp.ahead_by)&&
    cmp.ahead_by>=1&&cmp.behind_by===0,
    'PR #'+expected+' não descende do SHA do PR anterior');
  }
  prior=p;
 }
 check(prior.head.sha===headSha,
  'HEAD do PR atual mudou desde o início do teste');
 return Object.freeze({
  first:firstNumber,last:lastNumber,reviewed:pulls.length,
  ancestryChecked:comparisons.length,
  currentSha:headSha,chainValid:true,
  integrationAuthorized:false,productionRelease:'BLOQUEADA',
  pending:[
   'QA Android físico',
   'backup externo confirmado',
   '30 resultados independentes por liga',
   'autorização expressa de merge/deploy'
  ]
 });
}
