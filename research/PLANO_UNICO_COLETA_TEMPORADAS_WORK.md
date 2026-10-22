# FutStats — Nova orientação: coleta integral por temporada, uma única execução no Work

**Decisão do usuário em 22/10/2026:** suspender o modelo de micro-lotes (3, 7 partidas etc.). Os planos de lote 01/02 permanecem como histórico/auditoria, **não** como roteiro obrigatório das próximas coletas. O objetivo é obter os datasets restantes **de uma só vez**, um arquivo por competição/temporada, organizados em um único pacote, sem tarefas repetitivas manuais.

## Tarefa integral para o ChatGPT Work

Analise a estrutura real do projeto `azevedosouza22/futstats`, PR #13, e faça levantamento das competições/temporadas existentes, já coletadas ou parcialmente cobertas, conferindo os arquivos e notas do projeto. Os números abaixo são um ponto de partida, **não são garantia de cobertura atual**:

- 659 jogos no histórico pessoal do usuário (299 Brasileirão 2026, 306 Bundesliga 2025/26, 54 Bundesliga 2026/27), armazenados em seu Android; **não tentar reimportar** sem verificar e preservar.
- 155 resultados e intervalos experimentais da Serie A italiana, La Liga espanhola e Ligue 1 francesa 2026/27 (respectivamente 50, 64, 41; fonte OpenFootball pode estar desatualizada).
- Premier League 2026/27: 70 resultados do piloto gratuito da rodada 1–7, sem todas as estatísticas por período; Tottenham × Coventry teste CSV existente.
- Serie A italiana 2026/27: 3 jogos da rodada 1 já enriquecidos pelo Work e confirmados pelo usuário.
- Lote 02 (7 jogos) foi somente **planejado**; substituir a coleta em micro-lotes pela execução integral abaixo.
- Priorizar as **temporadas atuais de interesse do FutStats** (Brasileirão Série A 2026; Bundesliga, Premier League, Serie A italiana, La Liga e Ligue 1 2026/27), e pesquisar a liga saudita **apenas se houver fonte adequada**. Não duplicar temporadas completas já disponíveis (como Bundesliga 2025/26).

**Primeiro, procurar datasets completos para download autorizado, preferencialmente públicos/gratuitos (CC0, licença aberta compatível, CSV/JSON oficiais, APIs liberadas ou provedores com direito de exportação).** Checar licença, proveniência, período de atualização, número de jogos e cobertura estatística. Evitar scraping em massa, bypass de acesso, login não autorizado ou redistribuição de dados proprietários (inclusive Flashscore) sem licença. Se o site permitir navegação manual mas não download/exportação em massa, NÃO concluir que a extração em massa é autorizada.

Tentar obter para **todos os jogos já encerrados até a data efetiva da coleta**, em cada campeonato elegível, as seguintes métricas por **mandante e visitante**, nos períodos **jogo completo, 1º tempo e 2º tempo**: gols, finalizações, chutes no gol e escanteios. Não tratar jogos futuros como encerrados; não inventar zeros para N/D, horários, IDs nem escanteios por tempo ausentes. Se uma fonte só disponibilizar jogo completo ou placar por tempo, registrar a cobertura real sem extrapolar.

Entregar de uma vez, SEM pedidos sucessivos para novos micro-lotes:
1. Um **pacote ZIP** contendo **um CSV UTF-8 BOM por campeonato/temporada**, no **mesmo esquema original de 55 colunas FutStats**, preservando IDs e links verdadeiros; campos ausentes `N/D`.
2. Um **manifesto de cobertura CSV/JSON** com: competição, temporada, jogos agendados, jogos concluídos, jogos que já constam no projeto, jogos novos, jogos com gols por tempo, finalizações/chutes no alvo/escanteios por período, data máxima dos resultados, fontes, licença e pendências.
3. Um **relatório único e curto**, em português claro, de validação: contagem de jogos, duplicatas eliminadas, consistência de placares (HT + 2T = FT), somas de cada métrica por período, limites e questões de direitos de reutilização. Separar dados `validado`, `parcial` e `indisponível` sem fingir cobertura completa.
4. Se nenhuma fonte autorizar exportar estatísticas detalhadas por tempo para todas as partidas, **não parar no primeiro bloqueio**: entregar os dados de licença livre disponíveis, registrar exatamente a lacuna e apresentar a alternativa **mais automatizável e sustentável**, com preços da fonte comercial somente quando verificáveis. Não transformar limitações em dezenas de tarefas manuais para o usuário.

Segurança: **não alterar** app de produção, `main`, localStorage principal `futstats:v1` (659 históricos), pesquisa experimental `futstats:europe-research-cc0:v1` (155 resultados), `futstats:europe-work-stats:v1` (3 jogos enriquecidos) ou Radar V2/V3. Nenhuma importação, publicação de CSV de terceiros no GitHub ou deploy sem autorização expressa. O próprio Work deverá gerar os arquivos e entregá-los para revisão antes de importar. Se necessário use apenas trabalho analítico separado.

**Critério de sucesso:** o usuário recebe uma única entrega agregada e visualiza o que está pronto vs o que falta por fonte, sem executar tarefas repetitivas por rodada. `Temporada completa` significa **todos os jogos já disputados até a data da execução**, pois 2026/27 ainda está em andamento em outubro/2026.
