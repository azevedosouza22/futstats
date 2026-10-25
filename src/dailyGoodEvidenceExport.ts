/**
 * Portable read-only ledger of actual saved "As Boas do Dia" snapshots.
 *
 * NEVER calls APIs, reconstructs historical predictions, modifies browser data
 * or mistakes a structurally documented CSV score for independently checked
 * real-world evidence. Each line is one frozen signal (or one invalid snapshot).
 */
import type {SavedRadarRecord} from './radarRecords';
import type {PickAuditReport,PickAuditMarket} from './dailyGoodAudit';

const headings=[
 'registro_id','salvo_em_utc','inicio_brasilia','campeonato','mandante','visitante',
 'verificado_em','fonte_oficial','situacao_auditoria','motivo',
 'indicador_id','indicador','direcao_congelada','linha','projecao_v2',
 'media_historica_congelada','amostra_indicador','amostra_liga',
 'resultado_csv_local','veredito_csv_local','fonte_resultado_csv',
 'verificacao_externa_independente'
] as const;

/** All cells are quoted; an apostrophe prevents spreadsheet formula execution.
 * Keep original text intact otherwise, including links, accents and semicolons.
 */
function cell(input:unknown):string{
 const raw=input===null||input===undefined?'N/D':String(input);
 const safe=/^[\s\u0000-\u001f]*[=+\-@]/u.test(raw)?"'"+raw:raw;
 return '"'+safe.replace(/"/g,'""')+'"';
}
const encode=(cells:readonly unknown[])=>cells.map(cell).join(';');
const displayNumber=(number:number|null|undefined):number|string=>
 typeof number==='number'&&Number.isFinite(number)?number:'N/D';

/** Generate a standalone CSV, not a source of truth or a restore/archive file.
 * For every row, external verification remains PENDENTE, even with CSV scores.
 */
export function exportDailyGoodEvidenceCsv(
 records:readonly SavedRadarRecord[],report:PickAuditReport
):string{
 if(report.rows.length!==records.length)
  throw Error('Controle de auditoria divergente dos registros. Nenhum arquivo gerado.');
 const lines:string[]=[encode(headings)];
 records.forEach((record,i)=>{
  if(!record.goodPicks)return; // Never retroactively promote a legacy Radar pick.
  const audit=report.rows[i];
  if(audit.key!==record.key)
   throw Error('Ordem de auditoria alterada. Nenhum arquivo gerado.');
  const frozen=Array.isArray(record.goodPicks.signals)?record.goodPicks.signals:[];
  const signals=frozen.length?frozen:[null];
  for(const signal of signals){
   const observed:PickAuditMarket|undefined=
    audit.status==='scored'&&signal
     ?audit.markets.find(x=>x.id===signal.id):undefined;
   const row=[
    record.key,record.savedAt,record.matchAt,record.competition,
    record.home,record.away,
    record.goodPicks.verifiedAt,record.goodPicks.sourceUrl,
    audit.status,audit.reason,
    signal?.id??'N/D',signal?.label??'N/D',signal?.direction??'N/D',
    displayNumber(signal?.line),displayNumber(signal?.projection),
    displayNumber(signal?.historicalMean),
    displayNumber(signal?.historicalSample),displayNumber(signal?.leagueSample),
    displayNumber(observed?.actual),
    observed?.v3??'N/D',audit.sourceUrl??'N/D',
    'PENDENTE'
   ];
   lines.push(encode(row));
  }
 });
 // UTF-8 BOM improves Excel's interpretation of Brazilian Portuguese.
 return '\uFEFF'+lines.join('\r\n')+'\r\n';
}
