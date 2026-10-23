# FutStats V4 — Bundesliga alemã 2026/27: continuação integral com deduplicação

**Planejamento: 23/10/2026.** O usuário confirmou `OK ✅` na importação privada da Premier League. Status relatado do FutStats: **292 jogos completos via Work** em quatro ligas (70 Serie A italiana, 89 La Liga, 63 Ligue 1, 70 Premier League), sem alterar os **659 históricos**, Radar ou produção.

## Atenção: há Bundesliga 2026/27 armazenada anteriormente
O FutStats já mantém **54 partidas da Bundesliga 2026/27** entre os **659 jogos históricos pessoais no Android** (além de 306 da Bundesliga 2025/26 e 299 do Brasileirão 2026). **O Work pode não acessar esse armazenamento privado do telefone.** Não presumir que poderá identificar jogo a jogo essas 54 partidas apenas por consultar o GitHub. Procurar os arquivos/checkpoints originais acessíveis em pesquisa anterior; quando a identificação for incompleta, declarar a limitação e entregar um consolidado seguro para *comparação antes de importar*.

Objetivo: obter **as partidas encerradas da Bundesliga alemã 2026/27 até a data efetiva da execução**, com os dados completos e confiáveis, **priorizando partidas que ainda não foram documentadas**. Uma única execução por liga, sem pequenos lotes ou comandos por rodada.

### Dados obrigatórios por jogo (55 colunas FutStats)
Para mandante e visitante, em **jogo completo, primeiro tempo e segundo tempo**:
- Gols
- Finalizações totais
- Chutes no gol/no alvo
- Escanteios

Consultar as partidas pelo método Flashscore já validado quando autorizado, com IDs e URLs de origem genuínos, conferir status encerrado e reconhecer eventuais adiamentos/abandono; jamais preencher N/D como 0. Não realizar scraping em massa sem autorização, contornar restrições nem assumir direitos de redistribuição.

## Fonte aberta e alerta de defasagem

Catálogo aberto https://github.com/openfootball/football.json/blob/master/2026-27/de.1.json registra **306 confrontos da temporada**, mas só **33 placares FT+HT** até **20/09/2026** no arquivo consultado em 23/10/2026. Serve para reconciliar datas, equipes, rodada e esses 33 resultados, **não** para concluir que apenas 33 jogos foram realizados.

## Execução resiliente

1. Pesquisar primeiro os artefatos/checkpoints da Bundesliga **2026/27** já validados, de modo a evitar novo trabalho; os **306 jogos da Bundesliga 2025/26 não fazem parte da coleta**.
2. Determinar calendário e quais jogos de 2026/27 estão realmente encerrados até o dia da consulta. **Não contar automaticamente 54 como total disponível no GitHub:** esses registros estão principalmente no Android e podem não estar ao alcance do Work.
3. Coletar apenas jogos ausentes nos artefatos de pesquisa verificáveis. Se não for possível saber quais dos 54 jogos foram coletados, gerar o consolidado da temporada e entregar um **manifesto de IDs/data/clubes** que permita ao FutStats eliminar duplicatas antes da importação; não declarar que esses 54 foram substituídos.
4. Salvar checkpoints automáticos duráveis por ID/rodada/período e retomar sem repetir operações nem pedir comando a cada rodada.
5. Validar **8 somas entre 1T + 2T e jogo**, **12 totais mandante+visitante** e **6 relações chutes no alvo <= finalizações** por jogo, além de placares e datas.
6. Entregar **um único CSV de 55 colunas** (UTF-8 com BOM), um **relatório final sucinto** indicando novos jogos e eventuais duplicatas, e checkpoint se for necessário para retomada. Se uma partida não estiver completa, indicar exatamente qual métrica está faltando; não declará-la completa.
7. **Não importar, não apagar e não alterar** 659 históricos, 292 jogos Work, 155 resultados CC0, Radar V2/V3, app publicado, branch main ou produção; os arquivos serão conferidos antes de qualquer integração privada. Não incluir dados Flashscore proprietários em commits públicos.

## Integração após a pesquisa
Antes de convidar o usuário a importar, verificar os jogos já presentes na base do Android (somente após autorização e por interface segura), comparar identificadores/data/clubes/placares e decidir se são complementos ou repetições. Para evitar mexer no Radar/projeções, priorizar a **base experimental separada**. Nenhuma exclusão/sobrescrita é autorizada por este roteiro.

**Lembrete:** 292 jogos Work são dados de pesquisa em armazenamento separado, **ainda não são incorporados automaticamente às médias do Histórico/Radar**. A integração analítica para dados completos deve ser planejada/testada depois, sem comprometer previsões antigas.
