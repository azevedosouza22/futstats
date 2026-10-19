import {describe,expect,it} from 'vitest';
import {mergeWorkCsv,parseWorkResearchCsv,workCsvPreview} from './workCsv';
import {stats,validData,type Data} from './model';

const headings=['id_fonte','fonte','url_fonte','data','data_titulo_fonte','mandante','visitante','competicao'];
const metrics=[['gols','goals'],['finalizacoes','shots'],['chutes_no_alvo','target'],['escanteios','corners']];
for(const [p] of metrics)for(const period of ['jogo','1t','2t'])
  for(const who of ['mandante','visitante','total'])headings.push(`${p}_${who}_${period}`);
function source(values:Record<string,string>={}) {
  const row:Record<string,string>={
    id_fonte:'vXrY11bl',fonte:'Flashscore',
    url_fonte:'https://www.flashscore.com.br/jogo/futebol/exemplo/?mid=vXrY11bl',
    data:'2026-10-12',data_titulo_fonte:'2026-10-13',
    mandante:'RB Bragantino',visitante:'Cruzeiro',competicao:'Brasileirão Série A',
    ...values,
  };
  for(const [p] of metrics)for(const period of ['jogo','1t','2t'])
    for(const who of ['mandante','visitante','total'])
      row[`${p}_${who}_${period}`]??='N/D';
  return headings.join(',')+'\n'+headings.map(h=>row[h]??'N/D').join(',');
}
describe('Work CSV research import',()=>{
  it('preserves missing data, link and date discrepancy',()=>{
    const [r]=parseWorkResearchCsv(source({
      gols_mandante_jogo:'4',gols_visitante_jogo:'2',gols_total_jogo:'6',
      finalizacoes_mandante_jogo:'20',finalizacoes_visitante_jogo:'25',finalizacoes_total_jogo:'45',
      chutes_no_alvo_mandante_jogo:'11',chutes_no_alvo_visitante_jogo:'13',chutes_no_alvo_total_jogo:'24',
      escanteios_mandante_jogo:'7',escanteios_visitante_jogo:'6',escanteios_total_jogo:'13',
    }));
    expect(r.dateDiscrepancy).toBe(true);
    expect(r.first[0].shots).toBeNull();
    const merged=mergeWorkCsv({teams:[],matches:[]},[r]);
    expect(merged.added).toBe(1);
    expect(validData(merged.data)).toBe(true);
    expect(stats(merged.data.matches[0],0,'full').shots).toBe(20);
    expect(stats(merged.data.matches[0],0,'first').shots).toBeNull();
    expect(merged.data.matches[0].research?.sourceUrl).toContain('vXrY11bl');
  });
  it('rejects incorrect totals and negative numbers',()=>{
    expect(()=>parseWorkResearchCsv(source({gols_mandante_jogo:'2',gols_visitante_jogo:'1',gols_total_jogo:'4'}))).toThrow('não confere');
    expect(()=>parseWorkResearchCsv(source({finalizacoes_mandante_jogo:'-1'}))).toThrow('inválido');
  });
  it('rejects mismatched IDs in links and duplicates',()=>{
    expect(()=>parseWorkResearchCsv(source({url_fonte:'https://www.flashscore.com.br/?mid=other'}))).toThrow('não correspondem');
    const csv=source();
    expect(()=>parseWorkResearchCsv(csv+'\n'+csv.split('\n')[1])).toThrow('duplicada');
  });
  it('does not erase local data and skips repeated imports',()=>{
    const row=parseWorkResearchCsv(source());
    const original:Data={teams:[],matches:[]};
    const first=mergeWorkCsv(original,row);
    expect(original.matches.length).toBe(0);
    expect(workCsvPreview(first.data,row)[0].duplicate).toBe(true);
    const second=mergeWorkCsv(first.data,row);
    expect(second.skipped).toBe(1);
    expect(second.data.matches).toHaveLength(1);
  });
});
