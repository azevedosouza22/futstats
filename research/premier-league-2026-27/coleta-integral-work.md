# FutStats — Premier League inglesa 2026/27 — coleta integral no Work

**Planejado em 23/10/2026.** **Uma liga por execução**, sem solicitação de novos comandos por rodada ou por partida. O usuário confirmou no Android que, após a Ligue 1, o contador **Jogos completos via Work = 222**: 70 Serie A italiana, 89 La Liga espanhola e 63 Ligue 1 francesa. A pesquisa europeia CC0 de 155 resultados, o histórico local de 659 partidas, Radar V2/V3 e produção não devem ser modificados.

## Diferenciar o piloto de dados completos

Existe um **piloto público de 70 jogos da Premier League 2026/27** (rodadas 1 a 7), ligado a `src/fplFreePilot.ts` e `src/FplStatsPilot.tsx` no PR nº 13. Esse piloto **NÃO é a coleta completa no padrão de 55 colunas**: ele apresenta algumas métricas de jogo completo, mas não finalizações/chutes no gol/escanteios de 1º e 2º tempos confirmados. **Não considerar essas 70 partidas prontas para o CSV completo e não pular sua pesquisa**; reutilizar apenas metadados/placares quando corroborados. Existe uma pesquisa **pontual** antiga Spurs×Coventry, não uma temporada inteira de Premier League no Work.

OpenFootball (CC0) https://github.com/openfootball/football.json/blob/master/2026-27/en.1.json fornece calendário de **380 partidas e 20 clubes**, mas a versão inspecionada tem apenas **45 resultados com FT/HT até 20/09/2026**; está desatualizada como fonte dos resultados atuais. Serve para cruzar calendário, clubes e os placares **somente quando explicitamente publicados**, nunca para declarar jogos de outubro encerrados. A identidade e situação de jogos devem ser confirmadas em fonte de resultados atual.

## Instrução ao Work (uma única pesquisa para a Premier League)

Pesquisar **TODAS as partidas encerradas da Premier League inglesa 2026/27 até a data efetiva da execução**. Cobrir também as 70 partidas do piloto, pois lhes faltam os dados estatísticos dos dois tempos. Usar o procedimento de pesquisas pontuais no Flashscore (onde autorizado) que funcionou na Serie A italiana, La Liga espanhola e Ligue 1 francesa, ou outras fontes confiáveis e acessíveis.

Para **cada partida**, coletar os quatro indicadores **gols, finalizações totais, chutes no gol/no alvo e escanteios**, separadamente para **mandante e visitante**, nos períodos **jogo completo, primeiro tempo, segundo tempo**. Checar FT, intervalo, status ENCERRADO, equipes/data, ID e URLs genuínas. Não presumir valor zero quando dado estiver indisponível. Qualquer estatística da fonte alternativa deve ter proveniência identificada. Não usar scraping em massa não autorizado, burlar bloqueios, redistribuir dados proprietários, ou assumir que navegação pública autoriza exportação comercial.

**Proteção contra travamento:** o Work gerencia checkpoints persistentes INTERNOS de jogo/ID/período, deduplicação, validações intermediárias e retomada do último checkpoint sem pedir novos comandos a cada rodada. Checkpoints não autorizam mutações nos históricos privados nem substituição de jogos existentes. Não alegar sucesso integral se alguma partida não estiver verificada.

## Entregáveis finais

1. **Um CSV UTF-8 com BOM**, esquema **idêntico às 55 colunas** FutStats dos lotes aprovados, com **todos os jogos encerrados e confirmados** da Premier League 2026/27, cada uma das 4 métricas para mandante/visitante e todos os três períodos. Não chamar arquivo parcial de completo; reportar N/D quando necessário.
2. **Um relatório de validação resumido**: jogos encontrados, encerrados, completos, parciais, jogos adiados/abandonados, rodadas/datas, origem/licença, confronto com OpenFootball quando disponível e divergências. Verificar 8 somas 1º+2º=FT por jogo, 12 somas mandante+visitante=total, 6 regras chutes no alvo ≤ finalizações, IDs únicos e links reais.
3. Checkpoint de progresso recuperável como terceiro arquivo **somente se realmente necessário**, evitando perda caso a operação seja interrompida.

**Não importar** no FutStats e **não alterar** versão de produção, GitHub, branch `main`, 659 históricos, 155 resultados europeus CC0, os **222 jogos via Work** de outras ligas, 70 jogos do piloto Premier League ou previsões Radar. Devolver o CSV e relatório ao usuário para revisão no chat FutStats. Os dados detalhados coletados não devem ser publicados no GitHub sem confirmação de licença de reutilização. Após a validação do CSV, será necessário preparar uma **integração experimental específica da Premier League**: o importador atual de `src/europeWorkResearch.ts` só contempla Serie A, La Liga e Ligue 1. **Não pedir ao usuário para importar diretamente pelo importador das três ligas**, pois isso seria rejeitado e não significa arquivo inválido.
