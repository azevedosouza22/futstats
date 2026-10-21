import {expect, test} from '@playwright/test';

type Values = {goals:[number,number]; shots:[number,number]; target:[number,number]; corners:[number,number]};
type Fixture = {date:string; home:string; away:string; all:Values; first?:Values; second?:Values; titleDate?:string};

const fixtures:Fixture[] = [
  {date:'2026-10-12', titleDate:'2026-10-13',home:'RB Bragantino',away:'Cruzeiro',
    all:{goals:[4,2],shots:[20,25],target:[11,13],corners:[7,6]},
    first:{goals:[3,1],shots:[11,12],target:[5,9],corners:[2,2]},
    second:{goals:[1,1],shots:[9,13],target:[6,4],corners:[5,4]}},
  {date:'2026-10-07',home:'RB Bragantino',away:'Mirassol',all:{goals:[1,1],shots:[34,8],target:[9,2],corners:[11,3]}},
  {date:'2026-10-03',home:'Atlético-MG',away:'RB Bragantino',all:{goals:[1,0],shots:[8,23],target:[3,7],corners:[5,10]}},
  {date:'2026-09-20',home:'Flamengo',away:'RB Bragantino',all:{goals:[2,1],shots:[11,15],target:[6,5],corners:[2,5]}},
  {date:'2026-09-12',home:'Botafogo',away:'RB Bragantino',all:{goals:[1,1],shots:[23,14],target:[6,8],corners:[5,4]}},
  {date:'2026-09-05',home:'RB Bragantino',away:'Bahia',all:{goals:[2,3],shots:[24,11],target:[10,5],corners:[10,8]}},
  {date:'2026-10-07',home:'Cruzeiro',away:'São Paulo',all:{goals:[2,0],shots:[23,19],target:[9,3],corners:[8,8]}},
  {date:'2026-09-20',home:'Vitória',away:'Cruzeiro',all:{goals:[1,3],shots:[21,13],target:[8,5],corners:[8,2]}},
  {date:'2026-09-12',home:'Santos',away:'Cruzeiro',all:{goals:[2,1],shots:[32,9],target:[10,4],corners:[13,3]}},
  {date:'2026-09-06',home:'Cruzeiro',away:'Athletico-PR',all:{goals:[3,1],shots:[20,17],target:[6,7],corners:[7,2]}},
  {date:'2026-09-01',home:'Atlético-MG',away:'Cruzeiro',all:{goals:[2,1],shots:[28,12],target:[8,4],corners:[8,2]}},
];

// The fixtures are generated for automated testing only, not fetched from Flashscore.
function fixtureCsv() {
  const keys=['id_fonte','fonte','url_fonte','data','data_titulo_fonte','mandante','visitante','competicao'];
  const metrics:[keyof Values,string][]=[
    ['goals','gols'],['shots','finalizacoes'],['target','chutes_no_alvo'],['corners','escanteios']
  ];
  for(const [,prefix] of metrics)for(const period of ['jogo','1t','2t'])
    for(const side of ['mandante','visitante','total'])keys.push(`${prefix}_${side}_${period}`);
  const body=fixtures.map((game,i)=>{
    const id=`test-futstats-${i+1}`;
    const columns:Record<string,string>={
      id_fonte:id,fonte:'Flashscore',
      url_fonte:`https://www.flashscore.com.br/jogo/futebol/teste/?mid=${id}`,
      data:game.date,data_titulo_fonte:game.titleDate??game.date,
      mandante:game.home,visitante:game.away,
      competicao:'Brasileirão Série A',
    };
    for(const [metric,prefix] of metrics)
      for(const [period,value] of [['jogo',game.all],['1t',game.first],['2t',game.second]] as const) {
        const pair=value?.[metric];
        columns[`${prefix}_mandante_${period}`]=pair?.[0]?.toString()??'N/D';
        columns[`${prefix}_visitante_${period}`]=pair?.[1]?.toString()??'N/D';
        columns[`${prefix}_total_${period}`]=pair?(pair[0]+pair[1]).toString():'N/D';
      }
    return keys.map(key=>columns[key]??'N/D').join(',');
  });
  return [keys.join(','),...body].join('\n');
}
const upload={name:'futstats-teste-11.csv',mimeType:'text/csv',buffer:Buffer.from(fixtureCsv(),'utf8')};

