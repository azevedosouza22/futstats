import {useState} from 'react';
import {
 individualLineFrequency,validIndividualLine,
 type IndividualLens,type IndividualMean,type TeamOnlyReport
} from './teamOnlyPeriods';

type Period='first'|'second'|'full';
type Lines=Record<Period,number>;
const fmt=(v:number|null)=>v===null?'N/D':
 v.toLocaleString('pt-BR',{maximumFractionDigits:1});
const defaults:Record<TeamOnlyReport['metric'],Record<Period,string>>={
 goals:{full:'1,5',first:'0,5',second:'0,5'},
 shots:{full:'10,5',first:'5,5',second:'5,5'},
 target:{full:'3,5',first:'1,5',second:'1,5'},
 corners:{full:'4,5',first:'2,5',second:'2,5'}
};
const parseLine=(s:string)=>Number(s.trim().replace(',','.'));
const get=(lens:IndividualLens,period:Period,windowSize:5|10):IndividualMean=>{
 const row=lens.periods.find(item=>item.period===period);
 return row?(windowSize===5?row.last5:row.last10):{mean:null,count:0,values:[]};
};
/** A 10-game button must not promise new information for two samples of <= 5. */
export function individualWindowAvailability(report:TeamOnlyReport){
 const [home,away]=report.lenses;
 const homeCount=get(home,'full',10).count;
 const awayCount=get(away,'full',10).count;
 return {homeCount,awayCount,hasExtendedSample:homeCount>5||awayCount>5};
}
function Frequency({sample,line,label}:{sample:IndividualMean;line:number;label:string}){
 const f=individualLineFrequency(sample,line);
 if(!f)return <p className="team-frequency-unavailable">Informe uma linha terminada em ,5.</p>;
 const hit=(n:number,percent:number|null)=>f.count
  ?n+'/'+f.count+' ('+percent+'%)':'N/D';
 return <div className="team-frequency" aria-label={label+' · linha '+fmt(line)}>
  <div className="team-frequency-caption">Linha {fmt(line)} · {f.count} {f.count===1?'jogo válido':'jogos válidos'}</div>
  <div className="team-frequency-pair">
   <div><small>Over {fmt(line)}</small><strong>{hit(f.over,f.overPercent)}</strong></div>
   <div><small>Under {fmt(line)}</small><strong>{hit(f.under,f.underPercent)}</strong></div>
  </div>
  {f.count>0&&<div className="team-frequency-track" role="progressbar"
   aria-label={label+' · frequência histórica de Over '+fmt(line)}
   aria-valuenow={f.overPercent??0} aria-valuemin={0} aria-valuemax={100}>
    <div style={{width:(f.overPercent??0)+'%'}}/>
   </div>}
 </div>;
}
function IndividualCard({lens,title,windowSize,lines}:{
 lens:IndividualLens;title:string;windowSize:5|10;lines:Lines
}){
 const full=get(lens,'full',windowSize);
 const first=get(lens,'first',windowSize);
 const second=get(lens,'second',windowSize);
 return <article className="team-summary-card">
  <div className="team-summary-title">{title}</div>
  <div className="team-summary-main">
   <div><span>Média por jogo</span><strong>{fmt(full.mean)}</strong></div>
   <small>{full.count===0?'Sem jogos válidos':
    full.count+' '+(full.count===1?'jogo válido':'jogos válidos')}</small>
  </div>
  <Frequency sample={full} line={lines.full} label={title+' · jogo completo'}/>
  {full.count<5&&<p className="team-summary-small-sample">
   {full.count===0?'Ainda não existem jogos suficientes nesta seleção.':
    'Amostra pequena: apenas '+full.count+' jogos disponíveis.'}</p>}
  <details className="team-summary-times">
   <summary>Ver 1º e 2º tempo · médias e frequências</summary>
   <div className="team-summary-time-detail">
    <div className="team-period-result">
     <div className="team-period-mean"><span>1º tempo · média</span>
      <strong>{fmt(first.mean)}</strong></div>
     <Frequency sample={first} line={lines.first} label={title+' · 1º tempo'}/>
    </div>
    <div className="team-period-result">
     <div className="team-period-mean"><span>2º tempo · média</span>
      <strong>{fmt(second.mean)}</strong></div>
     <Frequency sample={second} line={lines.second} label={title+' · 2º tempo'}/>
    </div>
   </div>
  </details>
 </article>;
}
export default function TeamOnlyCards({report,home,away}:{
 report:TeamOnlyReport;home:string;away:string
}){
 const [selectedWindow,setSelectedWindow]=useState<5|10>(5);
 const defaultLines=defaults[report.metric];
 const [lineDrafts,setLineDrafts]=useState(defaultLines);
 const lines:Lines={full:parseLine(lineDrafts.full),
  first:parseLine(lineDrafts.first),second:parseLine(lineDrafts.second)};
 const changeLine=(p:Period,s:string)=>setLineDrafts(prev=>({...prev,[p]:s}));
 const [homeAny,awayAny,homeDirect,awayDirect]=report.lenses;
 const availability=individualWindowAvailability(report);
 const windowSize=availability.hasExtendedSample?selectedWindow:5;
 return <section className="team-only-panel team-summary-panel" aria-label="Médias e frequências individuais das equipes">
  <div className="team-summary-heading">
   <div><span className="smart-kicker">ESTATÍSTICAS INDIVIDUAIS</span>
    <h3>{({goals:'Gols',shots:'Finalizações',target:'Chutes no gol',corners:'Escanteios'} as const)[report.metric]} de cada time</h3>
    <p>Somente o que cada equipe produziu. Over e Under usam a linha individual escolhida.</p></div>
  </div>
  <div className="team-summary-options">
   <label className="team-line-input">Linha individual · jogo completo
    <input type="text" inputMode="decimal" aria-label="Linha Over Under individual de jogo completo"
     value={lineDrafts.full} onChange={e=>changeLine('full',e.target.value)}
     placeholder="Ex.: 10,5"/>
   </label>
   <div className="team-summary-window">
    <span>Considerar até</span>
    <div className="team-window-select" role="group" aria-label="Janela de jogos disponíveis">
     <button type="button" aria-pressed={windowSize===5}
      className={windowSize===5?'active':''} onClick={()=>setSelectedWindow(5)}>5 jogos</button>
     <button type="button" aria-pressed={windowSize===10}
      className={windowSize===10?'active':''}
      disabled={!availability.hasExtendedSample}
      title={!availability.hasExtendedSample?'Não há mais de 5 jogos por mando nesta seleção':undefined}
      onClick={()=>setSelectedWindow(10)}>10 jogos</button>
    </div>
   </div>
  </div>
  {!validIndividualLine(lines.full)&&<p className="alert" role="alert">
   Informe uma linha individual positiva terminada em ,5 (ex.: 10,5).
  </p>}
  <details className="team-period-line-settings">
   <summary>Ajustar linhas do 1º e 2º tempo</summary>
   <div className="team-period-line-fields">
    {(['first','second'] as const).map((p,i)=><label key={p}>
      Linha individual · {i===0?'1º':'2º'} tempo
      <input type="text" inputMode="decimal" value={lineDrafts[p]}
       aria-label={'Linha individual do '+(i===0?'primeiro':'segundo')+' tempo'}
       onChange={e=>changeLine(p,e.target.value)}/>
     </label>)}
   </div>
   {(!validIndividualLine(lines.first)||!validIndividualLine(lines.second))&&
    <p className="alert" role="alert">Use linhas positivas terminadas em ,5 nos períodos.</p>}
  </details>
  {!availability.hasExtendedSample&&<p className="team-window-note" role="status">
   A opção de 10 jogos ficará disponível quando houver mais partidas.
   Hoje temos {availability.homeCount} jogos de {home} em casa e
   {' '}{availability.awayCount} de {away} fora. Por isso, a média não mudaria.
  </p>}
  <div className="team-summary-grid">
   <IndividualCard title={home+' · em casa'} lens={homeAny} windowSize={windowSize} lines={lines}/>
   <IndividualCard title={away+' · fora'} lens={awayAny} windowSize={windowSize} lines={lines}/>
  </div>
  <details className="team-summary-direct">
   <summary>Confrontos diretos — médias e frequências</summary>
   <div className="team-summary-grid">
    <IndividualCard lens={homeDirect} title={home+' contra '+away} windowSize={windowSize} lines={lines}/>
    <IndividualCard lens={awayDirect} title={away+' contra '+home} windowSize={windowSize} lines={lines}/>
   </div>
   <p>Os dois clubes compartilham os mesmos confrontos diretos; não conte como amostras independentes.</p>
  </details>
  <p className="team-summary-footnote">A contagem considera somente partidas válidas realmente disponíveis
   em cada período. N/D não significa zero. Frequências passadas não são probabilidades futuras.</p>
 </section>;
}
