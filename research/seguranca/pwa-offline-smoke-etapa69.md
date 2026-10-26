# FutStats IA — Etapa 69 · Reabertura PWA verdadeiramente offline no navegador

**26/10/2026 · PR experimental filho do #68. Não altera `main`, Vercel nem o aplicativo Android instalado.**

## Lacuna diagnosticada
Os 56 testes Playwright existentes sempre usavam `test.use({serviceWorkers:'block'})`, portanto mediam a experiência no navegador, mas **não** comprovavam que a versão PWA **já compilada** conseguiria abrir a página inicial ou recuperar a previsão congelada sem rede. O app é uma PWA instalada em Android; essa é uma etapa de QA essencial antes do teste no aparelho real.

## Teste efetivamente executado
Novo `e2e/offline-pwa-recovery.spec.ts`, executado apenas na **versão de produção compilada em `vite preview`**, com Chromium em perfil isolado e **service worker habilitado**:

1. Abrir a home da versão compilada com conexão, aguardar a ativação do service worker, controle do documento e cache de `precache` de arquivos da aplicação. Se não houver cache/controlador, o teste falha.
2. Inserir dez partidas **sintéticas** do campeonato no armazenamento exclusivo do navegador Playwright.
3. Na UI, selecionar uma indicação “As Boas do Dia”, abrir o Radar e **salvar uma previsão congelada** com o botão verdadeiro.
4. Copiar os valores completos de `localStorage` na memória do teste e **desconectar a rede do contexto do navegador** por `context.setOffline(true)`.
5. Ainda sem internet, executar `page.reload()`: exigir que o documento PWA reabra, abrir Agenda/Radar, visitar os registros salvos e comparar previsão + `localStorage` original **byte a byte**.
6. Reativar conexão e recarregar; conferir mais uma vez que o registro continua idêntico.
7. Repetir nos projetos desktop e **layout Android simulado 390×844** no CI.

O workflow `.github/workflows/futstats-e2e.yml` mantém toda a suíte anterior e **acrescenta** este teste como etapa obrigatória, com service worker real e sem consulta a resultados esportivos.

## Limites
- **Não** significa teste em aparelho físico Android, resistência a limpeza dos dados do Chrome, reinstalação, atualização do PWA, perda de armazenamento nem recuperação de um backup externo real.
- Nenhum jogo concluído real foi consultado, nenhuma previsão prospectiva real foi verificada independentemente e nenhuma taxa de acerto pode ser declarada. Amostra autenticada permanece **0/30 por campeonato e N/D**.
- Nenhum dado privado sai do navegador, nenhum site bloqueado é contornado; dados do teste são inteiramente artificiais.
- **Sem merge, deploy, importação, coleta contínua ou alteração de produção**, histórico real de 659 partidas, Radar V2/V3, Work e backups preservados.

## Critério de aceite
GitHub Actions verde no HEAD final: Vitest, TypeScript/Vite, testes Node e cadeia DRAFT, os **56 E2E originais** e **2 cenários offline com service worker ativo**. Só então adicionar um ponto à área 12 de preparação/QA (planejamento 95→96%), mantendo a autorização de merge/deploy, o QA Android físico e a validação externa como pendências obrigatórias.