test('importa pesquisa CSV, exibe Histórico e calcula Pré-jogo sem misturar o confronto',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Importar pesquisa CSV · Experimental'})).toBeVisible();
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles(upload);
  const preview=page.locator('.research-preview');
  await expect(preview).toContainText('11 partidas · 11 novas · 0 duplicadas · 1 com divergência');
  await expect(preview.locator('tbody tr')).toHaveCount(11);
  await expect(preview).toContainText('Data do título: 2026-10-13');

  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Confirmar 11 partidas novas'}).click();
  await expect(page.getByRole('status')).toContainText('11 partidas importadas');

  await page.getByRole('button',{name:'Histórico',exact:true}).click();
  await expect(page.locator('.match-row')).toHaveCount(11);
  await expect(page.locator('.match-row').first()).toContainText('RB Bragantino');
  await page.getByRole('button',{name:'Pré-jogo',exact:true}).click();

  await page.getByRole('combobox',{name:'Equipe 1 pré-jogo'}).selectOption({label:'RB Bragantino'});
  await page.getByRole('combobox',{name:'Equipe 2 pré-jogo'}).selectOption({label:'Cruzeiro'});
  await page.getByLabel('Data do confronto').fill('2026-10-13');
  const cardB=page.locator('.pregame-card').filter({has:page.getByRole('heading',{name:'RB Bragantino',exact:true})});
  const cardC=page.locator('.pregame-card').filter({has:page.getByRole('heading',{name:'Cruzeiro',exact:true})});
  await expect(cardB).toContainText('5/5');
  await expect(cardC).toContainText('5/5');
  await expect(cardB.getByRole('row',{name:/Finalizações/}).getByRole('cell').first()).toContainText('22');
  await expect(cardC.getByRole('row',{name:/Finalizações/}).getByRole('cell').first()).toContainText('15,4');
  await expect(cardB.getByRole('row',{name:/Escanteios/}).getByRole('cell').first()).toContainText('8');
  await expect(cardC.getByRole('row',{name:/Escanteios/}).getByRole('cell').first()).toContainText('4,4');
  // The 12/10 match with 13/10 title must not leak into an analysis before 13/10.
  await expect(cardB.locator('details')).toContainText('Mirassol');
  await expect(cardB.locator('details')).not.toContainText('Cruzeiro');

  await page.getByRole('button',{name:'1º tempo',exact:true}).click();
  await expect(cardB.getByRole('row',{name:/Finalizações/}).getByRole('cell').first()).toContainText('N/D');
  await expect(cardC.getByRole('row',{name:/Finalizações/}).getByRole('cell').first()).toContainText('N/D');
  await page.reload();
  await page.getByRole('button',{name:'Histórico',exact:true}).click();
  await expect(page.locator('.match-row')).toHaveCount(11);

  // Repeating the same import must not duplicate or overwrite previous data.
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles(upload);
  await expect(page.locator('.research-preview')).toContainText('11 partidas · 0 novas · 11 duplicadas');
  await expect(page.getByRole('button',{name:'Confirmar 0 partidas novas'})).toBeDisabled();
});

test('ignora arquivo com totais divergentes sem salvar partidas',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  const invalid=fixtureCsv().replace('2026-10-12,2026-10-13,RB Bragantino,Cruzeiro,Brasileirão Série A,4,2,6',
    '2026-10-12,2026-10-13,RB Bragantino,Cruzeiro,Brasileirão Série A,4,2,99');
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles({...upload,buffer:Buffer.from(invalid,'utf8')});
  await expect(page.getByRole('alert')).toContainText('não confere');
  await page.getByRole('button',{name:'Histórico',exact:true}).click();
  await expect(page.locator('.match-row')).toHaveCount(0);
});

