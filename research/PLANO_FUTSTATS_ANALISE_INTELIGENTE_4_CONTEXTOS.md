# FutStats IA — proposta de navegação e análise inteligente por quatro contextos
Checkpoint 27/10/2026 · Etapa 78 · somente experimental

## Experiência esperada no celular
**Agenda → Confronto → Evidência histórica → Radar V2/V3 → As Boas do Dia**

O usuário pode escolher um jogo e analisar gols, finalizações, chutes no gol e escanteios na partida completa, no 1º ou no 2º tempo. Não obrigar a alternar entre telas técnicas.

### Quatro recortes (soma dos DOIS times em cada jogo)
1. Mandante em casa contra qualquer adversário.
2. Mandante em casa contra o visitante escolhido.
3. Visitante fora contra qualquer adversário.
4. Visitante fora contra o mandante escolhido.

**Atenção:** os recortes 2 e 4 são a MESMA amostra de confrontos diretos; os jogos diretos também aparecem nos recortes 1 e 3. Nunca somar esses percentuais como evidências independentes.

Para cada contexto:
- Até 5 e 10 jogos **antes** da data prevista, sem usar o próprio confronto ou jogos futuros;
- Média dos totais da partida e frequências Over/Under, **contagens brutas** (4/5) e percentuais observados (80%);
- Indicadores separados para temporada atual e imediatamente anterior, sem misturar divisões ou campeonatos;
- Qualidade da amostra, valores N/D, origem e conflitos visíveis. Não preencher dados ausentes automaticamente.

### Papel das ferramentas existentes
- **Base**: armazena partidas com proveniência e períodos, preservando 659 históricos, CSVs Work, Radar e backups.
- **Comparação inteligente**: fornece evidência por quatro recortes, fases e duas temporadas, com linha escolhida a partir de grid pré-definido.
- **Radar V2**: mantém sua projeção inicial já implementada.
- **Radar V3**: mantém filtros existentes; cruzar informações da Comparação só em fase posterior, com novas versões de regras testáveis, e sem recalcular snapshots congelados.
- **As Boas do Dia**: em etapa futura, exibir somente recomendações que passaram requisitos confiáveis de origem, antecedência e validação prospectiva; não inventar odds nem indicar acurácia como probabilidade.
- **Resultado**: ao encerrar o jogo, comparar snapshots genuinamente salvos previamente com números cotejados independentemente; separar Radar, As Boas e simulações retrospectivas.

### Etapas de implementação com proteção
**78A — Em PR experimental #73**: motor descritivo + painel na tela Radar pré-jogo + testes sem mutações, 4 recortes, 5/10 jogos, duas temporadas, período e linha, bloqueios de dados ambíguos e duplicatas. CI e QA pendentes até confirmação explícita.

**78B — Próxima**: apresentar ao Radar experimental a base atual e anterior em modo de pesquisa isolada. Os 1.019 registros do Drive NÃO estão todos no Android; não prometer que aparecem no aplicativo sem uma ponte segura, sem importar/mesclar silenciosamente. Fazer diagnóstico de cobertura e aliases.

**78C**: validar nova camada de evidência na relação V2/V3 sem ajustar parâmetros após conhecer resultados; testar amostra prospectiva congelada, incluindo frequência e estabilidade de linha.

**78D**: avaliar integração à shortlist As Boas, com estado de revisão quando houver poucos jogos, conflito direto ou fonte não validada. Não gerar recomendações automáticas antes de critérios de aceite e verificação de resultados.

**78E**: QA Android físico isolado, backup externo, auditoria por liga (meta de 30 genuinamente prospectivos e independentes), aprovação explícita antes de qualquer merge/deploy/import.

## Restrições
- Não altere produção, app instalado, `main`, 659 históricos, dados Work, backups ou previsões congeladas V2/V3.
- Toda percentagem é **frequência histórica**, não chance futura, valor esperado ou ROI.
- Evitar overfitting: linhas e critérios definidos antes dos jogos, e comparação obrigatória com baselines simples.
- Cálculos somente leitura e componente explicativo. Sem registro automático de palpites.
- Progresso de planejamento **96%**, mantido enquanto critérios finais não forem concluídos.
