# FutStats — Premier League inglesa 2026/27 — coleta integral no Work

**Planejado em 23/10/2026.** **Uma liga por execução**, sem solicitação de novos comandos por rodada ou por partida. O usuário confirmou no Android que, após a Ligue 1, o contador **Jogos completos via Work = 222**: 70 Serie A italiana, 89 La Liga espanhola e 63 Ligue 1 francesa. A pesquisa europeia CC0 de 155 resultados, o histórico local de 659 partidas, Radar V2/V3 e produção não devem ser modificados.

## Diferenciar o piloto de dados completos

Existe um **piloto público de 70 jogos da Premier League 2026/27** (rodadas 1 a 7), ligado a `src/fplFreePilot.ts` e `src/FplStatsPilot.tsx` no PR nº 13. Esse piloto **NÃO é a coleta completa no padrão de 55 colunas**: ele apresenta algumas métricas de jogo completo, mas não finalizações/chutes no gol/escanteios de 1º e 2º tempos confirmados. **Não considerar essas 70 partidas prontas para o CSV completo e não pular sua pesquisa**; reutilizar apenas metadados/placares quando corroborados. Existe uma pesquisa **pontual** antiga Spurs×Coventry, não uma temporada inteira de Premier League no Work.

OpenFootball (CC0) https://github.com/openfootball/football.json/blob/master/2026-27/en.1.json fornece calendário de **380 partidas e 20 clubes**, mas a versão inspecionada tem apenas **45 resultados com FT/HT até 20/09/2026**; está desatualizada como fonte dos resultados atuais. Serve para cruzar calendário, clubes e os placares **somente quando explicitamente publicados**, nunca para declarar jogos de outubro encerrados. A identidade e situação de jogos devem ser confirmadas em fonte de resultados atual.

## Decisão de arquitetura — substituir o piloto somente após validação (23/10/2026)

**Pedido do usuário:** verificar os arquivos da Premier League já existentes no aplicativo e avaliar se podem ser substituídos pelos dados mais completos do Work. **Sim, mediante validação e migração sem perdas, não exclusão imediata.** A inspeção do código do PR nº 13 confirmou:

- `src/FplStatsPilot.tsx` + `src/fplFreePilot.ts`: piloto **somente leitura** da FPL Core Insights, carregando `teams.csv` e `matches.csv` por rodada (70 partidas das primeiras sete rodadas, com mecanismo de descoberta de novas rodadas). Não insere na base local.
- `src/fplPeriodAudit.ts`: arquivos externos `shots.csv` por rodada, usados para reconciliar gols/finalizações/chutes no gol por período quando possível; **não fornecem escanteios por tempo**.
- `src/OpenFootballPilot.tsx`: catálogo CC0 `en.1.json`, 380 jogos no calendário, com só parte dos FT/HT publicados atualmente. Consulta sem alteração do histórico.
- `src/fplWorkReview.ts`: opção `Conferir pesquisa do Work sem importar`, valida CSV contra o piloto carregado, **não guarda dados**; os jogos além da cobertura do piloto não devem ser falsamente rejeitados em uma futura importação de temporada.
- `src/WorkCsvImport.tsx` (genérico) **pode alterar a base histórica principal** se o usuário confirmar a gravação. **NÃO utilizá-lo** para esta migração — precisamos de um importador experimental separado, como foi feito nas três ligas europeias.

**Estratégia segura para nova fonte completa:**

