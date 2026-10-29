import {useState,type ReactNode} from 'react';
import type {Period} from './model';
import type {ContextLens,FourLensReport,LensKind,LensSample} from './radarFourLenses';

const fmt=(n:number|null)=>n===null?'N/D':n.toLocaleString('pt-BR',{maximumFractionDigits:1});
const rate=(n:number,total:number)=>total?Math.round(n/total*100):null;
const periodLens=(reports:Record<Period,FourLensReport>,period:Period,id:LensKind):ContextLens=>
 reports[period].lenses.find(l=>l.id===id)!;
function SummaryFrequency({record,line}:{record:LensSample;line:number}){
 const n=record.count;
 return <div className="team-simple-frequency" aria-label={'Linha '+fmt(line)}>
  <span className="team-simple-line">Linha {fmt(line)} · {n} {n===1?'jogo':'jogos'}</span>
  <div className="team-simple-pairs">
   <span>Over <b>{n?record.over+'/'+n:'N/D'}</b>
     <em>{n?rate(record.over,n)+'%':'N/D'}</em></span>
   <span>Under <b>{n?record.under+'/'+n:'N/D'}</b>
     <em>{n?rate(record.under,n)+'%':'N/D'}</em></span>
  </div>
 </div>;
}
function MandoCard({reports,id,title,windowSize}:{
 reports:Record<Period,FourLensReport>;id:LensKind;title:string;windowSize:5|10
}){
 const read=(p:Period)=>{
  const lens=periodLens(reports,p,id);
  return windowSize===5?lens.last5:lens.last10;
 };
 const full=read('full');
 return <article className="smart-lens-card team-summary-card">
   <h4 className="team-summary-title">{title}</h4>
   <div className="team-summary-main">
     <div><span>Média · jogo completo</span><strong>{fmt(full.mean)}</strong></div>
     <small>{full.count} {full.count===1?'jogo válido':'jogos válidos'}</small>
   </div>
   {full.count<5&&<p className="smart-lens-caution">
     Amostra pequena; histórico ainda limitado.</p>}
   <SummaryFrequency line={reports.full.line} record={full}/>
   <div className="team-period-compact-list">
     {(['first','second'] as const).map((p)=><div className="team-period-compact-row" key={p}>
       <div className="team-period-compact-head">
         <strong>{p==='first'?'1º tempo':'2º tempo'}</strong>
         <span>Média {fmt(read(p).mean)}</span>
       </div>
       <SummaryFrequency line={reports[p].line} record={read(p)}/>
     </div>)}
   </div>
 </article>;
}
export default function SmartComparisonCards({report,periodReports,home,away,children,displayVerdict=true}:{
 report:FourLensReport;periodReports:Record<Period,FourLensReport>;
 home:string;away:string;children?:ReactNode;displayVerdict?:boolean
}){
 const [selectedWindow,setSelectedWindow]=useState<5|10>(5);
 const enoughHistory=['home-any','away-any'].some(id=>
   periodLens(periodReports,'full',id as LensKind).last10.count>5);
 const windowSize=enoughHistory?selectedWindow:5;
 const [homeAny,homeDirect,awayAny,awayDirect]=report.lenses;
 return <section className="smart-comparison-output" aria-label="Resultado da comparação inteligente">
  <div className="smart-match-head">
   <span className="smart-kicker">COMPARAÇÃO POR MANDO</span>
   <h3>{home} × {away}</h3>
   <p>Totais somados dos dois times, não as estatísticas individuais.
     Linhas do resumo próximas das médias de cada período.</p>
  </div>
  <div className="team-summary-window">
   <span>Últimos</span>
   <div className="team-window-select" role="group" aria-label="Janela de jogos do total da partida">
     <button type="button" aria-pressed={windowSize===5} className={windowSize===5?'active':''}
       onClick={()=>setSelectedWindow(5)}>5 jogos</button>
     <button type="button" aria-pressed={windowSize===10} className={windowSize===10?'active':''}
       disabled={!enoughHistory} onClick={()=>setSelectedWindow(10)}>10 jogos</button>
   </div>
  </div>
  <div className="smart-lens-grid">
   <MandoCard reports={periodReports} id="home-any" title={home+' · em casa'}
     windowSize={windowSize}/>
   <MandoCard reports={periodReports} id="away-any" title={away+' · fora'}
     windowSize={windowSize}/>
  </div>
  <details className="smart-direct-details">
   <summary>Ver totais nos confrontos diretos ({homeDirect.last10.count} jogo(s))</summary>
   <p>Os dois recortes abaixo consultam as mesmas partidas; não representam provas independentes.</p>
   <div className="smart-lens-grid">
    <MandoCard reports={periodReports} id="home-direct" title={home+' em casa × '+away}
     windowSize={windowSize}/>
    <MandoCard reports={periodReports} id="away-direct" title={away+' fora × '+home}
     windowSize={windowSize}/>
   </div>
  </details>
  {children}
  {displayVerdict&&<section className="smart-verdict" role="status">
   <small>LEITURA DOS DADOS DISPONÍVEIS</small>
   <h4>{report.historicalDirection==='Sem consenso'
    ?'Sem consenso histórico'
    :'Tendência histórica de '+report.historicalDirection+' '+fmt(report.line)}</h4>
   <p>{report.reason}</p>
   <p>Referência descritiva dos dois mandos: <b>{fmt(report.projection)}</b> ações por jogo.</p>
   <small>Frequência histórica não é probabilidade futura. Não considera odds.</small>
  </section>}
 </section>;
}
