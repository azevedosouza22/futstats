import {useState} from 'react';
import type {RadarLineGroup,RadarLineMetric} from './radarLineExplorer';

const fmt=(v:number|null)=>v===null?'N/D':v.toLocaleString('pt-BR',{maximumFractionDigits:2});

/** A descriptive, pre-match historical comparison; never a recommendation or V2/V3 signal. */
export default function RadarLineExplorer({groups,frozen=false}:{
  groups:RadarLineGroup[];frozen?:boolean
}){
  const [metric,setMetric]=useState<RadarLineMetric>('corners');
  const group=groups.find(g=>g.metric===metric)??groups[0];
  if(!group)return null;
  return <section className="radar-line-explorer" aria-label="Comparador de linhas históricas">
    <h4>Comparador de linhas · {frozen?'histórico salvo antes do jogo':'prévia histórica'}</h4>
    <label>Estatística
      <select aria-label="Indicador para comparar linhas" value={group.metric}
        onChange={e=>setMetric(e.target.value as RadarLineMetric)}>
        {groups.map(g=><option value={g.metric} key={g.metric}>{g.label}</option>)}
      </select>
    </label>
    <p className="muted">Média na amostra: <b>{fmt(group.historicalMean)}</b> · {group.observed} partidas com dados válidos.
      Últimos cinco jogos anteriores por equipe na competição, sem duplicatas por ID.</p>
    {group.observed<5&&<p className="muted">Amostra pequena: não tire conclusões apenas destas frequências.</p>}
    <div className="radar-line-table-scroll"><table className="analysis-table">
      <caption>Frequência observada para diferentes linhas de {group.label.toLocaleLowerCase('pt-BR')} (jogo completo)</caption>
      <thead><tr><th>Linha</th><th>Jogos acima</th><th>Frequência histórica</th></tr></thead>
      <tbody>{group.lines.map(l=><tr key={l.line}>
        <th>Mais de {fmt(l.line)}</th>
        <td>{group.observed?l.overs+'/'+group.observed:'N/D'}</td>
        <td>{group.observed?(100*l.overs/group.observed).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'N/D'}</td>
      </tr>)}</tbody>
    </table></div>
    <p className="muted">Estas linhas são ilustrativas; não são odds, mercados disponíveis ou sinais V2/V3.
      Frequência histórica não representa probabilidade garantida de acerto.</p>
  </section>;
}
