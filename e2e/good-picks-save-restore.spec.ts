import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

/**
 * Browser-level smoke test, with synthetic fixtures only. Does not query
 * private Work data, modify production, or use any user's actual storage.
 * Clock is fixed so official snapshot freshness is deterministic.
 */
const NOW='2026-10-25T15:00:00.000Z'; // 12:00 Brasília, before El Clásico
const DATA_KEY='futstats:v1';
const RADAR_KEY='futstats-radar-previews-v1';
const CALENDAR_KEY='futstats-calendar-csv-v1';
const COMPETITION='La Liga espanhola 2026/27';

const stat=(goals:number,shots:number,target:number,corners:number)=>({
  goals,shots,target,corners,yellow:0,red:0
});
function syntheticHistory(){
  const first=[stat(2,18,7,5),stat(1,14,5,6)];
  const second=[stat(0,0,0,0),stat(0,0,0,0)];
  return {
    teams:[
      {id:'barcelona',name:'Barcelona',color:'#234567'},
      {id:'real-madrid',name:'Real Madrid',color:'#456789'},
      ...Array.from({length:5},(_,i)=>({
        id:'opponent-'+i,name:'Oponente '+i,color:'#345678'
      })),
      ...Array.from({length:5},(_,i)=>({
        id:'visitor-'+i,name:'Visitante '+i,color:'#345678'
      }))
    ],
    matches:[
      ...Array.from({length:5},(_,i)=>({
        id:'home-historical-'+i,date:'2026-10-'+String(i+10).padStart(2,'0'),
        home:'barcelona',away:'opponent-'+i,competition:COMPETITION,
        first,second
      })),
      ...Array.from({length:5},(_,i)=>({
        id:'away-historical-'+i,date:'2026-10-'+String(i+16).padStart(2,'0'),
        home:'visitor-'+i,away:'real-madrid',competition:COMPETITION,
        first,second
      }))
    ]
  };
}
async function openRadar(page:Page){
  await page.getByRole('button',{name:/Agenda e Radar/}).click();
  await expect(page.getByRole('region',{name:/As Boas do Dia/})).toBeVisible();
}
async function openTools(page:Page){
  // Exercise a real visible control in both layouts; never bypass UI handlers.
  const mobile=page.getByRole('button',{name:'Abrir backup integral V4'});
  if(await mobile.isVisible())await mobile.click();
  else await page.locator('button[data-area="tools"]').click();
}

test.use({serviceWorkers:'block'});

