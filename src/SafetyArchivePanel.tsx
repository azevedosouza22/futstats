import {useState} from 'react';
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
 function refresh(){
  setError('');setMessage('');
  try{
   setReport(inspectSafetyStorage(localStorage));
  }catch(e){
   setError(e instanceof Error?e.message:'Não foi possível conferir a base do dispositivo.');
  }
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
    checked.workForecasts!==before.workForecasts)
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
    ' registros de previsão Work. Guarde o arquivo em local privado.');
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
    ' previsões Work. Para recarregar a interface, toque em Reiniciar visualização.');
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
   <div className="analysis-controls">
    <button type="button" onClick={refresh}>Conferir integridade dos dados</button>
    <button type="button" className="primary" onClick={exportArchive}>
     Criar cópia integral V4 (um único arquivo)
    </button>
   </div>
   {error&&<p className="alert" role="alert">{error}</p>}
   {message&&<p className="notice" role="status">{message}</p>}
   {report&&<>
    <div className="fpl-pilot-numbers">
     <div><strong>{description(report.matches)}</strong><span>Histórico original</span></div>
     <div><strong>{description(report.workMatches)}</strong><span>Pesquisas Work</span></div>
     <div><strong>{description(report.workForecasts)}</strong><span>Testes prospectivos Work</span></div>
     <div><strong>{report.invalid}</strong><span>Armazenamentos inconsistentes</span></div>
    </div>
    <details className="fpl-pilot-disclosure">
     <summary>Verificar os oito grupos de dados no dispositivo</summary>
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
    <p className="muted">A recuperação é permitida somente quando este navegador não contém nenhum dos oito grupos de dados FutStats. Se já existem jogos ou previsões, a operação é bloqueada para evitar qualquer substituição. O arquivo é lido e validado aqui mesmo, sem envio para servidores. O backup antigo continua com seu próprio botão de restauração e não aceita este formato.</p>
    <label>Selecionar arquivo de segurança V4
     <input type="file" accept=".json,application/json" aria-label="Escolher cópia integral V4"
      onChange={e=>{void chooseArchive(e.target.files?.[0]);e.currentTarget.value='';}}/>
    </label>
    {restorePlan&&<>
     <div className="fpl-pilot-numbers">
      <div><strong>{description(restorePlan.inspection.matches)}</strong><span>Históricos no arquivo</span></div>
      <div><strong>{description(restorePlan.inspection.workMatches)}</strong><span>Pesquisas Work no arquivo</span></div>
      <div><strong>{description(restorePlan.inspection.workForecasts)}</strong><span>Previsões Work no arquivo</span></div>
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
