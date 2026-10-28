import {expect,test} from '@playwright/test';

/** A clean experimental browser reads the 1,779 published research games.
 * Never imports them into 'futstats:v1' or recalculates saved predictions.
 */
test.use({serviceWorkers:'block'});
test('Radar e As Boas consultam pesquisa quando a base pessoal está vazia',async({page})=>{
 await page.route('**/raw.githubusercontent.com/**',r=>r.abort());
 await page.goto('/');
 await expect(page.getByText('1.779',{exact:true})).toBeVisible({timeout:45000});
 await expect(page.getByText('V2/V3 · pesquisa histórica')).toBeVisible();
 const native=await page.evaluate(()=>localStorage.getItem('futstats:v1'));
 expect(native).toBeNull();
 const shortcut=page.getByRole('button',{name:/Agenda e Radar/});
 await shortcut.click();
 await expect(page.getByText(/1.779 jogos de pesquisa/)).toBeVisible({timeout:45000});
 await expect(page.locator('.radar-hero-stats')).toContainText('1.779');
 expect(await page.evaluate(()=>localStorage.getItem('futstats:v1'))).toBeNull();
 expect(await page.evaluate(()=>localStorage.getItem('futstats-radar-previews-v1'))).toBeNull();
});
