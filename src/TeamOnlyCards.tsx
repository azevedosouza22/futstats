import {useState} from 'react';
import {
 individualLineFrequency,suggestedIndividualLine,
 type IndividualLens,type IndividualMean,type TeamFrequency,type TeamOnlyReport
} from './teamOnlyPeriods';

const fmt=(v:number|null)=>v===null?'N/D':
 v.toLocaleString('pt-BR',{maximumFractionDigits:1});
const pct=(v:number|null)=>v===null?'N/D':(v*100).toLocaleString('pt-BR',{
 maximumFractionDigits:0
})+'%';
const get=(lens:IndividualLens,period:'first'|'second'|'full',windowSize:5|10):IndividualMean=>{
 const row=lens.periods.find(item=>item.period===period);
 return row?(windowSize===5?row.last5:row.last10):
   {mean:null,count:0,observations:[]};
};
/** The 10-game option must not promise new information when both clubs have <=5 records. */
export function individualWindowAvailability(report:TeamOnlyReport){
 const [home,away]=report.lenses;
 const homeCount=get(home,'full',10).count;
 const awayCount=get(away,'full',10).count;
 return {homeCount,awayCount,hasExtendedSample:homeCount>5||awayCount>5};
}
function readableLine(input:string):number|null{
 const value=Number(input.trim().replace(',','.'));
 return input.trim()&&Number.isFinite(value)&&value>=0.5&&value<=999.5&&
   Number.isInteger(value-0.5)?value:null;
}
function FrequencySummary({frequency,line,compact=false}:{
 frequency:TeamFrequency;line:number;compact?:boolean
}){
 return <div className={compact?'team-hit-frequency compact':'team-hit-frequency'}>
  <div className="team-hit-head">
   <span>Linha {fmt(line)} · {frequency.count} {frequency.count===1?'jogo':'jogos'}</span>
  </div>
  <div className="team-hit-pair">
   <div><small>Over {fmt(line)}</small>
     <strong>{frequency.count?frequency.over+'/'+frequency.count:'N/D'}</strong>
     <span>{pct(frequency.overRate)}</span></div>
   <div><small>Under {fmt(line)}</small>
     <strong>{frequency.count?frequency.under+'/'+frequency.count:'N/D'}</strong>
     <span>{pct(frequency.underRate)}</span></div>
  </div>
  {frequency.count>0&&<div className="team-hit-track" role="img"
    aria-label={pct(frequency.overRate)+' dos jogos acima de '+fmt(line)}>
    <div style={{width:(frequency.overRate!*100)+'%'}}/>
  </div>}
 </div>;
}
/** One compact row per half. The independent half-time line is preserved,
 * but we do not repeat a full-size card, bar and nested panels for each half.
 */
function PeriodCompactRow({title,sample}:{title:string;sample:IndividualMean}){
 const line=suggestedIndividualLine(sample.mean);
 const frequency=line!==null?individualLineFrequency(sample,line):null;
 return <div className="team-period-compact-row">
   <div className="team-period-compact-head">
     <strong>{title}</strong>
     <span>Média {fmt(sample.mean)} · {sample.count} {sample.count===1?'jogo':'jogos'}</span>
   </div>
   {frequency&&line!==null?
     <div className="team-period-compact-frequencies">
       <span className="team-period-compact-line">Linha {fmt(line)}</span>
       <span>Over <b>{frequency.count?frequency.over+'/'+frequency.count:'N/D'}</b>
         {' '}<small>({pct(frequency.overRate)})</small></span>
       <span>Under <b>{frequency.count?frequency.under+'/'+frequency.count:'N/D'}</b>
         {' '}<small>({pct(frequency.underRate)})</small></span>
     </div>:
     <small className="team-period-compact-empty">Sem jogos válidos para a linha.</small>}
 </div>;
}
function IndividualCard({lens,title,windowSize}:{lens:IndividualLens;title:string;windowSize:5|10}){
 const [lineDraft,setLineDraft]=useState('');
 const full=get(lens,'full',windowSize);
 const first=get(lens,'first',windowSize);
 const second=get(lens,'second',windowSize);
 const suggestedLine=suggestedIndividualLine(get(lens,'full',10).mean);
 const changed=lineDraft.trim().length>0;
 const line=changed?readableLine(lineDraft):suggestedLine;
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
  {line!==null?
   <FrequencySummary frequency={individualLineFrequency(full,line)} line={line}/>:
   <p className="team-window-note">Não há linha válida ou jogos para calcular a frequência.</p>}
  <details className="team-summary-edit-line">
   <summary>Alterar linha Over/Under da equipe</summary>
   <label>Nova linha para {title}
    <input aria-label={'Linha individual para '+title} type="text" inputMode="decimal"
      value={changed?lineDraft:''} placeholder={fmt(suggestedLine)}
      onChange={e=>setLineDraft(e.target.value)}/>
   </label>
   {changed&&line===null&&<p role="alert">Digite um valor como 12,5 ou 16,5.</p>}
   {changed&&<button type="button" onClick={()=>setLineDraft('')}>
     Restaurar linha próxima da média</button>}
   <small>Linha de referência calculada com base na média observada.
     Não é odd nem recomendação de aposta.</small>
  </details>
  <details className="team-summary-times">
   <summary>Ver 1º e 2º tempo · linhas próprias da equipe</summary>
   <div className="team-period-compact-list">
     <PeriodCompactRow title="1º tempo" sample={first}/>
     <PeriodCompactRow title="2º tempo" sample={second}/>
   </div>
   <p className="team-times-note">Linhas individuais próximas da média de cada tempo;
     não são alteradas pela configuração do total da partida.</p>
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
   <div><span className="smart-kicker">MÉDIAS E FREQUÊNCIAS</span>
    <h3>{({goals:'Gols',shots:'Finalizações',target:'Chutes no gol',corners:'Escanteios'} as const)[report.metric]} de cada time</h3>
    <p>Estatísticas somente da equipe, sem somar as do adversário.</p></div>
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
   <IndividualCard key={'home-'+home+'-'+report.metric} title={home+' · em casa'}
     lens={homeAny} windowSize={windowSize}/>
   <IndividualCard key={'away-'+away+'-'+report.metric} title={away+' · fora'}
     lens={awayAny} windowSize={windowSize}/>
  </div>
  <details className="team-summary-direct">
   <summary>Confrontos diretos — médias de cada time</summary>
   <div className="team-summary-grid">
    <IndividualCard key={'direct-home-'+home+'-'+report.metric}
      lens={homeDirect} title={home+' contra '+away} windowSize={windowSize}/>
    <IndividualCard key={'direct-away-'+away+'-'+report.metric}
      lens={awayDirect} title={away+' contra '+home} windowSize={windowSize}/>
   </div>
   <p>Os dois clubes compartilham o mesmo histórico de confrontos diretos.</p>
  </details>
  <p className="team-summary-footnote">3/5 significa que aconteceu em três dos cinco jogos
   analisados (60%). Percentuais mostram frequência passada, não chance futura.
   Cada período usa suas próprias partidas válidas. N/D não significa zero.</p>
 </section>;
}
