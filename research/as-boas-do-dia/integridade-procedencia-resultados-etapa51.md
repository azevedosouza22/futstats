# FutStats IA · Etapa 51 — integridade cruzada do resultado CSV antes de pontuar previsões

**Data:** 25/10/2026. Trabalho EXCLUSIVAMENTE no PR experimental filho do #50, não integrado a `main` ou Vercel, sem importação ou reescrita de qualquer dado.

## Problema
A auditoria prospectiva anterior já checava identidade entre o registro de “As Boas” e a partida, validação estrutural rigorosa (`validateMatch`: períodos, chutes ao alvo ≤ finalizações, URLs CSV Flashscore com `mid` coerente), metadados de origem, importação posterior ao início +2 horas, jogo futuro, duplicação do mesmo confronto e sinais V2/V3 congelados.

Dois riscos adicionais permaneciam: o **mesmo `research.sourceId`** de um único confronto podia aparecer em duas partidas diferentes (times, ligas ou datas diferentes), e um CSV registrado com **`importedAt` posterior ao relógio da consulta** podia ser usado no cálculo. O primeiro prejudica a procedência sem aparecer na detecção de duplicados por confronto; o segundo simula um dado local que ainda não poderia existir. Nenhuma dessas situações comprova resultado real.

## Regras implementadas
- `src/dailyGoodResultProvenance.ts`: verificador puro, sem rede ou escrita, pesquisa `research.provider + research.source + research.sourceId` em **todas as partidas da base atual**, não só no jogo alvo. Quando ID é reutilizado, o estado retorna `reused_source_id` com IDs locais conflitantes. Não escolhe qual jogo tem a fonte correta.
- `auditDailyGoodPicks`: um ID repetido altera o registro prospectivo para `ambiguous`, com razão **“Mesmo ID da fonte CSV reutilizado em partidas diferentes”**, `markets=[]` e resultado fora de qualquer denominador. Um `importedAt` posterior a `now` passa a `source_missing` com motivo **“Importação CSV possui data futura em relação à consulta”**. Não gera linha `scored`, não calcula acerto e não ativa a comparação documental de segunda fonte.
- A auditoria não apaga dados, não muda a origem, não altera o horário do registro original e não reexecuta V2/V3.
- `DailyGoodAuditPanel`: aviso de **“Resultados locais não utilizados na avaliação”**, com contagens separadas para ID da fonte reutilizado e importação com data futura. O motivo específico também aparece na visão por registro, e a fila externa continua `PENDENTE`.
- Caso existam outros resultados corretamente documentados com IDs únicos e cronologia coerente, o processamento permanece igual ao fluxo anterior: marcação `scored` apenas como **comparação LOCAL**, não como resultado verificado independentemente.

## Critérios de teste
- Unitários: IDs distintos aceitos; uma fonte usada em partidas de outras datas, ligas ou times bloqueia todas as afetadas; duplicatas de identificador de partida também; data de importação futura não pontua, mesma data/hora da consulta é permitida; objeto externo ou dado manual não contam como origem; nenhum registro é modificado.
- Integração unitária da auditoria: nenhuma previsão congelada é pontuada com ID duplicado ou dado importado do futuro, a linha mantém explicação específica e nenhuma taxa cresce. Um resultado com fonte única e tempo válido continua contabilizado apenas como documentação CSV local.
- Playwright desktop e viewport Android em armazenamento **inteiramente fictício e isolado**: registrar “Boa do Dia” antes do jogo; adicionar resultado CSV sintético e outra partida usando o mesmo sourceId; confirmar 0 resultados válidos e aviso de procedência; retirar a fonte duplicada, inserir `importedAt` futuro, confirmar bloqueio; corrigir a cronologia sintética, verificar resultado local e segunda fonte ainda `PENDENTE`; comparar o JSON original do Radar no começo e no fim.
- Teste em aparelho físico e validação independente de resultados reais continuam PENDENTES.

## Proteções
- Mantém preservados 659 históricos, Radar V2/V3, 222+ lotes Work, backups e PWA de produção; não importa dados, não faz merge/deploy ou coleta contínua.
- CSV documentado não é garantia de correção factual do Flashscore: estrutura e identidade de origem apenas detectam algumas inconsistências internas. A coluna `verificacao_externa_independente` continua `PENDENTE` e nenhuma taxa prospectiva real é declarada sem confirmação de segunda fonte.
- A meta de 30 partidas prospectivas distintas **por liga** permanece exigência futura, não alcançada por testes sintéticos.
