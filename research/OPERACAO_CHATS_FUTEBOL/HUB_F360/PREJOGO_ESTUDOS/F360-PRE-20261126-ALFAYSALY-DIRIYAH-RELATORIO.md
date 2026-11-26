# F360 — Al Faysaly × Al Diriyah — LV4/Elite de 26/11/2026

**Registro independente:** `F360-PRE-20261126-ALFAYSALY-DIRIYAH`  
**Data/hora da criação:** `2026-11-26T12:28:59.141535+00:00` (UTC)  
**Evento:** Saudi Pro League 2026/27, rodada 13, Al Faisaly × Al Diriyah, 26/11 às **14h30 BRT (17h30 UTC)**. ID externo associado ao confronto: `1603083` (não é ID Flashscore autenticado).

## Correção do alias e qualidade do calendário
- A busca inicial por `Al Faisaly` (com **i**) não encontrou jogos na CP16. A inspeção normalizada encontrou a grafia **`Al Faysaly`** (com **y**) e seus 12 registros em 2026/27. **A abstenção inicial por ausência de histórico foi REVOGADA**, por erro de alias.
- **Conflito de agenda:** a [Saudi Pro League oficial](https://www.spl.com.sa/en/fixtures-results) apresenta `Al Faisaly × Diriyah` como *upcoming*, enquanto o [FotMob](https://www.fotmob.com/en-GB/teams/205687/fixtures/al-faisaly) indica `PP` (adiado). Antes de qualquer avaliação de odd, **reconfirmar se haverá jogo**. Sinais são documentais condicionados, NÃO aptos a SELECIONAR.
- Últimos cinco jogos de `Al Faysaly`: 15, 19, 23, 27 e 31/10; últimos cinco de `Al Diriyah`: 09, 17, 20, 23 e 30/10, todos da mesma competição/temporada na CP16. Consultas [Al Faisaly](https://statz.ai/team/al-faisaly/fixtures) e [Diriyah](https://www.fotmob.com/en-GB/teams/1787233/fixtures/al-diriyah) confirmam a pausa de novembro e a sequência.
- Fonte numérica **somente CP16** de 5.732 IDs: [Drive](https://drive.google.com/file/d/1-FUmgwHUmiy6dUAJHqsY4uludBRjU3ue/view), SHA256 `1982fbc1e074a6a722cc9947cc023ec2520a6df2321f31b366716590bbf35423`; dez IDs históricos distintos, 12/12 indicadores completos. Nenhum registro da base original foi alterado.

## 12 indicadores LV4
| Mercado | Período | Linha | Histórico | Média | Margem | Classe | SDD |
|---|---|---|---:|---:|---:|---|---|
| Gols | FT | Over 1,5 | 8/10 | 3,0 | 1,5 | LV4 | **OBSERVAR CONDICIONADO** |
| Gols | 1T | Over 0,5 | 8/10 | 1,6 | 1,1 | LV4 | **OBSERVAR CONDICIONADO** |
| Gols | 2T | Over 0,5 | 9/10 | 1,4 | 0,9 | ⭐ ELITE | **OBSERVAR CONDICIONADO** |
| Finalizações | FT | Over 26,5 | 7/10 | 28,3 | 1,8 | LV4 | **OBSERVAR CONDICIONADO** |
| Finalizações | 1T | Over 12,5 | 7/10 | 13,4 | 0,9 | LV4 | **OBSERVAR CONDICIONADO** |
| Finalizações | 2T | Over 13,5 | 7/10 | 14,9 | 1,4 | LV4 | **OBSERVAR CONDICIONADO** |
| Chutes no gol | FT | Over 7,5 | 7/10 | 8,9 | 1,4 | LV4 | **OBSERVAR CONDICIONADO** |
| Chutes no gol | 1T | Over 4,5 | 8/10 | 5,4 | 0,9 | LV4 | **OBSERVAR CONDICIONADO** |
| Chutes no gol | 2T | Over 2,5 | 7/10 | 3,5 | 1,0 | LV4 | **OBSERVAR CONDICIONADO** |
| Escanteios | FT | Over 6,5 | 7/10 | 10,3 | 3,8 | LV4 | **OBSERVAR CONDICIONADO** |
| Escanteios | 1T | Over 2,5 | 9/10 | 4,8 | 2,3 | ⭐ ELITE | **OBSERVAR CONDICIONADO** |
| Escanteios | 2T | Over 2,5 | 10/10 | 5,5 | 3,0 | ⭐ ELITE | **OBSERVAR CONDICIONADO** |

**Três Elite documentais provisórios**, subconjunto dos 12 sinais: escanteios 1T Over 2,5 (9/10, média 4,8, margem +2,3); gols 2T Over 0,5 (9/10, média 1,4, margem +0,9); escanteios 2T Over 2,5 (10/10, média 5,5, margem +3,0).

## Histórico por ID
| Data | Mandante × Visitante | ID |
|---|---|---|
| 2026-10-15 | Al Faysaly × Al-Kholood | `jucecdLq` |
| 2026-10-19 | Al Shabab × Al Faysaly | `ddjsQoem` |
| 2026-10-23 | Al Faysaly × Al Nassr Riyadh | `GzW1k2Ob` |
| 2026-10-27 | Abha × Al Faysaly | `MumpnBeo` |
| 2026-10-31 | Al-Fayha × Al Faysaly | `WUlMsBMk` |
| 2026-10-09 | Al Nassr Riyadh × Al Diriyah | `I9RilJrT` |
| 2026-10-17 | Al Diriyah × Al-Taawon | `0QpUVGR8` |
| 2026-10-20 | Al Diriyah × Al Riyadh | `Qg9H9QA6` |
| 2026-10-23 | Al-Ittihad × Al Diriyah | `KEmpXK8U` |
| 2026-10-30 | Al Diriyah × Neom SC | `hIOt2u84` |

## Status e handoff
O cálculo é reprodução documental da grade \`analyzeV4Fixture\` do commit \`6ef66d14...\`; sem execução TS nativa, sem odds, bilhetes, ROI, Shadow V1 ou mudança de estratégia.

- **12 OBSERVAR_CONDICIONADO; 0 SELECIONAR; 0 ABSTER** na aplicação matemática. Bloqueio de efetiva seleção pela situação conflitante da agenda e ausência de preço.
- **Coleta:** validar realização/adiamento antes de qualquer POSJOGO e recuperar ID Flashscore do alvo. Se não houver jogo, marcar CANCELADO/ADIADO, nunca ERRO.
- **Work:** checar alias, paridade da grade e calendário. Não atualizar projeções após o kickoff.
- Preservar 659 jogos pessoais, Radar V2/V3/V4, LV4/Elite, app/produção, main; sem merge.
