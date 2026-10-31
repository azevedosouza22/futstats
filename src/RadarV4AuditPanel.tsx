import {useState} from 'react';
import {parseV4Audit,summarizeV4Audit,type GroupDimension,type V4Audit} from './radarV4AuditResults';

const SOURCE='/research/v4-lab/auditoria-2026-10-31.json';
const pct=(v:number|null)=>v===null?'N/D':(v*100).toLocaleString('pt-BR',{maximumFractionDigits:1,minimumFractionDigits:1})+'%';
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dimensions:{id:GroupDimension;label:string}[]=[
 {id:'period',label:'Por tempo'},
 {id:'metric',label:'Por mercado'},
 {id:'league',label:'Por liga'},
 {id:'fixture',label:'Por jogo'},
 {id:'line',label:'Por linha exata'},
 {id:'league-period-metric',label:'Combinações'}
];
/** Research display only. No changes to local matches, saved picks, or betting. */
export default function RadarV4AuditPanel(){
 const [audit,setAudit]=useState<V4Audit|null>(null);
 const [dimension,setDimension]=useState<GroupDimension>('period');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [open,setOpen]=useState(false);
 async function showAudit(){
  setOpen(v=>!v);
  if(audit||busy)return;
  setError('');setBusy(true);
  try{
   const res=await fetch(SOURCE,{cache:'no-store'});
   if(!res.ok)throw Error('Arquivo de auditoria não encontrado na prévia experimental.');
   setAudit(parseV4Audit(await res.json() as unknown));
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível carregar os resultados.');}
  finally{setBusy(false);}
 }
 const all=audit?summarizeV4Audit(audit,dimension):[];
 const ranked=dimension==='line'||dimension==='league-period-metric'?
  all.filter(r=>r.n>=3).sort((a,b)=>b.taxa!-a.taxa!||b.n-a.n).slice(0,16):all;
 return <section className="v4-lab-results" aria-label="Auditoria de resultados LV4" style={{marginTop:'1.25rem'}}>
  <div className="v4-lab-archive-banner">
   <strong>Resultados e estratégias · LV4</strong>
   <span>Auditoria independente dos sinais emitidos antes dos jogos, com pesquisa de padrões por campeonato, mercado, tempo e linha exata.</span>
   <button type="button" onClick={()=>void showAudit()} disabled={busy}>
    {busy?'Carregando auditoria…':open?'Ocultar auditoria de 31/10':'Consultar auditoria de 31/10'}
   </button>
  </div>
  {error&&<p role="alert" className="v4-lab-alert">{error}</p>}
  {open&&audit&&<div>
   <p className="v4-lab-muted">Relatório parcial do Work, corte em 31/10 às 15h (Brasília). É histórico, não uma consulta ao vivo; 13 jogos ainda constam pendentes neste arquivo.</p>
   <div className="v4-lab-summary">
    <div><small>Jogos verificados</small><strong>{audit.summary.games_complete}/{audit.summary.fixtures}</strong></div>
    <div><small>Acertos</small><strong>{audit.summary.hits}</strong></div>
    <div><small>Erros</small><strong>{audit.summary.misses}</strong></div>
    <div><small>Acerto observado</small><strong>{pct(audit.summary.observed_hit_rate)}</strong></div>
   </div>
   <p>Foram {audit.summary.evaluated_signals} sinais avaliados, {audit.summary.abstentions} abstenções originais e {audit.summary.pending_signals} sinais pendentes. Nenhuma previsão foi recalculada após os jogos.</p>
   <label>Explorar resultados por&nbsp;
    <select aria-label="Agrupamento da auditoria LV4" value={dimension}
     onChange={e=>setDimension(e.target.value as GroupDimension)}>
     {dimensions.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
    </select>
   </label>
   <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',marginTop:'.65rem',fontSize:'.9rem'}}>
     <thead><tr><th scope="col">Grupo</th><th scope="col">Acertos</th>
      <th scope="col">Erros</th><th scope="col">Jogos</th><th scope="col">Taxa</th>
      <th scope="col">ROI 1,50*</th></tr></thead>
     <tbody>
     {ranked.map(r=><tr key={r.label}><th scope="row">{r.label}</th>
      <td>{r.acertos}</td><td>{r.erros}</td><td>{r.jogos}</td>
      <td>{pct(r.taxa)}</td><td>{pct(r.roi150)}</td></tr>)}
     </tbody>
    </table>
   </div>
   {(dimension==='line'||dimension==='league-period-metric')&&
    <p className="v4-lab-muted">Somente cruzamentos com pelo menos três sinais resolvidos. Ordenação exploratória por taxa de acerto. Podem existir vários sinais correlacionados do mesmo jogo; não significa estratégia validada.</p>}
   <div className="v4-lab-archive-banner" style={{marginTop:'.8rem'}}>
    <strong>Rentabilidade: simulação, não lucro real</strong>
    <span>{brl(376)} hipoteticamente apostados em 188 entradas de {brl(2)} a odd fixa 1,50: resultado {brl(8)} e ROI +2,13%. Não existem odds reais pré-jogo comprovadas neste arquivo.</span>
    <span>Não é possível testar padrões de segunda a sexta versus fim de semana utilizando apenas partidas de sábado. As hipóteses precisam ser congeladas e verificadas em novos dias.</span>
    <a href={SOURCE} download="LV4_2026-10-31_auditoria_360_decisoes.json">Consultar as 360 decisões e suas fontes (JSON)</a>
    <a href="https://github.com/azevedosouza22/futstats/blob/feat/v4-laboratorio-analisar-jogos-hoje/research/radar-v4-lab/PROTOCOLO_RELATORIO_DIARIO_PADROES_V4.md"
     target="_blank" rel="noopener noreferrer">Metodologia e critérios para validar estratégias</a>
   </div>
  </div>}
 </section>;
}
