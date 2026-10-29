import type {DailyPatternResult} from './dailyPatternSignals';
import type {ScheduledFixture} from './calendar';

const pct=(hits:number,total:number)=>total
 ?(100*hits/total).toLocaleString('pt-BR',{maximumFractionDigits:0})+'%':'N/D';
const number=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:1});
const periodName={first:'1º tempo',second:'2º tempo',full:'Jogo completo'};

/** Informational exploration; never writes predictions or claims betting value. */
export default function DailyPatternPicks({result,onPreview}:{
 result:DailyPatternResult;onPreview:(fixture:ScheduledFixture)=>void;
}){
 return <section className="daily-good-picks daily-pattern-picks"
   aria-label="Radar de Padrões experimental">
   <div className="daily-good-head">
     <h4>Radar Inteligente de Padrões <small>· V1 experimental</small></h4>
     <p className="muted">Procura linhas Over/Under em gols, finalizações,
       chutes no gol e escanteios, por equipe e total, nos três períodos.
       Considera os últimos jogos no mando e o que o adversário permitiu.
       <b> São padrões históricos, não estimativas calibradas de probabilidade nem dicas de aposta.</b>
     </p>
   </div>
   <p className="muted">Hoje: {result.date} · {result.verified} confronto(s) futuros
     com horário oficial recente, sem divergência, elegíveis à busca.</p>
   {result.items.length===0
     ?<p className="daily-good-empty">
       Nenhum padrão passou pelos critérios exploratórios neste conjunto
       de jogos verificados. O sistema não inventa indicações nem odds
       para preencher a lista.
      </p>
     :<div className="daily-good-list">
       {result.items.map(item=><article key={item.fixture.id} className="daily-good-item">
         <div className="daily-good-item-head">
           <strong>{item.fixture.home} × {item.fixture.away}</strong>
           <small>{item.fixture.competition} · {item.fixture.date} · {item.fixture.time} (Brasília)</small>
           <small>Referência oficial de {item.verifiedAt.split('-').reverse().join('/')}</small>
         </div>
         <ul className="daily-good-signals">
           {item.signals.map(s=><li key={s.id}>
             <b>{s.metricLabel} · {s.scopeLabel} · {periodName[s.period]}:
               {' '}{s.direction} {number(s.line)}</b>
             <small>Últimos {s.teamCount} no mando:
               {' '}{s.teamHits}/{s.teamCount} ({pct(s.teamHits,s.teamCount)})
               {' '}· últimos 5: {s.recentHits}/5 ({pct(s.recentHits,5)})</small>
             <small>Comportamento do adversário em seu mando:
               {' '}{s.opponentHits}/{s.opponentCount} ({pct(s.opponentHits,s.opponentCount)})
               {' '}· média da equipe {number(s.mean)} · referência adversária {number(s.opponentMean)}</small>
             <small>Odd: N/D · valor esperado: não avaliado · resultados futuros não conhecidos</small>
           </li>)}
         </ul>
         <button type="button" className="text-button" onClick={()=>onPreview(item.fixture)}>
           Conferir confronto no Radar (não salva o padrão)
         </button>
       </article>)}
      </div>}
   <p className="muted">Os critérios iniciais são 80% dos até 10 jogos recentes,
     pelo menos 4/5 e confirmação adversária de no mínimo 60%.
     São filtros exploratórios, sujeitos a padrões acidentais por múltiplas linhas.
     Nenhuma previsão é salva e nenhum resultado V2/V3 é alterado.
   </p>
 </section>;
}
