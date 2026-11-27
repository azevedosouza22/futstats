# FUTSTATS F360 — LV4/Elite de 24/11/2026
**Registro:** `F360-PRE-20261124-CHA-PAL` · `PREJOGO` documental experimental condicionado · gerado `2026-11-24T11:16:08.074Z` · evento `2026-11-24T21:00:00Z` (**18h BRT**). **Não homologado como execução TS nativa nem Shadow V1.**

## Agenda verificada
- **Chapecoense × Palmeiras** — Brasileirão Série A 2026 / 37ª rodada, 18h BRT. [CBF, jogo 370](https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/chapecoense-x-palmeiras/832260); [Flashscore, ID `OzJP5JI5`](https://www.flashscore.com/match/football/chapecoense-sc-jcQV3XP6/palmeiras-hMn9FTbH/standings/?mid=OzJP5JI5).
- **UEFA Champions League 2026/27:** nove jogos hoje, mas **0 jogos da própria competição na base CP16**. Todos **ABSTER** por regra de mesma competição/temporada; é proibido extrapolar séries nacionais como se fossem Champions. [UEFA, calendário](https://www.uefa.com/uefachampionsleague/news/02a8-2174c9e9019d-f909a77bd77a-1000--202627-champions-league-all-the-league-phase-fixtures-and-results/).

## Entrada e regras
- Base de pesquisa *experimental* `BASE_EXPERIMENTAL_CP16_5732_55COL.csv`, 5.732 IDs, [Drive](https://drive.google.com/file/d/1-FUmgwHUmiy6dUAJHqsY4uludBRjU3ue/view), SHA-256 `1982fbc1e074a6a722cc9947cc023ec2520a6df2321f31b366716590bbf35423`.
- Reproduz numericamente em Python a grade de `src/radarV4LabToday.ts` do commit `6ef66d14a5d814d57dd59e552cf08983bc57d91a`: cinco jogos anteriores de cada time; dez IDs distintos; 8+ valores por período/mercado; maior Over da grade com frequência >=70%. **Não foi executado o TypeScript original nem atualizado o Android.**
- Alias explícito, sem alterar fonte: as nove linhas recentes rotuladas `Brasileirão` em 2026 foram equivalidas analiticamente à `Brasileirão Série A 2026`. IDs deduplicados. Alguns registros novos têm título literal da fonte `N/D`, que não prova a revisão de discrepância de data exigida para homologação nativa.
- Elite documental, **não função nativa certificada**: 9/10 ou 10/10 ocorrências e margem média acima da linha >=0,8 gol / 3 finalizações / 1,5 chutes no alvo / 2 escanteios. Frequência ≠ probabilidade calibrada.
- O HUB F360 (PR DRAFT #104, issue #105) e `ESTRATEGIAS.json` foram lidos; **0 estratégias formalmente aprovadas**. Fechamento mais recente (23/11) permanece documental condicionado, **53 acertos/10 erros dentre 63 observados**, sem ROI.

## Quadro de 12 linhas: todas OBSERVAR, uma Elite
| Mercado | JC | 1ºT | 2ºT |
|---|---|---|---|
| Gols | Over 1,5 (9/10) **ELITE provisório** | Over 0,5 (7/10) | Over 0,5 (8/10) |
| Finalizações | Over 26,5 (8/10) | Over 12,5 (8/10) | Over 13,5 (9/10) |
| Chutes no gol | Over 8,5 (7/10) | Over 3,5 (8/10) | Over 4,5 (8/10) |
| Escanteios | Over 8,5 (7/10) | Over 3,5 (7/10) | Over 3,5 (8/10) |

**Resumo:** 12 sinais LV4 válidos historicamente; **1 Elite documental: Gols JC Over 1,5, 9/10, média 2,7, margem +1,2**; 0 ABSTER no Brasileirão. **SDD OBSERVAR para 12; SELECIONAR = 0** (sem odds reais e sem homologação da execução).

## Rastreamento dos 10 jogos passados
| Equipe amostrada | Data | Confronto | ID fonte |
|---|---|---|---|
| Chapecoense | 2026-10-28 | Red Bull Bragantino x Chapecoense | `faJea2wq` |
| Chapecoense | 2026-11-03 | Chapecoense x Mirassol | `hhAf8IwB` |
| Chapecoense | 2026-11-14 | Chapecoense x Vasco | `ARJ356Ua` |
| Chapecoense | 2026-11-18 | Remo x Chapecoense | `G82JXY6M` |
| Chapecoense | 2026-11-21 | Chapecoense x Cruzeiro | `0KQ0t3kf` |
| Palmeiras | 2026-10-24 | Palmeiras x RB Bragantino | `GCx7hfQb` |
| Palmeiras | 2026-10-28 | Santos x Palmeiras | `21vH6po9` |
| Palmeiras | 2026-11-05 | Palmeiras x Remo | `Q7uBAm3s` |
| Palmeiras | 2026-11-18 | Cruzeiro x Palmeiras | `zySpJZiT` |
| Palmeiras | 2026-11-21 | Palmeiras x Flamengo | `faNhnYLF` |

## Champions: nove jogos ABSTER, base sem competição
| Horário BRT | Confronto | Status |
|---|---|---|
| 14:45 | Bodø/Glimt × LASK | **ABSTER — sem 8+ IDs da Champions** |
| 14:45 | Galatasaray × Aston Villa | **ABSTER — sem 8+ IDs da Champions** |
| 17:00 | Arsenal × Borussia Dortmund | **ABSTER — sem 8+ IDs da Champions** |
| 17:00 | Como × AEK Athens | **ABSTER — sem 8+ IDs da Champions** |
| 17:00 | Feyenoord × Porto | **ABSTER — sem 8+ IDs da Champions** |
| 17:00 | Manchester City × Napoli | **ABSTER — sem 8+ IDs da Champions** |
| 17:00 | RB Leipzig × Lens | **ABSTER — sem 8+ IDs da Champions** |
| 17:00 | Real Madrid × PSV Eindhoven | **ABSTER — sem 8+ IDs da Champions** |
| 17:00 | Slovan Bratislava × Real Betis | **ABSTER — sem 8+ IDs da Champions** |

## Qualidade, SDD e handoff
1. A delegação do Palmeiras para este jogo teria 14 jogadores com passagem pela base, em função da preparação para a Libertadores. Essa mudança potencial de elenco **não está refletida na janela estatística**. [UOL, 24/11](https://www.uol.com.br/esporte/futebol/ultimas-noticias/2026/11/24/foco-na-libertadores-palmeiras-tera-14-crias-da-academia-contra-a-chape.ghtm).
2. Com odds pré-jogo N/D, nenhuma entrada está autorizada nem existe estimativa de EV/ROI. Verde = **candidata em observação**, não aposta.
3. **Coleta**: vincular resultado posterior por `OzJP5JI5`, registrar estatísticas FT/1T/2T, comparar as 12 linhas sem refazer previsão. **Work**: paridade TS e testes de recência/escalação em coorte separada. Evitar vazamento temporal.
4. Preservar 659 partidas pessoais, histórico de pesquisa, LV4/Elite, Radar V2/V3/V4, snapshots, main, produção e app; **sem merge**.
