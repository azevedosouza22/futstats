import type {ContextLens,FourLensReport,LensSample} from './radarFourLenses';

const fmt=(n:number|null)=>n===null?'N/D':n.toLocaleString('pt-BR',{maximumFractionDigits:1});
const rate=(n:number,total:number)=>total?Math.round(n/total*100):null;

function Frequency({label,record,line}:{label:string;record:LensSample;line:number}){
 const percent=rate(record.under,record.count);
 const other=rate(record.over,record.count);
 return <div className="smart-freq">
  <div className="smart-freq-header"><strong>{label}</strong><span>{record.count} jogo(s)</span></div>
  <div className="smart-freq-pair">
    <div><small>Under {fmt(line)}</small><b>{record.count?record.under+'/'+record.count:'N/D'}</b>
      <small>{percent===null?'Amostra indisponível':percent+'% das partidas'}</small></div>
    <div><small>Over {fmt(line)}</small><b>{record.count?record.over+'/'+record.count:'N/D'}</b>
      <small>{other===null?'Amostra indisponível':other+'% das partidas'}</small></div>
  </div>
  <div className="smart-freq-track" aria-hidden="true">
    <div style={{width:(percent??0)+'%'}}/>
  </div>
 </div>;
}
function LensCard({lens,line,title}:{lens:ContextLens;line:number;title:string}){
 return <article className="smart-lens-card">
  <h4>{title}</h4>
  <div className="smart-lens-lead"><div><small>Média total · últimos 10</small>
    <strong>{fmt(lens.last10.mean)}</strong></div>
   <span>{lens.last10.count} jogos válidos</span>
  </div>
  {lens.last10.count<5&&<p className="smart-lens-caution">
    Amostra pequena: esta média precisa de mais jogos para ser confiável.</p>}
  <Frequency label="Últimos 5 jogos" record={lens.last5} line={line}/>
  <Frequency label="Últimos 10 jogos" record={lens.last10} line={line}/>
 </article>;
}
export default function SmartComparisonCards({report,home,away}:{
 report:FourLensReport;home:string;away:string
}){
 const [homeAny,homeDirect,awayAny,awayDirect]=report.lenses;
 return <section className="smart-comparison-output" aria-label="Resultado da comparação inteligente">
  <div className="smart-match-head">
   <span className="smart-kicker">COMPARAÇÃO POR MANDO</span>
   <h3>{home} × {away}</h3>
   <p>A média representa a soma das ações dos dois times em cada partida.</p>
  </div>
  <div className="smart-lens-grid">
   <LensCard lens={homeAny} line={report.line} title={home+' em casa · todos os adversários'}/>
   <LensCard lens={awayAny} line={report.line} title={away+' fora · todos os adversários'}/>
  </div>
  <details className="smart-direct-details">
   <summary>Ver confrontos diretos ({homeDirect.last10.count} jogo(s) recentes)</summary>
   <p>Os dois recortes abaixo consultam as mesmas partidas; não representam provas independentes.</p>
   <div className="smart-lens-grid">
    <LensCard lens={homeDirect} line={report.line} title={home+' em casa × '+away}/>
    <LensCard lens={awayDirect} line={report.line} title={away+' fora × '+home}/>
   </div>
  </details>
  <section className="smart-verdict" role="status">
   <small>LEITURA DOS DADOS DISPONÍVEIS</small>
   <h4>{report.historicalDirection==='Sem consenso'
    ?'Sem consenso histórico'
    :'Tendência histórica de '+report.historicalDirection+' '+fmt(report.line)}</h4>
   <p>{report.reason}</p>
   <p>Referência descritiva dos dois mandos: <b>{fmt(report.projection)}</b> ações por jogo.</p>
   <small>Frequência histórica não é probabilidade futura. Não considera odds.</small>
  </section>
 </section>;
}
