import {useMemo,useState} from 'react';
import type {Data} from './model';
import type {SavedRadarRecord} from './radarRecords';
import {auditDailyGoodPicks} from './dailyGoodAudit';
import {exportDailyGoodEvidenceCsv} from './dailyGoodEvidenceExport';
import {buildIndependentReviewQueue,exportIndependentReviewQueueCsv} from './dailyGoodIndependentReview';
import {documentaryTemplate,parseDocumentaryEvidence,reconcileDocumentaryEvidence,type DocumentaryComparison,type ExternalEvidence} from './dailyGoodEvidenceCompare';
import {createDocumentaryDossier,inspectDocumentaryDossier} from './dailyGoodDossier';
import {buildProspectiveCohortPlan,exportProspectiveCohortCsv,MIN_EXTERNAL_FIXTURES_PER_LEAGUE} from './dailyGoodProspectiveCohorts';

const fmt=(n:number|null)=>n===null?'N/D':n.toLocaleString('pt-BR',{maximumFractionDigits:1});
const ratio=(a:number,b:number)=>!b?'N/D':b<20?a+'/'+b+' (amostra pequena; taxa N/D)':a+'/'+b+' ('+(100*a/b).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%)';
const labels={
 legacy:'Registro Radar geral (não atribuído à lista)',
 invalid:'Snapshot sem comprovação íntegra',
 late:'Registrado após o início',
 future:'Aguardando jogo',
 waiting:'Aguardando resultado',
 ambiguous:'Partida ou registro ambíguo',
 source_missing:'Resultado sem fonte CSV validável',
 scored:'Comparação disponível'
};
export default function DailyGoodAuditPanel({data,records}:{
 data:Data;records:readonly SavedRadarRecord[];
}){
 const report=useMemo(()=>auditDailyGoodPicks(data,records),[data,records]);
 const independentQueue=buildIndependentReviewQueue(records,report);
 const cohort=buildProspectiveCohortPlan(records,report,independentQueue);
 const duplicatedSources=report.rows.filter(r=>
  r.status==='ambiguous'&&r.reason.includes('ID da fonte CSV reutilizado')).length;
 const futureImports=report.rows.filter(r=>
  r.status==='source_missing'&&r.reason.includes('data futura')).length;
 const [documentary,setDocumentary]=useState<DocumentaryComparison|null>(null);
 const [documentarySource,setDocumentarySource]=useState<ExternalEvidence|null>(null);
 const [dossierNotice,setDossierNotice]=useState('');
 const [documentationNotice,setDocumentationNotice]=useState('');
 const readyForEvidence=new Set(independentQueue.entries
  .filter(x=>x.state==='check_external').map(x=>x.key));
 function downloadFile(name:string,content:string,type:string){
  const url=URL.createObjectURL(new Blob([content],{type}));
  try{
   const a=document.createElement('a');
   a.href=url;a.download=name;
   document.body.appendChild(a);a.click();a.remove();
  }finally{URL.revokeObjectURL(url);}
 }
 function downloadDocumentaryTemplate(key:string){
  const record=records.find(r=>r.key===key);
  if(!record||!readyForEvidence.has(key))return;
  try{
   const json=documentaryTemplate(record,report);
   downloadFile('futstats-segunda-fonte-modelo.json',json,'application/json;charset=utf-8');
   setDocumentationNotice('Modelo vazio gerado. Preencha somente após consultar outra fonte real.');
  }catch(e){
   setDocumentationNotice(e instanceof Error?e.message:'Modelo não disponível.');
  }
 }
 async function loadDocumentary(file?:File){
  setDocumentary(null);setDocumentarySource(null);setDossierNotice('');setDocumentationNotice('');
  if(!file)return;
  try{
   if(file.size>200_000||!file.name.toLowerCase().endsWith('.json'))
    throw Error('Selecione um JSON documental de até 200 KB.');
   const input=JSON.parse(await file.text()) as unknown;
   const source=parseDocumentaryEvidence(input);
   const comparison=reconcileDocumentaryEvidence(source,records,report);
   if(!readyForEvidence.has(comparison.recordKey))
    throw Error('Partida ainda não liberada para comparação documental.');
   setDocumentary(comparison);setDocumentarySource(source);
   setDocumentationNotice('Valores informados comparados apenas nesta tela, sem salvar ou verificar páginas na internet.');
  }catch(e){
   setDocumentationNotice(e instanceof Error?e.message:'Arquivo recusado; nenhuma previsão foi alterada.');
  }
 }


 async function exportDocumentaryDossier(){
  setDossierNotice('');
  if(!documentarySource||!documentary)return;
  try{
   const json=await createDocumentaryDossier(documentarySource,records,report);
   downloadFile('futstats-dossie-comparacao-local.json',json,'application/json;charset=utf-8');
   setDossierNotice('Dossiê gerado localmente. SHA-256 confere integridade, não autenticidade externa.');
  }catch(e){
   setDossierNotice(e instanceof Error?e.message:'Não foi possível criar o dossiê.');
  }
 }
 async function openDocumentaryDossier(file?:File){
  setDossierNotice('');
  if(!file)return;
  try{
   if(file.size>300_000||!file.name.toLowerCase().endsWith('.json'))
    throw Error('Selecione um dossiê JSON com até 300 KB.');
   const loaded=JSON.parse(await file.text()) as unknown;
   const examined=await inspectDocumentaryDossier(loaded,records,report);
   if(!readyForEvidence.has(examined.comparison.recordKey))
    throw Error('O registro do dossiê não está mais apto para revisão.');
   setDocumentary(examined.comparison);
   setDocumentarySource(examined.source);
   setDossierNotice('Integridade SHA-256 consistente com os dados locais atuais. DOCUMENTAÇÃO NÃO VERIFICADA NA WEB; verificação externa PENDENTE.');
  }catch(e){
   setDossierNotice(e instanceof Error?e.message:'Dossiê recusado.');
  }
 }

 function exportReviewQueue(){
  if(independentQueue.entries.length===0)return;
  const csv=exportIndependentReviewQueueCsv(independentQueue);
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  try{
   const a=document.createElement('a');
   a.href=url;
   a.download='futstats-fila-verificacao-resultados.csv';
   document.body.appendChild(a);a.click();a.remove();
  }finally{URL.revokeObjectURL(url);}
 }
 function exportCohort(){
  const csv=exportProspectiveCohortCsv(cohort);
  downloadFile('futstats-amostras-prospectivas-por-liga.csv',csv,
    'text/csv;charset=utf-8');
 }
 function exportLedger(){
  if(report.attributed===0)return;
  const text=exportDailyGoodEvidenceCsv(records,report);
  const url=URL.createObjectURL(new Blob([text],{
   type:'text/csv;charset=utf-8'
  }));
  try{
   const link=document.createElement('a');
   link.href=url;
   link.download='futstats-as-boas-acompanhamento.csv';
   document.body.appendChild(link);
   link.click();
   link.remove();
  }finally{URL.revokeObjectURL(url);}
 }
 return <section aria-label="Validação prospectiva As Boas do Dia" className="daily-good-audit">
  <h4>Validação de “As Boas do Dia” · experimental</h4>
  <p className="muted">Somente escolhas feitas na própria lista e salvas antes do início
   entram na avaliação. O sistema não atribui à lista previsões antigas ou criadas
   diretamente no Radar. Nenhuma previsão congelada é recalculada.</p>
  <p className="muted">{report.attributed} registro(s) com identificação da lista ·
   {' '}{report.scoredFixtures} confronto(s) com resultado e ao menos um indicador informado.
   {' '}Ausência de amostra aparece como N/D, nunca como taxa de acerto.</p>
  <section className="daily-good-cohorts"
    aria-label="Controle de amostras prospectivas por campeonato">
    <h5>Amostras prospectivas · por campeonato</h5>
    <p className="muted" role="status">
      {cohort.totalEligibleLocal} jogo(s) distinto(s) elegível(is) nos registros
      locais pré-jogo · {cohort.totalLocalResults} com indicador do CSV local
      para revisar · <strong>0 resultado(s) verificado(s) independentemente</strong>.
      Qualidade preditiva: <strong>N/D</strong>.
    </p>
    <p className="muted">A meta de avaliação é pelo menos
      {' '}{MIN_EXTERNAL_FIXTURES_PER_LEAGUE} partidas distintas,
      com previsões realmente salvas antes do jogo e resultados confrontados
      de forma independente, <strong>em cada campeonato</strong>.
      Ter 30 registros no navegador, 30 CSVs locais ou arquivos de segunda fonte
      apenas informados <strong>não completa essa meta</strong>.
    </p>
    <button type="button" className="text-button" onClick={exportCohort}>
      Exportar acompanhamento por campeonato (CSV)
    </button>
    {cohort.leagues.length===0
     ?<p className="muted">Nenhuma indicação prospectiva atribuída à lista neste
        navegador. Amostra verificada: 0/30 por campeonato · desempenho N/D.
        As previsões antigas do Radar não entram nessa contagem.</p>
     :<div className="radar-market-table">
       <table className="analysis-table">
        <caption>Preparação da amostra · nunca comprovação de acurácia</caption>
        <thead><tr>
          <th>Campeonato</th><th>Registros locais elegíveis</th>
          <th>Resultados locais para conferir</th>
          <th>Confirmados externamente</th><th>Faltam verificar</th>
        </tr></thead>
        <tbody>{cohort.leagues.map(l=><tr key={l.league}>
          <th>{l.league}
            <small>{l.attributed} indicação(ões) · {l.excluded}
              {' '}excluída(s) · {l.awaitKickoff} aguardando jogo ·
              {' '}{l.needsLocalResult} aguardando dado local</small>
          </th>
          <td>{l.eligibleLocal}</td>
          <td>{l.localResults} · PENDENTE</td>
          <td>0/{MIN_EXTERNAL_FIXTURES_PER_LEAGUE} · N/D</td>
          <td>{l.missingExternal}</td>
        </tr>)}</tbody>
       </table>
      </div>}
    <p className="muted">Este controle lê apenas registros e resultados deste
      navegador. Não consulta sites externos, não atesta a veracidade de datas
      gravadas localmente, não restaura arquivos e não altera previsões,
      histórico ou backups. O status externo permanece <strong>PENDENTE</strong>.
    </p>
  </section>
  {(duplicatedSources>0||futureImports>0)&&<div className="daily-good-data-warnings"
   role="status" aria-label="Resultados locais bloqueados por procedência">
    <strong>Resultados locais não utilizados na avaliação</strong>
    <p className="muted">{duplicatedSources} resultado(s) bloqueado(s) por
      ID de fonte CSV reutilizado · {futureImports} resultado(s) com
      data de importação futura. Esses registros não entram nas taxas nem
      autorizam comparação de segunda fonte. Confira os arquivos de
      origem; o FutStats não altera nem exclui os dados originais.</p>
  </div>}
  {report.attributed>0&&<div className="daily-good-ledger">
   <button type="button" className="text-button" onClick={exportLedger}>
    Exportar controle das indicações (CSV)
   </button>
   <p className="muted">Arquivo local de acompanhamento: inclui a previsão salva,
    a origem datada e os motivos de exclusão ou espera. Um resultado com fonte
    CSV é apenas um registro local; a coluna “verificação externa independente”
    permanece <strong>PENDENTE</strong> até conferência real. Este CSV não restaura
    previsões: conserve também o backup JSON integral.</p>
  </div>}
  {independentQueue.entries.length>0&&<section
    className="daily-good-review" aria-label="Fila de verificação independente dos resultados">
    <h5>Conferência independente · lista de trabalho</h5>
    <p className="muted" role="status">
      {independentQueue.checkExternal} com CSV local para conferir ·
      {' '}{independentQueue.needLocalResult} aguardando dados locais ·
      {' '}{independentQueue.awaitKickoff} aguardando jogo/finalização ·
      {' '}{independentQueue.excluded} excluído(s) da avaliação.
    </p>
    <p className="muted">Nenhuma partida é considerada externamente conferida.
      Ter resultado em CSV significa apenas que existe um registro local.
      A conferência independente exige consultar uma segunda fonte e comparar
      os indicadores; links e downloads <strong>não</strong> comprovam essa etapa.</p>
    <button type="button" className="text-button" onClick={exportReviewQueue}>
      Exportar fila de conferência (CSV)
    </button>
    <details className="daily-good-review-list">
      <summary>Ver prioridades de verificação ({independentQueue.entries.length})</summary>
      <ol>{independentQueue.entries.slice(0,8).map(e=><li key={e.key}>
        <b>{e.home} × {e.away}</b>{' · '}{e.matchAt.replace('T',' · ')}
        {' · '}<strong>{e.state==='check_external'
          ?'Conferir resultado com outra fonte'
          :e.state==='need_local_result'?'Resultado local pendente'
          :e.state==='await_kickoff'?'Aguardar fim da partida'
          :'Registro excluído da amostra'}</strong>
        <p className="muted">{e.reason}. Verificação independente:
          <strong> PENDENTE</strong>.</p>
        {e.state!=='excluded'&&e.officialUrl&&<a href={e.officialUrl}
          target="_blank" rel="noopener noreferrer">Ver referência oficial do jogo</a>}
        {e.state==='check_external'&&<p>
          <button type="button" className="text-button"
            onClick={()=>downloadDocumentaryTemplate(e.key)}>
            Modelo vazio para comparar este jogo
          </button>
        </p>}
        {e.state==='check_external'&&e.csvSourceUrl&&<p><a href={e.csvSourceUrl}
          target="_blank" rel="noopener noreferrer">Conferir origem do resultado CSV</a></p>}
      </li>)}</ol>
      {independentQueue.entries.length>8&&<p className="muted">
        Outros {independentQueue.entries.length-8} registros estão no CSV exportável.
      </p>}
    </details>
    {independentQueue.checkExternal>0&&<div className="daily-good-documentary-compare">
      <h6>Comparação documental de segunda fonte</h6>
      <p className="muted">Depois de conferir pessoalmente uma fonte independente,
        complete o modelo JSON deste jogo com URL, horário UTC da consulta
        e valores dos indicadores. O aplicativo compara os números, mas
        <strong> não acessa nem autentica a página externa</strong>. Mesmo quando
        coincidem, a verificação real permanece PENDENTE.</p>
      <label>Carregar valores documentados de segunda fonte (JSON)
        <input aria-label="Carregar comparação de segunda fonte (JSON)"
          type="file" accept=".json,application/json"
          onChange={e=>{void loadDocumentary(e.currentTarget.files?.[0]);e.currentTarget.value='';}}/>
      </label>
      {documentationNotice&&<p role="status" className="muted">{documentationNotice}</p>}
      {documentary&&documentarySource&&<div className="daily-good-dossier">
        <button type="button" className="text-button"
          onClick={()=>{void exportDocumentaryDossier();}}>
          Exportar dossiê local da comparação (JSON)
        </button>
        <p className="muted">O dossiê inclui previsão congelada, resultado CSV local,
          documento da segunda fonte informada e comparação. SHA-256 serve para
          detectar alterações acidentais, <strong>não é assinatura digital nem
          prova de consulta ao site</strong>. O arquivo não restaura dados.</p>
      </div>}
      <label>Reabrir dossiê local para conferir integridade (JSON)
        <input type="file" accept=".json,application/json"
          aria-label="Conferir integridade do dossiê (JSON)"
          onChange={e=>{void openDocumentaryDossier(e.currentTarget.files?.[0]);e.currentTarget.value='';}}/>
      </label>
      {dossierNotice&&<p role="status" className="muted">{dossierNotice}</p>}
      {documentary&&<div role="region" aria-label="Resultado da comparação documental">
        <strong>{documentary.fixture}</strong>
        <p className="muted">{documentary.conclusion} ·
          {' '}{documentary.agreement} coincide(m),
          {' '}{documentary.disagreement} diverge(m),
          {' '}{documentary.unknown} N/D. Status: PENDENTE.</p>
        <div className="radar-market-table"><table className="analysis-table">
          <thead><tr><th>Indicador</th><th>CSV local</th>
            <th>Segunda fonte informada</th><th>Comparação</th></tr></thead>
          <tbody>{documentary.markets.map(m=><tr key={m.id}>
            <th>{m.label}</th>
            <td>{fmt(m.local)}</td><td>{fmt(m.reported)}</td>
            <td>{m.status}</td>
          </tr>)}</tbody>
        </table></div>
      </div>}
    </div>}
    <p className="muted">A fila é calculada somente ao abrir o Radar, sem consultar
      fontes em segundo plano, gravar confirmações nem alterar previsões ou backups.
      Estados inválidos e tardios permanecem excluídos.</p>
  </section>}
  {report.leagues.length===0?<p className="daily-good-empty">
    Sem registros prospectivos atribuíveis a “As Boas do Dia” até agora.
    Os registros antigos continuam preservados, mas não podem comprovar o desempenho da lista.
   </p>:<>
   <div className="radar-market-table"><table className="analysis-table">
    <caption>Comparação por campeonato · mesmas partidas e indicadores disponíveis</caption>
    <thead><tr><th>Campeonato</th><th>Jogos / sinais</th><th>V2/V3 concordantes</th><th>Referência sempre Over</th><th>Referência média pré-jogo</th></tr></thead>
    <tbody>{report.leagues.map(l=><tr key={l.league}>
     <th>{l.league}<small>{l.snapshots} registro(s), {l.missingMarkets} indicador(es) N/D</small></th>
     <td>{l.scoredFixtures} / {l.scoredMarkets}</td>
     <td>{ratio(l.picks.hits,l.picks.observed)}</td>
     <td>{ratio(l.constantOver.hits,l.constantOver.observed)}</td>
     <td>{ratio(l.historicalBaseline.hits,l.historicalBaseline.observed)}</td>
    </tr>)}</tbody>
   </table></div>
  </>}
  {report.leagues.length>0&&<div className="radar-market-table"><table className="analysis-table">
    <caption>Rastreio de todos os registros atribuídos — nenhum excluído vira acerto</caption>
    <thead><tr><th>Campeonato</th><th>Jogo futuro</th><th>Aguardando resultado</th>
      <th>Fonte/estatística pendente</th><th>Excluídos</th><th>Com resultado CSV documentado</th></tr></thead>
    <tbody>{report.leagues.map(l=><tr key={l.league}>
      <th>{l.league}</th>
      <td>{l.statusCounts.future}</td>
      <td>{l.statusCounts.waiting}</td>
      <td>{l.statusCounts.source_missing}</td>
      <td>{l.statusCounts.invalid+l.statusCounts.late+l.statusCounts.ambiguous}</td>
      <td>{l.statusCounts.scored} registro(s); {l.scoredFixtures} com indicador disponível</td>
    </tr>)}</tbody>
   </table></div>}
  <p className="muted">Para avaliar um eventual ajuste por campeonato, o protocolo exige pelo menos
   30 confrontos prospectivos distintos com resultados conferidos também na fonte externa.
   A tabela acima contém somente registros locais; <strong>não</strong> comprova essa meta,
   nem a qualidade preditiva dos modelos. Não existe acompanhamento automático em segundo plano.</p>
  {report.attributed>0&&<details className="fpl-pilot-disclosure">
   <summary>Conferir cada indicação registrada ({report.attributed})</summary>
   {report.rows.filter(r=>r.status!=='legacy').map(row=><article key={row.key} className="fpl-pilot-game">
    <strong>{row.home} × {row.away}</strong> <small>{row.matchAt.replace('T',' · ')} (Brasília)</small>
    <p className="muted">{labels[row.status]} · {row.reason}</p>
    {row.sourceUrl&&<p><a href={row.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir fonte cadastrada do resultado</a></p>}
    {row.markets.length>0&&<div className="radar-market-table"><table className="analysis-table">
      <thead><tr><th>Indicador</th><th>Sinal congelado</th><th>Resultado</th><th>Veredito</th><th>Amostra anterior</th></tr></thead>
      <tbody>{row.markets.map(m=><tr key={m.id}>
       <th>{m.label}</th><td>{m.direction} {fmt(m.line)}</td>
       <td>{fmt(m.actual)}</td><td>{m.v3}</td>
       <td>{m.historicalSample} jogos, {m.leagueSample} na liga</td>
      </tr>)}</tbody>
     </table></div>}
   </article>)}
  </details>}
  <p className="muted">Leitura dos dados do Histórico principal: fontes CSV cadastradas e
   validadas estruturalmente, sem conferência independente do conteúdo na internet.
   Resultados não documentados, divergentes ou incompletos não geram acertos.
   Comparação descritiva, com amostras pequenas e sinais correlacionados; não indica
   probabilidade real de acerto, rentabilidade ou recomendação de aposta.</p>
 </section>;
}
