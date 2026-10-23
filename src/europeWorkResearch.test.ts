import {describe,expect,it} from 'vitest';
import {
 EUROPE_WORK_STORAGE,emptyEuropeWork,isWork55Header,readEuropeWork,
 reviewEuropeWorkCsv,stageEuropeWork
} from './europeWorkResearch';
import {EUROPE_RESEARCH_STORAGE,type EuropeMatch,type StoredEuropeanResearch} from './europeLeagueResearch';

const fixtures:[string,string,string,[number,number],[number,number],[number,number]][]=[
 ['Udinese Calcio','Como 1907','QuSvm8ln',[1,1],[1,0],[0,1]],
 ['FC Internazionale Milano','AC Monza','8Mn7Y8Zh',[4,1],[1,1],[3,0]],
 ['Genoa CFC','SSC Napoli','z9lazV4t',[0,2],[0,0],[0,2]]
];
const names=[['Udinese','Como'],['Inter','Monza'],['Genoa','Napoli']];
const original:StoredEuropeanResearch={format:EUROPE_RESEARCH_STORAGE,matches:
 fixtures.map(([home,away,id,full,half,second],i):EuropeMatch=>({
  id:['serie-a',1,'2026-08-22',home.toLowerCase(),away.toLowerCase()].join('|'),
  league:'serie-a',competition:'Serie A italiana 2026/27',date:'2026-08-22',
  round:1,home,away,full,half,second
 }))
};
const headings=['id_fonte','tipo_amostra','equipe_amostra','competicao','data',
 'data_titulo_fonte','hora_exibida_fonte','fuso_horario_fonte','divergencia_data',
 'mandante','visitante'];
const mapping={gols:'goals',finalizacoes:'shots',chutes_no_alvo:'target',escanteios:'corners'} as const;
for(const period of ['jogo','1t','2t'])
 for(const metric of Object.keys(mapping))
  for(const side of ['mandante','visitante','total'])
   headings.push(metric+'_'+side+'_'+period);
headings.push('fonte','url_fonte','url_fonte_1t','url_fonte_2t','url_fonte_gols_por_tempo',
 'sofascore_status','sofascore_url_partida','observacoes');
const values=(n:number,changes:Record<string,string>={})=>{
 const [home,away,id,full,half,second]=fixtures[n];
 const fields:Record<string,string>={
  id_fonte:id,tipo_amostra:'lote',equipe_amostra:'N/D',
  competicao:'Serie A italiana 2026/27',data:'2026-08-22',
  data_titulo_fonte:'2026-08-22',hora_exibida_fonte:'13:30',
  fuso_horario_fonte:'N/D',divergencia_data:'nao',
  mandante:names[n][0],visitante:names[n][1],fonte:'Flashscore',
  url_fonte:'https://www.flashscore.com.br/jogo/futebol/teste/?mid='+id,
  url_fonte_1t:'N/D',url_fonte_2t:'N/D',
  url_fonte_gols_por_tempo:'N/D',sofascore_status:'N/D',
  sofascore_url_partida:'N/D',observacoes:'N/D'
 };
 const rows:{[k:string]:[number,number]}={
  gols_jogo:full,gols_1t:half,gols_2t:second,
  finalizacoes_jogo:[13,9],finalizacoes_1t:[6,4],finalizacoes_2t:[7,5],
  chutes_no_alvo_jogo:[5,3],chutes_no_alvo_1t:[2,1],chutes_no_alvo_2t:[3,2],
  escanteios_jogo:[4,3],escanteios_1t:[1,1],escanteios_2t:[3,2]
 };
 for(const [key,[a,b]] of Object.entries(rows)){
  fields[key.replace(/_(jogo|1t|2t)$/,'_mandante_$1')]=String(a);
  fields[key.replace(/_(jogo|1t|2t)$/,'_visitante_$1')]=String(b);
  fields[key.replace(/_(jogo|1t|2t)$/,'_total_$1')]=String(a+b);
 }
 Object.assign(fields,changes);
 return headings.map(h=>fields[h]??'N/D').join(',');
};
const csv=(entries:number[]=[0,1,2],changes:Record<string,string>={})=>
 '\uFEFF'+headings.join(',')+'\n'+entries.map((n,i)=>values(n,i===0?changes:{})).join('\n');

