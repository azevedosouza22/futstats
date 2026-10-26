import {useState} from 'react';
import {COVERAGE_METRICS,COVERAGE_PERIODS} from './leagueCoverageAudit';
import {MIN_VENUE_PERIOD_SAMPLE,type VenueTeamProfile,type VenuePeriodProfile}
 from './radarVenuePeriodProfile';
import {exportVenueTrailCsv,type VenueTrailReport,type VenueTrailGroup} from './radarVenueSampleTrace';

const periodLabel={full:'Jogo completo',first:'1º tempo',second:'2º tempo'};
const fmt=(n:number|null)=>n===null?'N/D':n.toLocaleString('pt-BR',{maximumFractionDigits:2});
function TeamVenueTable({team,name}:{team:VenueTeamProfile;name:string}){
 return <section className="radar-venue-side" aria-label={name}>
   <h6>{name}: {team.venueCount}/{team.recentCount} jogos do mando</h6>
   <p className="muted">Apenas partidas em que este clube jogou
     {' '}{team.side==='home'?'em casa':'fora'}, entre seus cinco jogos
     anteriores desta competição. {team.excluded} partida(s) não confiável(is)
     excluída(s). “Feitos” são os valores do clube; “Sofridos” são do adversário.</p>
   <div className="radar-venue-table-scroll">
     <table className="analysis-table">
       <thead><tr><th>Indicador</th><th>Período</th><th>Feitos</th>
         <th>Sofridos</th><th>Amostra</th></tr></thead>
       <tbody>{COVERAGE_METRICS.flatMap(metric=>COVERAGE_PERIODS.map(period=>{
         const c=team.cells.find(cell=>cell.metric===metric&&cell.period===period)!;
         return <tr key={metric+'-'+period}>
           <th scope="row">{c.label}</th><td>{periodLabel[period]}</td>
           <td>{fmt(c.forMean)}</td><td>{fmt(c.againstMean)}</td>
           <td>{c.valid}/{team.venueCount}
             {(c.missing>0||c.conflicts>0)&&<small>
               {c.missing} N/D · {c.conflicts} conflito(s)
             </small>}
           </td>
         </tr>;
       }))}</tbody>
     </table>
   </div>
 </section>;
}
function SourceTrail({group,club}:{group:VenueTrailGroup;club:string}){
 return <section className="radar-venue-trail-side" aria-label={'Partidas da amostra: '+club}>
  <h6>{club} · {group.included}/{group.selected} incluídos no mando</h6>
  <ol>{group.rows.map((m,i)=><li key={m.matchId+'-'+i}>
   <b>{m.date}</b> · {m.opponents} · <strong>
     {m.disposition==='included'?'INCLUÍDO':
      m.disposition==='different_venue'?'FORA DO MANDO':'EXCLUÍDO'}
    </strong>
    <small>{m.reason}</small>
    {m.disposition==='included'&&<small>
      {m.missingCells} campo(s) N/D · {m.conflictingMetrics} indicador(es) em conflito
    </small>}
    {m.sourceUrl
     ?<a href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
       Abrir referência Flashscore informada (não verificada)</a>
     :<small>Fonte individual: N/D ou URL inválida</small>}
   </li>)}</ol>
 </section>;
}
export default function RadarVenuePeriodPanel({report,homeName,awayName,trace}:{
 report:VenuePeriodProfile;homeName:string;awayName:string;
 trace:VenueTrailReport|null;
}){
 const [expanded,setExpanded]=useState(false);
 function exportTrace(){
  if(!trace||!trace.consistent)return;
  const value=exportVenueTrailCsv(trace);
  const url=URL.createObjectURL(new Blob([value],{type:'text/csv;charset=utf-8'}));
  try{
   const link=document.createElement('a');link.href=url;
   link.download='futstats-rastro-amostras-mando.csv';
   document.body.appendChild(link);link.click();link.remove();
  }finally{URL.revokeObjectURL(url);}
 }

 return <section className="radar-venue-period" aria-label="Comparação por mando de campo e períodos">
   <button type="button" className="text-button" aria-expanded={expanded}
      onClick={()=>setExpanded(v=>!v)}>
     {expanded?'Ocultar':'Conferir'} desempenho em casa e fora · 4 indicadores e tempos
   </button>
   {expanded&&<>
     <p className="muted">Comparação descritiva: recorte de mando aplicado
       DEPOIS de escolher os últimos cinco jogos anteriores de cada clube,
       na mesma competição e temporada. Não substitui V2/V3.
       Com menos de {MIN_VENUE_PERIOD_SAMPLE} partidas válidas por campo,
       a média fica <strong>N/D</strong>, mesmo que a contagem exista.</p>
     <TeamVenueTable team={report.home} name={homeName+' · mandante em casa'}/>
     <TeamVenueTable team={report.away} name={awayName+' · visitante fora'}/>
     {trace&&<details className="radar-venue-trail"
        aria-label="Rastrear partidas históricas das médias por mando">
       <summary>Conferir partidas usadas nas médias e exclusões</summary>
       {!trace.consistent
        ?<p role="alert">A amostra exibida diverge do cálculo: rastro e
          exportação bloqueados para evitar informação incorreta.</p>
        :<>
          <p className="muted">Mesmos cinco jogos anteriores de cada clube
            na competição. Cada partida mostra por que entrou ou ficou fora
            do recorte de mando. Não procuramos outros jogos para
            completar a amostra. Fonte individual é somente uma referência
            cadastrada e não confirmação independente.</p>
          <button type="button" className="text-button"
           onClick={exportTrace}>Exportar rastro das amostras (CSV)</button>
          <SourceTrail group={trace.home} club={homeName+' (casa)'}/>
          <SourceTrail group={trace.away} club={awayName+' (fora)'}/>
          <p className="muted">Verificação externa: PENDENTE.
            Nenhum resultado de fonte foi conferido automaticamente;
            o relatório não altera o histórico, os backups ou a previsão.</p>
         </>}
      </details>}
     <p className="muted">Os campos totais e dos tempos são independentes.
       Não reconstruímos períodos ausentes nem confundimos zero com N/D.
       Os jogos têm amostras separadas para cada clube. Nenhuma porcentagem
       é probabilidade de acerto ou indicação de aposta.
       Nenhum histórico ou previsão foi alterado.</p>
   </>}
 </section>;
}