test('identifica cinco ligas e filtra pré-jogo por competição e mando',async({page})=>{
  // Fictitious cross-league fixture used only to test the CSV structure, not match results.
  const raw=fixtureCsv().split('\n');
  const lines=raw.slice(1).map((line,i)=>{
    const cols=line.split(',');
    const aliases=[
      ['Bundesliga','Bayern München','Borussia Dortmund'],
      ['Serie A italiana','Inter','AC Milan'],
      ['Ligue 1','PSG','Marseille'],
      ['La Liga','Real Madrid','Barcelona'],
      ['Brasileirão Série A','Palmeiras','Flamengo'],
    ];
    const [league,home,away]=aliases[i%5];
    cols[3]='2026-08-'+String(10+i).padStart(2,'0');
    cols[4]=cols[3];
    cols[5]=home;
    cols[6]=away;
    cols[7]=league;
    return cols.join(',');
  });
  const csv=[raw[0],...lines].join('\n');
  await page.goto('/');
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles({name:'ligas-de-teste.csv',mimeType:'text/csv',buffer:Buffer.from(csv,'utf8')});
  await expect(page.locator('.research-preview')).toContainText('11 partidas · 11 novas · 0 duplicadas');
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Confirmar 11 partidas novas'}).click();
  await expect(page.getByRole('status')).toContainText('11 partidas importadas');
  await page.getByRole('button',{name:'Pré-jogo',exact:true}).click();
  const filter=page.getByRole('combobox',{name:'Filtrar competição pré-jogo'});
  for(const name of ['Brasileirão Série A','Bundesliga','Serie A italiana','Ligue 1','La Liga']){
    await expect(filter.locator('option',{hasText:name})).toHaveCount(1);
  }
  await page.getByRole('combobox',{name:'Equipe 1 pré-jogo'}).selectOption({label:'Bayern München'});
  await page.getByRole('combobox',{name:'Equipe 2 pré-jogo'}).selectOption({label:'Borussia Dortmund'});
  await page.getByLabel('Data do confronto').fill('2026-10-15');
  await filter.selectOption('Bundesliga');
  const bayern=page.locator('.pregame-card').filter({has:page.getByRole('heading',{name:'Bayern München',exact:true})});
  await expect(bayern).toContainText('3/5');
  await page.getByRole('combobox',{name:'Recorte mandante visitante'}).selectOption('match');
  await expect(bayern).toContainText('mandante');
  await expect(bayern).toContainText('3/5');
  await filter.selectOption('Ligue 1');
  await expect(bayern).toContainText('0/5');
  await expect(bayern.getByRole('row',{name:/Finalizações/}).getByRole('cell').first()).toContainText('N/D');
});

test('radar retrospectivo usa somente históricos anteriores e esconde resultados até revelar',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles(upload);
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Confirmar 11 partidas novas'}).click();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Radar · Validação retrospectiva'})).toBeVisible();
  await page.getByRole('combobox',{name:'Liga do radar'}).selectOption({label:'Brasileirão Série A'});
  const fixture=page.getByRole('combobox',{name:'Partida do radar'});
  await fixture.selectOption({label:'2026-10-12 · RB Bragantino × Cruzeiro'});
  await expect(page.locator('.radar-context')).toContainText('5/5 jogos de RB Bragantino');
  await expect(page.locator('.radar-context')).toContainText('5/5 de Cruzeiro');
  await expect(page.locator('.radar-context')).toContainText('10 partidas únicas');
  await expect(page.getByRole('columnheader',{name:'Resultado ocorrido'})).toHaveCount(0);
  await page.getByRole('button',{name:'Revelar resultados para comparar'}).click();
  if ((page.viewportSize()?.width ?? 1000) <= 700) {
    await expect(page.locator('.radar-market-card').first()).toContainText('Resultado ocorrido');
    await expect(page.locator('.radar-market-cards')).toContainText('6 · Over');
  } else {
    await expect(page.getByRole('columnheader',{name:'Resultado ocorrido'})).toBeVisible();
    await expect(page.locator('.radar-market-table')).toContainText('6 · Over');
  }
  await page.getByRole('button',{name:'Ocultar resultados ocorridos'}).click();
  await expect(page.getByRole('columnheader',{name:'Resultado ocorrido'})).toHaveCount(0);
});

test('radar sem CSV não cria partida nem sugere entrada',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await expect(page.locator('.radar-panel')).toContainText('Importe pesquisas CSV');
  await expect(page.locator('.radar-panel')).not.toContainText('Revelar resultados');
});


