# FutStats IA — Laboratório Estatístico Radar V4

## Piloto 01 — teste histórico real (pesquisa isolada)
**Saudi Pro League 2025/26 — finalizações totais**

**Status:** experimento retrospectivo executado com dados reais, **não homologado como método preditivo**, e não integrado ao Radar V2/V3 ou As Boas do Dia.

### Desenho do teste congelado antes da execução
1. A temporada tem **306 partidas**, com 18 equipes e 34 rodadas. Foram avaliadas as **rodadas 20–34**, equivalentes a **135 confrontos**. Todos cumpriram os pré-requisitos.
2. Cada jogo é simulado em sua data. O algoritmo consulta **somente jogos anteriores à data** dos dois times (jamais o próprio dia, o resultado da partida ou data futura).
3. Obtém os últimos **cinco jogos anteriores de cada equipe**; junta as referências retirando partidas repetidas (mínimo de oito partidas históricas distintas).
4. Calcula, nesses jogos, a frequência com que o **total de finalizações** ultrapassou cada uma das linhas: **20,5; 22,5; 24,5; 26,5**.
5. **Regra experimental:** escolhe a **MAIOR linha** com frequência histórica de Over **≥70%**. Sem linha suficiente, **não emite sinal**.
6. Compara com a regra de referência **sempre Over 24,5**, uma referência simples **sempre Over 22,5** e a versão **Over 24,5 apenas quando a frequência histórica é ≥70%**.
7. Registra o sinal **antes** de olhar o desfecho e apenas então contabiliza acerto ou erro. As regras foram definidas antes da primeira execução deste piloto.

### Resultado calculado nos dados da temporada

| Estratégia | Jogos com sinal | Acertos | Erros | Acerto observado |
|---|---:|---:|---:|---:|
| **Radar V4 piloto, linha adaptativa** | 110 | 78 | 32 | **70,9%** |
| Referência: sempre Over 24,5 | 135 | 66 | 69 | 48,9% |
| Referência: sempre Over 22,5 | 135 | 81 | 54 | 60,0% |
| Filtro fixo: Over 24,5 só se histórico ≥70% | 23 | 14 | 9 | 60,9% |

A linha adaptativa **absteve-se em 25 partidas**. Entre os 110 sinais emitidos, escolheu **20,5 em 55**; **22,5 em 32**; **24,5 em 18**; e **26,5 em 5**. Intervalo de Wilson (95%, suposição binomial): **61,8%–78,6%** dos sinais emitidos pelo experimento; esse intervalo não contempla dependências temporais ou entre equipes.

O mesmo experimento apresentou **29/41** acertos nas rodadas 20–26 e **49/69** nas rodadas 27–34. Não foram ajustados os limiares ao longo da avaliação.

### Um acerto real, passo a passo
- **01/02/2026 — Al Shabab × Al-Fayha**; 5 jogos anteriores de cada equipe, sem duplicações: média histórica **23,0** finalizações.
- Frequência histórica suficiente para indicar **Over 20,5**.
- O confronto terminou com **29 finalizações**. Resultado: **acerto**.
- [Fonte da partida no Flashscore](https://www.flashscore.com.br/jogo/futebol/al-fayha-Meknfpi2/al-shabab-Gzqmz0ya/resumo/estatisticas/total/?mid=Slm1KII5).

### Um erro real
- **02/02/2026 — Al Riyadh × Al Nassr Riyadh**.
- Sinal experimental: **Over 20,5**; resultado **18 finalizações**. Resultado: **erro**.

### Interpretação obrigatória
**Não** concluir que “V4 é superior ao V2/V3” ou tem maior retorno financeiro: este piloto implementa uma **regra nova e simples**, não o código de V2/V3; as estratégias acima mudam **as linhas e a quantidade de seleções**. Linhas menores são naturalmente mais fáceis de acertar e normalmente possuem preços/odds distintos. As taxas não são comparáveis como rentabilidade. Mesmo a simulação temporal é retrospectiva e limitada a uma competição/temporada; não substitui previsões registradas prospectivamente.

Próximas evidências antes de qualquer mudança em As Boas:
- repetir o método **sem qualquer ajuste** em ligas e temporadas separadas;
- avaliar controles **sobre o mesmo conjunto de partidas e mesmas linhas**, incluindo abstinências;
- medir desempenho conjunto com V2 e V3, usando cada algoritmo de fato;
- documentar incertezas e revisar dados/odds históricos autorizados, se disponíveis;
- submeter registros prospectivos antes da partida e auditar resultados depois.

### Reproduzir o piloto
Execução determinística em Vitest, incluída neste PR:
```bash
npx vitest run src/radarV4LabPilot01.test.ts
```
O teste lê **somente** `public/research/packs/saudi_pro_league_2025_26.json`, confere 306 jogos, 18 clubes, 34 rodadas, períodos FT=1T+2T, unicidade de IDs, não vazamento de resultados posteriores e os resultados resumidos acima. **Não** modifica dados pessoais, backups, produção, previsões ou UI.

**Aviso:** os resultados estão no histórico de pesquisa experimental e não constituem sugestão de aposta.
