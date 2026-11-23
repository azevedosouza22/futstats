# F360 — Brasileirão 2026: lote de recuperação incremental (23/11/2026)

**Registro:** `F360-BR-RECUP-12-20261123` · **Status:** EXTRAÍDO / VALIDADO DOCUMENTALMENTE / **NÃO INTEGRADO AO ÍNDICE OU APP**

## Escopo comprovado
- Índice independente `01_INDICE_PARTIDAS_ELEGIVEIS_5620.csv` de 15/11: 5.620 registros, **336 do Brasileirão 2026**, com data máxima do Brasileirão em 06/11.
- Dados dos CSVs de auditoria de 18, 19, 21 e 22/11: **12 partidas distintas**, **144 células mercado × período**, **288 valores individuais (24 por partida)**.
- **144/144 células com mandante e visitante numéricos**, **12/12 partidas com 24/24 valores**, **96/96 comparações FT = 1T + 2T**, **72/72 verificações de chutes no gol ≤ finalizações**, sem contradições aritméticas.
- Cruzamento estrito com o índice-base: **0 coincidências por ID informado e 0 por data+mandante+visitante após normalização do alias**. Isso indica ausência *nesta cópia de corte antigo*, sem provar ausência de outras cópias.
- **10 IDs Flashscore informados no próprio CSV ou no parâmetro `mid` da fonte**. Para **Vasco × Internacional** e **São Paulo × Fluminense** (19/11) os arquivos deste lote não fornecem ID inequívoco: status **ID N/D**, não deduplicar/integrar até conferência independente.
- O texto original **Red Bull Bragantino** foi preservado; apenas o campo separado `_canonico` usa **RB Bragantino**. No índice antigo há 32 aparições de RB Bragantino e duas de Red Bull Bragantino.
- **Sem dados estimados.** Todos os números derivam dos CSVs já publicados no Drive, e não de nova navegação visual neste registro.

## Jogos e status de ID
| Data | Partida | ID Flashscore | 24/24 |
|---|---|---|---|
| 2026-11-18 | Coritiba × Santos | `nFe3yH7c` | OK |
| 2026-11-18 | Flamengo × Athletico-PR | `0ID26d8N` | OK |
| 2026-11-18 | Remo × Chapecoense | `G82JXY6M` | OK |
| 2026-11-19 | São Paulo × Fluminense | `N/D` | OK |
| 2026-11-19 | Vasco × Internacional | `N/D` | OK |
| 2026-11-19 | Vitória × Red Bull Bragantino | `Kt9AZfxA` | OK |
| 2026-11-21 | Bahia × Coritiba | `v5xhrPKs` | OK |
| 2026-11-21 | Chapecoense × Cruzeiro | `0KQ0t3kf` | OK |
| 2026-11-21 | Palmeiras × Flamengo | `faNhnYLF` | OK |
| 2026-11-22 | Athletico-PR × Remo | `Y5AK0Xz9` | OK |
| 2026-11-22 | Fluminense × Mirassol | `CvlkSCUq` | OK |
| 2026-11-22 | Red Bull Bragantino × Vasco | `2PQ0pCjS` | OK |

## Pendências para integração
1. **P0** resolver IDs de Vasco × Internacional e São Paulo × Fluminense de 19/11 diretamente na fonte e confrontar data/equipes/placar. O `mid` de Vitória × Red Bull Bragantino está presente na URL original; validar identidade na página para gate final.
2. **P0** conferir fontes originais/etapas de coleta e autenticidade temporal; o fechamento documental condicionado é válido como recuperação de estatísticas, **não** como previsão prospectiva.
3. **P0** recuperar jogos da 35ª rodada fora desta seleção: **Mirassol × Atlético-MG (14/11)**, **Cruzeiro × Palmeiras (18/11)**, **Grêmio × Bahia (18/11)** e **Corinthians × Botafogo (18/11)**, conforme [tabela oficial CBF Série A 2026](https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a/2026). Cruzar IDs, completar 24 valores e documentar problemas; não afirmar ausência global até comparar todas as cópias.
4. **P0** conferir todos os demais jogos encerrados posteriores ao corte 06/11 e rodadas 34 a 36; a 36ª rodada vai até 25/11 de acordo com [calendário CBF](https://www.cbf.com.br/futebol-brasileiro/noticias/campeonato-brasileiro-serie-a/a/cbf-divulga-tabela-detalhada-das-35a-e-36a-rodadas-do-brasileirao-serie-a), portanto partidas futuras não são pendências.
5. Somente após QA, preparar **nova cópia isolada incremental** e atualizar índice de pesquisa com total antes/depois e hashes — preservar `01_INDICE_PARTIDAS_ELEGIVEIS_5620.csv` original.
6. Depois retestar casos de recência sem reescrever previsões de 22/23, linhas, histórico, SDD ou classificação Elite.

## Proveniência
- [Índice original de 5.620](https://drive.google.com/file/d/19nLXneG2zkrY8us4dWozf7Vth7P_BKBj/view).
- [18/11 — 36 decisões](https://drive.google.com/file/d/1GfU8mo7sEZ9Kz2buHxshZbo0ARX_fUBw/view).
- [19/11 — 36 decisões](https://drive.google.com/file/d/1CJcaLxDl0OFcMc0VfZ1tAvtb-ltYyCOE/view).
- [21/11 — 204 células](https://drive.google.com/file/d/1ZBiebMZM_n8PnhBztvKdZGSQ8fEnTtXb/view).
- [22/11 — 132 células](https://drive.google.com/file/d/1ss-W_D6xGfR0MTw_kV3ziQVUe7TpOWcf/view).
- Fonte oficial de calendário: CBF, rodadas 35 e 36, ver links acima.

**Contrato:** nenhum merge, deploy, mudança em `main`, app, 659 partidas pessoais, Radar V2/V3/V4, LV4/Elite ou estratégias; nenhum bilhete ou ROI registrado a partir desta recuperação. A matriz CSV acompanha este relatório em `BR_2026_RECUPERACAO_12_20261123.csv`.
