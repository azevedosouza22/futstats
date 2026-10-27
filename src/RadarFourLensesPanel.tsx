import {useMemo,useState} from 'react';
import type {Data,Period} from './model';
import type {RadarFixture} from './radar';
import {
 analyzeFourLenses,FOUR_LENS_LINES,FOUR_LENS_METRICS,
 type FourLensMetric,type LensSample
} from './radarFourLenses';

const fmt=(v:number|null)=>v===null?'N/D':v.toLocaleString('pt-BR',{maximumFractionDigits:1});
const pct=(v:number|null)=>v===null?'N/D':(100*v).toLocaleString('pt-BR',{maximumFractionDigits:0})+'%';
function SampleRow({title,stats}:{title:string;stats:LensSample}){
 return <div className="radar-numeric-details">
   <strong>{title} · {stats.count} jogo(s)</strong>
   <span>Média total das equipes: {fmt(stats.mean)}</span>
   <span>Over: {stats.over}/{stats.count} ({pct(stats.overRate)})</span>
   <span>Under: {stats.under}/{stats.count} ({pct(stats.underRate)})</span>
 </div>;
}

/** Read-only, descriptive card; does not replace the existing Radar or As Boas. */
export default function RadarFourLensesPanel({data,fixture,homeName,awayName}:{
 data:Data;fixture:RadarFixture;homeName:string;awayName:string;
}){
 const [metric,setMetric]=useState<FourLensMetric>('shots');
 const [period,setPeriod]=useState<Period>('full');
 const [line,setLine]=useState<number>(24.5);
 const report=useMemo(()=>analyzeFourLenses(data,fixture,metric,period,line),
   [data,fixture.home,fixture.away,fixture.date,fixture.competition,metric,period,line]);
 return <section className="radar-line-explorer" aria-label="Comparação em quatro contextos">
   <h4>Comparação inteligente · 4 contextos</h4>
   <p>Veja como <b>{homeName}</b> se comporta em casa e <b>{awayName}</b> fora,
    contra qualquer rival e nos confrontos diretos. Somente jogos anteriores a {fixture.date}.</p>
   <div className="analysis-controls">
     <label>Indicador
       <select aria-label="Indicador dos quatro contextos" value={metric}
         onChange={e=>{
           const selected=e.target.value as FourLensMetric;
           setMetric(selected);setLine(FOUR_LENS_LINES[selected][2]);
         }}>
         {FOUR_LENS_METRICS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
       </select>
     </label>
     <label>Período
       <select aria-label="Período dos quatro contextos" value={period}
         onChange={e=>setPeriod(e.target.value as Period)}>
         <option value="full">Jogo completo</option>
         <option value="first">1º tempo</option>
         <option value="second">2º tempo</option>
       </select>
     </label>
     <label>Linha para observar
       <select aria-label="Linha dos quatro contextos" value={line}
         onChange={e=>setLine(Number(e.target.value))}>
         {FOUR_LENS_LINES[metric].map(n=><option value={n} key={n}>{fmt(n)}</option>)}
       </select>
     </label>
   </div>
   <p className="muted">Temporadas: {report.competition} e{' '}
     {report.previousCompetition??'anterior não identificada nesta competição'}.
     Cada média representa a <b>soma das duas equipes</b>, nunca só as ações de um time.</p>
   <div className="radar-market-cards">
     {report.lenses.map(lens=><article className="radar-market-card" key={lens.id}>
       <h4>{lens.label}</h4>
       <SampleRow title="Últimos 5" stats={lens.last5}/>
       <SampleRow title="Últimos 10" stats={lens.last10}/>
       <details>
         <summary>Separar por temporada</summary>
         <SampleRow title="Temporada atual (até 10)" stats={lens.currentSeason}/>
         <SampleRow title="Temporada anterior (até 10)" stats={lens.previousSeason}/>
       </details>
     </article>)}
   </div>
   <div className="radar-v2-card" role="status">
     <h4>Leitura conjunta · {FOUR_LENS_METRICS.find(m=>m.id===metric)?.label}</h4>
     <p>Projeção descritiva dos dois recortes gerais: <strong>{fmt(report.projection)}</strong></p>
     <p>Linha observada: <b>{fmt(line)}</b> · Consenso histórico:{' '}
       <strong>{report.historicalDirection}</strong></p>
     <p className="muted">{report.reason}</p>
   </div>
   <p className="muted">As duas linhas de confronto direto se referem aos <b>mesmos jogos</b>;
     elas não são evidências independentes. Os confrontos diretos também aparecem nas médias
     gerais. Com menos de três jogos diretos, não os usamos para confirmar ou contrariar
     tendências. Amostras pequenas e duas temporadas não garantem o próximo resultado.</p>
   <p className="muted">Esta é uma leitura histórica experimental, não uma previsão validada,
     nem sinal oficial do V2/V3 ou de “As Boas do Dia”. Nenhuma odd foi analisada.
     A análise não salva ou altera previsões, partidas ou backups.</p>
 </section>;
}