test('visual escuro premium e atalho principal para o Radar',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.app')).toHaveClass(/premium/);
  const ui=await page.evaluate(()=>{
    const background=(selector:string)=>getComputedStyle(document.querySelector(selector)!).backgroundColor;
    return {body:background('body'),card:background('.panel')};
  });
  const channels=(s:string)=>(s.match(/\d+/g)??[]).slice(0,3).map(Number);
  expect(Math.max(...channels(ui.body))).toBeLessThan(50);
  expect(Math.max(...channels(ui.card))).toBeLessThan(70);
  await page.getByRole('button',{name:/Agenda e Radar/}).click();
  await expect(page.getByRole('heading',{name:'Radar · Validação retrospectiva'})).toBeVisible();
  await expect(page.getByText('Agenda de confrontos · rodada 32 disponível')).toBeVisible();
});

test('restaura previsões exportadas sem sobrescrever dados existentes',async({page})=>{
  await page.clock.install({time:new Date('2026-10-20T17:00:00Z')});
  await page.goto('/');
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles(upload);
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Confirmar 11 partidas novas'}).click();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await page.getByRole('combobox',{name:'Mandante futuro'}).selectOption({label:'RB Bragantino'});
  await page.getByRole('combobox',{name:'Visitante futuro'}).selectOption({label:'Cruzeiro'});
  await page.getByRole('combobox',{name:'Competição futura'}).selectOption({label:'Brasileirão Série A'});
  await page.getByLabel('Data futura').fill('2026-10-23');
  await page.getByLabel('Hora futura').fill('20:00');
  await page.getByRole('button',{name:'Registrar análise antes do jogo'}).click();
  await expect(page.locator('.radar-saved')).toContainText('Registros pré-jogo salvos (1)');
  const original=await page.evaluate(()=>localStorage.getItem('futstats-radar-previews-v1'));
  expect(original).toBeTruthy();
  await page.evaluate(()=>localStorage.removeItem('futstats-radar-previews-v1'));
  await page.reload();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await expect(page.locator('.radar-saved')).toContainText('Registros pré-jogo salvos (0)');
  const file={name:'futstats-radar-registros.json',mimeType:'application/json',buffer:Buffer.from(original!,'utf8')};
  await page.getByLabel('Restaurar registros JSON').setInputFiles(file);
  await expect(page.getByRole('status').filter({hasText:'previsões restauradas'})).toBeVisible();
  await expect(page.locator('.radar-saved')).toContainText('Registros pré-jogo salvos (1)');
  const restored=await page.evaluate(()=>localStorage.getItem('futstats-radar-previews-v1'));
  expect(restored).toBe(original);
  await page.getByLabel('Restaurar registros JSON').setInputFiles(file);
  await expect(page.getByRole('status').filter({hasText:'Nenhuma previsão nova'})).toBeVisible();
  await expect(page.locator('.radar-saved')).toContainText('Registros pré-jogo salvos (1)');
  await expect(page.locator('.toolbar')).toContainText('11 partidas na sua base');
  await expect(page.getByRole('heading',{name:'Rodada 32 · Seus resultados'})).toBeVisible();
});

test('radar prospectivo registra indicadores antes da partida e persiste após recarregar',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles(upload);
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Confirmar 11 partidas novas'}).click();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await page.getByRole('combobox',{name:'Mandante futuro'}).selectOption({label:'RB Bragantino'});
  await page.getByRole('combobox',{name:'Visitante futuro'}).selectOption({label:'Cruzeiro'});
  await page.getByRole('combobox',{name:'Competição futura'}).selectOption({label:'Brasileirão Série A'});
  const inTwoDays=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
  await page.getByLabel('Data futura').fill(inTwoDays);
  await expect(page.locator('.radar-future-results')).toContainText('5/5 do mandante');
  await expect(page.locator('.radar-future-results')).toContainText('5/5 do visitante');
  await expect(page.locator('.radar-future-results')).toContainText('9 partidas únicas');
  await expect(page.locator('.radar-future-results')).not.toContainText('Resultado ocorrido');
  await expect(page.locator('.radar-venue-prospective')).toContainText('Previsões V2 × V3 antes da partida');
  await expect(page.locator('.radar-venue-prospective')).toContainText('Finalizações');
  await page.getByRole('button',{name:'Registrar análise antes do jogo'}).click();
  await expect(page.getByRole('status')).toContainText('Análise prospectiva registrada');
  await expect(page.locator('.radar-saved')).toContainText('Registros pré-jogo salvos (1)');
  await page.reload();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await expect(page.locator('.radar-saved')).toContainText('Registros pré-jogo salvos (1)');
  await expect(page.locator('.radar-saved')).toContainText('RB Bragantino × Cruzeiro');
  await expect(page.locator('.radar-saved')).toContainText('Teste com previsões registradas antes dos jogos');
  await expect(page.locator('.radar-saved')).toContainText('Aguardando jogo');
  await expect(page.getByRole('button',{name:'Exportar registros JSON'})).toBeVisible();
});


