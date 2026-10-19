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
