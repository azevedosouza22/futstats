import {useRef,useState} from 'react';
import type {Data} from './model';
import {mergeWorkCsv,parseWorkResearchCsv,workCsvPreview,type WorkResearchRow} from './workCsv';

export default function WorkCsvImport({data,save}:{data:Data;save:(next:Data)=>boolean}) {
  const input=useRef<HTMLInputElement>(null);
  const [rows,setRows]=useState<WorkResearchRow[]>([]);
  const [filename,setFilename]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  async function load(file?:File) {
    setRows([]);setFilename('');setError('');setNotice('');
    if(!file)return;
    try {
      if(file.size>2_000_000||!file.name.toLowerCase().endsWith('.csv'))throw Error('Selecione um arquivo CSV de até 2 MB.');
      const parsed=parseWorkResearchCsv(await file.text());
      setRows(parsed);setFilename(file.name);
    }catch(e){setError(e instanceof Error?e.message:'Falha ao ler CSV.');}
    if(input.current)input.current.value='';
  }
  const preview=workCsvPreview(data,rows);
  const newCount=preview.filter(r=>!r.duplicate).length;
  const updatedCount=preview.filter(r=>r.enrichable).length;
  const duplicateCount=preview.length-newCount-updatedCount;
  const additionalFields=preview.reduce((total,r)=>total+r.newFields,0);
  function confirmImport() {
    setError('');setNotice('');
    if(!rows.length)return;
    try{
      const result=mergeWorkCsv(data,rows);
      if(result.added===0&&result.updated===0){setNotice('Nenhuma partida nova ou complemento: os registros já estão cadastrados.');return;}
      if(!window.confirm(`Adicionar ${result.added} partidas novas e completar ${result.filledFields} valores ausentes em ${result.updated} partidas existentes? Nada será excluído ou substituído. Faça backup antes de continuar.`))return;
      if(save(result.data)){
        setRows([]);setFilename('');
        setNotice(`${result.added} partidas importadas. ${result.updated} partidas complementadas (${result.filledFields} valores). ${result.skipped} duplicatas ignoradas. Dados preservados no navegador.`);
      }
    }catch(e){setError(e instanceof Error?e.message:'Falha na validação.');}
  }
  return <section className="panel research-import">
    <div className="panel-head"><div><h2>Importar pesquisa CSV · Experimental</h2>
    <p>Pesquisas pontuais do Work, com revisão antes de salvar. Nunca substitui um backup.</p></div></div>
    <div className="integration-content">
      <p className="muted">Aceita o CSV de pesquisa do FutStats, com fonte Flashscore. Não acessa sites, não faz extração automática e não envia o arquivo ao servidor. Campos N/D permanecem ausentes.</p>
      <input ref={input} type="file" accept=".csv,text/csv" aria-label="Escolher pesquisa CSV" onChange={e=>void load(e.currentTarget.files?.[0])}/>
      {error&&<p className="alert" role="alert">{error}</p>}
      {notice&&<p className="notice" role="status">{notice}</p>}
      {!!rows.length&&<div className="research-preview">
        <h3>Prévia: {filename}</h3>
        <p>{rows.length} partidas · {newCount} novas · {updatedCount>0?`${updatedCount} a complementar (${additionalFields} valores) · `:''}{duplicateCount} duplicadas · {rows.filter(r=>r.dateDiscrepancy).length} com divergência entre datas.</p>
        <div className="research-table-wrap"><table className="analysis-table">
          <thead><tr><th>Data</th><th>Partida</th><th>Competição</th><th>Origem</th><th>Situação</th></tr></thead>
          <tbody>{preview.map(r=><tr key={r.sourceId}>
            <td>{r.date}{r.dateDiscrepancy&&<small>Data do título: {r.titleDate}</small>}</td>
            <td>{r.home} × {r.away}</td><td>{r.competition||'N/D'}</td>
            <td><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">Flashscore · conferir</a></td>
            <td>{r.enrichable?`Complementar ${r.newFields} valores ausentes`:r.duplicate?'Duplicada — ignorar':r.dateDiscrepancy?'Revisar data':'Nova'}</td>
          </tr>)}</tbody>
        </table></div>
        <p className="muted">Importamos partidas concluídas e estatísticas verificadas no CSV. O aviso de data mantém os valores originais; confirme a data antes de usar análises pré-jogo.</p>
        <button className="primary" disabled={newCount===0&&updatedCount===0} onClick={confirmImport}>Confirmar {newCount} partidas novas{updatedCount>0?` e ${updatedCount} complementos`:''}</button>
        <button className="text-button" onClick={()=>{setRows([]);setFilename('');}}>Cancelar prévia</button>
      </div>}
    </div>
  </section>;
}
