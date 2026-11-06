import {useState} from 'react';
import type {V4Pick} from './radarV4LabToday';
import {evaluateV4OddsValue} from './radarV4OddsValue';

const pct=(x:number)=>x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
const brl=(x:number)=>x.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const signedMoney=(x:number)=>(x>0?'+':'')+brl(x);
const signedPct=(x:number)=>(x>0?'+':'')+pct(x);

/** A private in-memory calculator, not a bookmaker or prediction feed. */
export default function RadarV4OddsPanel({label,pick,archive}:{
 label:string;pick:V4Pick;archive:boolean;
}){
 const [odd,setOdd]=useState('');
 const [probability,setProbability]=useState('');
 const [stake,setStake]=useState('2');
 const r=evaluateV4OddsValue(odd,probability,stake);
 return <section className="v4-odds-panel" aria-label="Simulador de odds V4">
  <h5>Simulador de valor · {label}</h5>
  <p className="v4-lab-muted">Frequência histórica V4: <b>{pick.overs}/{pick.observed}</b> jogos.
   Isso não equivale à probabilidade futura de acerto e não preenche o cálculo automaticamente.</p>
  <div className="v4-odds-inputs">
   <label>Odd da casa
    <input type="text" inputMode="decimal" aria-label="Odd da casa" value={odd}
     placeholder="Ex.: 1,50" onChange={e=>setOdd(e.target.value)} maxLength={12}/>
   </label>
   <label>Probabilidade estimada (%)
    <input type="text" inputMode="decimal" aria-label="Probabilidade estimada (%)"
     value={probability} placeholder="Ex.: 70" maxLength={10}
     onChange={e=>setProbability(e.target.value)}/>
   </label>
   <label>Valor por aposta (R$)
    <input type="text" inputMode="decimal" aria-label="Valor por aposta (R$)"
     value={stake} onChange={e=>setStake(e.target.value)} maxLength={14}/>
   </label>
  </div>
  {r.status==='invalid_odds'?
   <p role="status" className="v4-lab-muted">Informe uma odd decimal válida, maior que 1.</p>:
   <>
    <p className="v4-odds-break">Probabilidade mínima para empatar na odd {r.odd?.toLocaleString('pt-BR')}: <strong>{pct(r.breakEvenPercent!)}</strong></p>
    {r.status==='invalid_stake'&&<p role="alert">Informe um valor de aposta positivo e válido.</p>}
    {r.status==='missing_probability'&&<p role="status" className="v4-lab-muted">Informe uma estimativa de probabilidade fundamentada para simular o valor esperado. Sem ela, o V4 não pode dizer se a odd compensa.</p>}
    {r.status==='invalid_probability'&&<p role="alert">Informe uma probabilidade de 0 a 100, sem o símbolo %.</p>}
    {(r.status==='positive'||r.status==='negative'||r.status==='neutral')&&
     <div className="v4-odds-output" role="status">
      <strong className={r.status==='positive'?'v4-odds-plus':r.status==='negative'?'v4-odds-minus':''}>
       {r.status==='positive'?'Valor teórico positivo':
        r.status==='negative'?'Valor teórico negativo':'Sem vantagem matemática'}
      </strong>
      <div className="v4-odds-numbers">
       <span>Vantagem estimada: <b>{signedPct(r.edgePoints!)}</b></span>
       <span>Retorno esperado (ROI): <b>{signedPct(r.expectedRoiPercent!)}</b></span>
       <span>Lucro esperado por aposta: <b>{signedMoney(r.expectedProfit!)}</b></span>
       <span>Retorno se acertar: <b>{brl(r.winningReturn!)}</b></span>
       <span>Perda se errar: <b>{brl(r.losingProfit!)}</b></span>
      </div>
     </div>}
   </>}
  <p className="v4-odds-warning">
   <b>Avaliação somente hipotética.</b> A probabilidade foi informada manualmente, não
   calibrada nem comprovada pelo FutStats; nenhuma entrada é recomendada automaticamente.
   {archive?' Esta é uma partida histórica: odd digitada hoje não comprova a cotação pré-jogo.':
    ' Para avaliar apostas reais, registre a odd oferecida antes da partida.'}
  </p>
 </section>;
}
