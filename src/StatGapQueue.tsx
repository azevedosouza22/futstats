import {useMemo,useState} from 'react';
import type {Data} from './model';
import type {WorkAnalysisMatch} from './workAnalysis';
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
function Task({item}:{item:GapQueueItem}){
  const remaining=item.missing.length;
  return <article className="stat-gap-item">
    <header>
      <strong>{item.label}</strong>
      <small>{item.date} · {item.competition} · ID {item.matchId}</small>
    </header>
    <p className="stat-gap-priority">
      {priorityLabels[item.priority]} · {item.source==='main'?'Histórico principal':'Pesquisa Work'}
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
    {item.sourceUrl
      ?<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
        Conferir fonte Flashscore já cadastrada
      </a>
      :<p className="muted">Sem link Flashscore confiável cadastrado. Localizar a fonte antes de completar os dados.</p>}
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
  const tasks=useMemo(()=>{
    const main=prioritizeMainGaps(data,today);
    const work=workMatches?prioritizeWorkGaps(workMatches,today):[];
    return [...main,...work].sort((a,b)=>
      priorityOrder[a.priority]-priorityOrder[b.priority]||
      b.date.localeCompare(a.date)||a.key.localeCompare(b.key));
  },[data,workMatches,today]);
  const corners=tasks.filter(t=>
    t.priority==='corners-full'||t.priority==='corners-period').length;
  const reviews=tasks.filter(t=>t.priority==='source-review').length;
  const filtered=tasks.filter(t=>
    (origin==='all'||t.source===origin)&&
    (focus==='all'||(focus==='review'?t.priority==='source-review':
      t.priority==='corners-full'||t.priority==='corners-period')));
  const shown=filtered.slice(0,25);
  return <section className="stat-gap-queue" aria-label="Fila de lacunas de estatísticas">
    <h4>Fila de conferência · partidas já cadastradas</h4>
    <p className="muted">{tasks.length} partidas com pendências na base disponível
      {' '}· {corners} com falta de escanteios · {reviews} com fonte para revisão.</p>
    <p className="muted">Esta fila apenas identifica o que precisa ser pesquisado.
      Não coleta, altera ou completa números automaticamente. Prioriza escanteios do jogo
      completo, depois dos tempos e outras pendências.</p>
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
    </div>
    <p className="muted">{filtered.length} pendências nesse filtro.
      {filtered.length>shown.length?' Exibindo as primeiras 25.':''}</p>
    {shown.length===0
      ?<p className="muted">Nenhuma pendência identificada neste filtro.
        Isso não comprova cobertura total dos campeonatos.</p>
      :<div className="stat-gap-items">{shown.map(t=><Task key={t.key} item={t}/>)}</div>}
  </section>;
}