1. **Receber primeiro** o CSV de 55 colunas da Premier League 2026/27 e o relatório do Work; comparar todas as partidas sobrepostas com o piloto existente (identidade, mandante/visitante, data, placares, totais de finalizações, alvo e escanteios, e dados por tempo onde já confiáveis). Rejeitar conflitos para revisão, sem substituição silenciosa.
2. Criar/estender **base experimental privada e separada** para partidas completas da Premier League, com deduplicação por confronto/data/temporada, ID autêntico da fonte, sem escrever em `futstats:v1`, `futstats:europe-research-cc0:v1`, `futstats:europe-work-stats:v1` ou no Radar.
3. **Promover a exibição do Work validado** a referência principal da Premier League no V4, com os quatro indicadores para mandante/visitante em FT/1º/2º tempo. Preservar o piloto antigo como **modo legado de comparação/diagnóstico** (pode ficar recolhido, não precisa manter interface duplicada).
4. Somente depois de verificar que a nova base permite todas as análises necessárias, considerar desativar o piloto antigo. **Não apagar** arquivos do GitHub, originais nem dados anteriores até confirmar que não se perdeu informação útil (por exemplo, eventos dos chutes, metadados das rodadas e calendário futuro).
5. Avisar o usuário uma única vez para importar o consolidado em dispositivo **após** o app estar pronto para esse tipo de CSV; evitar download/reimportação rodada a rodada, prints repetidos e comandos técnicos.
6. Todas as funcionalidades devem distinguir leitura local privada de permissão para publicar/revender estatísticas dos provedores. **Não publicar CSV proprietário no GitHub**.

**Situação atual:** plano registrado; **nenhuma migração ou exclusão foi feita**. A futura promoção fica condicionada à chegada e auditoria do consolidado Premier League. Os **222 jogos completos via Work** das outras ligas, **155 resultados CC0**, **659 históricos** e Radar continuam protegidos.

## Instrução ao Work (uma única pesquisa para a Premier League)

Pesquisar **TODAS as partidas encerradas da Premier League inglesa 2026/27 até a data efetiva da execução**. Cobrir também as 70 partidas do piloto, pois lhes faltam os dados estatísticos dos dois tempos. Usar o procedimento de pesquisas pontuais no Flashscore (onde autorizado) que funcionou na Serie A italiana, La Liga espanhola e Ligue 1 francesa, ou outras fontes confiáveis e acessíveis.

Para **cada partida**, coletar os quatro indicadores **gols, finalizações totais, chutes no gol/no alvo e escanteios**, separadamente para **mandante e visitante**, nos períodos **jogo completo, primeiro tempo, segundo tempo**. Checar FT, intervalo, status ENCERRADO, equipes/data, ID e URLs genuínas. Não presumir valor zero quando dado estiver indisponível. Qualquer estatística da fonte alternativa deve ter proveniência identificada. Não usar scraping em massa não autorizado, burlar bloqueios, redistribuir dados proprietários, ou assumir que navegação pública autoriza exportação comercial.

**Proteção contra travamento:** o Work gerencia checkpoints persistentes INTERNOS de jogo/ID/período, deduplicação, validações intermediárias e retomada do último checkpoint sem pedir novos comandos a cada rodada. Checkpoints não autorizam mutações nos históricos privados nem substituição de jogos existentes. Não alegar sucesso integral se alguma partida não estiver verificada.

## Entregáveis finais

1. **Um CSV UTF-8 com BOM**, esquema **idêntico às 55 colunas** FutStats dos lotes aprovados, com **todos os jogos encerrados e confirmados** da Premier League 2026/27, cada uma das 4 métricas para mandante/visitante e todos os três períodos. Não chamar arquivo parcial de completo; reportar N/D quando necessário.
2. **Um relatório de validação resumido**: jogos encontrados, encerrados, completos, parciais, jogos adiados/abandonados, rodadas/datas, origem/licença, confronto com OpenFootball quando disponível e divergências. Verificar 8 somas 1º+2º=FT por jogo, 12 somas mandante+visitante=total, 6 regras chutes no alvo ≤ finalizações, IDs únicos e links reais.
3. Checkpoint de progresso recuperável como terceiro arquivo **somente se realmente necessário**, evitando perda caso a operação seja interrompida.

**Não importar** no FutStats e **não alterar** versão de produção, GitHub, branch `main`, 659 históricos, 155 resultados europeus CC0, os **222 jogos via Work** de outras ligas, 70 jogos do piloto Premier League ou previsões Radar. Devolver o CSV e relatório ao usuário para revisão no chat FutStats. Os dados detalhados coletados não devem ser publicados no GitHub sem confirmação de licença de reutilização. Após a validação do CSV, será necessário preparar uma **integração experimental específica da Premier League**: o importador atual de `src/europeWorkResearch.ts` só contempla Serie A, La Liga e Ligue 1. **Não pedir ao usuário para importar diretamente pelo importador das três ligas**, pois isso seria rejeitado e não significa arquivo inválido.