test('As Boas -> Radar -> salvar -> recuperar registro e backup integral',async({page})=>{
  await page.clock.install({time:new Date(NOW)});
  // The free community lookup is unrelated to the official-source shortlist.
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  const fake=syntheticHistory();
  const localCalendar=[{
    id:'2026-10-29|la liga espanhola 2026/27|barcelona|real madrid',
    date:'2026-10-29',time:'20:00',competition:COMPETITION,
    home:'Barcelona',away:'Real Madrid',
    sourceUrl:'https://www.laliga.com/juegos/ejemplo'
  }];
  await page.evaluate(({data,calendar})=>{
    localStorage.setItem('futstats:v1',JSON.stringify(data));
    localStorage.setItem('futstats-calendar-csv-v1',JSON.stringify(calendar));
  },{data:fake,calendar:localCalendar});
  await page.reload();
  await openRadar(page);
  const boas=page.getByRole('region',{name:/As Boas do Dia/});
  await expect(boas.getByText('FC Barcelona × Real Madrid')).toBeVisible();
  await expect(boas.getByText(/V2 e V3 concordam/).first()).toBeVisible();
  await boas.getByRole('button',{name:'Abrir Radar e conferir análise'}).click();
  await expect(page.locator('.radar-selected-fixture')).toContainText('FC Barcelona × Real Madrid');
  await expect(page.locator('.radar-selected-fixture')).toContainText('17:00');
  const before=await page.evaluate(key=>localStorage.getItem(key),RADAR_KEY);
  expect(before===null||before==='[]').toBeTruthy();
  await page.getByRole('button',{name:'Salvar previsão V2/V3 deste jogo'}).click();
  await expect(page.getByText('Análise prospectiva registrada neste navegador.')).toBeVisible();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({
    home:'Barcelona',away:'Real Madrid',competition:COMPETITION,
    matchAt:'2026-10-25T17:00:00',homeCount:5,awayCount:5
  });
  expect(saved[0].venue).toHaveLength(3);
  expect(saved[0].goodPicks).toMatchObject({
    // Preserve the source's actual dated verification, not the test clock.
    verifiedAt:'2026-10-23',
    sourceUrl:expect.stringContaining('laliga.com'),
    signals:expect.arrayContaining([expect.objectContaining({
      id:'goals-full-2.5',direction:'Over',historicalSample:10
    })])
  });
  await page.getByRole('button',{name:'Ver previsão que acabei de salvar'}).click();
  const audit=page.getByRole('region',{name:'Validação prospectiva As Boas do Dia'});
  await expect(audit).toContainText('1 registro(s) com identificação da lista');
  await expect(audit).toContainText('0 confronto(s) com resultado');
  await expect(page.locator('#radar-saved-forecasts')).toBeFocused();

  const verification=audit.getByRole('region',{
    name:'Fila de verificação independente dos resultados'
  });
  await expect(verification).toContainText('1 aguardando jogo/finalização');
  await verification.getByText(/Ver prioridades de verificação/).click();
  await expect(verification).toContainText('Aguardar fim da partida');
  await expect(verification).toContainText('PENDENTE');
  const [queueFile]=await Promise.all([
    page.waitForEvent('download'),
    verification.getByRole('button',{name:'Exportar fila de conferência (CSV)'}).click()
  ]);
  expect(queueFile.suggestedFilename()).toBe('futstats-fila-verificacao-resultados.csv');
  const queueCsv=await readFile((await queueFile.path())!,'utf-8');
  expect(queueCsv.startsWith('\uFEFF"registro_id";')).toBe(true);
  expect(queueCsv.split('\r\n').filter(Boolean)).toHaveLength(2);
  expect(queueCsv).toContain('"await_kickoff"');
  expect(queueCsv).toContain('"PENDENTE"');
  expect(queueCsv).not.toContain('"CONFIRMADO"');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY))
    .toEqual(saved);

  await expect(page.locator('#radar-saved-forecasts')).toBeVisible();
  // The real UI exports a read-only ledger; it must not mutate the saved pick
  // or claim that synthetic/local CSV results were checked on the web.
  const [ledger]=await Promise.all([
    page.waitForEvent('download'),
    audit.getByRole('button',{name:'Exportar controle das indicações (CSV)'}).click()
  ]);
  expect(ledger.suggestedFilename()).toBe('futstats-as-boas-acompanhamento.csv');
  const text=await readFile((await ledger.path())!,'utf-8');
  expect(text.startsWith('\uFEFF"registro_id";')).toBe(true);
  expect(text.split('\r\n').filter(Boolean)).toHaveLength(4); // 3 frozen markets + header
  expect(text).toContain('"PENDENTE"');
  expect(text).toContain('"future"');
  expect(text).not.toContain('"Acertou"');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY))
    .toEqual(saved);

  await expect(page.locator('#radar-saved-forecasts')).toBeVisible();
  await expect(page.locator('#radar-saved-forecasts')).toContainText('Barcelona × Real Madrid');
  await expect(page.locator('.round-tracker-disclosure')).not.toHaveAttribute('open');
  // A revisit must never silently duplicate or recalculate frozen entries.
  await page.reload();
  await page.getByRole('button',{name:/Agenda e Radar/}).click();
  await page.getByRole('button',{name:/Ver previsões já registradas/}).click();
  await expect(page.locator('#radar-saved-forecasts')).toContainText('Barcelona × Real Madrid');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]').length,RADAR_KEY)).toBe(1);
  // Export all eight protected groups in a single local archive.
  await openTools(page);
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:/Criar cópia integral V4/}).click()
  ]);
  const archivePath=await download.path();
  expect(archivePath).toBeTruthy();
  // Only the isolated Playwright browser is cleared. NEVER a user browser.
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await openTools(page);
  await page.getByText(/Recuperar cópia integral V4 \(somente em dispositivo vazio\)/).click();
  // Playwright's download.path() is a random, extensionless temporary name.
  // The UI correctly requires *.json: upload the original suggested filename.
  await page.getByLabel('Escolher cópia integral V4').setInputFiles({
    name:download.suggestedFilename(),
    mimeType:'application/json',
    buffer:await readFile(archivePath!)
  });
  await expect(page.getByText(/Arquivo V4 conferido, sem importar dados/)).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Restaurar cópia V4 neste perfil vazio'}).click();
  await expect(page.getByText(/Restauração V4 verificada/)).toBeVisible();
  await page.getByRole('button',{name:'Reiniciar visualização do FutStats'}).click();
  await expect(page.getByRole('button',{name:/Agenda e Radar/})).toBeVisible();
  const recovered=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY);
  expect(recovered).toEqual(saved);
  const recoveredData=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'{}'),DATA_KEY);
  expect(recoveredData).toEqual(fake);
  const recoveredCalendar=await page.evaluate(key=>
    JSON.parse(localStorage.getItem(key)??'[]'),CALENDAR_KEY);
  expect(recoveredCalendar).toEqual(localCalendar);
  await page.getByRole('button',{name:/Agenda e Radar/}).click();
  await page.getByRole('button',{name:/Ver previsões já registradas/}).click();
  await expect(page.locator('#radar-saved-forecasts')).toContainText('Barcelona × Real Madrid');
});

