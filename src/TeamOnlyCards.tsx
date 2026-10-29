import {useState} from 'react';
import type {DirectVenueMode} from './smartDirectH2H';
import {
 individualLineFrequency,suggestedIndividualLine,suggestedIndividualWindowLine,
 type IndividualLens,type IndividualMean,type TeamFrequency,type TeamOnlyReport
} from './teamOnlyPeriods';

const fmt=(v:number|null)=>v===null?'N/D':v.toLocaleString('pt-BR',{maximumFractionDigits:1});
const pct=(v:number|null)=>v===null?'N/D':Math.round(v*100)+'%';
const get=(lens:IndividualLens,period:'first'|'second'|'full',windowSize:5|10):IndividualMean=>{
 const row=lens.periods.find(item=>item.period===period);
 return row?(windowSize===5?row.last5:row.last10):{mean:null,count:0,observations:[]};
};
export function individualWindowAvailability(report:TeamOnlyReport){
 const [home,away]=report.lenses;
 const homeCount=get(home,'full',10).count,awayCount=get(away,'full',10).count;
 return {homeCount,awayCount,hasExtendedSample:homeCount>5||awayCount>5};
}
function readableLine(input:string):number|null{
 const value=Number(input.trim().replace(',','.'));
 return input.trim()&&Number.isFinite(value)&&value>=0.5&&value<=999.5&&
  Number.isInteger(value-0.5)?value:null;
}
function FrequencyRow({line,frequency}:{line:number;frequency:TeamFrequency}){
 const n=frequency.count;
 return <div className="team-simple-frequency" aria-label={'Linha '+fmt(line)}>
   <span className="team-simple-line">Linha {fmt(line)} · {n} {n===1?'jogo':'jogos'}</span>
   <div className="team-simple-pairs">
     <span>Over <b>{n?frequency.over+'/'+n:'N/D'}</b> <em>{pct(frequency.overRate)}</em></span>
     <span>Under <b>{n?frequency.under+'/'+n:'N/D'}</b> <em>{pct(frequency.underRate)}</em></span>
   </div>
 </div>;
}
function PeriodCompactRow({title,sample}:{title:string;sample:IndividualMean}){
 const line=suggestedIndividualLine(sample.mean);
 return <div className="team-period-compact-row">
   <div className="team-period-compact-head">
     <strong>{title}</strong>
     <span>Média {fmt(sample.mean)}</span>
   </div>
   {line===null?<small>N/D · sem amostra</small>:
      <FrequencyRow line={line} frequency={individualLineFrequency(sample,line)}/>}
 </div>;
}
function IndividualCard({lens,title,windowSize}:{lens:IndividualLens;title:string;windowSize:5|10}){
 const [lineDraft,setLineDraft]=useState('');
 const full=get(lens,'full',windowSize),first=get(lens,'first',windowSize),
  second=get(lens,'second',windowSize);
 const suggested=suggestedIndividualWindowLine(lens,'full',windowSize);
 const changed=lineDraft.trim().length>0;
 const line=changed?readableLine(lineDraft):suggested;
 return <article className="team-summary-card">
   <h4 className="team-summary-title">{title}</h4>
   <div className="team-summary-main">
     <div><span>Média · jogo completo</span><strong>{fmt(full.mean)}</strong></div>
     <small>{full.count} {full.count===1?'jogo válido':'jogos válidos'}</small>
   </div>
   {full.count<5&&<p className="team-summary-small-sample">
     {full.count?'Amostra pequena; histórico ainda limitado.':'Sem jogos válidos nesta seleção.'}
   </p>}
   <div className="team-individual-full-line">
     <label>Linha do jogo completo
       <input aria-label={'Linha individual para '+title} type="text" inputMode="decimal"
         value={changed?lineDraft:fmt(suggested)} placeholder="Ex.: 12,5"
         onChange={e=>setLineDraft(e.target.value)}/>
     </label>
     {changed&&<button type="button" onClick={()=>setLineDraft('')}>Restaurar</button>}
   </div>
   {line!==null?<FrequencyRow line={line} frequency={individualLineFrequency(full,line)}/>:
    <p className="team-window-note" role="alert">{changed
      ?'Linha inválida: use número terminado em ,5.':'Sem dados para calcular a frequência.'}</p>}
   <div className="team-period-compact-list" aria-label={'1º e 2º tempo de '+title}>
     <PeriodCompactRow title="1º tempo" sample={first}/>
     <PeriodCompactRow title="2º tempo" sample={second}/>
   </div>
 </article>;
}
export default function TeamOnlyCards({report,home,away,directVenue,onDirectVenueChange}:{
 report:TeamOnlyReport;home:string;away:string;
 directVenue:DirectVenueMode;onDirectVenueChange:(mode:DirectVenueMode)=>void
}){
 const [selectedWindow,setSelectedWindow]=useState<5|10>(5);
 const [homeAny,awayAny,homeDirect,awayDirect]=report.lenses;
 const availability=individualWindowAvailability(report);
 const windowSize=availability.hasExtendedSample?selectedWindow:5;
 const metric=({goals:'Gols',shots:'Finalizações',target:'Chutes no gol',corners:'Escanteios'} as const)[report.metric];
 return <>
   <section className="team-only-panel team-summary-panel" aria-label="Médias somente das equipes">
     <div className="team-summary-heading">
       <span className="smart-kicker">ESTATÍSTICAS INDIVIDUAIS</span>
       <h3>{metric} · somente de cada equipe</h3>
       <p>Não soma as ações do adversário. Dados em casa e fora.</p>
     </div>
     <div className="team-summary-window">
       <span>Últimos</span>
       <div className="team-window-select" role="group" aria-label="Janela de jogos disponíveis">
         <button type="button" aria-pressed={windowSize===5} className={windowSize===5?'active':''}
           onClick={()=>setSelectedWindow(5)}>5 jogos</button>
         <button type="button" aria-pressed={windowSize===10} className={windowSize===10?'active':''}
           disabled={!availability.hasExtendedSample}
           onClick={()=>setSelectedWindow(10)}>10 jogos</button>
       </div>
     </div>
     {!availability.hasExtendedSample&&<p className="team-window-note" role="status">
       Até 5 jogos por mando disponíveis para esta seleção.
     </p>}
     <div className="team-summary-grid">
       <IndividualCard key={'home-'+home+'-'+report.metric} title={home+' · em casa'}
         lens={homeAny} windowSize={windowSize}/>
       <IndividualCard key={'away-'+away+'-'+report.metric} title={away+' · fora'}
         lens={awayAny} windowSize={windowSize}/>
     </div>
   </section>
   <section className="team-summary-direct" aria-label="Confrontos diretos — equipes individuais">
     <h3>Confrontos diretos</h3>
     <label>Recorte de mandos nos confrontos diretos
       <select aria-label="Filtro de mando dos confrontos diretos" value={directVenue}
         onChange={e=>onDirectVenueChange(e.target.value as DirectVenueMode)}>
         <option value="all">Todos os mandos</option>
         <option value="current">Somente mando atual</option>
       </select>
     </label>
     <p role="status">{report.directMatchCount} {report.directMatchCount===1?'confronto válido':'confrontos válidos'}
       {' '}nas temporadas selecionadas · últimos até 10 por indicador e período.
       Ambos os cartões representam as mesmas partidas, sem duplicar resultados.</p>
     <div className="team-summary-grid">
       <IndividualCard key={'direct-home-'+home+'-'+report.metric}
         lens={homeDirect} title={home+' · contra '+away+
           (directVenue==='all'?' · qualquer mando':' · em casa')} windowSize={windowSize}/>
       <IndividualCard key={'direct-away-'+away+'-'+report.metric}
         lens={awayDirect} title={away+' · contra '+home+
           (directVenue==='all'?' · qualquer mando':' · fora')} windowSize={windowSize}/>
     </div>
   </section>
   <p className="team-summary-footnote">
     3/5 = ocorreu em três dos cinco jogos (60%). Frequência passada não é
     probabilidade futura. N/D significa sem dado, não zero.
   </p>
 </>;
}
