import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e',outputDir:'./work/playwright',timeout:180000,workers:1,
  use:{baseURL:'http://localhost:5190',headless:true,launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']},screenshot:'only-on-failure'},
  projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'android-layout',use:{viewport:{width:390,height:844}}}],
  webServer:{command:'npm run preview -- --port 5190 --strictPort',url:'http://localhost:5190',reuseExistingServer:!process.env.CI}
});
