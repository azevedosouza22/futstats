import {useState} from 'react';
import type {Data} from './model';
import {brasiliaDate,normalizeTeam,type ScheduledFixture} from './calendar';
import CalendarAgenda from './CalendarAgenda';
import {radarUpcoming, type RadarMarketResult} from './radar';

type Saved = {
  key: string; savedAt: string; matchAt: string; competition: string;
  home: string; away: string; homeCount: number; awayCount: number;
  markets: Pick<RadarMarketResult,'id'|'label'|'line'|'historyRate'|'observed'|'overs'|'historicalMean'>[];
};
const KEY='futstats-radar-previews-v1';
function readSaved(): Saved[] {
  try {
    const parsed:unknown=JSON.parse(localStorage.getItem(KEY)??'[]');
    if(!Array.isArray(parsed))return [];
    return parsed.filter((v):v is Saved=>!!v&&typeof v==='object'&&typeof v.key==='string'&&
      typeof v.savedAt==='string'&&typeof v.matchAt==='string'&&typeof v.competition==='string'&&
      typeof v.home==='string'&&typeof v.away==='string'&&Array.isArray(v.markets)).slice(0,50);
  }catch{return [];}
}
const format=(v:number|null)=>v===null?'N/D':v.toLocaleString('pt-BR',{maximumFractionDigits:2});
const percentage=(v:number|null)=>v===null?'N/D':(v*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';

export default function UpcomingRadar({data}:{data:Data}) {
  const [ids,setIds]=useState<[string,string]>(['','']);
  const [date,setDate]=useState(brasiliaDate().date);
  const [time,setTime]=useState('20:00');
  const [league,setLeague]=useState('');
  const [saved,setSaved]=useState(readSaved);
  const [message,setMessage]=useState('');
  function useCalendarFixture(f:ScheduledFixture){
    const h=data.teams.find(t=>normalizeTeam(t.name)===normalizeTeam(f.home));
    const a=data.teams.find(t=>normalizeTeam(t.name)===normalizeTeam(f.away));
    if(!h||!a||!f.time)return;
    setIds([h.id,a.id]);setLeague(f.competition);setDate(f.date);setTime(f.time);
    setMessage('Confronto da agenda selecionado. Confira as amostras antes de registrar.');
  }
  const teams=data.teams;
  const leagues=[...new Set(data.matches.map(m=>m.competition.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const home=teams.find(t=>t.id===ids[0]);
  const away=teams.find(t=>t.id===ids[1]);
  const eligible=!!home&&!!away&&home.id!==away.id&&!!league&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&/^\d{2}:\d{2}$/.test(time);
  const comparison=eligible?radarUpcoming(data,{home:home.id,away:away.id,date,competition:league}):null;

  function saveSnapshot(){
    if(!eligible||!comparison||!home||!away)return;
    const matchAt=date+'T'+time+':00';
    const nowBR=brasiliaDate();
    if(date<nowBR.date||(date===nowBR.date&&time<=nowBR.time)){
      setMessage('O horário informado já passou. Para um novo registro prospectivo, selecione um jogo futuro.');return;
    }
    if(comparison.homeHistory.length===0||comparison.awayHistory.length===0){
      setMessage('Ainda não há históricos anteriores para as duas equipes. Importe dados antes de registrar a análise.');return;
    }
    const record:Saved={
      key:crypto.randomUUID(),savedAt:new Date().toISOString(),matchAt,
      competition:league,home:home.name,away:away.name,
      homeCount:comparison.homeHistory.length,awayCount:comparison.awayHistory.length,
      markets:comparison.markets.map(m=>({
        id:m.id,label:m.label,line:m.line,historyRate:m.historyRate,
        observed:m.observed,overs:m.overs,historicalMean:m.historicalMean,
      })),
    };
    const next=[record,...saved].slice(0,50);
    try{localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);setMessage('Análise prospectiva registrada neste navegador. Exporte o arquivo para conservar uma cópia.');}
    catch{setMessage('Não foi possível salvar no navegador. Libere espaço e tente novamente.');}
  }
  function exportSaved(){
    if(!saved.length)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(saved,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='futstats-radar-registros.json';a.click();
    URL.revokeObjectURL(url);
  }
  return <section className="radar-upcoming" aria-label="Radar para jogos futuros">
    <CalendarAgenda onSelect={useCalendarFixture} availableTeams={teams.map(t=>t.name)}/>
    <h3>Radar · Novo confronto futuro</h3>
    <p className="muted">Selecione um jogo que ainda não começou. As análises utilizam apenas partidas anteriores, sem saber o resultado do confronto. Os horários desta seção seguem Brasília.</p>
    <div className="analysis-controls">
      <label>Mandante<select aria-label="Mandante futuro" value={ids[0]} onChange={e=>setIds([e.target.value,ids[1]])}>
        <option value="">Selecione</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
      </select></label>
      <label>Visitante<select aria-label="Visitante futuro" value={ids[1]} onChange={e=>setIds([ids[0],e.target.value])}>
        <option value="">Selecione</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
      </select></label>
      <label>Competição<select aria-label="Competição futura" value={league} onChange={e=>setLeague(e.target.value)}>
        <option value="">Selecione</option>{leagues.map(c=><option key={c} value={c}>{c}</option>)}
      </select></label>
      <label>Data<input aria-label="Data futura" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label>Hora de Brasília<input aria-label="Hora futura" type="time" value={time} onChange={e=>setTime(e.target.value)}/></label>
    </div>
    {comparison&&<div className="radar-future-results">
      <p><b>Histórico disponível:</b> {comparison.homeHistory.length}/5 do mandante e {comparison.awayHistory.length}/5 do visitante; {comparison.distinctHistoryCount} partidas únicas.</p>
      <div className="radar-market-table"><table className="analysis-table">
        <thead><tr><th>Mercado hipotético</th><th>Frequência Over</th><th>Média</th><th>Amostra válida</th></tr></thead>
        <tbody>{comparison.markets.map(m=><tr key={m.id}>
          <th>{m.label}<small>Linha: {format(m.line)}</small></th>
          <td>{percentage(m.historyRate)}<small>{m.overs}/{m.observed}</small></td>
          <td>{format(m.historicalMean)}</td><td>{m.observed}</td>
        </tr>)}</tbody>
      </table></div>
      <p className="muted">Frequências observadas em amostras pequenas; não são probabilidades de sucesso, nem indicações de apostar. Nenhuma odd foi consultada.</p>
      <button type="button" className="primary" onClick={saveSnapshot}>Registrar análise antes do jogo</button>
    </div>}
    {message&&<p role="status" className="notice">{message}</p>}
    <div className="radar-saved">
      <h4>Registros pré-jogo salvos ({saved.length})</h4>
      {saved.length>0&&<button type="button" className="text-button" onClick={exportSaved}>Exportar registros JSON</button>}
      {saved.length===0?<p className="muted">Nenhum registro salvo neste navegador.</p>:<ul>
        {saved.slice(0,10).map(v=><li key={v.key}><b>{v.home} × {v.away}</b>
          <small>{v.matchAt.replace('T',' ')} · {v.competition} · registrado {new Date(v.savedAt).toLocaleString('pt-BR')} · {v.homeCount}+{v.awayCount} jogos históricos</small>
        </li>)}
      </ul>}
    </div>
    <p className="muted">Os registros prospectivos ficam separados da base de partidas e do backup principal. Para protegê-los, use “Exportar registros JSON”. A agenda aceita CSV verificado, mas ainda não consulta sites automaticamente.</p>
  </section>;
}
