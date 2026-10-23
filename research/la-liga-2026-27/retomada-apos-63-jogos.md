# FutStats V4 — La Liga 2026/27 — Retomada orientada após 63 jogos

**Auditoria do arquivo enviado pelo usuário:** `futstats_la_liga_2026_27_consolidado.csv`, recebido em 22/10/2026. **Somente CSV enviado; relatório MD do Work não foi anexado nesta etapa.**

## Resultado da verificação de CSV (sem importar no aplicativo)
- **63 linhas de partidas, 63 IDs únicos, 55 colunas exatas, BOM UTF-8**, competição uniforme `La Liga espanhola 2026/27`; datas **15/08 a 19/09/2026**.
- Todos os indicadores **gols, finalizações, chutes no alvo, escanteios** preenchidos para mandante/visitante, em partida completa, primeiro e segundo tempo; **zero erros nas 504 somas 1T+2T=FT e 756 totais mandante+visitante** (1.260 verificações aritméticas). Nenhuma duplicata no CSV.
- Rodadas com jogos presentes: **1ª: 10/10, 2ª: 10/10, 3ª: 10/10, 4ª: 10/10, 5ª: 10/10, 6ª: 9/10, 7ª: 4/10**. Rodadas 8 e 9 ausentes.
- **63/63 partidas** coincidem por data/equipes com o calendário OpenFootball `2026-27/es.1.json` (nomes de times abreviados reconciliados). Em **58**, OpenFootball já fornece FT/HT e ambos são idênticos ao CSV. As outras **5** constam na fonte aberta como `score:[0,0]` sem o marcador `ft` (Valencia × Celta, Osasuna × Levante, Real Sociedad × Celta, Málaga × Levante, Athletic Bilbao × Alavés); o Work informou 0×0 completo para essas cinco e números detalhados de finalizações/escanteios. Guardar a origem como Work, **não** fingir que foram confirmadas como resultados oficiais da fonte aberta.
- O CSV **NÃO** abrange todos os jogos concluídos até 22/10/2026: o calendário OpenFootball lista **27 partidas com data até 22/10/2026 que não estão no CSV**, compreendendo 1 da rodada 6, 6 da rodada 7, 10 da rodada 8 e 10 da rodada 9. **Não assumir que jogos futuros em calendário já terminaram**; confirmar status encerrado no Flashscore antes de importar, inclusive Levante × Athletic Bilbao (21/10). Sua ausência do CSV não é evidência de falta de estatísticas.
- O histórico de **659 partidas**, a pesquisa experimental de **155 partidas** e os dados completos já salvos da Serie A italiana (**70 partidas**) devem permanecer intactos. Nenhuma alteração de produção ou Radar.

## Os 7 jogos pendentes das rodadas 6 e 7

| Rodada | Data | Mandante × visitante | FT de referência OpenFootball |
|---:|---|---|---|
| 6 | 21/10/2026 | Levante × Athletic Bilbao | Fonte CC0 ainda sem placar |
| 7 | 19/09/2026 | Sevilla × Barcelona | 1×3 |
| 7 | 20/09/2026 | Getafe × Málaga | 1×0 |
| 7 | 20/09/2026 | Atlético de Madrid × Real Madrid | 2×1 |
| 7 | 20/09/2026 | Deportivo La Coruña × Betis | 1×1 |
| 7 | 20/09/2026 | Villarreal × Levante | 3×1 |
| 7 | 20/09/2026 | Valencia × Real Sociedad | 2×3 |

**Depois** conferir todos os jogos encerrados das rodadas 8 (09–12/10) e 9 (16–19/10), já listados no calendário; **20 confrontos** ainda ausentes do CSV. Acesse calendário e resultados do Flashscore para status e identidades atuais, evitando supor jogo concluído só pela data.

## Instrução única ao Work (sem novos micro-lotes)

**Continue a tarefa La Liga 2026/27 DO CHECKPOINT de 63 partidas, SEM refazer nenhuma partida já pesquisada**. Localize e colete, no mesmo procedimento validado do Work, cada jogo **encerrado** que falta até 22/10/2026, incluindo gols, finalizações, chutes no alvo e escanteios separados por mandante/visitante em FT, 1T e 2T; faça checksums/checkpoints intermediários duráveis de forma interna, sem comandos manuais ao usuário. Priorize as **27 partidas listadas como ausentes pelo confronto com o calendário** e ajuste se o Flashscore trouxer status diferente. Verifique 1T+2T=FT por equipe/indicador e os totais, links/IDs verdadeiros, datas/nomes, evitando registros duplicados.

Ao concluir, **mescle de forma segura com os 63 jogos existentes**, com CSV **único** UTF-8 BOM de **55 colunas**, na ordem original e sem lacunas inventadas, e **um relatório MD de validação**, listando quantos foram considerados encerrados, coletados, não disponíveis, conflitos e atualidade. **Nenhum CSV deve ser publicado no GitHub**, e não deve haver alterações na produção, base histórica, pesquisa experimental, Radar ou código.

**Critério de aceitação:** arquivo consolidado até a data da pesquisa, não um lote de 27 entregue isolado; indicação explícita dos resultados e dados estatísticos. Uma vez recebidos os arquivos, validar aqui e efetuar **uma única importação local no Android**, evitando múltiplas operações manuais.
