import {useMemo,useState} from 'react';
import type {Data} from './model';
import type {WorkAnalysisMatch} from './workAnalysis';
import type {GapSourceStatus} from './statGapSource';
import StatSupplementPreflight from './StatSupplementPreflight';
import {
  prioritizeMainGaps,prioritizeWorkGaps,
  type GapQueueItem,type GapPriority,type MissingField
} from './statGapQueue';

const metric:Record<MissingField['metric'],string>={
  goals:'Gols',shots:'Finalizações',target:'Chutes no gol',corners:'Escanteios'
};
const period:Record<MissingField['period'],string>={
  full:'jogo completo',first:'1º tempo',second:'2º tempo'
};
const side:Record<MissingField['side'],string>={home:'mandante',away:'visitante'};
const priorityLabels:Record<GapPriority,string>={
  'corners-full':'Escanteios · jogo completo',
  'corners-period':'Escanteios · 1º/2º tempo',
  'source-review':'Fonte precisa de revisão',
  other:'Outros indicadores'
};
const priorityOrder:Record<GapPriority,number>={
  'corners-full':0,'corners-period':1,'source-review':2,other:3
};
const sourceLabels:Record<GapSourceStatus,string>={
  'linked-unchecked':'Link cadastrado · consulta pendente',
  'missing-source':'Fonte não cadastrada · manter N/D',
  'invalid-source':'Link incompatível · corrigir origem',
  'needs-review':'Fonte divergente · revisar antes de usar'
};
function Task({item,onSelect}:{item:GapQueueItem;onSelect:(item:GapQueueItem)=>void}){
  const remaining=item.missing.length;
  return <article className="stat-gap-item">
    <header>
      <strong>{item.label}</strong>
      <small>{item.date} · {item.competition} · ID {item.matchId}</small>
    </header>
    <p className="stat-gap-priority">
      {priorityLabels[item.priority]} · {item.source==='main'?'Histórico principal':'Pesquisa Work'}
    </p>
    <p className={'stat-gap-source-status stat-gap-source-'+item.sourceStatus}>
      {sourceLabels[item.sourceStatus]}
      {item.sourceId?' · Fonte ID '+item.sourceId:''}
    </p>
    {item.reviewReason&&<p className="stat-gap-review">
      {item.reviewReason}. Confira o registro original antes de qualquer correção.
    </p>}
    {remaining>0&&<>
      <p className="muted">{remaining} {remaining===1?'campo ausente':'campos ausentes'} (N/D):</p>
      <ul>{item.missing.slice(0,8).map(f=><li key={f.metric+'|'+f.period+'|'+f.side}>
        {metric[f.metric]} · {period[f.period]} · {side[f.side]}
      </li>)}</ul>
      {remaining>8&&<p className="muted">Mais {remaining-8} campos ausentes neste jogo.</p>}
    </>}
    {item.sourceStatus==='linked-unchecked'&&<button type="button"
      className="text-button" onClick={()=>onSelect(item)}>
      Pré-validar complemento CSV (sem salvar)
    </button>}
    {item.sourceUrl
      ?<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
        Abrir referência cadastrada (dados ainda não confirmados)
      </a>
      :<p className="muted">Não há URL de origem utilizável neste registro.
        {item.sourceStatus==='invalid-source'
          ?' A URL não coincide com o ID ou a origem permitida; confira os metadados antes de pesquisar.'
          :' Localize e confira uma referência real antes de qualquer correção.'}
        {' '}Estatísticas ausentes continuam N/D.
      </p>}
  </article>;
}

/**
 * Prioritized view, not a data-collection button. No writes, automatic
 * guesses, external requests, or records altered when filters change.
 */