describe('Lote Work europeu isolado',()=>{
 it('valida 3 partidas da Serie A nas 55 colunas e aliases de clubes',()=>{
  const text=csv();
  expect(headings).toHaveLength(55);
  expect(isWork55Header(text)).toBe(true);
  const before=JSON.stringify(original);
  const report=reviewEuropeWorkCsv(text,original,emptyEuropeWork());
  expect(report.checked).toBe(3);
  expect(report.newEntries).toHaveLength(3);
  expect(report.matched.map(x=>x.sourceId)).toEqual(['QuSvm8ln','8Mn7Y8Zh','z9lazV4t']);
  const saved=stageEuropeWork(emptyEuropeWork(),report);
  expect(saved.entries).toHaveLength(3);
  expect(saved.entries[0].first.corners).toEqual([1,1]);
  expect(readEuropeWork(JSON.stringify(saved)).entries).toHaveLength(3);
  expect(JSON.stringify(original)).toBe(before);
 });
 it('aceita partida da rodada 6 ainda sem placar CC0, sem somar jogos aos 155',()=>{
  const match:EuropeMatch={
   id:['serie-a',6,'2026-10-10','genoa cfc','acf fiorentina'].join('|'),
   league:'serie-a',competition:'Serie A italiana 2026/27',date:'2026-10-10',
   round:6,home:'Genoa CFC',away:'ACF Fiorentina',
   full:null,half:null,second:null
  };
  const researchBefore=JSON.stringify(original);
  const work=csv([0],{
   id_fonte:'Rodada6A',url_fonte:'https://www.flashscore.com.br/jogo/futebol/teste/?mid=Rodada6A',
   data:'2026-10-10',data_titulo_fonte:'2026-10-10',
   mandante:'Genoa',visitante:'Fiorentina'
  });
  const report=reviewEuropeWorkCsv(work,original,emptyEuropeWork(),[match]);
  expect(report.newEntries).toHaveLength(1);
  expect(report.matched[0].round).toBe(6);
  const next=stageEuropeWork(emptyEuropeWork(),report);
  expect(next.entries[0].fixture?.id).toBe(match.id);
  expect(next.entries[0].fixture?.full).toEqual([1,1]);
  expect(readEuropeWork(JSON.stringify(next)).entries).toHaveLength(1);
  expect(JSON.stringify(original)).toBe(researchBefore);
  const again=reviewEuropeWorkCsv(work,original,next,[match]);
  expect(again.duplicates).toBe(1);
  expect(again.newEntries).toHaveLength(0);
  expect(()=>reviewEuropeWorkCsv(work,original,emptyEuropeWork(),[])).toThrow('calendário validado');
 });
 it('associa jogo La Liga 2026/27 sem placar CC0 e aceita empate 0x0 conferido pelo Work',()=>{
  const g:EuropeMatch={
   id:['la-liga',2,'2026-08-22','valencia cf','rc celta de vigo'].join('|'),
   league:'la-liga',competition:'La Liga espanhola 2026/27',date:'2026-08-22',
   round:2,home:'Valencia CF',away:'RC Celta de Vigo',
   full:null,half:null,second:null
  };
  const zeros:Record<string,string>={
   id_fonte:'TesteLaLiga',url_fonte:'https://www.flashscore.com.br/jogo/futebol/teste/?mid=TesteLaLiga',
   competicao:'La Liga espanhola 2026/27',data:'2026-08-22',data_titulo_fonte:'2026-08-22',
   mandante:'Valencia',visitante:'Celta de Vigo'
  };
  for(const period of ['jogo','1t','2t'])for(const side of ['mandante','visitante','total'])
    zeros['gols_'+side+'_'+period]='0';
  const work=csv([0],zeros);
  const before=JSON.stringify(original);
  const preview=reviewEuropeWorkCsv(work,original,emptyEuropeWork(),[g]);
  expect(preview.checked).toBe(1);
  expect(preview.newEntries).toHaveLength(1);
  expect(preview.matched[0].league).toBe('la-liga');
  expect(preview.newEntries[0].fixture?.full).toEqual([0,0]);
  const stored=stageEuropeWork(emptyEuropeWork(),preview);
  expect(readEuropeWork(JSON.stringify(stored)).entries).toHaveLength(1);
  expect(reviewEuropeWorkCsv(work,original,stored,[g]).duplicates).toBe(1);
  expect(JSON.stringify(original)).toBe(before);
 });
 it('ignora a importação repetida e rejeita conflito',()=>{
  const first=reviewEuropeWorkCsv(csv(),original,emptyEuropeWork());
  const store=stageEuropeWork(emptyEuropeWork(),first);
  const repeat=reviewEuropeWorkCsv(csv(),original,store);
  expect(repeat.newEntries).toHaveLength(0);
  expect(repeat.duplicates).toBe(3);
  expect(stageEuropeWork(store,repeat).entries).toHaveLength(3);
  const changed=csv([0],{
   escanteios_mandante_1t:'2',escanteios_mandante_2t:'2',
   escanteios_total_1t:'3',escanteios_total_2t:'4'
  });
  expect(()=>reviewEuropeWorkCsv(changed,original,store)).toThrow('Conflito');
 });
 it('nunca transforma N/D em zero e bloqueia gols divergentes',()=>{
  expect(()=>reviewEuropeWorkCsv(csv([0],{
   escanteios_mandante_1t:'N/D',escanteios_total_1t:'N/D'
  }),original,emptyEuropeWork())).toThrow('N/D');
  expect(()=>reviewEuropeWorkCsv(csv([0],{
   gols_mandante_jogo:'2',gols_mandante_2t:'1',
   gols_total_jogo:'3',gols_total_2t:'2'
  }),original,emptyEuropeWork())).toThrow('Placar');
 });
 it('reconhece nomes abreviados dos sete confrontos seguintes sem combinar equipes erradas',()=>{
  const pairs:[string,string,string,string][]=[
   ['Parma Calcio 1913','Cagliari Calcio','Parma','Cagliari'],
   ['Frosinone Calcio','Juventus FC','Frosinone','Juventus'],
   ['Venezia FC','US Lecce','Venezia','Lecce'],
   ['Atalanta BC','US Sassuolo Calcio','Atalanta','Sassuolo'],
   ['Torino FC','AC Milan','Torino','Milan'],
   ['Bologna FC 1909','SS Lazio','Bologna','Lazio'],
   ['AS Roma','ACF Fiorentina','Roma','Fiorentina']
  ];
  for(const [fullHome,fullAway,shortHome,shortAway] of pairs){
   const first=original.matches[0];
   const m:EuropeMatch={...first,
    home:fullHome,away:fullAway,
    id:['serie-a',1,'2026-08-22',fullHome.toLowerCase(),fullAway.toLowerCase()].join('|')
   };
   const db:StoredEuropeanResearch={format:EUROPE_RESEARCH_STORAGE,matches:[m]};
   const report=reviewEuropeWorkCsv(csv([0],{mandante:shortHome,visitante:shortAway}),db,emptyEuropeWork());
   expect(report.newEntries).toHaveLength(1);
   expect(report.newEntries[0].europeId).toBe(m.id);
  }
 });
 it('não inclui partidas que não existem nos 155 jogos',()=>{
  expect(()=>reviewEuropeWorkCsv(csv([0],{mandante:'Time aleatório'}),original,emptyEuropeWork())).toThrow('não identificada');
  expect(()=>reviewEuropeWorkCsv(csv([0],{competicao:'Serie A italiana 2025/26'}),original,emptyEuropeWork())).toThrow('Competição');
  expect(()=>reviewEuropeWorkCsv(csv([0],{data_titulo_fonte:'2026-08-23'}),original,emptyEuropeWork())).toThrow('Datas');
 });
 it('recusa cabeçalho alterado e armazenamento corrompido',()=>{
  expect(()=>reviewEuropeWorkCsv(csv([0]).replace('id_fonte','id_falso'),original,emptyEuropeWork())).toThrow('55 colunas');
  expect(()=>readEuropeWork('{')).toThrow('inválida');
  expect(()=>readEuropeWork('{"format":"'+EUROPE_WORK_STORAGE+'","entries":[{}]}')).toThrow('incompatível');
 });
});
