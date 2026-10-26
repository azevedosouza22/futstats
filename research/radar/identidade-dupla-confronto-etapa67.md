# FutStats IA — Etapa 67: dupla identidade de um jogo histórico

**26/10/2026 · somente PR experimental filho do #66.** Não houve merge, deploy, importação, atualização de `main` ou mudança em backups/históricos originais.

## Erro específico bloqueado
O validador global já recusava IDs locais repetidos e o mesmo `sourceId` de origem Flashscore em duas linhas. Porém duas linhas com **IDs diferentes** (por exemplo, registro manual e novo CSV) podiam descrever o **mesmo mandante × visitante, mesma competição/temporada e mesma data**, e ainda assim contar como duas partidas independentes nas médias e sinais.

## Política de integridade da amostra
- Novo `src/radarFixtureUniqueness.ts`: agrupa **exatamente** competição, data, ID do mandante e ID do visitante. Se houver **mais de um ID local distinto**, marca **todos os registros daquela identidade** como suspeitos. Não tenta escolher qual CSV/manual é correto, não usa aliases ou matching difuso, não funde ligas, datas diferentes ou mando invertido.
- Retira as cópias **depois** de aplicar a seleção cronológica já existente dos últimos 5 ou 10 confrontos. A amostra não é preenchida silenciosamente com o sexto ou 11º jogo mais antigo.
- Usa o mesmo filtro na prévia descritiva `radarUpcoming`, no V2 por mando, V3 de confirmação e nas médias da liga. As matrizes de tempo/linha e trilhas baseadas na prévia herdam o recorte. O backtest retrospectivo `evaluateVenueV2` também bloqueia confrontos com dupla identidade em treinos/holdouts locais. Não confere nenhuma fonte externa.
- Exibe um aviso **“Histórico em revisão”** na prévia quando entradas recentes forem suspensas, informando quantos registros do recorte recente ficaram de fora; deixa claro que os dados originais não foram apagados. Se V2/V3 perderem a amostra mínima de 3 jogos por mando, exibem **Sem sinal** e projeção N/D. “As Boas” mantém exigência de 5 jogos anteriores por clube e não surge quando a amostra válida cai abaixo disso.
- `src/pregame.ts` e os jogos armazenados **não são reescritos**. O filtro é aplicado somente aos cálculos do Radar, não altera o histórico comum nem substitui o cálculo de odds/probabilidades.

## Aceite
- Vitest: dois IDs diferentes do mesmo confronto são bloqueados em ambos os registros; seleção dos últimos cinco preserva as posições (sem voltar a partidas antigas), separação por temporada, data e inversão de mando, soma/Média N/D, V2 e V3 retornam Sem sinal quando aplicável, evidência do backtest não duplica partida, nenhuma mutação de fonte.
- Playwright desktop e viewport Android: histórico sintético de dez partidas de duas equipes, com cópia extra de um jogo e **um sourceId distinto estruturalmente válido**; o app aceita a estrutura (não é ID duplicado), mas As Boas não gera indicação porque mandante caiu para 3 de 5; ao abrir a prévia manual, aviso **2 entradas em revisão**, 3/5 e 5/5; localStorage original e previsões seguem intactos.
- CI inclui build TypeScript/Vite, Vitest, Node auditor de PRs empilhados e Playwright nos dois projetos. Não declarar concluído nem somar ponto até o CI verde no HEAD exato.

## Limites
Um jogo identificado só pelo par/data/competição não comprova qual origem estava certa nem mostra resultado. A quarentena é conservadora; o usuário pode conferir posteriormente a fonte e corrigir a base com controle separado, nunca de modo automático. Não prova acurácia, e a coorte de resultados verificados externamente permanece **0/30 por liga**, com desempenho **N/D**. Não há QA Android físico. Preservar os **659 históricos**, Radar V2/V3 congelado, Work, backups e PWA de produção.
