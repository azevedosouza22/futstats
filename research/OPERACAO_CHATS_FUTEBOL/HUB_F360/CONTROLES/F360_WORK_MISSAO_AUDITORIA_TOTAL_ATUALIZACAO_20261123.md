# FUTSTATS F360 — WORK | ATUALIZAÇÃO INTEGRAL MULTILIGAS 2026
**Origem:** correção de escopo no Chat 2 (23/11/2026)
**Prioridade:** ALTA
**Modo:** pesquisa pesada / Flashscore navegação visual autorizada, comparação de IDs e evidências.
**Branch de controle:** `research/f360-hub-chats-2026-11-21`; PR DRAFT #104; issue #105.
**Não aplicar merge, nem modificar app/produção/algoritmos.**

## Missão correta
NÃO limitar recuperação aos 12 jogos do Brasileirão, nem aos 41 jogos já auditados. Executar auditoria completa do calendário das ligas presentes no catálogo mestre de 6.123 IDs, confrontando com índice operacional de 5.620 partidas (corte 15/11), Drive e GitHub. Encontrar TODOS os jogos **FINAL até 22/11/2026 23:59 BRT** das ligas 2026/27 ou 2026, confirmar temporada/fase e recuperar todos os 24 indicadores ausentes. Os jogos de 23/11 ficam em lote posterior somente após encerramento.

## Primeira leitura obrigatória
1. `research/OPERACAO_CHATS_FUTEBOL/HUB_F360/INICIO_AQUI.md` e `ESTADO_ATUAL.json`.
2. `AUDITORIAS/F360_AUDITORIA_INTEGRAL_23_GRUPOS_2026-11-23.md` (23 liga/temporada) e `AUDITORIAS/F360_FILA_68_CATALOGO_ATE_22NOV2026.csv`.
3. [CATALOGO_MESTRE_FLASHScore.csv — 6.123](https://drive.google.com/file/d/1vDTRk7WeeMJephZxDdAHu4QsN01Zvz9H/view); [01_INDICE_PARTIDAS_ELEGIVEIS_5620.csv](https://drive.google.com/file/d/19nLXneG2zkrY8us4dWozf7Vth7P_BKBj/view); [PENDENCIAS_PARTIDAS.csv](https://drive.google.com/file/d/141dqSuWS4f4i4iyHmHPc-4hCiQT91-n_/view); fechamentos F360 18–22/11.
4. `COLETAS/BRASILEIRAO_2026/BR_2026_RECUPERACAO_12_20261123.csv`: amostra já recuperada, NÃO total geral; dois IDs de 19/11 N/D.
5. Calendários oficiais das ligas para não tratar adiamento/pausa como lacuna: CBF, La Liga, LFP, Premier League, Bundesliga, Serie A, Liga Portugal, NFF, MLS, Saudi Pro League, AFA.

## Fluxo obrigatório por temporada
**Fase A — inventário:** montar `CALENDARIO_X_BASE_ATE_22NOV.csv` com cada partida realmente encerrada até 22/11, `id_flashscore`, `data_brt`, `liga`, `temporada`, `fase/rodada`, `mandante`, `visitante`, `status_no_fornecedor`, `url`, `presenca_catalogo_6123`, `presenca_indice_5620`, `presenca_POSJOGO_18a22`, `acao`. Recusar atribuição aproximada de ID; revisão humana para casos ambíguos.
**Fase B — reconciliação:** canonizar apenas em coluna auxiliar nomes alternativos como RB Bragantino / Red Bull Bragantino; separar MLS regular/playoffs/All-Stars, Argentina Apertura/Clausura/playoffs; não contar PDF agenda como placar realizado. Diferenciar FINAL_NOVO, FINAL_PARCIAL, COMPLETO_COM_CONFLITO, DUPLICADO, AINDA_FUTURO, ADIADO, SEM_DADOS e RETIFICACAO.
**Fase C — coleta incremental:** jogos FINAL ausentes; gols, finalizações, chutes no gol, escanteios de mandante e visitante em **FT, 1T, 2T** = 24 campos; leituras reais Flashscore com URL/time-stamp e fonte secundária em divergência; sem estimativa, zero fictício ou invasão de proteções do site.
**Fase D — auditoria:** conferir FT=1T+2T, 0<=chutesNoGol<=finalizações, identidade, tempo extra, datas, SHA/hashes, IDs únicos; preservar original diante de conflito. CSV padrão 55 colunas, manifestos, logs, evidências e checklist de QA.
**Fase E — checkpoint:** publicar PR DRAFT com arquivos experimentais separados por liga, tabela `antes / novos / completos / parciais / conflitantes / agendados / faltantes / depois` e IDs pendentes. A cada retomada, ler checkpoint e NÃO repetir jogos concluídos. Somente declarar “liga atualizada” se todos FINAL até o corte estiverem completos ou exceções estiverem individualmente justificadas.

## Priorização e observações
**P0:** Brasileirão 2026, 23 IDs datados ≤22/11 fora do índice (não necessariamente todos ausentes); já existem 12 auditorias; verificar demais jogos e duas identidades de 19/11.
**P1:** Saudi 2026/27 18 candidatos datados; Eliteserien 2026 8; La Liga 2025/26 9 conflitos de versão (NÃO nove jogos novos); La Liga 2026/27 um conflito; Ligue 1 2025/26 um parcial; MLS 2025 um parcial; Argentina 2026 um só catálogo; Liga Portugal 2026/27 três só catálogo. Para as outras ligas 2026/27 sem pendências no catálogo antigo, comparar calendários externos, incluindo 41 jogos auditados 18–22/11.
**P2:** temporadas encerradas estruturalmente completas conforme catálogo, revalidar integridade pontual; Copa do Brasil, amistosos e Liga Europa não misturar com competições de liga.

## Limites
Não alterar `01_INDICE_PARTIDAS_ELEGIVEIS_5620.csv` em lugar; criar novo índice versionado APENAS em ramo experimental e sujeito a QA. Não retificar forecasts já congelados, SDD ou apostas. Preservar 659 pessoais, base Android, LV4/Elite, Radar V2/V3/V4 e `main`. Sem merge, sem deploy e sem usar registros recém-coletados retrospectivamente em previsões antigas.

**Entrega mínima antes de escalar coleta:** matriz de calendário externa x 6.123 x 5.620 para TODAS as 11 temporadas em curso, contagem fundamentada de faltantes e hashes. **Entrega final:** 24 estatísticas por jogo elegível até o corte e lista auditada de exceções.
