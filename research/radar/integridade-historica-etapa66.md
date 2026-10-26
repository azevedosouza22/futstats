# FutStats IA — Etapa 66: consistência histórica entre Radar, V2/V3 e médias

**26/10/2026 (Brasília). Somente PR DRAFT empilhado sobre #65; sem alterar produção, merge, dados ou backups.**

## Problema encontrado
A matriz por períodos da Etapa 56 e a auditoria de mando já diferenciavam origem CSV com **data divergente** e métricas cujos valores do jogo completo não batiam com a soma do 1º e 2º tempos. Contudo, o Radar principal, as projeções V2 e as referências da liga ainda podiam contar esses registros na média de um mercado. Esse desacordo poderia originar uma indicação de “As Boas” sobre uma amostra estruturalmente contestada.

## Solução aplicada
- `src/radarHistoricalIntegrity.ts` adiciona um gate **puro** por partida/indicador. Recusa `research.dateDiscrepancy`; se os valores **full, 1T e 2T existem** para algum dos lados e `full !== 1T + 2T`, recusa **apenas a métrica daquele jogo** nos três períodos. Campos não disponíveis permanecem N/D; zero conhecido permanece zero.
- `src/radar.ts`: `matchTotal` e médias descritivas do mando não usam estatística conflitante. Mantém o histórico selecionado por `recentMatches` e a trilha de revisão da origem, **sem substituir silenciosamente um dos últimos cinco jogos por partida antiga**.
- `src/radarVenueV2.ts`: médias de ataque/defesa de V2 excluem lados de dados conflitantes. V3 usa a mesma `matchTotal`; se a amostra válida cai abaixo do limite mínimo, retorna **Sem sinal**, sem projetar média artificial.
- `src/radarNumericContext.ts`: a média descritiva do campeonato ignora partidas com data CSV divergente e aplica a mesma validação estrutural por indicador. Não mistura ligas/temporadas.
- `src/radarPeriodCoverage.ts`: matriz 4×3 usa o mesmo verificador para impedir divergência entre painel auditável e cálculos. Conflitos continuam evidentes na matriz (N/D/conflito); não muda nenhum dado original ou previsão V2/V3 congelada.
- O verificador **não autentica fatos externos** nem calcula precisão do modelo. É um bloqueio interno de consistência aplicado em memória durante a análise pré-jogo, sem escrita ou coleta automática.

## Testes novos
- Unitários: origem CSV datada de forma contraditória mesmo com ambas datas anteriores ao jogo; FT/1T/2T conflitantes por apenas um lado; erros que se anulariam no somatório agregado; V2/V3 que ficam sem amostra mínima e retornam Sem sinal; isolamento de liga/temporada e N/D vs zero. Dados fictícios e imutáveis.
- Navegador desktop/viewport Android: carregar histórico sintético de 5+5 jogos, com UMA fonte CSV cujo título diverge da data do jogo; o app aceita o formato de registro mas **não seleciona indicação de As Boas** se as observações válidas caem de dez para nove; localStorage e previsões permanecem intactos. As suites prévias de salvar, recuperar, backup, fonte oficial e matrizes devem continuar verdes.
- Não são resultados reais. Coorte externa **0/30 por liga**, qualidade preditiva **N/D**, Android físico e integração/merge/deploy pendentes.

## Preservação
PR DRAFT filho do #65, sem escrever em `main`, Vercel, storage do celular ou arquivos Work. Preserva **659 partidas históricas, Radar V2/V3 já salvos, backups e produção**. Todo avanço no Controle Mestre #29 depende de CI verde no SHA exato do PR.
