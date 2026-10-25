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