test('Sem base, horário válido ou fonte recente, As Boas não inventa previsão',async({page})=>{
  await page.clock.install({time:new Date('2026-11-03T15:00:00.000Z')});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  await openRadar(page);
  const boas=page.getByRole('region',{name:/As Boas do Dia/});
  await expect(boas.getByText(/Nenhuma indicação passou pelos critérios hoje/)).toBeVisible();
  const details=boas.getByText('Por que alguns jogos ainda não recebem indicações?');
  await details.click();
  await expect(boas.getByText(/Nenhuma referência oficial futura cadastrada/)).toBeVisible();
  await expect(boas.getByRole('button',{name:/Abrir Radar/})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Exportar controle das indicações (CSV)'}))
    .toHaveCount(0);
  expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_KEY)).toBeNull();
});

test('Sem histórico suficiente, abre agenda mas não oferece As Boas',async({page})=>{
  await page.clock.install({time:new Date(NOW)});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  const incomplete=syntheticHistory();
  incomplete.matches=incomplete.matches.slice(0,4);
  await page.evaluate(({data,key})=>localStorage.setItem(key,JSON.stringify(data)),{
    data:incomplete,key:DATA_KEY
  });
  await page.reload();
  await openRadar(page);
  const boas=page.getByRole('region',{name:/As Boas do Dia/});
  await expect(boas.getByText(/Nenhuma indicação passou pelos critérios hoje/)).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_KEY)).toBeNull();
});


test('Android: percurso principal visível, áreas avançadas recolhidas e atalhos utilizáveis',async({page})=>{
  await page.clock.install({time:new Date(NOW)});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  await openRadar(page);
  const nav=page.getByRole('navigation',{name:'Escolha o que fazer no Radar'});
  const create=nav.getByRole('button',{name:/Criar previsão para um jogo futuro/});
  const existing=nav.getByRole('button',{name:/Ver previsões já registradas/});
  await expect(create).toBeVisible();
  await expect(existing).toBeVisible();
  const b=await existing.boundingBox();
  expect(b?.height??0).toBeGreaterThanOrEqual(44);
  const advanced=page.locator('.radar-extra-modes');
  await expect(advanced).not.toHaveAttribute('open');
  await expect(nav.getByRole('button',{name:/Radar Work/})).toBeHidden();
  await advanced.locator('summary').click();
  await expect(nav.getByRole('button',{name:/Radar Work/})).toBeVisible();
  await existing.click();
  await expect(page.locator('#radar-saved-forecasts')).toBeFocused();
  await expect(page.locator('.round-tracker-disclosure')).not.toHaveAttribute('open');
  await create.click();
  await expect(page.getByRole('region',{name:/As Boas do Dia/})).toBeVisible();
  await openTools(page);
  await expect(page.getByRole('region',{name:'Segurança e backup integral do FutStats V4'})).toBeVisible();
});

