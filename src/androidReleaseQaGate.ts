/**
 * Etapa 61 — preflight of an eventual Android QA/release, with NO deploy,
 * network, write, physical-device claim, or server-provided evidence.
 * Local green checks are necessary but NEVER sufficient for production.
 */
import type {SafetyInspection} from './safetyArchive';
import type {DryRunResult} from './safetyRestoreDryRun';

export type AndroidQaEnvironment={
  viewportWidth:number;documentWidth:number;
  randomUUID:boolean;sha256:boolean;
};
export type QaGateItem={
  id:string;label:string;
  status:'OK'|'REVISAR'|'PENDENTE';
  detail:string;
};
export type AndroidQaGate={
  createdAt:string;
  localStatus:'APTO_PARA_TESTE_FISICO'|'REVISAR_ANTES_DO_TESTE';
  releaseStatus:'NAO_LIBERADO_PARA_PRODUCAO';
  localPassed:number;localTotal:4;
  releaseBlocked:true;checks:readonly QaGateItem[];
  counts:{historical:number;work:number;workForecasts:number;calendar:number};
  caveat:'TESTES LOCAIS NÃO SUBSTITUEM ANDROID FÍSICO OU AUTORIZAÇÃO DE DEPLOY';
};
const csv=(s:string)=>{
  const safe=/^[\s\u0000-\u001f]*[=+\-@]/u.test(s)?"'"+s:s;
  return '"'+safe.replace(/"/g,'""')+'"';
};
export function assessAndroidQaGate(
  safety:SafetyInspection,dryRun:DryRunResult|null,
  env:AndroidQaEnvironment,now=new Date()
):AndroidQaGate{
  const storageOk=safety.ok&&safety.invalid===0&&safety.present>0;
  const restored=!!dryRun&&dryRun.status==='PASSOU'&&
    dryRun.originalUnchanged===true&&dryRun.simulatedOnly===true&&
    dryRun.groups===9&&dryRun.restored===safety.present&&
    dryRun.matches===safety.matches&&
    dryRun.workMatches===safety.workMatches&&
    dryRun.workForecasts===safety.workForecasts&&
    dryRun.calendarFixtures===safety.calendarFixtures;
  const viewport=Number.isFinite(env.viewportWidth)&&env.viewportWidth>=320&&
    Number.isFinite(env.documentWidth)&&
    env.documentWidth<=env.viewportWidth+1;
  const browser=env.randomUUID&&env.sha256;
  const flags=[storageOk,restored,viewport,browser];
  const local:QaGateItem[]=[
    {id:'storage',label:'Grupos V4 locais legíveis',status:storageOk?'OK':'REVISAR',
     detail:storageOk?`${safety.present} grupo(s) presente(s), 0 inválidos. Ausentes não são inventados.`:
      'Sem grupo V4 válido ou com dados ilegíveis. Não restaurar ou substituir automaticamente.'},
    {id:'recovery',label:'Ensaio de recuperação em memória',status:restored?'OK':'REVISAR',
     detail:restored?`${dryRun!.restored} grupo(s) preservado(s) byte a byte, somente na memória.`:
      'Ensaio ausente, falhou ou divergiu da leitura atual. Não presume backup persistente.'},
    {id:'layout',label:'Enquadramento local da tela',status:viewport?'OK':'REVISAR',
     detail:viewport?'Largura mínima 320px e sem rolagem global observada.':
      'Largura menor que 320px, inválida ou com rolagem horizontal global.'},
    {id:'crypto',label:'APIs do navegador',status:browser?'OK':'REVISAR',
     detail:browser?'UUID e SHA-256 locais disponíveis.':
      'Falta gerador de IDs seguro ou SHA-256. Não há garantia de operação.'}
  ];
  const pending:QaGateItem[]=[
    {id:'android_physical',label:'Teste em Android físico',status:'PENDENTE',
     detail:'NÃO executado por este diagnóstico. Conferir abrir agenda, salvar, recuperar e reiniciar no aparelho.'},
    {id:'external_backup',label:'Arquivo de backup guardado fora do aparelho',status:'PENDENTE',
     detail:'Exportar no celular não prova que o arquivo foi preservado em outro lugar.'},
    {id:'external_results',label:'Resultados prospectivos conferidos externamente',status:'PENDENTE',
     detail:'Sem evidência independente autenticada de pelo menos 30 partidas por campeonato: precisão N/D.'},
    {id:'authorized_integration',label:'Integração e publicação autorizadas',status:'PENDENTE',
     detail:'PRs experimentais continuam separados: nenhum merge/deploy é autorizado por este relatório.'}
  ];
  const localPassed=flags.filter(Boolean).length;
  return {createdAt:now.toISOString(),
    localStatus:localPassed===4?'APTO_PARA_TESTE_FISICO':'REVISAR_ANTES_DO_TESTE',
    releaseStatus:'NAO_LIBERADO_PARA_PRODUCAO',releaseBlocked:true,
    localPassed,localTotal:4,checks:[...local,...pending],
    counts:{historical:safety.matches,work:safety.workMatches,
      workForecasts:safety.workForecasts,calendar:safety.calendarFixtures},
    caveat:'TESTES LOCAIS NÃO SUBSTITUEM ANDROID FÍSICO OU AUTORIZAÇÃO DE DEPLOY'};
}
/** A privacy-preserving local file: counts + states only, NEVER records,
 * forecast JSON, external URLs, source IDs or any browser storage value.
 */
export function exportAndroidQaGateCsv(report:AndroidQaGate):string{
 const rows=[
  ['verificacao','estado','observacao'],
  ...report.checks.map(c=>[c.label,c.status,c.detail]),
  ['VEREDITO DE PRODUCAO','NAO LIBERADO',
   'O diagnóstico não efetua QA físico, importação, merge ou deploy.']
 ];
 return '\uFEFF'+rows.map(r=>r.map(csv).join(';')).join('\r\n')+'\r\n';
}
