import {useState} from 'react';
import type {Data} from './model';
import type {WorkAnalysisMatch} from './workAnalysis';
import {reconcileMainWorkSources,exportMainWorkReconciliationCsv} from './mainWorkSourceReconciliation';
const labels={
 same_values:'Coincide localmente · mesma origem, NÃO é segunda fonte',
 different_values:'Divergência de valores entre bases',
 incomplete_values:'Campos incompletos (N/D)',
 different_fixture:'Identidade/data/competição divergentes',
 duplicate_work_id:'ID repetido em registros Work',
 unsafe_reference:'Referência HTTPS/ID incompatível'
};
export default function MainWorkSourceReview({data,work,today}:{
 data:Data;work:readonly WorkAnalysisMatch[];today:string
}){
 const [open,setOpen]=useState(false);
 const report=open?reconcileMainWorkSources(data,work,today):null;
 function download(){
  if(!report)return;
  const csv=exportMainWorkReconciliationCsv(report);
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  try{
   const a=document.createElement('a');a.href=url;
   a.download='futstats-main-work-conferencia-origens.csv';
   document.body.appendChild(a);a.click();a.remove();
  }finally{URL.revokeObjectURL(url);}
 }
 return <details className="cross-store-review"
   aria-label="Conferir partidas compartilhadas entre Histórico e Work"
   open={open} onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>Conferir partidas compartilhadas entre Histórico e Work</summary>
  {report&&<>
   <p className="muted" role="status">
    {report.sharedIds} ID(s) Flashscore presentes em ambas as bases ·
    {' '}{report.identical} coincidência(s) local(is) ·
    {' '}{report.conflicting} com valores divergentes ·
    {' '}{report.mismatchedFixtures+report.duplicateWorkIds+
       report.unsafeRefs} origem(ns) para revisão ·
    {' '}0 resultado(s) confirmado(s) externamente.
   </p>
   <p className="muted">A mesma partida pode existir nas duas bases
    separadas. <strong>Isso não significa duas fontes independentes.</strong>
    Coincidência de números locais não comprova placar nem valida
    “As Boas”. Nada será importado, mesclado ou corrigido.</p>
   <button type="button" className="text-button" onClick={download}>
    Exportar confrontos compartilhados (CSV)
   </button>
   {report.overlaps.length===0?<p className="muted">
      Nenhum identificador Flashscore compartilhado encontrado nos registros
      locais anteriores à data de hoje. Isso não prova cobertura completa.
    </p>:<ul className="cross-store-list">{report.overlaps.slice(0,12).map(r=>
     <li key={r.key}>
      <strong>{r.date} · {r.home} × {r.away}</strong>
      <small>{r.competition} · origem {r.sourceId}</small>
      <span>{labels[r.state]} · {r.conflicts} valores divergentes ·
       {' '}{r.unavailable} N/D · conferência externa PENDENTE</span>
      {r.sourceUrl&&<a href={r.sourceUrl} target="_blank"
       rel="noopener noreferrer">Abrir referência cadastrada (não verificada)</a>}
     </li>
    )}</ul>}
   {report.overlaps.length>12&&<p className="muted">
    Exibidos os primeiros 12. O CSV contém todos os registros compartilhados.
   </p>}
   <p className="muted">Leitura local por ID exato, competição,
    data e equipes; confronto por 4 métricas × 3 períodos × 2 equipes.
    N/D não vira zero. URL HTTPS válida não comprova a página,
    e todos os resultados externos seguem PENDENTE.</p>
  </>}
 </details>;
}