test('Agenda: referência oficial vencida exige reconfirmação e não reativa As Boas',async({page})=>{
  await page.clock.install({time:new Date('2026-10-31T12:00:00.000Z')});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  await openRadar(page);
  const queue=page.getByRole('region',{name:'Prioridades de reconferência da agenda oficial'});
  await expect(queue).toBeVisible();
  await expect(queue).toContainText('referência(s) com horário vencido');
  await expect(queue).toContainText('reconfirmar horário (N/D)');
  await expect(queue.getByRole('link',{name:/Conferir fonte oficial/}).first())
    .toHaveAttribute('href',/^https:\/\/www\./);
  const boas=page.getByRole('region',{name:/As Boas do Dia/});
  await expect(boas).toContainText('Nenhuma indicação passou pelos critérios hoje');
  await boas.getByText('Por que alguns jogos ainda não recebem indicações?').click();
  await expect(boas.getByRole('table',{name:/Transparência da lista por campeonato/})).toBeVisible();
  await expect(boas.getByText('Fonte vencida / conferir')).toBeVisible();
  await expect(boas.getByRole('button',{name:/Abrir Radar/})).toHaveCount(0);
  expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_KEY)).toBeNull();
});


test('Etapa 45: comparação documental de segunda fonte, sem atestar resultado',async({page})=>{
  await page.clock.install({time:new Date(NOW)});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  const base=syntheticHistory();
  await page.evaluate(data=>localStorage.setItem('futstats:v1',JSON.stringify(data)),base);
  await page.reload();
  await openRadar(page);
  await page.getByRole('region',{name:/As Boas do Dia/})
    .getByRole('button',{name:'Abrir Radar e conferir análise'}).click();
  await page.getByRole('button',{name:'Salvar previsão V2/V3 deste jogo'}).click();
  const original=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY);
  expect(original).toHaveLength(1);
  // These result values exist only in the isolated Playwright test profile.
  base.matches.push({
    id:'e2e-local-result',date:'2026-10-25',home:'barcelona',away:'real-madrid',
    competition:COMPETITION,first:[stat(2,18,7,5),stat(1,14,5,6)],
    second:[stat(0,0,0,0),stat(0,0,0,0)],
    research:{provider:'work-csv',source:'Flashscore',sourceId:'e2e-001',
      sourceUrl:'https://www.flashscore.com.br/jogo/?mid=e2e-001',
      importedAt:'2026-10-26T03:00:00.000Z',dateDiscrepancy:false,
      full:[stat(2,18,7,5),stat(1,14,5,6)]}
  } as (typeof base.matches)[number]);
  await page.evaluate(data=>localStorage.setItem('futstats:v1',JSON.stringify(data)),base);
  await page.clock.setFixedTime(new Date('2026-10-26T16:00:00.000Z'));
  await page.reload();
  await openRadar(page);
  await page.getByRole('button',{name:/Ver previsões já registradas/}).click();
  const audit=page.getByRole('region',{name:'Validação prospectiva As Boas do Dia'});
  const queue=audit.getByRole('region',{name:'Fila de verificação independente dos resultados'});
  await expect(queue).toContainText('1 com CSV local para conferir');
  await queue.getByText(/Ver prioridades de verificação/).click();
  const [template]=await Promise.all([
    page.waitForEvent('download'),
    queue.getByRole('button',{name:'Modelo vazio para comparar este jogo'}).click()
  ]);
  const blank=JSON.parse(await readFile((await template.path())!,'utf-8'));
  expect(blank).toMatchObject({recordKey:original[0].key,checkedAt:'',sourceUrl:''});
  expect(blank.indicators.every((m:{actual:null})=>m.actual===null)).toBe(true);
  const upload=audit.getByLabel('Carregar comparação de segunda fonte (JSON)');
  await upload.setInputFiles({name:'modelo-vazio.json',
    mimeType:'application/json',buffer:Buffer.from(JSON.stringify(blank))});
  await expect(audit).toContainText('Identidade, data ou domínio da segunda fonte inválidos.');
  const supplied={...blank,checkedAt:'2026-10-26T10:00:00.000Z',
    sourceUrl:'https://www.sofascore.com/pt/futebol/jogo/barca-madrid/abc',
    indicators:[{id:'goals-full-2.5',actual:3}]};
  await upload.setInputFiles({name:'valores-informados.json',
    mimeType:'application/json',buffer:Buffer.from(JSON.stringify(supplied))});
  const comparison=audit.getByRole('region',{name:'Resultado da comparação documental'});
  await expect(comparison).toContainText('DOCUMENTAÇÃO INFORMADA — NÃO VERIFICADA NA WEB');
  await expect(comparison).toContainText('COINCIDE');
  await expect(comparison).toContainText('N/D');
  await expect(comparison).toContainText('PENDENTE');
  await upload.setInputFiles({name:'divergencia.json',
    mimeType:'application/json',buffer:Buffer.from(JSON.stringify({
      ...supplied,indicators:[{id:'goals-full-2.5',actual:4}]
    }))});
  await expect(comparison).toContainText('DIVERGE');
  const [dossier]=await Promise.all([
    page.waitForEvent('download'),
    audit.getByRole('button',{name:'Exportar dossiê local da comparação (JSON)'}).click()
  ]);
  expect(dossier.suggestedFilename()).toBe('futstats-dossie-comparacao-local.json');
  const packet=JSON.parse(await readFile((await dossier.path())!,'utf-8'));
  expect(packet).toMatchObject({
    format:'futstats-dossie-comparacao-documental-v1',
    independentVerification:'PENDENTE',
    originalRecord:{key:original[0].key},
    comparison:{disagreement:1}
  });
  expect(packet.sha256).toMatch(/^[a-f0-9]{64}$/);
  const dossierUpload=audit.getByLabel('Conferir integridade do dossiê (JSON)');
  await dossierUpload.setInputFiles({name:'dossie-legitimo.json',
    mimeType:'application/json',buffer:Buffer.from(JSON.stringify(packet))});
  await expect(audit).toContainText('Integridade SHA-256 consistente');
  await expect(audit).toContainText('DOCUMENTAÇÃO NÃO VERIFICADA NA WEB');
  const tampered={...packet,comparison:{...packet.comparison,disagreement:77}};
  await dossierUpload.setInputFiles({name:'dossie-alterado.json',
    mimeType:'application/json',buffer:Buffer.from(JSON.stringify(tampered))});
  await expect(audit).toContainText('integridade SHA-256 falhou');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY)).toEqual(original);
});


