import {useState} from 'react';
import type {IndividualLens,IndividualMean,TeamOnlyReport} from './teamOnlyPeriods';

const fmt=(v:number|null)=>v===null?'N/D':
 v.toLocaleString('pt-BR',{maximumFractionDigits:1});
const get=(lens:IndividualLens,period:'first'|'second'|'full',windowSize:5|10):IndividualMean=>{
 const row=lens.periods.find(item=>item.period===period);
 return row?(windowSize===5?row.last5:row.last10):{mean:null,count:0};
};
/** The 10-game option must not promise new information when both clubs have <=5 records. */
export function individualWindowAvailability(report:TeamOnlyReport){
 const [home,away]=report.lenses;
 const homeCount=get(home,'full',10).count;
 const awayCount=get(away,'full',10).count;
 return {homeCount,awayCount,hasExtendedSample:homeCount>5||awayCount>5};
}
function IndividualCard({lens,title,windowSize}:{lens:IndividualLens;title:string;windowSize:5|10}){
 const full=get(lens,'full',windowSize);
 const first=get(lens,'first',windowSize);
 const second=get(lens,'second',windowSize);
 return <article className="team-summary-card">
  <div className="team-summary-title">{title}</div>
  <div className="team-summary-main">
   <div><span>Média por jogo</span>
    <strong>{fmt(full.mean)}</strong></div>
   <small>{full.count===0?'Sem jogos válidos':
    full.count+' '+(full.count===1?'jogo válido':'jogos válidos')}</small>
  </div>
  {full.count<5&&<p className="team-summary-small-sample">
   {full.count===0?'Ainda não existem jogos suficientes nesta seleção.':
     'Amostra pequena: apenas '+full.count+' jogos disponíveis.'}</p>}
  <details className="team-summary-times">
    <summary>Ver médias do 1º e 2º tempo</summary>
    <div className="team-summary-time-grid">
      <div><span>1º tempo</span><strong>{fmt(first.mean)}</strong>
        <small>{first.count} jogos</small></div>
      <div><span>2º tempo</span><strong>{fmt(second.mean)}</strong>
        <small>{second.count} jogos</small></div>
    </div>
  </details>
 </article>;
}
export default function TeamOnlyCards({report,home,away}:{
 report:TeamOnlyReport;home:string;away:string
}){
 const [selectedWindow,setSelectedWindow]=useState<5|10>(5);
 const [homeAny,awayAny,homeDirect,awayDirect]=report.lenses;
 const availability=individualWindowAvailability(report);
 const windowSize=availability.hasExtendedSample?selectedWindow:5;
 return <section className="team-only-panel team-summary-panel" aria-label="Médias somente das equipes">
  <div className="team-summary-heading">
   <div><span className="smart-kicker">MÉDIAS INDIVIDUAIS</span>
    <h3>Finalizações e ações de cada time</h3>
    <p>Somente o que cada equipe fez, sem somar o adversário.</p></div>
  </div>
  <div className="team-summary-window">
   <span>Considerar até</span>
   <div className="team-window-select" role="group" aria-label="Janela de jogos disponíveis">
     <button type="button" aria-pressed={windowSize===5}
       className={windowSize===5?'active':''} onClick={()=>setSelectedWindow(5)}>
       5 jogos</button>
     <button type="button" aria-pressed={windowSize===10}
       className={windowSize===10?'active':''}
       disabled={!availability.hasExtendedSample}
       title={!availability.hasExtendedSample?'Não há mais de 5 jogos por mando nesta seleção':undefined}
       onClick={()=>setSelectedWindow(10)}>10 jogos</button>
   </div>
  </div>
  {!availability.hasExtendedSample&&<p className="team-window-note" role="status">
   A opção de 10 jogos ficará disponível quando houver mais partidas.
   Hoje temos {availability.homeCount} jogos de {home} em casa e
   {' '}{availability.awayCount} de {away} fora. Por isso, a média não mudaria.
  </p>}
  <div className="team-summary-grid">
   <IndividualCard title={home+' · em casa'} lens={homeAny} windowSize={windowSize}/>
   <IndividualCard title={away+' · fora'} lens={awayAny} windowSize={windowSize}/>
  </div>
  <details className="team-summary-direct">
   <summary>Confrontos diretos — médias de cada time</summary>
   <div className="team-summary-grid">
    <IndividualCard lens={homeDirect} title={home+' contra '+away} windowSize={windowSize}/>
    <IndividualCard lens={awayDirect} title={away+' contra '+home} windowSize={windowSize}/>
   </div>
   <p>Os dois clubes compartilham o mesmo histórico de confrontos diretos.</p>
  </details>
  <p className="team-summary-footnote">Jogo completo e tempos usam suas respectivas amostras.
    N/D significa ausência de dados, não zero. Médias históricas não garantem resultados.</p>
 </section>;
}
