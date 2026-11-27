# F360 — Continuidade do Chat 2 (Coleta/Fechamento) — 23/11/2026

**Registro:** F360-CTRL-COLETA-HANDOFF-20261123
**Estado:** ADOTADO / CONTINUIDADE DOCUMENTAL, sem nova coleta ou nova auditoria nesta abertura
**Branch:** research/f360-hub-chats-2026-11-21
**Referências:** PR DRAFT #104, issues #29 e #105

## Finalidade
Este registro marca a migração do antigo "Chat 2 coleta de dados" (somente leitura) para o novo Chat 2, sem reiniciar coletas ou importar resultados sem reconciliação. A função é fechamento de resultados, controle de fontes, estatísticas por jogo/1T/2T, prompts para Work e registro das pendências. Outros chats: F360 Análise (pré-jogo) e Work (coleta pesada/experimentos).

## Estado recuperado diretamente do HUB em 23/11
- **Último POSJOGO documental liquidado:** `F360-POS-20261122-FINAL-COND` (11 jogos; 119 sinais com linha; 84 ACERTO, 35 ERRO, 0 N/D; 13 ABSTER; 21 candidatos Elite: 12 acertos/9 erros, seis brasileiros bloqueados). Preliminar de 22/11 substituído **somente para agregação** — não somar os dois.
- **21/11:** `F360-POS-20261121-FINAL-COND` (17 jogos, 177 sinais com linha, 134 acertos, 43 erros, zero N/D e 27 abstenções). Preliminar de 21/11 substituído somente para agregação.
- **Estudo para 23/11:** `F360-ESTUDO-20261123` (8 jogos; 96 indicadores; 73 linhas históricas: 63 OBSERVAR, 10 DESCARTAR; 23 ABSTER; 10 Elite documentais). **Não há neste handoff fechamento real dos jogos de 23/11**. As linhas e status são de estudo condicionado, não apostas nem projeções nativas homologadas.
- **Auditoria de recência `F360-CTRL-RECENCIA-LIGAS-20261123`:** índice independente contém 5.620 jogos elegíveis, corte máximo em 09/11; 41 jogos auditados em 18–22/11 fora do corte devem ser reconciliados sem supor ausência em outras bases.
- **Prioridade P0:** Brasileirão 2026, 336 jogos no índice até 06/11, 12 jogos recentes auditados, atualizar os encerrados e lacunas das rodadas 35/36, normalizar identificação RB Bragantino/Red Bull Bragantino mantendo grafia de origem.
- **Prioridades P1:** La Liga 2026/27 e 9 lacunas em La Liga 2025/26; MLS 2026 (All-Stars e playoffs separados); Argentina 2026 (145 alertas de data, playoffs separados); Serie A 2026/27 (Fiorentina/Juventus com N/D); Ligue 1 2026/27 e uma lacuna de 2025/26.
- **Estratégias aprovadas:** nenhuma em `ESTRATEGIAS.json`; sinais condicionados não entram na Shadow V1 e não justificam nova regra.
- **Apostas executadas e ROI:** N/D até comprovação individual com linha, odd, valor e horário.

## Próximo fluxo do Chat 2
1. Consultar `INICIO_AQUI.md`, `ESTADO_ATUAL.json`, `INDICE_REGISTROS.csv`, `ESTRATEGIAS.json`, `CONTRATO_DADOS.md` e as linhas do estudo PREJOGO antes de qualquer auditoria.
2. Conforme cada evento de 23/11 for **encerrado**, recuperar placar e estatísticas de gols/finalizações/chutes no gol/escanteios para FT, 1T, 2T; fonte, IDs e horário de conferência. Não liquidar jogos em andamento.
3. Comparar apenas as 73 linhas **originais e imutáveis**, preservar 23 abstenções e os 10 descartes, documentar N/D/VOID quando cabíveis e separar Elite, LV4 e bilhetes comprovados.
4. Publicar novo `POSJOGO` e atualizar índice/estado apenas com evidências; caso a coleta visual seja extensa, preparar missão direcionada ao Work.
5. Em paralelo, preparar a reconciliação **incremental experimental** da base do Brasileirão (P0) antes de avaliar hipóteses sobre desempenho; não computar prévias retroativas.

## Gates
- Não inventar dados, odds, resultados ou hora de congelamento.
- Sem alterar estudo, linha, radar, modelo, estratégia, código produtivo, 659 jogos pessoais ou app Android.
- Sem merge e sem deploy; publicações somente na branch experimental e PR DRAFT.
- Não afirmar que esta transferência sincroniza automaticamente conversas; o elo é o arquivo versionado e os IDs.

**Referências primárias:** `research/OPERACAO_CHATS_FUTEBOL/HUB_F360/ESTADO_ATUAL.json`, `PREJOGO_ESTUDOS/F360-ESTUDO-20261123-RELATORIO.md`, `REGISTROS/POSJOGO_2026-11-22_FINAL.md`, `AUDITORIAS/F360_AUDITORIA_RECENCIA_LIGAS_2026-11-23.md`.