test('Etapa 47: As Boas recupera registro existente em um toque sem duplicá-lo',async({page})=>{
  await page.clock.install({time:new Date(NOW)});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  await page.evaluate(data=>localStorage.setItem('futstats:v1',JSON.stringify(data)),syntheticHistory());
  await page.reload();
  await openRadar(page);
  const boas=page.getByRole('region',{name:/As Boas do Dia/});
  await expect(boas.getByRole('button',{name:'Abrir Radar e conferir análise'})).toHaveCount(1);
  await boas.getByRole('button',{name:'Abrir Radar e conferir análise'}).click();
  await page.getByRole('button',{name:'Salvar previsão V2/V3 deste jogo'}).click();
  const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY);
  expect(before).toHaveLength(1);
  await page.getByRole('button',{name:/Criar previsão para um jogo futuro/}).click();
  const daily=page.getByRole('region',{name:/As Boas do Dia/});
  await expect(daily).toContainText('Indicação já salva em As Boas');
  await expect(daily.getByRole('button',{name:'Abrir Radar e conferir análise'})).toHaveCount(0);
  await daily.getByRole('button',{name:'Ver previsão já registrada'}).click();
  const selected=page.getByRole('listitem',{name:'Previsão salva Barcelona contra Real Madrid'});
  await expect(selected).toBeVisible();
  await expect(selected).toBeFocused();
  await expect(selected).toContainText('Barcelona × Real Madrid');
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY);
  expect(after).toEqual(before);
  expect(after).toHaveLength(1);
});


