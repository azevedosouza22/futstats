# FutStats IA — Etapa 43: livro-razão de acompanhamento de As Boas do Dia

**Escopo:** ramo experimental empilhado no PR #42, apenas leitura e exportação local. Nenhum merge, deploy, importação, coleta em segundo plano ou modificação de Radar V2/V3, 659 históricos, Work e backups.

## O que foi acrescentado

No painel **Validação prospectiva de “As Boas do Dia”**, o botão **Exportar controle das indicações (CSV)** é apresentado somente se houver uma previsão com identificação explícita da lista. O arquivo `futstats-as-boas-acompanhamento.csv` permite auditar os **registros efetivamente salvos pelo usuário antes da partida** sem misturar previsões legadas.

Cada linha preserva os dados que já estavam congelados:
- Identificador e timestamp UTC da gravação, horário da partida em Brasília, campeonato, mandante, visitante.
- Data de verificação e URL da fonte da programação oficial, situação e motivo da auditoria (por exemplo: jogo futuro, resultado aguardado, fonte inválida, previsão tardia, duplicidade, comparação com CSV local documentado).
- Indicador, direção V2/V3 congelada, linha, projeção V2, média pré-jogo e amostras históricas.
- Resultado por indicador e veredito **somente se** o registro local da partida passou pela validação estrutural do CSV e pelas travas temporais. Do contrário resultado e veredito são N/D.
- URL da fonte local do resultado se já cadastrada. A coluna **verificacao_externa_independente** permanece **PENDENTE em TODAS as linhas**, inclusive quando o CSV local contém placar, para não induzir à conclusão de resultado real independentemente confirmado.

Os antigos snapshots do Radar **não recebem atribuição retroativa** a “As Boas”. Registros tardios, ambiguidades, fontes vencidas, estatísticas ausentes e duplicatas são explicitamente preservados como tais no relatório; nunca se convertem em acertos. É um artefato auxiliar de consulta que não se importa de volta no FutStats.

## Segurança e usabilidade

- CSV em UTF-8 com BOM, separador `;`, células entre aspas, aspas internas duplicadas e prevenção de fórmulas de planilha com prefixo de segurança para células iniciadas por sinais de execução, inclusive após espaços.
- Exportação via Blob e clique de download iniciado pelo usuário; não envia dados para GitHub, Vercel, terceiros ou servidores remotos e não grava no localStorage.
- A integridade da ordenação entre registros salvos e auditoria é verificada: divergência aborta a geração do arquivo.
- O backup integral JSON permanece a única cópia de restauração: este arquivo CSV **não substitui o backup**.
- Testes sintéticos verificam registros antigos excluídos, futuros, aguardando desfecho, registro tardio, comparação local sem validação externa, prevenção de fórmulas e abortos por ordem inconsistente. E2E baixa o arquivo pelo botão no navegador desktop/viewport Android sem alterar a previsão.

## Critério restante para medição de desempenho

A etapa prepara a documentação **mas NÃO cria previsões reais no navegador do usuário** e **não confere resultados na internet**. Uma amostra para decisão de mudanças por liga precisará de pelo menos 30 confrontos prospectivos distintos, com resultados externamente checados e denominadores representativos. Resultados N/D e casos excluídos não integram numeradores ou denominadores de acertos.

Nunca deduzir taxa de acerto de dados sintéticos/CSV local sem auditoria externa. O progresso percentual no Controle Mestre é um planejamento de entregáveis, não medida objetiva da precisão preditiva ou prontidão em produção.
