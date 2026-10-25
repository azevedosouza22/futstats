# FutStats IA — Etapa 44: fila segura de conferência independente de resultados

**Data:** 25/10/2026, versão experimental empilhada após PR #43. Não há consulta contínua, incorporação de novos resultados, alterações de histórico, provas de resultado criadas automaticamente ou deploy/merge.

## Por que esta etapa existe
O CSV da Etapa 43 preserva fielmente os sinais de “As Boas do Dia”, mas qualquer resultado presente no FutStats ainda é **apenas uma informação local estruturalmente documentada**. A falta de confronto com fontes externas impede afirmar uma taxa de acerto real. Esta etapa prepara a **fila de trabalho por partida**, em vez de exigir ao usuário diversas capturas de tela e anotações.

## Critérios da fila
O motor `src/dailyGoodIndependentReview.ts` transforma SOMENTE registros de escolha explícita em “As Boas”, respeitando a auditoria anterior. Os estados são:
- **check_external** — registro antes do início, não ambíguo, com sinal congelado e pelo menos um resultado numérico originado de CSV local documentado, APÓS um intervalo mínimo de 120 min do início; a fonte externa ainda NÃO foi conferida. Verificar cada indicador contra outro fornecedor independente.
- **need_local_result** — partida já ultrapassou os 120 min, mas o resultado local é ausente, não documentado ou todos os indicadores são N/D. Não atribuir acerto.
- **await_kickoff** — partida ainda futura ou sem janela pós-jogo mínima, inclusive casos que exigem conversão da virada UTC para Brasília.
- **excluded** — origem inválida, registro após o início ou duplicidade/ambiguidade. Excluídos **não** se tornam elegíveis apenas ao abrir o link.
- Legados sem `goodPicks` são totalmente omitidos; não se recuperam previsões retrospectivamente.

Em TODOS os estados a coluna de confirmação externa é **PENDENTE**. Links da programação oficial e da origem do CSV local podem ser abertos, mas o clique NÃO constitui conferência nem altera `verifiedAt`. O app não inventa outro link e não coleta resultados em background.

## Fluxo no celular
No painel **Validação prospectiva As Boas do Dia**, mostrar os quatro contadores e um painel recolhido de **prioridades por partida** (máximo 8 na visualização, lista completa no arquivo). O botão **Exportar fila de conferência (CSV)** baixa o estado sem alterar o histórico ou previsões; depois pode ser usado em uma verificação externa pontual. Separador ;, UTF-8 BOM, campos escapados e proteção de fórmulas. Não pode ser usado para restaurar previsões nem substituir o arquivo de backup integral.

## Condições para afirmar desempenho real
1. Previsão salva no app ANTES do início confirmado, com data/hora e fontes congeladas; sem duplicatas e com sinais V2/V3 reproduzíveis a partir do snapshot, sem reprocessar dados futuros.
2. Resultado da partida finalizado, com identidade única e estatísticas por indicador/período em documentação do CSV original; se N/D, não medir.
3. **Conferência independente externa de cada indicador**, com segunda fonte efetivamente consultada, horário da conferência e URL vinculada ao mesmo jogo. Não registrar essa conferência como concluída sem evidência concreta.
4. Análise futura somente após amostra suficiente de **pelo menos 30 confrontos distintos por liga**, diferenciando mercado, denominador, ausência, baseline e intervalo de incerteza. A fila atual não comprova nem executa essa verificação.

## Aceitação e preservação
- Testes unitários de quatro estados, hora pós-jogo, fusos, fonte confiável, injeção em CSV, legados, divergência de ordem e imutabilidade.
- Playwright executa o download via UI e confere que todos os dados locais continuam byte a byte iguais, em desktop e viewport Android sintéticos.
- Nenhum merge, deploy, importação, extração contínua ou modificação dos 659 históricos, Radar V2/V3, Work, backups ou arquivos pessoais.