test('Etapa 48: preparar prévia em 7 dias sem registrar como Boa do Dia',async({page})=>{
  await page.clock.install({time:new Date(NOW)});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  const data=syntheticHistory();
  data.teams.push({id:'alaves',name:'Deportivo Alavés',color:'#123456'});
  for(let i=0;i<5;i++)data.matches.push({
    id:'alaves-away-'+i,date:'2026-10-'+String(14+i).padStart(2,'0'),
    home:'opponent-'+i,away:'alaves',competition:COMPETITION,
    first:[stat(1,10,4,5),stat(2,18,7,5)],
    second:[stat(0,0,0,0),stat(0,0,0,0)]
  });
  await page.evaluate(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),{key:DATA_KEY,data});
  await page.reload();
  await openRadar(page);
  const shortlist=page.getByRole('region',{name:/As Boas do Dia/});
  await expect(shortlist).toContainText('FC Barcelona × Real Madrid');
  const next=shortlist.getByText(/Preparar próximos 7 dias/);
  await expect(next).toContainText('com prévia possível');
  await next.click();
  const section=page.getByLabel('Preparar análises dos próximos sete dias');
  await expect(section).toContainText('FC Barcelona × Deportivo Alavés');
  await expect(section).toContainText('Prévia possível — não é indicação');
  await expect(section).toContainText('Histórico insuficiente');
  await section.getByRole('button',{name:'Abrir prévia no Radar (sem indicação)'}).first().click();
  const fixture=page.locator('.radar-selected-fixture');
  await expect(fixture).toContainText('FC Barcelona × Deportivo Alavés');
  await expect(fixture).toContainText('2026-10-31');
  const previously=await page.evaluate(key=>localStorage.getItem(key),RADAR_KEY);
  expect(previously===null||previously==='[]').toBeTruthy();
  await page.getByRole('button',{name:'Salvar previsão V2/V3 deste jogo'}).click();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({competition:COMPETITION,
    home:'Barcelona',away:'Deportivo Alavés',matchAt:'2026-10-31T17:00:00'});
  expect(saved[0]).not.toHaveProperty('goodPicks');
  expect(saved[0].markets.length).toBeGreaterThan(0);
});


