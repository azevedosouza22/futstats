/**
 * Etapa 62 — verificador PURE das dependências de PRs experimentais.
 * Sem API, sem efeitos colaterais, sem qualquer permissão para merge/deploy.
 * `ahead` no compare API prova ancestralidade dos commits; base.ref sozinha não.
 */
const shaOk=s=>typeof s==='string'&&/^[0-9a-f]{40}$/.test(s);
const check=(ok,msg)=>{if(!ok)throw Error('Cadeia de PRs BLOQUEADA: '+msg);};
export function validateStackedPrChain(pulls,comparisons,{
 firstNumber=48,lastNumber,anchorBase='feat/v4-good-picks-saved-return',
 headSha,repoFullName='azevedosouza22/futstats'
}={}){
 check(Number.isSafeInteger(lastNumber)&&lastNumber>=firstNumber,
  'faixa de PRs inválida');
 check(Array.isArray(pulls)&&pulls.length===lastNumber-firstNumber+1,
  'a sequência tem PR faltante, adicional ou não encontrado');
 check(Array.isArray(comparisons)&&comparisons.length===pulls.length-1,
  'falta verificar ancestralidade de commits');
 let prior=null;
 const ids=new Set(),branches=new Set(),heads=new Set();
 for(let i=0;i<pulls.length;i++){
  const p=pulls[i],expected=firstNumber+i;
  check(p&&p.number===expected,'PR #'+expected+' ausente ou fora de ordem');
  check(!ids.has(p.number),'PR #'+expected+' repetido');ids.add(p.number);
  check(p.state==='open'&&p.draft===true&&!p.merged_at&&p.merged!==true,
   'PR #'+expected+' não está aberto e em rascunho');
  check(p.head?.repo?.full_name===repoFullName&&
    p.base?.repo?.full_name===repoFullName,
   'PR #'+expected+' pertence a outro repositório ou fork');
  check(typeof p.head?.ref==='string'&&p.head.ref.startsWith('feat/v4-')&&
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
    'comparação de commits não corresponde a #'+(expected-1)+' → #'+expected);
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
