import {useState,type FormEvent} from 'react';
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport} from './dailyGoodAudit';
import {compareQuickEnteredSource} from './dailyGoodQuickEvidence';
import type {DocumentaryComparison,ExternalEvidence} from './dailyGoodEvidenceCompare';

export default function DailyGoodQuickEvidenceForm({records,report,readyKeys,onCompared,onClear}:{
 records:readonly SavedRadarRecord[];report:PickAuditReport;
 readyKeys:ReadonlySet<string>;
 onCompared:(source:ExternalEvidence,comparison:DocumentaryComparison)=>void;
 onClear:()=>void;
}){
 const [key,setKey]=useState('');
 const [sourceUrl,setSourceUrl]=useState('');
 const [checkedAtBrasilia,setCheckedAtBrasilia]=useState('');
 const [values,setValues]=useState<Record<string,string>>({});
 const [ack,setAck]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const matches=records.filter(r=>readyKeys.has(r.key));
 const record=matches.find(r=>r.key===key);
 const row=report.rows.find(r=>r.key===key);
 const markets=record&&row?.status==='scored'?
  row.markets.filter(m=>m.actual!==null):[];
 const changeRecord=(next:string)=>{
  setKey(next);setSourceUrl('');setCheckedAtBrasilia('');
  setValues({});setAck(false);setError('');setSuccess('');onClear();
 };
 const submit=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();setError('');setSuccess('');onClear();
  if(!ack){setError('Confirme que você transcreveu os valores de outra página consultada.');return;}
  try{
   const result=compareQuickEnteredSource({
    recordKey:key,sourceUrl,checkedAtBrasilia,values
   },records,report);
   onCompared(result.source,result.comparison);
   setSuccess('Comparação local montada sem arquivo JSON. Fonte informada, NÃO verificada na web; status PENDENTE.');
  }catch(e){
   setError(e instanceof Error?e.message:'Dados recusados; nenhuma previsão foi alterada.');
  }
 };
 return <section className="daily-good-quick-source"
  aria-label="Preencher comparação sem arquivo JSON">
  <h6>Comparar segunda fonte diretamente · sem arquivo JSON</h6>
  <p className="muted">Preencha apenas depois de consultar uma página real e
    independente. O FutStats <strong>não abre nem autentica os números
    automaticamente</strong>. Nenhum campo é preenchido com o valor do CSV local.
    A concordância entre dados digitados não confirma um resultado externo.</p>
  <form onSubmit={submit}>
    <label>Previsão a comparar
      <select aria-label="Previsão a comparar" value={key}
       onChange={e=>changeRecord(e.currentTarget.value)} required>
       <option value="">Escolher jogo com resultado CSV local</option>
       {matches.map(m=><option key={m.key} value={m.key}>
        {m.competition} · {m.home} × {m.away} · {m.matchAt.slice(0,10)}
       </option>)}
      </select>
    </label>
    {record&&row&&<>
      <p className="muted">Confronto congelado: {record.home} × {record.away}.
        Os indicadores disponíveis aparecem abaixo; deixe em branco caso
        a segunda fonte não informe o valor.</p>
      <label>URL da segunda fonte consultada (Sofascore, ESPN ou FotMob)
        <input type="url" aria-label="URL da segunda fonte consultada"
          placeholder="https://www.sofascore.com/..."
          value={sourceUrl} onChange={e=>{setSourceUrl(e.currentTarget.value);
          setSuccess('');onClear();}} required />
      </label>
      <label>Data e hora efetivas da consulta (Brasília)
        <input type="datetime-local" step="60"
          aria-label="Data e hora efetivas da consulta (Brasília)"
          value={checkedAtBrasilia}
          onChange={e=>{setCheckedAtBrasilia(e.currentTarget.value);
            setSuccess('');onClear();}} required />
      </label>
      {markets.map(m=><label key={m.id}>
        {m.label} · valor da segunda fonte (vazio = N/D)
        <input type="number" step="1" min="0" inputMode="numeric"
          aria-label={'Valor da segunda fonte: '+m.label}
          value={values[m.id]??''}
          onChange={e=>{
            // Capture the value BEFORE the deferred React state updater runs:
            // SyntheticEvent.currentTarget can be null after this callback.
            const nextValue=e.currentTarget.value;
            setValues(old=>({...old,[m.id]:nextValue}));
            setSuccess('');onClear();
          }}
          placeholder="N/D"/>
      </label>)}
      <label className="daily-good-quick-confirm">
        <input type="checkbox" aria-label="Confirmar transcrição de fonte consultada"
          checked={ack} onChange={e=>setAck(e.currentTarget.checked)} />
        <span>Transcrevi os valores de uma página externa que consultei e
          informei a data e hora reais dessa consulta.</span>
      </label>
      <button type="submit" className="text-button">
        Comparar números informados (sem verificar site)
      </button>
    </>}
  </form>
  {error&&<p role="alert" className="muted">{error}</p>}
  {success&&<p role="status" className="muted">{success}</p>}
  <p className="muted">Comparação exibida nesta sessão, sem salvar automaticamente.
    O dossiê documental JSON ainda pode ser exportado, com SHA-256 para
    integridade LOCAL, não para autenticação externa. A fila permanece PENDENTE.</p>
 </section>;
}
