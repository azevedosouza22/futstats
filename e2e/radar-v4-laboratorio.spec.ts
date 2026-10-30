import {test,expect} from '@playwright/test';

test('Radar V4: botão da visão geral abre laboratório sem alterar os registros',async({page})=>{
 // Free external community catalogues may be temporarily offline.
 // Lab must still respond using its dated built-in official references.
 await page.route(/^https:\/\//,route=>route.abort());
 await page.goto('/');
 await page.getByRole('button',{name:'Analisar jogos de hoje'}).first().click();
 await expect(page.getByRole('heading',{name:'Radar V4 · Laboratório'})).toBeVisible();
 const analyze=page.locator('.v4-lab-actions button.primary');
 await expect(analyze).toBeEnabled({timeout:90000});
 await analyze.click();
 await expect(page.getByLabel('Resumo dos resultados')).toBeVisible({timeout:45000});
 await page.getByRole('button',{name:'1º tempo'}).last().click();
 await expect(page.locator('.v4-lab-periods button.selected')).toContainText('1º tempo');
 await expect(page.getByText(/Sem sinal|Regra V4|agenda|histórico/i).first()).toBeVisible();
 const untouched=await page.evaluate(()=>({
  v4:localStorage.getItem('futstats:radar-v4-lab-frozen:v1'),
  regular:localStorage.getItem('futstats-radar-previews-v1')
 }));
 expect(untouched.v4).toBeNull();
 expect(untouched.regular).toBeNull();
});
