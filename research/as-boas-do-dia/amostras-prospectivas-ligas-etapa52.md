# FutStats IA — Etapa 52 · Mapa de amostras prospectivas por campeonato

**Data:** 25/10/2026 · somente ramo experimental filho do PR #51. Sem merge, deploy, importação ou manipulação do PWA em produção.

## O que mudou na experiência
Na seção **Ver previsões já registradas → Validação de “As Boas do Dia”**, aparece o bloco **“Amostras prospectivas · por campeonato”**.

Ele apresenta, por competição:
- número de **registros locais elegíveis** (somente indicações que foram explicitamente salvas em “As Boas” antes do jogo de acordo com o horário armazenado, preservando os sinais congelados e as checagens de origem);
- número de confrontos com **CSV local estruturalmente coerente** e ao menos um indicador, elegíveis para trabalho de segunda fonte, nunca uma verificação externa;
- registros ainda aguardando jogo, dados locais ou excluídos por anomalias;
- resultado **confirmado externamente: 0/30 por campeonato**, com desempenho **N/D** e **PENDENTE**; não se presume que links abertos ou JSON de segunda fonte informado tenham sido realmente conferidos.

O botão **“Exportar acompanhamento por campeonato (CSV)”** gera um arquivo UTF-8, uma linha por liga, com totais de registros locais, estados de auditoria, meta de 30 confrontos e marcações permanentes N/D e PENDENTE. Não é arquivo de backup/restauração ou comprovante de precisão.

## Por que a contagem é deliberadamente conservadora
O objetivo de validação do modelo exige **ao menos 30 partidas distintas, salvas prospectivamente e com resultado independente confrontado, POR LIGA**. Atingir 30 jogos locais com previsão registrada no navegador NÃO atesta que foram consultados em tempo real, que suas datas não foram alteradas nem que 30 resultados foram verificados de verdade. Importações CSV com URL não provam o conteúdo remoto. Comparações com números informados pelo usuário e dossiê com SHA256 também não autenticam a fonte.

Portanto, **não existe neste momento contador positivo de fontes externas autenticadas**. O módulo atribui literalmente ZERO como total externo e mantém `readyForModelValidation=false` para qualquer liga, inclusive com 30+ registros locais. Não exibe taxa de acerto comprovada.

## Implementação
- `src/dailyGoodProspectiveCohorts.ts`: controle puro/read-only que combina registros congelados, `PickAuditReport` e fila de conferência, com checagens de ordem, identidade, origem da indicação, estado da fila e unicidade de partida. Não conta registros Radar genéricos, excluídos, tardios, inválidos, ambíguos ou confrontos duplicados como amostra elegível. Não revisa ou recalcula mercados, não acessa web nem mexe no armazenamento.
- `src/DailyGoodAuditPanel.tsx`: tabela visível desde zero registros, legenda para diferenciar dados locais de fonte externa, status PENDENTE, exportação do resumo por liga, sem permitir selecionar “confirmado” manualmente.
- `src/dailyGoodProspectiveCohorts.test.ts`: cenários sem registros, uma previsão válida futura, uma pontuada com CSV local, 30 previsões fictícias que NÃO viram amostra validada, ligas separadas, legado excluído, duplicidade, revisão fora de ordem, ataques por texto de planilha e imutabilidade.
- `e2e/good-picks-save-restore.spec.ts`: percurso navegável com amostra sintética isolada, previsão congelada, tabela/CSV pré-jogo, inclusão de resultado CSV local no perfil de teste, consulta após jogo: continua **0/30 confirmado externamente** e arquivo local original intacto, inclusive em viewport Android. Android físico segue pendente.

## Continuidade
A próxima ação que realmente produz evidência de eficácia **não é preencher valores fictícios**; é coletar previsões selecionadas antes do jogo e conferir resultados numa segunda fonte efetivamente acessada, guardando comprovação auditável. Dados privados do navegador do usuário não estão acessíveis pelo GitHub connector. Nenhuma taxa de acerto ou meta 30/30 pode ser declarada neste estágio. Preservar 659 históricos, Radar V2/V3, Work, CSVs e backups; sem operações na produção, merge ou coleta contínua.