export default function StatGapQueue({data,workMatches,today}:{
  data:Data;workMatches:readonly WorkAnalysisMatch[]|null;today:string;
}){
  const [origin,setOrigin]=useState<'all'|'main'|'work'>('all');
  const [focus,setFocus]=useState<'corners'|'review'|'all'>('corners');
  const [sourceFilter,setSourceFilter]=useState<'all'|'linked'|'review'|'unlinked'>('all');
  const [selectedKey,setSelectedKey]=useState<string|null>(null);
  const tasks=useMemo(()=>{
    const main=prioritizeMainGaps(data,today);
    const work=workMatches?prioritizeWorkGaps(workMatches,today):[];
    return [...main,...work].sort((a,b)=>
      priorityOrder[a.priority]-priorityOrder[b.priority]||
      b.date.localeCompare(a.date)||a.key.localeCompare(b.key));
  },[data,workMatches,today]);
  const corners=tasks.filter(t=>
    t.priority==='corners-full'||t.priority==='corners-period').length;
  const reviews=tasks.filter(t=>t.reviewReason!==null).length;
  const linked=tasks.filter(t=>t.sourceStatus==='linked-unchecked').length;
  const unlinked=tasks.filter(t=>t.sourceStatus==='missing-source'||
    t.sourceStatus==='invalid-source').length;
  const filtered=tasks.filter(t=>
    (origin==='all'||t.source===origin)&&
    (sourceFilter==='all'||(sourceFilter==='linked'
      ?t.sourceStatus==='linked-unchecked'
      :sourceFilter==='review'
        ?t.reviewReason!==null||t.sourceStatus==='invalid-source'
        :t.sourceStatus==='missing-source'||t.sourceStatus==='invalid-source'))&&
    (focus==='all'||(focus==='review'?t.reviewReason!==null:
      t.priority==='corners-full'||t.priority==='corners-period')));
  const shown=filtered.slice(0,25);
  const selected=tasks.find(t=>t.key===selectedKey);
  return <section className="stat-gap-queue" aria-label="Fila de lacunas de estatísticas">
    <h4>Fila de conferência · partidas já cadastradas</h4>
    <p className="muted">{tasks.length} partidas com pendências na base disponível
      {' '}· {corners} com falta de escanteios · {reviews} com divergências.</p>
    <p className="muted">{linked} com link cadastrado não conferido · {unlinked} sem referência utilizável.</p>
    <p className="muted">Esta fila apenas identifica o que precisa ser pesquisado.
      Não coleta, altera ou completa números automaticamente. A URL não prova que
      os dados existam ou estejam acessíveis. Até conferência, manter N/D.</p>
    <div className="stat-gap-filters">
      <label>Origem da partida
        <select aria-label="Filtrar origem da pendência" value={origin}
          onChange={e=>setOrigin(e.target.value as typeof origin)}>
          <option value="all">Ambas, separadas</option>
          <option value="main">Histórico principal</option>
          <option value="work">Pesquisa Work</option>
        </select>
      </label>
      <label>Tipo de pendência
        <select aria-label="Filtrar tipo de pendência" value={focus}
          onChange={e=>setFocus(e.target.value as typeof focus)}>
          <option value="corners">Escanteios primeiro</option>
          <option value="review">Revisar fontes</option>
          <option value="all">Todas as estatísticas</option>
        </select>
      </label>
      <label>Conferência da fonte
        <select aria-label="Filtrar conferência da fonte" value={sourceFilter}
          onChange={e=>setSourceFilter(e.target.value as typeof sourceFilter)}>
          <option value="all">Todas as referências</option>
          <option value="linked">Links cadastrados sem conferência</option>
          <option value="review">Divergências ou links incompatíveis</option>
          <option value="unlinked">Sem URL utilizável</option>
        </select>
      </label>
    </div>
    <p className="muted">{filtered.length} pendências nesse filtro.
      {filtered.length>shown.length?' Exibindo as primeiras 25.':''}</p>
    {shown.length===0
      ?<p className="muted">Nenhuma pendência identificada neste filtro.
        Isso não comprova cobertura total dos campeonatos.</p>
      :<div className="stat-gap-items">{shown.map(t=><Task key={t.key} item={t}
        onSelect={item=>setSelectedKey(item.key)}/>)}</div>}
    {selected&&<StatSupplementPreflight key={selected.key} data={data}
      workMatches={workMatches} task={selected} onCancel={()=>setSelectedKey(null)}/>}
  </section>;
}
