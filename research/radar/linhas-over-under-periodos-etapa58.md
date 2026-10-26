# FutStats IA · Etapa 58 — comparação Over/Under por tempo, com amostras confiáveis

**25/10/2026, Brasília. Apenas PR experimental filho do #57.** Não alterar produção, 659 históricos, Radar V2/V3, Work, backups ou PRs anteriores.

## Melhoria entregue
Na prévia **Agenda → selecionar confronto → Radar**, aparece a seção recolhida **“Comparar Over e Under · jogo e tempos (histórico)”**. O usuário pode selecionar qualquer um dos quatro indicadores (**gols, finalizações, chutes no alvo, escanteios**) e qualquer período (**jogo completo, 1º tempo, 2º tempo**) — **12 combinações**.

A tabela exibe linhas numéricas **ilustrativas** com contagens separadas de jogos acima (**Over**) e abaixo (**Under**), numerador e denominador, amostra válida por indicador/período, total de jogos da amostra, campos ausentes (N/D), dados conflitantes e média histórica. **Não apresenta odds, mercados disponíveis, sugestões de aposta nem projeções novas de V2/V3.**

Há **linhas diferentes** para cada um dos tempos e para o jogo completo: por exemplo, 1º tempo de escanteios tem referências de 1,5 até 6,5, enquanto jogo completo vai de 4,5 a 12,5. Isso não representa uma oferta de casa de apostas, apenas comparação aritmética retrospectiva.

## Critérios de confiabilidade
- Mesmo `radarUpcoming` dos últimos **cinco jogos anteriores por equipe**, competição e temporada exatas, sem a partida principal nem jogos posteriores. Deduplicar por ID quando confronto estiver nas duas amostras.
- Reutilizar **exatamente a verificação de soma por lado e período** da matriz oficial de cobertura de etapas 56–57 (`auditedRadarMetricValues`). Se FT, 1º e 2º tempos estiverem completos e uma equipe não fechar a soma, excluir **somente o indicador afetado** da comparação daquela partida, não reparar nem forçar coerência. Sem reaproveitar partidas com `dateDiscrepancy` ou origem de partida externa não encerrada.
- Quando **qualquer lado** do período estiver N/D, excluir apenas aquele jogo do denominador dessa métrica/período. Um valor do FT **não completa** os tempos faltantes. Zero documentado é **zero válido**, diferente de N/D.
- **Over + Under = número de jogos válidos**, com linhas `n+0,5` sem possibilidade de empate na linha.
- Exigir **mínimo cinco jogos válidos** para mostrar frequência **percentual**. Abaixo de cinco, os totais brutos continuam visíveis quando houver observações, mas a porcentagem é **N/D** com alerta de amostra insuficiente. Sem jogos válidos, todas as frequências N/D. **Nenhuma porcentagem é estimativa calibrada de acerto futuro.**
- `comparePeriodRadarLines` verifica que os denominadores coincidem com as contagens da matriz 4×3. Se houver divergência entre cálculos, falha em vez de oferecer informação enganosa.
- O comparador é **somente leitura** e não faz parte de `lineExploration` salvo: snapshots legados V2/V3 permanecem congelados, sem recalcular períodos retroativamente ou alterar dados, backups ou resultados.

## Testes e aceite
- Vitest: 12 combinações vazias N/D, sample 5+5, dedup cross-teams, mesma temporada, jogos futuros excluídos, amostra 4/N com percentual N/D, escanteios FT disponível e 1T/2T N/D, duas somas contraditórias que se anulam no agregado (recusadas), zero legítimo, Under+Over=N em toda linha, proveniência temporal e imutabilidade.
- Playwright **desktop e viewport Android**: exemplo **sintético isolado** com 10 históricos, um com FT de escanteios disponível e 1º tempo N/D; testar 10/10 FT → 9/10 1º tempo, Over/Under somando 9, mudar para gols do 2º tempo, garantir armazenamento idêntico, salvar e recuperar previsão original sem alterar `lineExploration`. Testes não comprovam Android físico.
- GitHub Actions: teste unitário + compilação TypeScript/Vite + teste de navegador, **todos obrigatoriamente verdes antes de marcar a Etapa 58 concluída**.

## Continuidade
A melhora é da transparência de linhas históricas (área 06 do Controle Mestre), **não de taxa de acertos**. Validação de 30 previsões reais por liga com segunda fonte autenticamente conferida e QA Android físico continuam pendentes. Sem merge/deploy, scraping ou importação contínua.
