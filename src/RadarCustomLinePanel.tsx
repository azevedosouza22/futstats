import {useState} from 'react';
import type {Data} from './model';
import type {RadarFixture} from './radar';
import {compareCustomPeriodLine} from './radarCustomPeriodLine';
import {PERIOD_REFERENCE_LINES,PERIOD_LINE_LABELS} from './radarPeriodLineComparison';
import type {CoverageMetric,CoveragePeriod} from './leagueCoverageAudit';
const metrics:CoverageMetric[]=['goals','shots','target','corners'];
const periods:CoveragePeriod[]=['full','first','second'];
const labels={goals:'Gols',shots:'Finalizações',target:'Chutes no alvo',corners:'Escanteios'};
const start=(p:CoveragePeriod,m:CoverageMetric)=>String(PERIOD_REFERENCE_LINES[p][m][0]);
const pct=(v:number|null)=>v===null?'N/D':(v*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
export default function RadarCustomLinePanel({data,fixture}:{data:Data;fixture:RadarFixture}){
 const [metric,setMetric]=useState<CoverageMetric>('corners');
 const [period,setPeriod]=useState<CoveragePeriod>('full');
 const [line,setLine]=useState(start('full','corners'));
 const value=line.trim()?Number(line):NaN;
 const invalid=!Number.isFinite(value)||value<0||value>500||!Number.isSafeInteger(value*2);
 const result=invalid?null:compareCustomPeriodLine(data,fixture,metric,period,value);
 return <details className="radar-custom-line" aria-label="Simular linha histórica personalizada">
  <summary>Comparar linha personalizada · acima, abaixo ou igual</summary>
  <p className="muted">Frequências descritivas dos jogos anteriores. Não são projeções V2/V3. Nenhum valor é salvo.</p>
  <div className="radar-custom-line-controls">
   <label>Indicador
    <select aria-label="Indicador da linha personalizada" value={metric}
      onChange={e=>{const m=e.target.value as CoverageMetric;setMetric(m);setLine(start(period,m));}}>
     {metrics.map(m=><option key={m} value={m}>{labels[m]}</option>)}
    </select>
   </label>
   <label>Período
    <select aria-label="Período da linha personalizada" value={period}
      onChange={e=>{const p=e.target.value as CoveragePeriod;setPeriod(p);setLine(start(p,metric));}}>
     {periods.map(p=><option key={p} value={p}>{PERIOD_LINE_LABELS[p]}</option>)}
    </select>
   </label>
   <label>Linha (passos de 0,5)
    <input aria-label="Valor da linha personalizada" type="number"
     min="0" max="500" step="0.5" value={line} onChange={e=>setLine(e.target.value)}/>
   </label>
  </div>
  {invalid?<p role="alert">Linha inválida: use valores entre 0 e 500, em passos de 0,5.</p>:
   result&&<>
    <p className="muted" role="status">
     {result.sample}/{result.distinct} jogos válidos · {result.missing} N/D ·
     {' '}{result.conflicts} em revisão.
     {!result.sampleAdequate?' Percentual N/D: menos de 5 jogos válidos.':''}
    </p>
    <div className="radar-custom-line-results" aria-label="Contagens acima abaixo e igualdade">
      <div><strong>Acima (Over)</strong><span>{result.over}/{result.sample}</span><small>{pct(result.overShare)}</small></div>
      <div><strong>Abaixo (Under)</strong><span>{result.under}/{result.sample}</span><small>{pct(result.underShare)}</small></div>
      <div><strong>Igual (push)</strong><span>{result.push}/{result.sample}</span><small>{pct(result.pushShare)}</small></div>
    </div>
    <p className="muted">Linha inteira: empate na linha contado separadamente. N/D não entra no denominador nem equivale a zero. Resultado histórico não comprova futuro.</p>
   </>}
 </details>;
}
