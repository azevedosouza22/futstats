# FutStats IA — Etapa 68: trilha de previsão congelada até resultado CSV local

**Data:** 26/10/2026, Brasília. Implementação no PR DRAFT filho da Etapa 67, sem merge/deploy/importação/coleta contínua.

## Problema concreto
A auditoria prospectiva já sabia decidir se uma previsão original, registrada antes da partida, tinha resultado CSV local com estatísticas; porém o usuário não conseguia conferir em uma só área o **ID da previsão, o ID do jogo no CSV, o identificador original da fonte, a data da importação e cada indicador congelado**. Não é seguro usar somente um link como se comprovasse o resultado final.

## Funcionalidade entregue
Em **Radar → Ver previsões já registradas → Validação prospectiva**, seção recolhível **“Conferir vínculo previsão → resultado CSV”**:
- identifica cada jogo atribuído originalmente a “As Boas do Dia”, com `key`, data de salvamento, início em Brasília e referência oficial datada congelada;
- mostra `RESULTADO_PENDENTE` enquanto não existe CSV local aceito e **N/D** para identificadores/importação ausentes;
- quando a auditoria já classificou `scored`, localiza **uma única partida exata** (data, liga/temporada, nomes de mandante e visitante) e exige que o URL da fonte corresponda ao da auditoria; então apresenta IDs locais e da fonte, provedor, `importedAt` e valores documentados dos indicadores originais;
- se o registro for inválido, tardio ou ambíguo, exibe `EXCLUIDO`, **sem escolher uma duplicata ou atribuir o score indevidamente**;
- fornece um CSV de acompanhamento, uma linha para cada sinal congelado, com prevenção de execução de fórmulas por valores textuais e coluna **`verificacao_independente=PENDENTE`** sempre. Não é backup nem comprovação de acerto.

A funcionalidade é derivada apenas de `auditDailyGoodPicks` e do armazenamento atual. **Não reexecuta V2/V3**, não altera a previsão congelada, os resultados do CSV, a base Main/Work ou o histórico, não abre sites, não coleta dados e não muda a taxa de acertos.

## Limites e pontos que continuam pendentes
- `scored` significa que o CSV local foi estruturalmente aceito: **NÃO significa fonte externa efetivamente conferida**. A existência do sourceId/URL e a data de importação tampouco autenticam as estatísticas.
- Os testes usam somente partidas e previsões **sintéticas**, não resultados reais. A meta de 30 confrontos prospectivos externamente conferidos por liga continua em 0/30 enquanto não houver trabalho real comprovado, com taxas de acerto N/D.
- QA Android físico, um backup guardado em arquivo externo, integração/merge/deploy e qualquer operação em produção continuam pendentes. Preservar 659 históricos originais, Radar V2/V3, Work, backups e PRs anteriores.

## Aceite
Vitest: vínculo único a sourceId e importedAt, casos esperando local/excluído/legado, duplicatas cross-ID e identidade, preservação byte a byte, CSV sem “CONFIRMADO” e neutralização de fórmulas.
Playwright desktop/viewport Android: previsão congelada antes do início → trilha N/D/PENDENTE → registrar resultado CSV **somente no localStorage sintético de teste** → visualizar ID original e importedAt → exportar CSV → conferir JSON da previsão inalterado. Compilação e cadeia de PRs verdes são obrigatórias antes de atualizar o Controle Mestre.

**Área de planejamento:** integridade entre previsão salva e resultado local (área 05). Este ganho de infraestrutura não é, por si só, validação externa real.
