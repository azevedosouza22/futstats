import {useState,useRef} from 'react';
import type {Data} from './model';
import {brasiliaDate,normalizeTeam,brasileiraoRound32,isUpcoming,type ScheduledFixture} from './calendar';
import CalendarAgenda from './CalendarAgenda';
import {radarUpcoming} from './radar';
import {leagueNumericContext,type LeagueNumericMarket} from './radarNumericContext';
import {captureVenuePredictions,settleVenuePredictions,scoreSettlements} from './radarProspective';
import {parseRadarRecords,mergeRadarRecords,type SavedRadarRecord} from './radarRecords';
import {summarizeRadarFollowup,type FollowupFilter} from './radarFollowup';
import {teamsInCompetition} from './radarTeamFilters';

type Saved = SavedRadarRecord;
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
const Signal = ({value}:{value:'Over'|'Under'|'Sem sinal'})=><span className={'signal signal--'+(value==='Over'?'over':value==='Under'?'under':'neutral')}>{value}</span>;

// New observations are frozen with the prediction. Older records never receive
// reconstructed league values from games that were played afterward.
function NumericReferences({line,history,league,projected,legacy=false}:{
  line:number;
  history?:{historicalMean:number|null;observed:number};
  league?:LeagueNumericMarket;
  projected?:number|null;
  legacy?:boolean;
}){
  return <div className="radar-numeric-details">
    <span>Linha analisada: +{format(line)}</span>
    <span>Média histórica das equipes: {format(history?.historicalMean??null)} ({history?.observed??0} jogos)</span>
    <span>Média do campeonato: {legacy?'N/D (não registrada)':format(league?.mean??null)+' ('+(league?.observed??0)+' jogos)'}</span>
    {projected!==undefined&&<span>Projeção V2: {format(projected)}</span>}
  </div>;
}