test('agenda CSV mostra próximos jogos e envia confronto ao Radar',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles(upload);
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Confirmar 11 partidas novas'}).click();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  const dt=new Date(Date.now()+4*86400000).toISOString().slice(0,10);
  const head='data,horario_brasilia,competicao,mandante,visitante,url_fonte';
  const entry=dt+',21:00,Brasileirão Série A,RB Bragantino,Cruzeiro,https://www.cbf.com.br/calendario';
  const file={name:'agenda-ficticia.csv',mimeType:'text/csv',buffer:Buffer.from(head+'\n'+entry)};
  await page.getByLabel('Importar calendário CSV').setInputFiles(file);
  await expect(page.getByRole('status')).toContainText('Agenda: 1 novos jogos');
  await page.getByRole('button',{name:'7 dias'}).click();
  await expect(page.locator('.calendar-fixture').filter({hasText:'RB Bragantino × Cruzeiro'})).toHaveCount(1);
  await page.locator('.calendar-fixture').filter({hasText:'RB Bragantino × Cruzeiro'}).getByRole('button',{name:'Analisar jogo'}).click();
  await expect(page.getByRole('heading',{name:'Radar · Novo confronto futuro'})).toBeInViewport();
  await expect(page.getByRole('status').filter({hasText:'Jogo selecionado:'})).toContainText('RB Bragantino × Cruzeiro');
  await expect(page.getByRole('combobox',{name:'Mandante futuro'})).toHaveValue(/.+/);
  await expect(page.getByRole('combobox',{name:'Visitante futuro'})).toHaveValue(/.+/);
  await expect(page.getByRole('combobox',{name:'Competição futura'})).toHaveValue('Brasileirão Série A');
  await expect(page.getByLabel('Data futura')).toHaveValue(dt);
  await expect(page.getByLabel('Hora futura')).toHaveValue('21:00');
  await expect(page.locator('.radar-future-results')).toContainText('Histórico disponível');
  await page.getByLabel('Importar calendário CSV').setInputFiles(file);
  await expect(page.locator('.calendar-agenda').getByRole('status')).toContainText('0 novos jogos; 1 duplicatas');
  await page.reload();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await page.getByRole('button',{name:'7 dias'}).click();
  await expect(page.locator('.calendar-fixture').filter({hasText:'RB Bragantino × Cruzeiro'})).toHaveCount(1);
});