test('Etapa 49: nove jogos oficiais Bundesliga acessíveis por filtro, vencendo em N/D',async({page})=>{
  await page.clock.install({time:new Date(NOW)});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  await openRadar(page);
  await page.getByRole('group',{name:'Período da agenda'})
    .getByRole('button',{name:'7 dias'}).click();
  const official=page.getByRole('region',{name:'Jogos com referências oficiais'});
  await official.getByLabel('Filtrar campeonato na agenda oficial')
    .selectOption('Bundesliga 2026/27');
  const fixtures=official.locator('.official-fixture');
  await expect(fixtures).toHaveCount(9);
  await expect(official).toContainText('FC Bayern München × Borussia Dortmund');
  await expect(official).toContainText('Bayer 04 Leverkusen × VfB Stuttgart');
  await expect(official).toContainText('SV Elversberg × 1. FSV Mainz 05');
  await expect(official).toContainText('Eintracht Frankfurt × Hamburger SV');
  const derby=fixtures.filter({hasText:'FC Bayern München × Borussia Dortmund'});
  await expect(derby).toContainText('2026-10-31 · 14:30 (Brasília)');
  const opener=fixtures.filter({hasText:'SV Elversberg × 1. FSV Mainz 05'});
  await expect(opener).toContainText('2026-10-30 · 16:30 (Brasília)');
  await expect(fixtures.first().getByRole('link',{name:'Conferir programação oficial'}))
    .toHaveAttribute('href','https://www.bundesliga.com/en/bundesliga/matchday/2026-2027/8');
  expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_KEY)).toBeNull();

  // No live recheck: after two Brasília days the source is stale on all 9.
  await page.clock.setFixedTime(new Date('2026-10-29T12:00:00.000Z'));
  await page.reload();
  await openRadar(page);
  await page.getByRole('group',{name:'Período da agenda'})
    .getByRole('button',{name:'7 dias'}).click();
  const stale=page.getByRole('region',{name:'Jogos com referências oficiais'});
  await stale.getByLabel('Filtrar campeonato na agenda oficial')
    .selectOption('Bundesliga 2026/27');
  const listed=stale.locator('.official-fixture');
  await expect(listed).toHaveCount(9);
  expect((await listed.allTextContents()).every(v=>v.includes('horário N/D · reconfirmar'))).toBe(true);
  expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_KEY)).toBeNull();
});


test('Etapa 50: nove jogos Bundesliga agrupados numa fonte com CSV PENDENTE',async({page})=>{
  await page.clock.install({time:new Date(NOW)});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  await openRadar(page);
  await page.getByRole('group',{name:'Período da agenda'})
    .getByRole('button',{name:'7 dias'}).click();
  const official=page.getByRole('region',{name:'Jogos com referências oficiais'});
  await official.getByLabel('Filtrar campeonato na agenda oficial')
    .selectOption('Bundesliga 2026/27');
  const batch=official.locator('details.official-source-review');
  await expect(batch.locator('summary')).toContainText('1 fonte para 9 jogos');
  await batch.locator('summary').click();
  await expect(batch).toContainText('0 horário(s) vencido(s)');
  await expect(batch.getByRole('link',{name:'Abrir página oficial do grupo'}))
    .toHaveCount(1);
  await expect(batch.getByRole('link',{name:'Abrir página oficial do grupo'}))
    .toHaveAttribute('href','https://www.bundesliga.com/en/bundesliga/matchday/2026-2027/8');
  const [first]=await Promise.all([
    page.waitForEvent('download'),
    batch.getByRole('button',{name:'Exportar checklist de fontes oficiais (CSV)'}).click()
  ]);
  expect(first.suggestedFilename()).toBe('futstats-reconferencia-fontes-oficiais.csv');
  const csv=await readFile((await first.path())!,'utf-8');
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(2);
  expect(csv).toContain('"PENDENTE"');
  expect(csv).toContain('FC Bayern München x Borussia Dortmund');
  expect(csv).toContain('SV Elversberg x 1. FSV Mainz 05');
  expect(csv).not.toContain('"CONFIRMADO"');
  expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_KEY)).toBeNull();

  // Old snapshots are NOT silently renewed by a click or downloaded file.
  await page.clock.setFixedTime(new Date('2026-10-29T12:00:00.000Z'));
  await page.reload();
  await openRadar(page);
  await page.getByRole('group',{name:'Período da agenda'})
    .getByRole('button',{name:'7 dias'}).click();
  const expired=page.getByRole('region',{name:'Jogos com referências oficiais'});
  await expired.getByLabel('Filtrar campeonato na agenda oficial')
    .selectOption('Bundesliga 2026/27');
  const oldBatch=expired.locator('details.official-source-review');
  await expect(oldBatch.locator('summary')).toContainText('1 fonte para 9 jogos');
  await oldBatch.locator('summary').click();
  await expect(oldBatch).toContainText('9 horário(s) vencido(s)');
  const [oldFile]=await Promise.all([
    page.waitForEvent('download'),
    oldBatch.getByRole('button',{name:'Exportar checklist de fontes oficiais (CSV)'}).click()
  ]);
  const oldCsv=await readFile((await oldFile.path())!,'utf-8');
  expect(oldCsv.split('\r\n').filter(Boolean)).toHaveLength(2);
  expect(oldCsv).toContain('"PENDENTE"');
  expect((oldCsv.match(/\(N\/D Brasília, expired\)/g)??[])).toHaveLength(9);
  expect(oldCsv).not.toContain('14:30 Brasília');
  expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_KEY)).toBeNull();
});


