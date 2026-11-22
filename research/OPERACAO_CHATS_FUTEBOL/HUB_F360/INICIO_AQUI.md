# FUTSTATS FUTEBOL — HUB DE CONTINUIDADE F360
21/11/2026 · Documentação experimental · PR DRAFT · **sem merge**

## Ordem obrigatória em cada chat
1. Ler este arquivo e `ESTADO_ATUAL.json`, `INDICE_REGISTROS.csv`, `ESTRATEGIAS.json`, `CONTRATO_DADOS.md`.
2. Verificar [Controle Mestre #29](https://github.com/azevedosouza22/futstats/issues/29) e os artefatos atuais, usando **ref explícita** `research/f360-hub-chats-2026-11-21` para este HUB enquanto não for mesclado.
3. Consultar o último fechamento auditado por mercado e período ANTES de qualquer nova análise; **não** presumir que uma conversa anterior gravou arquivos.
4. Gravar saídas no GitHub em ramo experimental/PR DRAFT, vinculando IDs de previsões e resultados e atualizando o índice.

## Distribuição dos três chats
| Chat | Função principal | Saída versionada |
|---|---|---|
| **F360 — Análise LV4/Elite** | Pré-jogo, ranking SDD, validação de dados, Radar, previsão congelada | `PREJOGO`, pendências e decisão |
| **Coleta / Fechamento / Prompts** | Fechamentos, conferência jogo real, gols/finalizações/chutes no gol/escanteios, montagem dos prompts Work | `POSJOGO`, auditoria, solicitações |
| **Work** | Coleta extensa autorizada, reconciliação de fontes/IDs, backtest temporal e melhoria experimental | `EXPERIMENTO`, relatórios de qualidade |

O uso do GitHub é uma disciplina de leitura/gravação de arquivos **não** uma sincronização mágica entre chats. Se não houver um artefato recuperável, a informação é N/D, não "aprendida".

## Fluxo de aprendizagem
Pré-jogo **congelado** → jogo concluído → auditoria por mercado/1ºT/2ºT/FT → erros e hipóteses → teste independente Work com corte temporal → aprovação explícita → nova versão de regra. **A simples produção de relatório não treina automaticamente o modelo.**

## Regras invioláveis
- Preservar 659 partidas pessoais, históricos, Radar V2/V3 e experimentos V4; não alterar base do app/produção e não fazer merge.
- Projeções LV4/Elite/Radar têm versões e cortes; nenhuma análise reprocessada após o início pode contar como prospectiva.
- Manter separados gols, finalizações, finalizações no alvo e escanteios por equipe/total e por FT/1T/2T. Tempo extra, estatísticas indisponíveis ou partidas awarded não são zeros.
- Aposta comprovada ≠ sinal teórico; odd/linha faltante deixa resultado financeiro N/D.
- Preservar CENÁRIOS SDD e classificações Elite históricas sem retocar. Não inferir probabilidade calibrada de frequência ou notas Elite.
- Fontes externas somente nos limites autorizados; nada de burlar proteção ou scraping proibido.
- Nas respostas ao usuário: tabela curta por jogo/mercado, com nome dos confrontos de fácil busca e um link para os arquivos, sem despejar toda a base no chat.

## Ponto de partida verificado
- [Controle Mestre #29](https://github.com/azevedosouza22/futstats/issues/29) continua sendo referência de continuidade do projeto.
- [PR DRAFT #103](https://github.com/azevedosouza22/futstats/pull/103) documenta arquivo pré-jogo congelado de 30/10 e Radar V4 experimental. **Não** equivale à promoção de V4.
- Este HUB é **apenas documentação de conexão**, e ainda não reconciliou fechamentos recentes.

Para migrar para um chat novo, basta informar repositório, ref `research/f360-hub-chats-2026-11-21` e caminho `research/OPERACAO_CHATS_FUTEBOL/HUB_F360/INICIO_AQUI.md`.
