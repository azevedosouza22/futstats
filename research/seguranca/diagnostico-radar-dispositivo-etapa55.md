# Etapa 55 · Diagnóstico pontual do Radar e acessibilidade em celulares

**25/10/2026, São Paulo/Rio de Janeiro (Brasília). Somente PR experimental filho do #54.**

## Objetivo real
Checar um percurso do app **na interface do navegador** sem confundir viewport Android do CI com QA em aparelho Android físico. O sistema tinha testes de 390×844px, mas ainda não fornecia diagnóstico local acionável ao usuário nem cobria larguras muito pequenas.

## Mudança entregue
Em **Radar → Outras análises · Histórico e Work**, botão recolhido **“Testar interface e armazenamento neste dispositivo”**.

Ao tocar, o FutStats executa uma checagem **somente leitura, neste dispositivo e nesta tela**:
1. Largura do documento não excede a largura real da viewport (sem barra horizontal global).
2. Botão **Criar previsão** possui área efetiva de pelo menos 44 × 44 CSS px.
3. Botão **Ver previsões** também tem área efetiva de pelo menos 44 × 44 CSS px.
4. Os nove grupos V4 localmente presentes estão legíveis e estruturalmente válidos; grupos ausentes não viram dados fictícios.
5. API `crypto.randomUUID` do navegador está disponível para identificar previsões futuras.
6. `crypto.subtle` permite verificar SHA-256 **local** em dossiês documentais, mas não autentica fontes na web.

Relatório **APTO PARA TESTE** somente com 6/6, senão **REVISAR** com motivo individual para a checagem que não passou. Estado transitório na tela; nenhuma gravação local, upload, rede, coletor ou cron. O botão fica recolhido na área avançada para não distrair o usuário do percurso Agenda → Radar → salvar → recuperar.

**Aviso explícito:** DIAGNÓSTICO LOCAL — NÃO É TESTE FÍSICO ANDROID. Os testes checam medidas observadas no DOM, não a durabilidade do armazenamento no sistema operacional, bateria, reinstalação PWA, funcionamento offline, confiabilidade externa de resultados ou precisão dos modelos.

## Testes programados
- Vitest: 6 verificações, viewport inconsistente ou 320/390 largura, tolerância subpixel, botões inferiores a 44px, armazenamento inválido, UUID e SHA-256 indisponíveis e sem alegação de QA físico.
- Playwright desktop/viewport Android: fluxo com histórico sintético de 10 jogos e previsão salva → diagnóstico 6/6 → comparativo byte a byte de todo o `localStorage` → recuperação da mesma previsão na aba de registros.
- Playwright com viewports adicionais de **320, 360 e 390px**: checar botões principais, resultados do diagnóstico e ausência de overflow horizontal global. Se detectado, corrigir CSS no PR e repetir CI até verde.
- Nenhum teste inspeciona o armazenamento pessoal do usuário; o navegador isolado do GitHub Actions contém apenas dados artificiais.

## Preservação
PR DRAFT sobre o último checkpoint #54, sem merge/deploy, sem restaurar ou importar jogos. Preserva 659 históricos reais, Radar V2/V3, Work, backups e aplicação Vercel. O status da validação prospectiva permanece 0/30 por campeonato, N/D e PENDENTE quando não existem resultados reais conferidos.

## Próximos passos
Quando houver uma versão experimental acessível e autorização para testar no Android físico, essa checagem ajudará a identificar problemas de viewport e API no **aparelho real** sem prints ou passos técnicos complexos. Um resultado verde no GitHub Actions não prova que o teste físico já aconteceu.
