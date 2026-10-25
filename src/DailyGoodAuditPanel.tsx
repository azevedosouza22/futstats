import {useMemo} from 'react';
import type {Data} from './model';
import type {SavedRadarRecord} from './radarRecords';
import {auditDailyGoodPicks} from './dailyGoodAudit';

const fmt=(n:number|null)=>n===null?'N/D':n.toLocaleString('pt-BR',{maximumFractionDigits:1});
const ratio=(a:number,b:number)=>b?a+'/'+b+' ('+(100*a/b).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%)':'N/D';
const labels={
 legacy:'Registro Radar geral (não atribuído à lista)',
 invalid:'Snapshot sem comprovação íntegra',
 late:'Registrado após o início',
 future:'Aguardando jogo',
 waiting:'Aguardando resultado',
 ambiguous:'Partida ou registro ambíguo',
 source_missing:'Resultado sem fonte CSV validável',
 scored:'Comparação disponível'
};
export default function DailyGoodAuditPanel({data,records}:{
 data:Data;records:readonly SavedRadarRecord[];
}){
 const report=useMemo(()=>auditDailyGoodPicks(data,records),[data,records]);
 return <section aria-label="Validação prospectiva As Boas do Dia" className="daily-good-audit">
  <h4>Validação de “As Boas do Dia” · experimental</h4>
  <p className="muted">Somente escolhas feitas na própria lista e salvas antes do início
   entram na avaliação. O sistema não atribui à lista previsões antigas ou criadas
   diretamente no Radar. Nenhuma previsão congelada é recalculada.</p>
  <p className="muted">{report.attributed} registro(s) com identificação da lista ·
   {' '}{report.scoredFixtures} confronto(s) com resultado e ao menos um indicador informado.
   {' '}Ausência de amostra aparece como N/D, nunca como taxa de acerto.</p>
  {report.leagues.length===0?<p className="daily-good-empty">
    Sem registros prospectivos atribuíveis a “As Boas do Dia” até agora.
    Os registros antigos continuam preservados, mas não podem comprovar o desempenho da lista.
   </p>:<>
   <div className="radar-market-table"><table className="analysis-table">
    <caption>Comparação por campeonato · mesmas partidas e indicadores disponíveis</caption>
    <thead><tr><th>Campeonato</th><th>Jogos / sinais</th><th>V2/V3 concordantes</th><th>Referência sempre Over</th><th>Referência média pré-jogo</th></tr></thead>
    <tbody>{report.leagues.map(l=><tr key={l.league}>
     <th>{l.league}<small>{l.snapshots} registro(s), {l.missingMarkets} indicador(es) N/D</small></th>
     <td>{l.scoredFixtures} / {l.scoredMarkets}</td>
     <td>{ratio(l.picks.hits,l.picks.observed)}</td>
     <td>{ratio(l.constantOver.hits,l.constantOver.observed)}</td>
     <td>{ratio(l.historicalBaseline.hits,l.historicalBaseline.observed)}</td>
    </tr>)}</tbody>
   </table></div>
  </>}
  {report.attributed>0&&<details className="fpl-pilot-disclosure">
   <summary>Conferir cada indicação registrada ({report.attributed})</summary>
   {report.rows.filter(r=>r.status!=='legacy').map(row=><article key={row.key} className="fpl-pilot-game">
    <strong>{row.home} × {row.away}</strong> <small>{row.matchAt.replace('T',' · ')} (Brasília)</small>
    <p className="muted">{labels[row.status]} · {row.reason}</p>
    {row.sourceUrl&&<p><a href={row.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir fonte cadastrada do resultado</a></p>}
    {row.markets.length>0&&<div className="radar-market-table"><table className="analysis-table">
      <thead><tr><th>Indicador</th><th>Sinal congelado</th><th>Resultado</th><th>Veredito</th><th>Amostra anterior</th></tr></thead>
      <tbody>{row.markets.map(m=><tr key={m.id}>
       <th>{m.label}</th><td>{m.direction} {fmt(m.line)}</td>
       <td>{fmt(m.actual)}</td><td>{m.v3}</td>
       <td>{m.historicalSample} jogos, {m.leagueSample} na liga</td>
      </tr>)}</tbody>
     </table></div>}
   </article>)}
  </details>}
  <p className="muted">Leitura dos dados do Histórico principal: fontes CSV cadastradas e
   validadas estruturalmente, sem conferência independente do conteúdo na internet.
   Resultados não documentados, divergentes ou incompletos não geram acertos.
   Comparação descritiva, com amostras pequenas e sinais correlacionados; não indica
   probabilidade real de acerto, rentabilidade ou recomendação de aposta.</p>
 </section>;
}