export default function UpcomingRadar({data,view}:{data:Data;view:'new'|'saved'}) {
  const [ids,setIds]=useState<[string,string]>(['','']);
  const [date,setDate]=useState(brasiliaDate().date);
  const [time,setTime]=useState('20:00');
  const [league,setLeague]=useState('');
  const [saved,setSaved]=useState(readSaved);
  const [recordFilter,setRecordFilter]=useState<FollowupFilter>('all');
  const [message,setMessage]=useState('');
  const [calendarSelection,setCalendarSelection]=useState('');
  const futureFormRef=useRef<HTMLHeadingElement>(null);
  const restoreInput=useRef<HTMLInputElement>(null);
  function useCalendarFixture(f:ScheduledFixture){
    const h=data.teams.find(t=>normalizeTeam(t.name)===normalizeTeam(f.home));
    const a=data.teams.find(t=>normalizeTeam(t.name)===normalizeTeam(f.away));
    if(!h||!a||!f.time)return;
    const candidates=teamsInCompetition(data,f.competition);
    if(!candidates.some(t=>t.id===h.id)||!candidates.some(t=>t.id===a.id))return;
    setIds([h.id,a.id]);setLeague(f.competition);setDate(f.date);setTime(f.time);
    setCalendarSelection(`${f.home} × ${f.away} · ${f.date} às ${f.time} (Brasília)`);
    setMessage('');
    // Keep the user on the same page but bring the filled-in Radar controls into view.
    futureFormRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  const teams=data.teams;
  const leagues=[...new Set(data.matches.map(m=>m.competition.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const leagueTeams=teamsInCompetition(data,league);
  const home=leagueTeams.find(t=>t.id===ids[0]);
  const away=leagueTeams.find(t=>t.id===ids[1]);
  const eligible=!!home&&!!away&&home.id!==away.id&&!!league&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&/^\d{2}:\d{2}$/.test(time);
  const alreadySavedSelected=!!home&&!!away&&saved.some(record=>
    record.matchAt.slice(0,10)===date&&record.competition.trim()===league.trim()&&
    normalizeTeam(record.home)===normalizeTeam(home.name)&&
    normalizeTeam(record.away)===normalizeTeam(away.name));
  const comparison=eligible?radarUpcoming(data,{home:home.id,away:away.id,date,competition:league}):null;
  const prospective=eligible&&home&&away?captureVenuePredictions(data,{home:home.id,away:away.id,date,competition:league}):[];
  const numericLeagueContext=eligible?leagueNumericContext(data,league,date):[];
  const settlements=saved.map(v=>settleVenuePredictions(data,v));
  const scores=scoreSettlements(settlements);
  const followup=summarizeRadarFollowup(saved,settlements);
  const visibleSaved=saved.map((record,index)=>({record,index,status:followup.statuses[index]}))
    .filter(r=>recordFilter==='all'||r.status===recordFilter);
  const evaluatedScore=(correct:number,count:number)=>count
    ?`${correct}/${count} (${(100*correct/count).toLocaleString('pt-BR',{maximumFractionDigits:1})}%)`
    :'N/D';
  const scoreText=(v:{correct:number;signals:number})=>v.signals?`${v.correct}/${v.signals} (${(100*v.correct/v.signals).toLocaleString('pt-BR',{maximumFractionDigits:1})}%)`:'N/D';

  // Preview all missing predictions from the verified round. No writes happen
  // until the user explicitly confirms. Already saved forecasts are immutable.
  const alreadyRegistered=(f:ScheduledFixture,records:Saved[]=saved)=>
    records.some(v=>v.matchAt.slice(0,10)===f.date&&
      v.competition.trim()===f.competition.trim()&&
      normalizeTeam(v.home)===normalizeTeam(f.home)&&normalizeTeam(v.away)===normalizeTeam(f.away));
  const roundPlans=brasileiraoRound32.flatMap(f=>{
    if(!f.time||!isUpcoming(f)||alreadyRegistered(f))return [];
    const h=teams.find(t=>normalizeTeam(t.name)===normalizeTeam(f.home));
    const a=teams.find(t=>normalizeTeam(t.name)===normalizeTeam(f.away));
    if(!h||!a||h.id===a.id)return [];
    const fixture={home:h.id,away:a.id,date:f.date,competition:f.competition};
    const analysis=radarUpcoming(data,fixture);
    if(!analysis.homeHistory.length||!analysis.awayHistory.length)return [];
    return [{f,home:h,away:a,analysis,venue:captureVenuePredictions(data,fixture),leagueContext:leagueNumericContext(data,f.competition,f.date)}];
  });
  const bulkCount=Math.min(roundPlans.length,Math.max(0,50-saved.length));
  function registerRound(){
    const latest=readSaved();
    // Recheck duplicate records from disk, not only the React render.
    const now=new Date(),timestamp=now.toISOString();
    const free=Math.max(0,50-latest.length);
    const chosen=roundPlans.filter(p=>isUpcoming(p.f,now)&&!alreadyRegistered(p.f,latest)).slice(0,free);
    if(!chosen.length){setMessage('Nenhum confronto novo pode ser registrado. Os já salvos continuam intactos.');return;}
    const newRecords:Saved[]=chosen.map(p=>({
      key:crypto.randomUUID(),savedAt:timestamp,matchAt:p.f.date+'T'+p.f.time+':00',
      competition:p.f.competition,home:p.home.name,away:p.away.name,
      homeCount:p.analysis.homeHistory.length,awayCount:p.analysis.awayHistory.length,
      venue:p.venue,
      leagueContext:p.leagueContext,
      markets:p.analysis.markets.map(m=>({
        id:m.id,label:m.label,line:m.line,historyRate:m.historyRate,
        observed:m.observed,overs:m.overs,historicalMean:m.historicalMean,
      })),
    }));
    const next=[...newRecords,...latest];
    try{
      localStorage.setItem(KEY,JSON.stringify(next));
      setSaved(next);
      setMessage(`${newRecords.length} análises registradas antes dos jogos. As anteriores foram preservadas, sem duplicatas. Confira os registros abaixo.`);
      futureFormRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
    }catch{
      setMessage('Não foi possível salvar as análises. Nenhum registro anterior foi alterado.');
    }
  }

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
    const latest=readSaved();
    if(latest.some(s=>s.matchAt.slice(0,10)===date&&s.competition===league&&normalizeTeam(s.home)===normalizeTeam(home.name)&&normalizeTeam(s.away)===normalizeTeam(away.name))){
      setMessage('Este confronto já possui uma previsão V2/V3 registrada. Ela permanecerá sem alterações.');return;
    }
    const record:Saved={
      key:crypto.randomUUID(),savedAt:new Date().toISOString(),matchAt,
      competition:league,home:home.name,away:away.name,
      homeCount:comparison.homeHistory.length,awayCount:comparison.awayHistory.length,
      venue:prospective,
      leagueContext:numericLeagueContext,
      markets:comparison.markets.map(m=>({
        id:m.id,label:m.label,line:m.line,historyRate:m.historyRate,
        observed:m.observed,overs:m.overs,historicalMean:m.historicalMean,
      })),
    };
    const next=[record,...latest].slice(0,50);
    try{localStorage.setItem(KEY,JSON.stringify(next));setSaved(next);setMessage('Análise prospectiva registrada neste navegador. Exporte o arquivo para conservar uma cópia.');}
    catch{setMessage('Não foi possível salvar no navegador. Libere espaço e tente novamente.');}
  }
  function removeSavedRecord(record:Saved){
    if(!window.confirm(`Excluir somente este registro pré-jogo de ${record.home} × ${record.away} (${record.matchAt.slice(0,10)})?\n\nOs jogos da base e os demais registros serão preservados. A exclusão só poderá ser desfeita com uma cópia JSON anterior.`))return;
    const latest=readSaved();
    if(!latest.some(v=>v.key===record.key)){
      setSaved(latest);
      setMessage('Este registro não está mais salvo neste navegador. Os demais foram preservados.');
      return;
    }
    const next=latest.filter(v=>v.key!==record.key);
    try{
      localStorage.setItem(KEY,JSON.stringify(next));
      setSaved(next);
      setMessage('Somente o registro selecionado foi excluído. As partidas e os demais registros foram preservados.');
    }catch{
      setMessage('Não foi possível excluir o registro. Nenhum dado foi alterado.');
    }
  }

  async function restoreSaved(file?:File){
    if(!file)return;
    setMessage('');
    try{
      if(file.size>2_000_000||!file.name.toLowerCase().endsWith('.json'))throw Error('Selecione um JSON de previsões de até 2 MB.');
      const imported=parseRadarRecords(JSON.parse(await file.text()) as unknown);
      const onDisk=readSaved();
      const preview=mergeRadarRecords(onDisk,imported);
      if(preview.added===0){
        setSaved(onDisk);setMessage('Nenhuma previsão nova: todos os registros desse arquivo já estão salvos.');return;
      }
      if(!window.confirm(`Restaurar ${preview.added} previsões ausentes? Os registros atuais e a base histórica não serão substituídos.`))return;
      // Re-read just before saving, keeping the previous data in precedence.
      const merged=mergeRadarRecords(readSaved(),imported);
      localStorage.setItem(KEY,JSON.stringify(merged.entries));
      setSaved(merged.entries);
      setMessage(`${merged.added} previsões restauradas. ${merged.skipped} duplicadas ou excedentes ignoradas; as existentes foram preservadas.`);
    }catch(e){setMessage(e instanceof Error?e.message:'Falha ao restaurar previsões. Nada foi substituído.');}
    finally{if(restoreInput.current)restoreInput.current.value='';}
  }
  function exportSaved(){
    if(!saved.length)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(saved,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='futstats-radar-registros.json';a.click();
    URL.revokeObjectURL(url);
  }
  const roundStatuses=brasileiraoRound32.map(f=>{
    const i=saved.findIndex(r=>r.matchAt.slice(0,10)===f.date&&
      normalizeTeam(r.home)===normalizeTeam(f.home)&&
      normalizeTeam(r.away)===normalizeTeam(f.away)&&r.competition.trim()===f.competition.trim());
    const result=i>=0?settlements[i]:null;
    const complete=result?.status==='complete'&&result.markets.some(m=>
      [m.v2,m.v3].some(v=>v==='Acertou'||v==='Errou'));
    const status=i<0?'missing':complete?'scored':result?.status==='complete'?'insufficient':result?.status??'pending';
    const label=({
      missing:'Sem previsão',scored:'Conferido',insufficient:'Estatísticas insuficientes',
      future:'Aguardando jogo',pending:'Aguardando resultado',
      ambiguous:'Revisar dados',late:'Registrado após início',legacy:'Previsão antiga',
    } as Record<string,string>)[status]??'Em análise';
    return {f,status,label};
  });
  const registered=roundStatuses.filter(x=>x.status!=='missing').length;
  const evaluated=roundStatuses.filter(x=>x.status==='scored').length;
  return <section className="radar-upcoming" aria-label="Radar para jogos futuros">
    {view==='new'&&<>
          <h3 id="radar-new-forecast" ref={futureFormRef} tabIndex={-1}>1 · Criar previsão para um jogo futuro</h3>
     <p className="radar-form-help">Esta é a seção certa para nossos testes diários. <strong>Escolha primeiro o campeonato. Depois selecione mandante, visitante, data e hora.</strong> Os sinais V2 e V3 aparecerão abaixo; só serão salvos ao tocar no botão de confirmação.</p>
     <p className="radar-form-help">A agenda opcional fica abaixo deste formulário. Para outras ligas, como a Bundesliga, selecione as equipes aqui e confira data e horário na fonte.</p>
     <details className="radar-v2v3-explain"><summary>O que significam V2, V3 e “Sem sinal”?</summary>
       <p><b>V2:</b> faz uma projeção utilizando jogos anteriores das equipes, respeitando mando de campo e temporada, e exige uma margem em relação à linha do indicador.</p>
       <p><b>V3:</b> verifica se o histórico de ambas as equipes confirma o sinal da V2. Se não confirmar, pode mostrar “Sem sinal”.</p>
       <p><b>Sem sinal:</b> não há informação suficiente ou as regras não indicam Over/Under com clareza. Isso não significa previsão errada, nem recomendação para apostar.</p>
     </details>
    {calendarSelection&&<p role="status" className="notice">Jogo selecionado: {calendarSelection}. Confira abaixo as previsões V2/V3. Nada foi registrado ainda.</p>}
    <p className="muted">Selecione um jogo que ainda não começou. As análises utilizam apenas partidas anteriores, sem saber o resultado do confronto. Os horários desta seção seguem Brasília.</p>
    <div className="analysis-controls radar-fixture-form">
      <label>1. Competição / temporada
        <select aria-label="Competição futura" value={league} onChange={e=>{setLeague(e.target.value);setIds(['','']);setCalendarSelection('');setMessage('');}}>
          <option value="">Escolha primeiro a competição</option>{leagues.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <p className="radar-league-team-count" role="status">{league
        ?`${leagueTeams.length} equipes encontradas nesta competição e temporada.`
        :'Escolha uma competição para liberar as equipes.'}</p>
      <label>2. Mandante
        <select aria-label="Mandante futuro" disabled={!league} value={home?.id??''}
          onChange={e=>{setIds([e.target.value,ids[1]===e.target.value?'':ids[1]]);setCalendarSelection('');}}>
          <option value="">Selecione o mandante</option>
          {leagueTeams.filter(t=>t.id!==ids[1]).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      <label>3. Visitante
        <select aria-label="Visitante futuro" disabled={!league} value={away?.id??''}
          onChange={e=>{setIds([ids[0]===e.target.value?'':ids[0],e.target.value]);setCalendarSelection('');}}>
          <option value="">Selecione o visitante</option>
          {leagueTeams.filter(t=>t.id!==ids[0]).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      <label>4. Data do jogo
        <input aria-label="Data futura" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
      </label>
      <label>5. Hora de Brasília
        <input aria-label="Hora futura" type="time" value={time} onChange={e=>setTime(e.target.value)}/>
      </label>
    </div>
    {alreadySavedSelected&&<p className="notice" role="status"><strong>Este confronto já tem uma previsão salva.</strong> Não registre novamente: consulte em “Ver previsões já registradas”. O registro anterior foi preservado.</p>}
    {league&&!leagueTeams.length&&<p className="alert">Ainda não há equipes desta competição na base. Importe jogos dessa temporada antes de registrar a análise.</p>}
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
      <div className="radar-venue-prospective" aria-label="Previsões futuras V2 e V3">
        <h4>Previsão deste jogo · V2 e V3 (ainda não salva)</h4>
        {prospective.map(m=><div className="forecast-line" key={m.marketId}><b>{m.label}</b><div><span>V2 <Signal value={m.v2}/></span><span>V3 <Signal value={m.v3}/></span></div><NumericReferences line={m.line} history={comparison.markets.find(x=>x.id===m.marketId)} league={numericLeagueContext.find(x=>x.id===m.marketId)} projected={m.projectedTotal}/></div>)}
        {comparison.markets.filter(m=>m.id==='corners-full-8.5').map(m=><div className="forecast-line" key={m.id}><b>Escanteios · partida completa</b><span>Histórico disponível · sem sinal V2/V3 nesta versão</span><NumericReferences line={m.line} history={m} league={numericLeagueContext.find(x=>x.id===m.id)}/></div>)}
      </div>
      <p className="muted">Estas previsões só serão registradas ao confirmar. Depois de salvas, não serão recalculadas com resultados futuros.</p>
      <p className="muted">Frequências observadas em amostras pequenas; não são probabilidades de sucesso, nem indicações de apostar. Nenhuma odd foi consultada.</p>
      <button type="button" className="primary" disabled={alreadySavedSelected} onClick={saveSnapshot}>{alreadySavedSelected?'Previsão já registrada':'Salvar previsão V2/V3 deste jogo'}</button>
    </div>}
    {message&&<p role="status" className="notice">{message}</p>}

      <details className="radar-extra-agenda">
        <summary>Consultar agenda de jogos (opcional)</summary>
        <p className="muted">Se o jogo ainda não estiver na agenda, use os campos da previsão acima.</p>
            <CalendarAgenda onSelect={useCalendarFixture} availableTeams={teams.map(t=>t.name)}/>

      </details>
    </>}
    {view==='saved'&&<>
          <div className="radar-hero">
      <span className="radar-hero-eyebrow">RADAR EXPERIMENTAL · V2 + V3</span>
      <h3>Antecipe. Registre. Compare.</h3>
      <p>Confira a agenda, acompanhe os sinais e compare as previsões com os resultados quando os jogos terminarem.</p>
      <div className="radar-hero-stats"><span><strong>{data.matches.length}</strong> partidas na base</span><span><strong>{saved.length}</strong> registros pré-jogo</span></div>
    </div>

          <section className="round-tracker" aria-label="Acompanhamento da rodada 32">
      <div className="round-tracker-head"><div><span className="quick-eyebrow">ACOMPANHAMENTO</span><h3>Rodada 32 · Seus resultados</h3></div><span className="round-tracker-date">23–26 OUT</span></div>
      <div className="round-tracker-metrics">
        <div><strong>{registered}/10</strong><span>Previsões registradas</span></div>
        <div><strong>{evaluated}/10</strong><span>Jogos avaliados</span></div>
        <div><strong>{registered-evaluated}</strong><span>Em acompanhamento</span></div>
      </div>
      <p className="muted">As previsões ficam congeladas. A conferência aparece aqui depois que as estatísticas reais são importadas e validadas na base. Ainda não existe atualização automática de resultados.</p>
      <details className="round-tracker-details"><summary>Ver situação dos 10 confrontos</summary>
        <div className="round-tracker-list">{roundStatuses.map(({f,status,label})=><div key={f.id} className="round-tracker-row">
          <div><b>{f.home} × {f.away}</b><small>{f.date} · {f.time??'N/D'} (Brasília)</small></div>
          <span className="round-state-pill" data-state={status}>{label}</span>
        </div>)}</div>
      </details>
    </section>

          <div className="radar-saved" id="radar-saved-forecasts">
      <h4>2 · Previsões salvas e acompanhamento ({saved.length})</h4>
       <p className="muted">Aqui ficam os testes registrados antes das partidas. Para criar um novo, use o primeiro atalho do topo.</p>
      <div className="radar-record-actions">
        {saved.length>0&&<button type="button" className="text-button" onClick={exportSaved}>Exportar registros JSON</button>}
        <label className="radar-record-import">Restaurar registros JSON
          <input ref={restoreInput} aria-label="Restaurar registros JSON" type="file" accept=".json,application/json"
            onChange={e=>{void restoreSaved(e.currentTarget.files?.[0]);}}/>
        </label>
      </div>
      <section className="radar-followup" aria-label="Painel de acompanhamento das previsões">
        <h5>Resultados dos testes registrados · V2 e V3</h5>
        <p className="muted">Acompanhe as previsões congeladas antes das partidas. Os acertos só aparecem após importar resultados reais e validados.</p>
        <div className="radar-followup-kpis">
          {[
            {label:'Registros',count:followup.counts.total},
            {label:'Aguardando jogo',count:followup.counts.future},
            {label:'Aguardando resultado',count:followup.counts.pending},
            {label:'Jogos avaliados',count:followup.counts.scored},
            {label:'Revisar / N/D',count:followup.counts.review},
          ].map(item=><div key={item.label}><strong>{item.count}</strong><span>{item.label}</span></div>)}
        </div>
        <div className="radar-followup-scroll">
          <table className="radar-followup-table">
            <thead><tr><th scope="col">Mercado</th><th scope="col">Sinais V2</th><th scope="col">Acertos V2</th><th scope="col">Sinais V3</th><th scope="col">Acertos V3</th></tr></thead>
            <tbody>{followup.byMarket.map(m=><tr key={m.id}>
              <th scope="row">{m.label}</th>
              <td>{m.v2Signals}</td><td>{evaluatedScore(m.v2Correct,m.v2Evaluated)}</td>
              <td>{m.v3Signals}</td><td>{evaluatedScore(m.v3Correct,m.v3Evaluated)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="radar-followup-cards" aria-label="Sinais e acertos por mercado no celular">
          {followup.byMarket.map(m=><article className="radar-followup-card" key={m.id}>
            <h6>{m.label}</h6>
            <div className="radar-followup-card-versions">
              <div>
                <b>Radar V2</b>
                <span>Sinais <strong>{m.v2Signals}</strong></span>
                <span>Acertos <strong>{evaluatedScore(m.v2Correct,m.v2Evaluated)}</strong></span>
              </div>
              <div>
                <b>Radar V3</b>
                <span>Sinais <strong>{m.v3Signals}</strong></span>
                <span>Acertos <strong>{evaluatedScore(m.v3Correct,m.v3Evaluated)}</strong></span>
              </div>
            </div>
          </article>)}
        </div>
        <p className="muted">Sinais = previsões Over/Under feitas antes do jogo. Acertos = somente sinais com resultado conferido. N/D significa que ainda não há resultado válido; não equivale a erro ou acerto.</p>
        <details className="radar-followup-baselines">
          <summary>Comparar com referências sempre Over e sempre Under</summary>
          <p>V2: {scoreText(scores.v2)} · sempre Over nos mesmos sinais: {scoreText(scores.alwaysOverV2)} · sempre Under: {scoreText(scores.alwaysUnderV2)}</p>
          <p>V3: {scoreText(scores.v3)} · sempre Over nos mesmos sinais: {scoreText(scores.alwaysOverV3)} · sempre Under: {scoreText(scores.alwaysUnderV3)}</p>
          <p className="muted">Mercados diferentes não são jogos independentes. Amostras pequenas não comprovam capacidade preditiva.</p>
        </details>
        <label className="radar-followup-filter">Filtrar registros
          <select aria-label="Filtrar registros pré-jogo por situação" value={recordFilter} onChange={e=>setRecordFilter(e.target.value as FollowupFilter)}>
            <option value="all">Todos ({followup.counts.total})</option>
            <option value="future">Aguardando jogo ({followup.counts.future})</option>
            <option value="pending">Aguardando resultado ({followup.counts.pending})</option>
            <option value="scored">Jogos avaliados ({followup.counts.scored})</option>
            <option value="review">Revisar / N/D ({followup.counts.review})</option>
          </select>
        </label>
      </section>
      {saved.length===0?<p className="muted">Nenhum registro salvo neste navegador.</p>:<>
        {visibleSaved.length===0&&<p className="muted">Nenhum registro nesta situação. Selecione "Todos" para ver os demais.</p>}
        <ul>
        {visibleSaved.map(({record:v,index:i})=>{
          const settled=settlements[i];
          const status={future:'Aguardando jogo',pending:'Aguardando resultado na base',ambiguous:'Resultado com data ou identidade ambígua',late:'Registro posterior ao início (não pontua)',legacy:'Registro antigo — sem V2/V3',complete:'Resultado disponível'}[settled.status];
          return <li key={v.key}><b>{v.home} × {v.away}</b>
            <small>{v.matchAt.replace('T',' ')} · {v.competition} · registrado {new Date(v.savedAt).toLocaleString('pt-BR')} · {v.homeCount}+{v.awayCount} jogos históricos</small>
            <p className="record-status" data-state={settled.status}>{status}</p>
            {v.venue?.map(m=>{
              const result=settled.markets.find(s=>s.marketId===m.marketId);
              return <div className="saved-market" key={m.marketId}>
                <b>{m.label}</b><span>V2 <Signal value={m.v2}/>{result?' · '+result.v2:''}</span>
                <span>V3 <Signal value={m.v3}/>{result?' · '+result.v3:''}</span>
                <NumericReferences line={m.line} history={v.markets.find(x=>x.id===m.marketId)}
                  league={v.leagueContext?.find(x=>x.id===m.marketId)} projected={m.projectedTotal}
                  legacy={!v.leagueContext}/>
              </div>;
            })}
            {v.markets.filter(m=>m.id==='corners-full-8.5').map(m=><div className="saved-market" key={m.id}>
              <b>Escanteios · partida completa</b><span>Histórico salvo · sem sinal V2/V3</span>
              <NumericReferences line={m.line} history={m}
                league={v.leagueContext?.find(x=>x.id===m.id)} legacy={!v.leagueContext}/>
            </div>)}
            <button type="button" className="radar-record-delete" aria-label={`Excluir apenas o registro pré-jogo ${v.home} × ${v.away} de ${v.matchAt.slice(0,10)}`} onClick={()=>removeSavedRecord(v)}>Excluir somente este registro</button>
          </li>;
        })}
      </ul></>}
    </div>
    <p className="muted">Previsões V2/V3 ficam congeladas neste navegador. O backup completo agora inclui os jogos e os registros pré-jogo; o JSON separado do Radar permanece disponível. A conferência exige resultados reais validados na base; ainda não há consulta automática de resultados.</p>

      <details className="radar-extra-bulk">
        <summary>Ferramenta opcional · registro em lote da rodada 32</summary>
            <div className="radar-bulk-round" aria-label="Registro da rodada 32">
      <h3>Teste da rodada 32 · Registro em lote</h3>
      <p className="muted">Registre os jogos restantes de uma só vez, usando os mesmos cálculos V2/V3 já disponíveis no Radar. Os registros ficam congelados antes do início; confrontos já registrados não serão substituídos. A agenda é uma referência estática e deve ser conferida na fonte.</p>
      <p className="round-count"><strong>{bulkCount}</strong> jogos novos disponíveis para registrar <small>Limite de 50 previsões no navegador</small></p>
      {bulkCount>0&&<details>
        <summary>Conferir previsões antes de registrar</summary>
        {roundPlans.slice(0,bulkCount).map(p=><div key={p.f.id}>
          <p><b>{p.f.home} × {p.f.away}</b> · {p.f.date} às {p.f.time} (Brasília)</p>
          {p.venue.map(m=><p className="bulk-market" key={m.marketId}><small>{m.label}</small><span>V2 <Signal value={m.v2}/> V3 <Signal value={m.v3}/></span></p>)}
        </div>)}
      </details>}
      <button type="button" className="primary" disabled={bulkCount===0} onClick={registerRound}>
        Registrar {bulkCount} {bulkCount===1?'análise':'análises'} da rodada 32
      </button>
      <p className="muted">O botão grava apenas no navegador, sem apostas nem alterações nas 299 partidas. Ao importar os resultados futuramente, o Radar comparará as previsões salvas com os valores realizados.</p>
    </div>

      </details>
    </>}
  </section>;
}
