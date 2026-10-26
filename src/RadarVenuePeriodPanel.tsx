import {useState} from 'react';
import {COVERAGE_METRICS,COVERAGE_PERIODS} from './leagueCoverageAudit';
import {MIN_VENUE_PERIOD_SAMPLE,type VenueTeamProfile,type VenuePeriodProfile}
 from './radarVenuePeriodProfile';

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
export default function RadarVenuePeriodPanel({report,homeName,awayName}:{
 report:VenuePeriodProfile;homeName:string;awayName:string;
}){
 const [expanded,setExpanded]=useState(false);
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
     <p className="muted">Os campos totais e dos tempos são independentes.
       Não reconstruímos períodos ausentes nem confundimos zero com N/D.
       Os jogos têm amostras separadas para cada clube. Nenhuma porcentagem
       é probabilidade de acerto ou indicação de aposta.
       Nenhum histórico ou previsão foi alterado.</p>
   </>}
 </section>;
}
