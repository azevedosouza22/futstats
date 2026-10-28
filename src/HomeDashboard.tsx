import {useEffect,useState} from 'react';
import {
 Activity,ArrowLeftRight,ArrowUpRight,CalendarDays,CheckCircle2,ChevronRight,
 Clock3,Database,Flag,Goal,History,Shield,Star,Target,TrendingUp,Users
} from 'lucide-react';
import type {Data} from './model';
import {brasiliaDate,isUpcoming} from './calendar';
import {readOfficialCalendar} from './officialCalendar';
import {selectDailyGoodSignals} from './dailyGoodSignals';
import {loadResearchCatalog,type ResearchCatalog} from './researchCatalog';
import {homeHistoricalMarkets,homeLeagueCount} from './homeDashboardModel';

type Focus='agenda'|'picks';
type Props={
 data:Data;onNavigate:(page:number,focus?:Focus)=>void;
 onNewMatch:()=>void;
};
const number=(n:number)=>n.toLocaleString('pt-BR');
const ICONS=[Goal,TrendingUp,Target,Flag] as const;

/** Three concepts in one: sport-like agenda, readable fixture cards,
 * and an original dark dashboard with observed historical bars.
 * Everything is from real, labelled sources. No example bets or fabricated odds.
 */
export default function HomeDashboard({data,onNavigate,onNewMatch}:Props){
 const [research,setResearch]=useState<ResearchCatalog|null>(null);
 const [researchError,setResearchError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  void loadResearchCatalog(controller.signal).then(result=>{
   if(!controller.signal.aborted){setResearch(result);setResearchError('');}
  }).catch(err=>{
   if(!controller.signal.aborted)
    setResearchError(err instanceof Error?err.message:'Pesquisa indisponível.');
  });
  return ()=>controller.abort();
 },[]);
 const now=new Date();
 const today=brasiliaDate(now).date;
 const references=readOfficialCalendar(now);
 const dailyGood=selectDailyGoodSignals(data,references,now);
 const scheduled=references.filter(item=>item.fresh&&isUpcoming(item.fixture,now));
 const unique=new Set<string>();
 const upcoming=scheduled.filter(({fixture:f})=>{
  const key=[f.date,f.competition,f.home,f.away].join('|');
  if(unique.has(key))return false;
  unique.add(key);return true;
 }).sort((a,b)=>a.fixture.date.localeCompare(b.fixture.date)||
   (a.fixture.time??'99:99').localeCompare(b.fixture.time??'99:99')).slice(0,4);
 const source=research?.data??data;
 const markets=homeHistoricalMarkets(source);
 const leagueCount=homeLeagueCount(source);
 const statsDescription=research
  ?'Pesquisa histórica experimental · leitura, sem importação'
  :researchError
   ?'Pesquisa externa indisponível; exibindo apenas a base local'
   :'Carregando pesquisa histórica separada...';
 const counts=[
  {label:'Jogos na pesquisa',value:research?number(research.total):researchError?'N/D':'…',icon:Database,
   note:research?'Somente leitura':'Dados externos'},
  {label:'Ligas na pesquisa',value:research?number(leagueCount):researchError?'N/D':'…',icon:Activity,
   note:'Sem misturar temporadas'},
  {label:'Boas verificadas hoje',value:number(dailyGood.items.length),icon:Star,
   note:'Regras V2/V3 · histórico local'}
 ];
 return <div className="fs-home" aria-label="Painel inicial FutStats IA">
  <section className="fs-home-hero" aria-label="Visão geral da pesquisa">
   <div className="fs-home-hero-head">
    <div>
     <span className="fs-home-overline"><Activity size={15}/> FUTSTATS IA · PAINEL DE ANÁLISE</span>
     <h2>Seu futebol. Todos os números.</h2>
     <p>As Boas, agenda e histórico em um só lugar, com fontes e amostras identificadas.</p>
    </div>
    <span className="fs-home-date"><CalendarDays size={16}/>{today.split('-').reverse().join('/')}</span>
   </div>
   <div className="fs-home-kpis">
    {counts.map(item=><div className="fs-home-kpi" key={item.label}>
      <div className="fs-home-kpi-icon"><item.icon size={21}/></div>
      <span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small>
    </div>)}
   </div>
  </section>

  <section className="fs-home-panel fs-home-market" aria-label="Frequências históricas de mercados">
   <div className="fs-home-section-heading">
    <div><h2><TrendingUp size={23}/> Mercados no histórico</h2>
      <p>Frequência observada de Over no jogo completo, nunca probabilidade futura.</p>
    </div>
    <span className="fs-home-source">{research?'Pesquisa':researchError?'Local':'Carregando'}</span>
   </div>
   <p className="fs-home-source-note">{statsDescription}</p>
   <div className="fs-home-bars">
    {markets.map((market,i)=>{
      const Icon=ICONS[i];
      return <div className="fs-home-bar-row" key={market.metric}>
        <Icon size={18} aria-hidden="true"/>
        <div className="fs-home-bar-details">
          <div className="fs-home-bar-top">
            <span><strong>{market.label}</strong><small>{market.description}</small></span>
            <b>{market.percent===null?'N/D':market.percent+'%'}</b>
          </div>
          <div className="fs-home-bar-track" aria-hidden="true">
            <div style={{width:(market.percent??0)+'%'}}/>
          </div>
          <small>{market.observed>0
            ?number(market.over)+' de '+number(market.observed)+' jogos acima da linha'
            :'Sem amostra suficiente para a linha'}</small>
        </div>
      </div>;
    })}
   </div>
   <p className="fs-home-disclaimer">Os 48 registros com divergência de data, quando presentes
     na pesquisa, ficam fora das frequências. Valores ausentes não são considerados zero.</p>
  </section>

  <section className="fs-home-panel" aria-label="Resumo de As Boas do Dia">
   <div className="fs-home-section-heading">
    <div><h2><Star size={23}/> As Boas do Dia</h2>
      <p>Sinais existentes e conferidos; nenhuma sugestão é criada para preencher espaço.</p>
    </div>
    <button type="button" className="fs-home-more" onClick={()=>onNavigate(6,'picks')}>
      Ver todas <ChevronRight size={17}/>
    </button>
   </div>
   {dailyGood.items.length===0
    ?<div className="fs-home-empty">
      <Star size={23}/><div><strong>Nenhuma indicação qualificada no momento</strong>
      <p>{dailyGood.checked} jogo(s) elegíveis conferidos para hoje no histórico local.
      Consulte o Radar para detalhes e possíveis pendências de fonte.</p></div>
    </div>
    :<div className="fs-home-pick-list">{dailyGood.items.slice(0,3).map(item=>
      <button type="button" className="fs-home-pick" key={item.fixture.id}
        onClick={()=>onNavigate(6,'picks')}>
        <span className="fs-home-pick-league">{item.fixture.competition} · {item.fixture.time??'Horário N/D'} (Brasília)</span>
        <strong>{item.fixture.home} <span>×</span> {item.fixture.away}</strong>
        <span className="fs-home-line-chips">
          {item.signals.map(signal=><span key={signal.id}>{signal.label}</span>)}
        </span>
        <small>Fonte conferida em {item.verifiedAt.split('-').reverse().join('/')} ·
          análise histórica, não garantia de acerto</small>
      </button>)}</div>}
  </section>

  <section className="fs-home-panel" aria-label="Próximos confrontos da agenda verificada">
   <div className="fs-home-section-heading">
    <div><h2><CalendarDays size={23}/> Próximos confrontos</h2>
      <p>Referências oficiais registradas; horários podem mudar e não são tempo real.</p>
    </div>
    <button type="button" className="fs-home-more" onClick={()=>onNavigate(6,'agenda')}>
      Agenda <ChevronRight size={17}/>
    </button>
   </div>
   {upcoming.length===0
    ?<div className="fs-home-empty"><Clock3 size={23}/>
      <div><strong>Sem programação recente confirmada nesta consulta</strong>
      <p>Abra a Agenda para conferir calendários e atualizar fontes.</p></div>
    </div>
    :<div className="fs-home-fixtures">{upcoming.map(item=>
      <button type="button" className="fs-home-fixture" key={item.fixture.id}
       onClick={()=>onNavigate(6,'agenda')}>
        <span className="fs-home-fixture-clock">
          <strong>{item.fixture.time??'N/D'}</strong>
          <small>{item.fixture.date.split('-').reverse().join('/')}</small>
        </span>
        <span className="fs-home-fixture-teams">
          <small>{item.fixture.competition}</small>
          <b>{item.fixture.home} <span>×</span> {item.fixture.away}</b>
          <small>Conferido em {item.verifiedAt.split('-').reverse().join('/')}</small>
        </span>
        <ChevronRight size={19}/>
      </button>)}</div>}
  </section>

  <section className="fs-home-panel" aria-label="Acesso rápido às ferramentas">
   <div className="fs-home-section-heading">
    <div><h2><CheckCircle2 size={23}/> Acesso rápido</h2>
      <p>Recursos existentes do FutStats, agora em cartões mais claros.</p></div>
   </div>
   <div className="fs-home-actions">
    <button type="button" onClick={()=>onNavigate(2)}><ArrowLeftRight size={23}/>
      <strong>Comparar</strong><small>Equipes e linhas</small><ArrowUpRight size={17}/></button>
    <button type="button" onClick={()=>onNavigate(6,'agenda')}><CalendarDays size={23}/>
      <strong>Agenda e Radar</strong><small>Partidas e previsões</small><ArrowUpRight size={17}/></button>
    <button type="button" onClick={()=>onNavigate(5)}><Target size={23}/>
      <strong>Pré-jogo</strong><small>Análise detalhada</small><ArrowUpRight size={17}/></button>
    <button type="button" onClick={()=>onNavigate(3)}><History size={23}/>
      <strong>Histórico</strong><small>Suas partidas</small><ArrowUpRight size={17}/></button>
   </div>
  </section>

  <div className="fs-home-footer">
    <div><Shield size={21}/><span><strong>Dados pessoais protegidos</strong>
      <small>Histórico local: {number(data.matches.length)} partidas ·
        sem mesclar automaticamente com a pesquisa</small></span></div>
    <button type="button" className="fs-home-more" onClick={()=>onNavigate(7)}>
      Segurança e backup <ChevronRight size={17}/>
    </button>
  </div>
  <button type="button" className="fs-home-new-match" onClick={onNewMatch}>
    <Users size={17}/> Cadastrar nova partida
  </button>
 </div>;
}