test('Etapa 51: ID de resultado duplicado e importação futura não viram acerto',async({page})=>{
  await page.clock.install({time:new Date(NOW)});
  await page.route('**/raw.githubusercontent.com/**',route=>route.abort());
  await page.goto('/');
  const base=syntheticHistory();
  await page.evaluate(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),{key:DATA_KEY,data:base});
  await page.reload();
  await openRadar(page);
  await page.getByRole('region',{name:/As Boas do Dia/})
    .getByRole('button',{name:'Abrir Radar e conferir análise'}).click();
  await page.getByRole('button',{name:'Salvar previsão V2/V3 deste jogo'}).click();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY);
  expect(saved).toHaveLength(1);
  const result={
    id:'local-source-001',date:'2026-10-25',
    competition:COMPETITION,home:'barcelona',away:'real-madrid',
    first:[stat(2,18,7,5),stat(1,14,5,6)],
    second:[stat(0,0,0,0),stat(0,0,0,0)],
    research:{provider:'work-csv',source:'Flashscore',
      sourceId:'local-source-001',
      sourceUrl:'https://www.flashscore.com.br/jogo/?mid=local-source-001',
      importedAt:'2026-10-26T03:00:00.000Z',dateDiscrepancy:false,
      full:[stat(2,18,7,5),stat(1,14,5,6)]}
  };
  const duplicate={...result,id:'other-unrelated-fixture',
    date:'2026-10-24',home:'visitor-0',away:'opponent-0',
    competition:'Liga sem relação'};
  base.matches.push(result as (typeof base.matches)[number],
    duplicate as (typeof base.matches)[number]);
  const saveBase=async()=>{
    await page.evaluate(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),
      {key:DATA_KEY,data:base});
    await page.reload();
    await openRadar(page);
    await page.getByRole('button',{name:/Ver previsões já registradas/}).click();
  };
  await page.clock.setFixedTime(new Date('2026-10-26T16:00:00.000Z'));
  // The application's EXISTING global parser already rejects any research
  // sourceId reused in separate matches; never bypass or relax this barrier.
  await page.evaluate(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),
    {key:DATA_KEY,data:base});
  await page.reload();
  await expect(page.getByText(/Não foi possível ler os dados locais/)).toBeVisible();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY))
    .toEqual(saved);

  base.matches.pop(); // remove the unrelated fixture; only isolated synthetic data
  result.research.importedAt='2026-10-30T12:00:00.000Z';
  await saveBase();
  let audit=page.getByRole('region',{name:'Validação prospectiva As Boas do Dia'});
  await expect(audit).toContainText('0 confronto(s) com resultado');
  await expect(audit.getByRole('status',{name:'Resultados locais bloqueados por procedência'}))
    .toContainText('1 resultado(s) com data de importação futura');
  let queue=audit.getByRole('region',{name:'Fila de verificação independente dos resultados'});
  await expect(queue).toContainText('0 com CSV local para conferir');

  result.research.importedAt='2026-10-26T03:00:00.000Z';
  await saveBase();
  audit=page.getByRole('region',{name:'Validação prospectiva As Boas do Dia'});
  await expect(audit).toContainText('1 confronto(s) com resultado');
  await expect(audit.getByRole('status',{name:'Resultados locais bloqueados por procedência'}))
    .toHaveCount(0);
  queue=audit.getByRole('region',{name:'Fila de verificação independente dos resultados'});
  await expect(queue).toContainText('1 com CSV local para conferir');
  await expect(queue).toContainText('PENDENTE');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'[]'),RADAR_KEY))
    .toEqual(saved);
});
