import {useState} from 'react';
import {dryRunV4Restore,type DryRunResult} from './safetyRestoreDryRun';
import {assessAndroidQaGate,exportAndroidQaGateCsv,type AndroidQaGate} from './androidReleaseQaGate';
import {planSafetyRestore,restoreSafetyArchiveEmpty,type RestorePlan} from './safetyRestore';
import {
 createSafetyArchive,inspectSafetyStorage,inspectSafetyArchive,
 type SafetyInspection
} from './safetyArchive';

const description=(n:number)=>n.toLocaleString('pt-BR');
export default function SafetyArchivePanel(){
 const [report,setReport]=useState<SafetyInspection|null>(null);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [restorePlan,setRestorePlan]=useState<RestorePlan|null>(null);
 const [candidate,setCandidate]=useState<unknown>(null);
 const [restoreDone,setRestoreDone]=useState(false);
 const [dryRun,setDryRun]=useState<DryRunResult|null>(null);
 const [qaGate,setQaGate]=useState<AndroidQaGate|null>(null);
 function refresh(){
  setError('');setMessage('');
  try{
   setReport(inspectSafetyStorage(localStorage));
  }catch(e){
   setError(e instanceof Error?e.message:'Não foi possível conferir a base do dispositivo.');
  }
 }
 function testRestoreWithoutWriting(){
  setError('');setMessage('');setDryRun(null);
  try{
   const result=dryRunV4Restore(localStorage);
   setDryRun(result);
   setReport(inspectSafetyStorage(localStorage));
  }catch(e){
   setError(e instanceof Error?e.message:'Autoteste incompleto; nenhum dado foi restaurado.');
  }
 }
 function runAndroidPreflight(){
  // Read the original storage only. The recovery trial uses a private Map.
  // No claim of an actual Android-device test or successful file backup.
  setError('');setQaGate(null);
  try{
    const inspection=inspectSafetyStorage(localStorage);
    let recovery:DryRunResult|null=null;
    try{recovery=dryRunV4Restore(localStorage);}catch{recovery=null;}
    const gate=assessAndroidQaGate(inspection,recovery,{
      viewportWidth:document.documentElement.clientWidth,
      documentWidth:document.documentElement.scrollWidth,
      randomUUID:typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function',
      sha256:typeof crypto!=='undefined'&&!!crypto.subtle
    });
    setQaGate(gate);
  }catch(e){setError(e instanceof Error?e.message:
    'A conferência local falhou. Não liberar a versão experimental.');}
 }
 function exportQaGate(){
  if(!qaGate)return;
  const bytes=exportAndroidQaGateCsv(qaGate);
  const url=URL.createObjectURL(new Blob([bytes],{type:'text/csv;charset=utf-8'}));
  const anchor=document.createElement('a');
  anchor.href=url;anchor.download='futstats-checklist-qa-android.csv';
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
 }
 function exportArchive(){
  setError('');setMessage('');
  try{
   const before=inspectSafetyStorage(localStorage);
   setReport(before);
   const archive=createSafetyArchive(localStorage);
   // Verify JSON round trip in memory without touching localStorage.
   const content=JSON.stringify(archive);
   const fromFile=JSON.parse(content) as unknown;
   const checked=inspectSafetyArchive(fromFile);
   if(!checked.ok||checked.matches!==before.matches||
    checked.workMatches!==before.workMatches||
    checked.workForecasts!==before.workForecasts||
    checked.calendarFixtures!==before.calendarFixtures)
    throw Error('A conferência do arquivo integral falhou. Nenhum dado foi modificado.');
   const blob=new Blob([content],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const anchor=document.createElement('a');
   anchor.href=url;
   anchor.download='futstats-v4-seguranca-'+new Date().toISOString().slice(0,10)+'.json';
   anchor.click();
   setTimeout(()=>URL.revokeObjectURL(url),5000);
   setMessage('Cópia integral V4 gerada no dispositivo: '+description(checked.matches)+
    ' partidas do histórico, '+description(checked.workMatches)+
    ' pesquisas Work e '+description(checked.workForecasts)+
    ' registros de previsão Work e '+description(checked.calendarFixtures)+
    ' confrontos da agenda CSV local. Guarde o arquivo em local privado.');
  }catch(e){
   setError(e instanceof Error?e.message:'Não foi possível gerar a cópia integral.');
  }
 }
 async function chooseArchive(file?:File){
  setError('');setMessage('');setCandidate(null);setRestorePlan(null);setRestoreDone(false);
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.json')||file.size>35_000_000){
   setError('Selecione um arquivo V4 JSON de até 35 MB. Nenhum dado foi alterado.');
   return;
  }
  try{
   const raw=await file.text();
   const parsed:unknown=JSON.parse(raw);
   const plan=planSafetyRestore(parsed,localStorage);
   setRestorePlan(plan);setCandidate(parsed);
   setMessage('Arquivo V4 conferido, sem importar dados. '+plan.reason);
  }catch(e){
   setError('O arquivo não passou na verificação: '+
    (e instanceof Error?e.message:'formato desconhecido')+
    '. Nenhum dado foi alterado.');
  }
 }
 function restoreEmpty(){
  if(!restorePlan?.canRestore||!candidate)return;
  setError('');setMessage('');
  try{
   // Re-check immediately before the user's explicit confirmation.
   const current=planSafetyRestore(candidate,localStorage);
   setRestorePlan(current);
   if(!current.canRestore)throw Error(current.reason);
   const confirmText=
    'RECUPERAÇÃO V4 — PERFIL VAZIO\n\n' +
    'Serão restaurados somente os dados que constam no arquivo validado. '+
    'Esta operação não é uma importação para o Histórico antigo e não mistura dados. '+
    'Antes de confirmar, mantenha uma cópia do arquivo de segurança.\n\n' +
    'Restaurar neste navegador vazio agora?';
   if(!window.confirm(confirmText))return;
   const result=restoreSafetyArchiveEmpty(localStorage,candidate);
   setRestoreDone(true);
   setCandidate(null);setRestorePlan(null);
   setMessage('Restauração V4 verificada: '+result.restored+
    ' grupos recuperados, '+description(result.archivedMatches)+
    ' jogos históricos, '+description(result.archivedWork)+
    ' pesquisas Work e '+description(result.archivedForecasts)+
    ' previsões Work e '+description(result.archivedCalendarFixtures)+
    ' confrontos da agenda. Para recarregar a interface, toque em Reiniciar visualização.');
  }catch(e){
   setError(e instanceof Error?e.message:'Falha de recuperação; confira os dados antes de continuar.');
  }
 }
 function reloadAfterRestore(){
  if(restoreDone)window.location.reload();
 }
 return <section className="panel safety-archive-panel"
  aria-label="Segurança e backup integral do FutStats V4">
  <div className="panel-head"><div>
   <h2>Segurança V4 · Conferência e cópia integral</h2>
   <p>Confira os dados deste celular e salve o histórico, as pesquisas Work e as previsões em um único arquivo privado.</p>
  </div><span className="tag">SOMENTE CÓPIA</span></div>
  <div className="analysis-content">
   <p className="muted">A conferência não altera, apaga ou importa nenhum jogo. O arquivo é gerado somente no seu dispositivo, sem enviar dados Work ao GitHub ou à Vercel.</p>
   <p className="muted">O botão de autoteste reproduz a exportação e a
     recuperação em um perfil fictício dentro da memória. Não apaga nem
     restaura os dados deste aparelho; se encontrar inconsistências, bloqueia
     o ensaio e informa o erro. Ao final, use “Criar cópia integral V4” para
     salvar um arquivo privado de verdade.</p>
   <p className="muted">O backup V4 v2 protege nove grupos: Histórico, previsões, Work e agenda CSV local. Backups V4 v1 de oito grupos continuam aceitos e não incluem agenda. A agenda oficial e comunitária consultada pela internet não é salva como dado próprio. Guarde o arquivo em local privado fora do dispositivo.</p>
   <div className="analysis-controls">
    <button type="button" onClick={refresh}>Conferir integridade dos dados</button>
    <button type="button" onClick={testRestoreWithoutWriting}>
      Testar recuperação V4 sem alterar dados
    </button>
    <button type="button" onClick={runAndroidPreflight}>
      Preparar testes Android e verificar bloqueios de liberação
    </button>
    <button type="button" className="primary" onClick={exportArchive}>
     Criar cópia integral V4 (um único arquivo)
    </button>
   </div>
   {qaGate&&<section className="safety-android-qa" role="region"
     aria-label="Pré-check de liberação Android">
     <h3>Preparação para testes no Android · NÃO LIBERADO PARA PRODUÇÃO</h3>
     <p role="status" className="muted">
      Verificações locais: <strong>{qaGate.localPassed}/{qaGate.localTotal}</strong>.
      {' '}{qaGate.localStatus==='APTO_PARA_TESTE_FISICO'
       ?'Apto a iniciar o teste físico, ainda NÃO realizado.'
       :'Revisar os problemas locais antes de testar no aparelho.'}
     </p>
     <ul>{qaGate.checks.map(c=><li key={c.id}>
      <strong>{c.status}</strong> · {c.label}.
      <small>{c.detail}</small>
     </li>)}</ul>
     <p className="muted">Este relatório tem apenas contagens e estados,
       nunca o conteúdo dos jogos ou previsões. Mesmo com 4/4 checagens locais,
       continuam obrigatórios backup externo, testes físicos,
       resultados verificados independentemente e integração autorizada.
       Nenhuma atualização na produção foi realizada.</p>
     <button type="button" onClick={exportQaGate}>
       Baixar checklist de QA Android (CSV sem dados de partidas)
     </button>
    </section>}
   {error&&<p className="alert" role="alert">{error}</p>}
   {message&&<p className="notice" role="status">{message}</p>}
   {dryRun&&<section aria-label="Resultado do autoteste de recuperação V4"
      role="status" className="notice">
      <p><strong>Autoteste PASSOU — apenas memória isolada.</strong>
       {' '}{dryRun.restored} de {dryRun.groups} grupos presentes recuperados,
       {' '}{description(dryRun.matches)} partidas no Histórico,
       {' '}{description(dryRun.radarForecasts)} previsões Radar V2/V3,
       {' '}{description(dryRun.workMatches)} pesquisas Work,
       {' '}{description(dryRun.workForecasts)} previsões Work e
       {' '}{description(dryRun.calendarFixtures)} jogos da agenda CSV.
       O armazenamento real permaneceu intacto durante o teste.
       Este ensaio não grava um arquivo no dispositivo, não testa falhas do
       sistema Android e não substitui manter o backup externo.</p>
    </section>}
   {report&&<>
    <div className="fpl-pilot-numbers">
     <div><strong>{description(report.matches)}</strong><span>Histórico original</span></div>
     <div><strong>{description(report.workMatches)}</strong><span>Pesquisas Work</span></div>
     <div><strong>{description(report.workForecasts)}</strong><span>Testes prospectivos Work</span></div>
     <div><strong>{description(report.calendarFixtures)}</strong><span>Confrontos da agenda CSV</span></div>
     <div><strong>{report.invalid}</strong><span>Armazenamentos inconsistentes</span></div>
    </div>
    <details className="fpl-pilot-disclosure">
     <summary>Verificar os nove grupos de dados no dispositivo</summary>
     <table className="analysis-table">
      <thead><tr><th>Grupo</th><th>Estado</th><th>Registros</th></tr></thead>
      <tbody>{report.entries.map(e=><tr key={e.key}>
       <th>{e.label}</th>
       <td>{e.status==='ok'?'Íntegro':
        e.status==='absent'?'Não encontrado':'Revisão necessária'}
        {e.error&&<small>{e.error}</small>}
       </td>
       <td>{e.count===null?'—':description(e.count)}</td>
      </tr>)}</tbody>
     </table>
    </details>
    {report.missing>0&&<p className="muted">Alguns grupos não existem neste navegador. Eles são salvos como ausentes, sem criar registros artificiais. A quantidade de jogos pode ser diferente de outros aparelhos.</p>}
    {report.invalid>0&&<p className="alert">A cópia integral não será gerada enquanto houver dados inconsistentes. Isso evita substituir silenciosamente registros antigos.</p>}
   </>}
   <details className="fpl-pilot-disclosure" aria-label="Recuperação segura V4">
    <summary>Recuperar cópia integral V4 (somente em dispositivo vazio)</summary>
    <p className="muted">A recuperação exige um navegador sem nenhum dos nove grupos protegidos, inclusive a agenda CSV. Arquivos V4 v1 antigos de oito grupos não restauram uma agenda inexistente. Se houver qualquer jogo, previsão, pesquisa Work ou agenda local, a restauração será bloqueada. O arquivo é validado neste dispositivo, sem envio a servidores. O backup antigo de Histórico + Radar usa outra opção de restauração.</p>
    <label>Selecionar arquivo de segurança V4
     <input type="file" accept=".json,application/json" aria-label="Escolher cópia integral V4"
      onChange={e=>{void chooseArchive(e.target.files?.[0]);e.currentTarget.value='';}}/>
    </label>
    {restorePlan&&<>
     <div className="fpl-pilot-numbers">
      <div><strong>{description(restorePlan.inspection.matches)}</strong><span>Históricos no arquivo</span></div>
      <div><strong>{description(restorePlan.inspection.workMatches)}</strong><span>Pesquisas Work no arquivo</span></div>
      <div><strong>{description(restorePlan.inspection.workForecasts)}</strong><span>Previsões Work no arquivo</span></div>
      <div><strong>{description(restorePlan.inspection.calendarFixtures)}</strong><span>Confrontos da agenda no arquivo</span></div>
      <div><strong>{restorePlan.existingKeys.length}</strong><span>Grupos já existentes neste aparelho</span></div>
     </div>
     <p className="muted" role="status">{restorePlan.reason}</p>
     <button type="button" className="primary"
      disabled={!restorePlan.canRestore} onClick={restoreEmpty}>
      Restaurar cópia V4 neste perfil vazio
     </button>
    </>}
    {restoreDone&&<button type="button" onClick={reloadAfterRestore}>Reiniciar visualização do FutStats</button>}
   </details>
   <p className="muted">A nova cópia integral V4 agora pode ser verificada e restaurada exclusivamente em um perfil vazio. Não existe opção para mesclar, apagar ou substituir os 659 históricos ou quaisquer registros já salvos. Em caso de falha, o aplicativo tenta reverter todas as escritas. Guarde sempre a cópia original, inclusive após a restauração.</p>
  </div>
 </section>;
}
