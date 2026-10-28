import {useState} from 'react';
import type {IndividualLens,IndividualMean,TeamOnlyReport} from './teamOnlyPeriods';

const fmt=(v:number|null)=>v===null?'N/D':
 v.toLocaleString('pt-BR',{maximumFractionDigits:1});
const periodName:Record<'first'|'second'|'full',string>={
 first:'1º tempo',second:'2º tempo',full:'Jogo inteiro'
};
function MeanCell({name,mean}:{name:string;mean:IndividualMean}){
 return <div className="team-period-cell">
  <small>{name}</small>
  <strong>{fmt(mean.mean)}</strong>
  <small>{mean.count} {mean.count===1?'jogo válido':'jogos válidos'}</small>
 </div>;
}
function IndividualCard({lens,title,windowSize}:{lens:IndividualLens;title:string;windowSize:5|10}){
 return <article className="team-only-card">
  <h4>{title}</h4>
  <div className="team-period-values">
   {lens.periods.map(row=><MeanCell key={row.period} name={periodName[row.period]}
    mean={windowSize===5?row.last5:row.last10}/>)}
  </div>
 </article>;
}
export default function TeamOnlyCards({report,home,away}:{
 report:TeamOnlyReport;home:string;away:string
}){
 const [windowSize,setWindowSize]=useState<5|10>(5);
 const [homeAny,awayAny,homeDirect,awayDirect]=report.lenses;
 return <section className="team-only-panel" aria-label="Médias somente das equipes">
  <div className="team-only-head">
   <div><span className="smart-kicker">ESTATÍSTICAS INDIVIDUAIS</span>
    <h3>Somente cada equipe</h3>
    <p>Produção do próprio time, sem somar a do adversário.</p></div>
   <div className="team-window-select" role="group" aria-label="Quantidade de jogos">
    <button type="button" aria-pressed={windowSize===5} className={windowSize===5?'active':''}
      onClick={()=>setWindowSize(5)}>5 jogos</button>
    <button type="button" aria-pressed={windowSize===10} className={windowSize===10?'active':''}
      onClick={()=>setWindowSize(10)}>10 jogos</button>
   </div>
  </div>
  <div className="team-only-grid">
   <IndividualCard title={home+' · jogando em casa'} lens={homeAny} windowSize={windowSize}/>
   <IndividualCard title={away+' · jogando fora'} lens={awayAny} windowSize={windowSize}/>
  </div>
  <details className="smart-direct-details team-only-direct">
   <summary>Ver médias individuais nos confrontos diretos</summary>
   <p>Apenas partidas em que {home} foi mandante e {away} visitante.
     São os mesmos jogos vistos por lados diferentes.</p>
   <div className="team-only-grid">
    <IndividualCard lens={homeDirect} title={home+' contra '+away} windowSize={windowSize}/>
    <IndividualCard lens={awayDirect} title={away+' contra '+home} windowSize={windowSize}/>
   </div>
  </details>
  <p className="team-only-disclaimer">Essas médias ajudam a estudar mercados de desempenho
    de uma equipe, que são diferentes dos mercados de total da partida. Cada
    período possui sua própria contagem de jogos válidos. N/D indica ausência
    de registros; não significa zero. São ocorrências históricas, não previsões.</p>
 </section>;
}