test('registra rodada em lote sem duplicar previsão já salva ou mudar base histórica',async({page})=>{
  // Freeze the browser before the October 23 fixture; this is a deterministic
  // fixture test, not an assertion that the October 2026 games are always future.
  await page.clock.install({time:new Date('2026-10-20T17:00:00Z')});
  const original=fixtureCsv().split('\n');
  const more=Array.from({length:3},(_,i)=>{
    const cells=original[1].split(',');
    cells[0]='bulk-remo-'+i;
    cells[2]='https://www.flashscore.com.br/jogo/futebol/teste/?mid=bulk-remo-'+i;
    cells[3]='2026-10-0'+(i+1);
    cells[4]=cells[3];
    cells[5]='Vitória';
    cells[6]='Remo';
    return cells.join(',');
  });
  const localCsv=[...original,...more].join('\n');
  await page.goto('/');
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles({
    name:'amostra-bulk.csv',mimeType:'text/csv',buffer:Buffer.from(localCsv,'utf8'),
  });
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Confirmar 14 partidas novas'}).click();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await page.locator('.calendar-fixture').filter({hasText:'Cruzeiro × Remo'})
    .getByRole('button',{name:'Analisar jogo'}).click();
  await expect(page.getByRole('status').filter({hasText:'Jogo selecionado:'}))
    .toContainText('Cruzeiro × Remo');
  await page.getByRole('button',{name:'Registrar análise antes do jogo'}).click();
  await expect(page.locator('.radar-saved')).toContainText('Registros pré-jogo salvos (1)');

  const round=page.locator('.radar-bulk-round');
  const register=round.getByRole('button',{name:/Registrar \d+ análises da rodada 32/});
  const text=await register.textContent();
  const n=Number(text?.match(/\d+/)?.[0]??0);
  expect(n).toBeGreaterThan(0);
  await round.getByText('Conferir previsões antes de registrar').click();
  await expect(round).toContainText('V2');
  await register.click();
  await expect(page.locator('.radar-saved')).toContainText(`Registros pré-jogo salvos (${n+1})`);
  await expect(page.locator('.radar-saved li').filter({hasText:'Cruzeiro × Remo'})).toHaveCount(1);
  await expect(page.locator('.toolbar')).toContainText('14 partidas na sua base');
  await page.reload();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await expect(page.locator('.radar-saved')).toContainText(`Registros pré-jogo salvos (${n+1})`);
  await expect(page.locator('.radar-bulk-round')).toContainText('0 jogos novos disponíveis');
  await expect(page.locator('.radar-bulk-round').getByRole('button',{name:'Registrar 0 análises da rodada 32'})).toBeDisabled();
});

test('backtest automático apresenta sinais e mercados em cartões legíveis no celular',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Importar',exact:true}).click();
  await page.getByLabel('Escolher pesquisa CSV').setInputFiles(upload);
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Confirmar 11 partidas novas'}).click();
  await page.getByRole('button',{name:'Radar experimental',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Validação automática da temporada'})).toBeVisible();
  await expect(page.locator('.radar-backtest-card')).toHaveCount(6);
  await expect(page.locator('.radar-benchmark-row')).toHaveCount(6);
  await expect(page.getByRole('heading',{name:'Radar V2 · Teste por mando de campo'})).toBeVisible();
  await expect(page.locator('.radar-v2-panel .radar-v2-card')).toHaveCount(3);
  await expect(page.getByRole('heading',{name:'Radar V3 · Filtro de concordância'})).toBeVisible();
  await expect(page.locator('.radar-v3-panel .radar-v2-card')).toHaveCount(3);
  const v3Card=page.locator('.radar-v3-panel .radar-v2-card').first();
  await v3Card.getByText('Por que o V3 descartou sinais?').click();
  await expect(v3Card).toContainText('Média do mandante em casa');
  await expect(v3Card).toContainText('Frequência do visitante fora');
  await expect(v3Card).toContainText('Quando apenas uma condição falhou');
  await expect(v3Card).toContainText('rejeições isoladas');
  await expect(page.locator('.radar-v2-card').first()).toContainText('Teste posterior');
  await expect(page.locator('.radar-v2-card').first()).toContainText('Regra simples');
  const benchmark=page.locator('.radar-benchmark-row').filter({hasText:'Gols · 2º tempo'});
  await expect(benchmark).toContainText('Sempre Over');
  await expect(benchmark).toContainText('Sempre Under');
  await expect(benchmark).toContainText('Teste temporal · último terço');
  await page.locator('.radar-backtest-card').filter({hasText:'Gols · 2º tempo'}).getByText('Ver amostras, mando e comparação').click();
  const secondHalf=page.locator('.radar-backtest-card').filter({hasText:'Gols · 2º tempo'});
  await expect(secondHalf).toContainText('Regra "sempre Over"');
  await expect(secondHalf).toContainText('Frequência real de Over na base');
  await expect(secondHalf.locator('.radar-period-row')).toHaveCount(3);
  await expect(page.locator('.radar-market-table')).toBeHidden();
  await expect(page.locator('.radar-market-card')).toHaveCount(6);
  await expect(page.locator('.radar-market-card').first()).not.toContainText('Resultado ocorrido');
  await page.getByRole('button',{name:'Revelar resultados para comparar'}).click();
  await expect(page.locator('.radar-market-card').first()).toContainText('Resultado ocorrido');
});
