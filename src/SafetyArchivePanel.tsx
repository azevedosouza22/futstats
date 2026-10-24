import {useState} from 'react';
import {
 createSafetyArchive,inspectSafetyStorage,inspectSafetyArchive,
 type SafetyInspection
} from './safetyArchive';

const description=(n:number)=>n.toLocaleString('pt-BR');
export default function SafetyArchivePanel(){
 const [report,setReport]=useState<SafetyInspection|null>(null);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
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
   <p className="muted">Importante: este é um novo formato de arquivo para proteção e auditoria, distinto do backup antigo. <strong>A restauração integral ainda não está habilitada</strong>; o botão antigo de restauração não reconhece esta cópia V4. Até validarmos uma recuperação transacional, nenhuma base será sobrescrita automaticamente.</p>
  </div>
 </section>;
}
