import {useState} from 'react';
import type {Data} from './model';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {GapQueueItem} from './statGapQueue';
import {preflightStatSupplement,type PreflightResult} from './statSupplementPreflight';
import {parseWorkResearchCsv} from './workCsv';
import {isWork55Header} from './europeWorkResearch';

/**
 * Explicit local-only CSV inspection. Does NOT invoke mergeWorkCsv, store APIs,
 * fetch or upload. Discards CSV text as soon as the inspection finishes.
 */
export default function StatSupplementPreflight({data,workMatches,task,onCancel}:{
  data:Data;workMatches:readonly WorkAnalysisMatch[]|null;
  task:GapQueueItem;onCancel:()=>void;
}){
  const [result,setResult]=useState<PreflightResult|null>(null);
  const [error,setError]=useState('');
  const [checking,setChecking]=useState(false);
  async function check(file:File|undefined){
    if(!file)return;
    setError('');setResult(null);setChecking(true);
    try{
      if(file.size>2_000_000||!file.name.toLowerCase().endsWith('.csv'))
        throw Error('Selecione um arquivo CSV de até 2 MB.');
      const raw=await file.text();
      if(!isWork55Header(raw))
        throw Error('Este pré-validador aceita somente o CSV original do FutStats com 55 colunas.');
      const rows=parseWorkResearchCsv(raw);
      if(rows.length!==1)
        throw Error('Utilize um CSV com exatamente uma partida para conferir este registro.');
      setResult(preflightStatSupplement(data,workMatches,task,rows[0]));
    }catch(e){
      setError(e instanceof Error?e.message:'Não foi possível conferir o CSV.');
    }finally{setChecking(false);}
  }
  return <section className="stat-supplement-preflight"
    aria-label="Pré-validação local de estatísticas" role="region">
    <h5>Conferir complemento CSV · somente leitura</h5>
    <p className="muted"><b>{task.label}</b> · {task.competition} · ID {task.matchId}</p>
    <p className="muted">Selecione um CSV original de 55 colunas com uma partida.
      Os dados serão conferidos apenas neste aparelho, sem upload, importação,
      substituição de valores ou registro de previsão.
    </p>
    <label>Arquivo para conferência local
      <input type="file" accept=".csv,text/csv" disabled={checking}
        onChange={e=>{const file=e.currentTarget.files?.[0];
          void check(file);e.currentTarget.value='';}}/>
    </label>
    {checking&&<p className="muted" role="status">Conferindo estrutura e consistência…</p>}
    {error&&<p className="alert" role="alert">{error}</p>}
    {result&&<div className="stat-supplement-result" role="status">
      <strong>{result.state==='blocked'?'Complemento bloqueado':
        result.state==='no-new-fields'?'Nenhum campo novo':'Estrutura consistente · conferir a fonte'}</strong>
      {result.problems.length>0&&<ul>{result.problems.map((p,i)=><li key={i}>{p}</li>)}</ul>}
      {result.state!=='blocked'&&<p>
        {result.fillable} campos potencialmente complementáveis ·
        {' '}{result.identical} valores iguais aos já existentes ·
        {' '}{result.skippedMissing} campos ausentes no CSV (N/D).
      </p>}
      <p className="muted"><b>Nenhuma alteração realizada.</b>
        {' '}A pré-validação não autentica os números apresentados pela fonte.
        Eles só poderão ser considerados após uma conferência independente,
        uma revisão de segurança e sua autorização para a etapa de gravação.
      </p>
    </div>}
    <button type="button" className="text-button" onClick={onCancel}>
      Fechar conferência
    </button>
  </section>;
}
