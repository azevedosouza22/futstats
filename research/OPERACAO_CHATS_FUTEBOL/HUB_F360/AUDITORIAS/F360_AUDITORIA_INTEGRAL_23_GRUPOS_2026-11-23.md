# FUTSTATS F360 — AUDITORIA GERAL DO CATÁLOGO DE LIGAS — 23/11/2026

**Registro:** `F360-CTRL-REVISÃO-INTEGRAL-23LIGAS-20261123`
**Corte conservador de confronto encerrado:** 22/11/2026 (horário de Brasília).
**Estado:** Relatório de inventário e triagem do catálogo; status dos jogos e faltas totais reais ainda exigem consulta ao calendário oficial/Flashscore.
**Objetivo CORRIGIDO:** primeiro identificar TODAS as ligas/temporadas defasadas e comparar calendário; DEPOIS coletar TODAS as partidas ausentes, sem limitar a uma amostra de 12 jogos.

## 1. Bases efetivamente conferidas
- [Catálogo mestre de 6.123 IDs](https://drive.google.com/file/d/1vDTRk7WeeMJephZxDdAHu4QsN01Zvz9H/view), checkpoint 15/11.
- [Índice operacional de 5.620 válidas](https://drive.google.com/file/d/19nLXneG2zkrY8us4dWozf7Vth7P_BKBj/view), checkpoint 15/11.
- 23 grupos de liga/temporada catalogados; 21 aparecem no índice elegível (exclui Amistosos Interclubes e Copa do Brasil).
- 503 IDs estão fora do índice: 472 rotulados FUTURA, 16 CATALOGADA SEM ESTATÍSTICAS, 5 PARCIAL e 10 COMPLETA com divergências de versão.
- **68 IDs com data de catálogo ≤ 22/11 fora do índice**: 37 ainda com status FUTURA do arquivo antigo, 16 somente catalogados, 5 parciais e 10 completos conflitantes.
- **435 registros com data de catálogo posterior a 22/11**, sem classificação automática de falta. Data agendada não comprova conclusão; calendário pode mudar, jogos podem ser adiados.
- Fonte externa de resultados auditados 18–22/11: 41 jogos distintos em relatórios anteriores, fora do corte do índice de 5.620. Esse conjunto deve ser reconciliado com os 68 por IDs, sem somar diretamente.
- O estágio de 12 partidas do Brasileirão `F360-BR-RECUP-12-20261123` é **apenas um subconjunto**, não solução do objetivo geral e não base atualizada.

## 2. Matriz integral por liga e temporada
| Liga | Temporada | IDs catálogo | IDs elegíveis no índice | Última data do índice | Data ≤ corte fora do índice | Desses, antiga FUTURA | Completas conflitantes | Classificação |
|---|---|---:|---:|---|---:|---:|---:|---|
| Amistoso Interclubes | 2026 | 2 | 0 | — | 2 | 0 | 0 | PENDENCIA_CATALOGADA |
| Argentina | 2025 | 510 | 510 | 2025-12-13 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Argentina | 2026 | 495 | 494 | 2026-11-07 | 1 | 0 | 0 | PENDENCIA_CATALOGADA |
| Brasileirão | 2026 | 379 | 336 | 2026-11-06 | 23 | 20 | 0 | PENDENCIA_CATALOGADA |
| Bundesliga | 2025/26 | 306 | 306 | 2026-05-16 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Bundesliga | 2026/27 | 81 | 81 | 2026-11-08 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Copa do Brasil | 2026 | 1 | 0 | — | 1 | 0 | 0 | PENDENCIA_CATALOGADA |
| Eliteserien | 2026 | 240 | 208 | 2026-11-09 | 8 | 8 | 0 | PENDENCIA_CATALOGADA |
| La Liga | 2025/26 | 380 | 371 | 2026-05-24 | 9 | 0 | 9 | PENDENCIA_CATALOGADA |
| La Liga | 2026/27 | 118 | 117 | 2026-11-08 | 1 | 0 | 1 | PENDENCIA_CATALOGADA |
| Liga Europa | 2026/27 | 2 | 2 | 2026-10-15 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Liga Portugal | 2025/26 | 306 | 306 | 2026-05-16 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Liga Portugal | 2026/27 | 306 | 96 | 2026-11-08 | 3 | 0 | 0 | PENDENCIA_CATALOGADA |
| Ligue 1 | 2025/26 | 306 | 305 | 2026-05-17 | 1 | 0 | 0 | PENDENCIA_CATALOGADA |
| Ligue 1 | 2026/27 | 89 | 89 | 2026-11-08 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| MLS | 2025 | 510 | 509 | 2025-10-18 | 1 | 0 | 0 | PENDENCIA_CATALOGADA |
| MLS | 2026 | 511 | 511 | 2026-11-07 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Premier League | 2025/26 | 380 | 380 | 2026-05-24 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Premier League | 2026/27 | 100 | 100 | 2026-11-08 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Saudi Pro League | 2025/26 | 306 | 306 | 2026-05-21 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Saudi Pro League | 2026/27 | 306 | 104 | 2026-10-31 | 18 | 9 | 0 | PENDENCIA_CATALOGADA |
| Serie A italiana | 2025/26 | 380 | 380 | 2026-05-24 | 0 | 0 | 0 | COMPARAR_CALENDARIO |
| Serie A italiana | 2026/27 | 109 | 109 | 2026-11-08 | 0 | 0 | 0 | COMPARAR_CALENDARIO |

> `Data ≤ corte fora do índice` equivale a **candidato à checagem** (status, identidade e completude), não partida definitivamente faltante. **0** significa que o catálogo arquivado não tem pendência anterior à data, mas NÃO significa que não existam jogos novos ainda não catalogados. Cobertura do calendário oficial ainda precisa ser checada.

## 3. Escolha do foco de coleta
**P0** — Brasileirão 2026: 336 completas no índice até 06/11; 379 IDs no catálogo, 23 com data até 22/11 fora do índice, 20 deles rotulados FUTURA em 15/11 e três sem estatísticas em 04–05/11. Consultar CBF/Flashscore para identificar *todos* os jogos encerrados entre 07/11 e 22/11, não apenas 12 já auditados, e cruzar as rodadas 34–36; vincular IDs e aliases RB Bragantino/Red Bull Bragantino sem apagar origem.

**P1** — Saudi Pro League 2026/27 (18 registros arquivados datados até corte: nove FUTURA e nove somente catálogo; calendário oficial informa pausa e retomada em 20/11); Eliteserien 2026 (8 futuras arquivadas com data vencida); La Liga 2025/26 (380 completas, mas NOVE com conflitos de versão: não são nove jogos por coletar), La Liga 2026/27 (um caso completo conflitante); Ligue 1 2025/26 (Nantes × Toulouse parcial); MLS 2025 (Toronto × Columbus parcial); Argentina 2026 (Central Córdoba × Lanús somente catálogo); Liga Portugal 2026/27 (três jogos de 08/11 sem estatísticas).

**P1 calendário completo também** — Bundesliga 2026/27, Premier League 2026/27, Serie A italiana 2026/27, Ligue 1 2026/27 e MLS 2026 não possuem, no catálogo de 15/11, IDs pendentes anteriores ao corte; entretanto há fechamentos de 18–22/11 fora do índice. Portanto exigir consulta de **TODOS** os resultados oficiais até 22/11 e comparação de ID antes de concluir que estão atualizadas.

**P2** — temporadas anteriores completas e estabilizadas por inventário: Argentina 2025, Bundesliga 2025/26, Liga Portugal 2025/26, Premier League 2025/26, Saudi Pro League 2025/26, Serie A italiana 2025/26; excluir Copa do Brasil/amistosos e Liga Europa de ligas nacionais sem descartar suas referências.

**Integridade adicional** — MLS 2026 contém um All-Stars fora da temporada regular, ID `d0OLOOJ5`; Argentina/MLS playoffs separados por fase; Brasileirão tem duas grafias do Bragantino; não promover frequência histórica como probabilidade.

## 4. Procedimento EXAUSTIVO (não interromper após primeiro lote)
1. **Descoberta de calendário:** cada liga/temporada deve ter todos os jogos realmente iniciados e encerrados até 22/11, incluindo jogos adiados e fases, com fonte oficial / Flashscore, data, equipes, rodada, status e ID. Não inferir falta por intervalo de datas ou percentuais teóricos da temporada.
2. **Diferença multibase:** cruzar por ID entre calendário externo, catálogo de 6.123, índice de 5.620, registros pós-jogo 18–22 e eventuais coletas recentes no Drive/GitHub; normalizar aliases em campo auxiliar. Identificar EXISTE_COMPLETA, EXISTE_PARCIAL, COMPLETA_CONFLITANTE, NAO_CATALOGADA, FUTURA_AGORA_FINAL, ADIADA, CANCELADA, DIVERGENCIA_ID, EVIDENCIA_INSUFICIENTE.
3. **Coleta faltante:** consultar apenas partidas FINAL com estatísticas que faltam, na fonte permitida, extraindo gols, finalizações, chutes no gol e escanteios de cada equipe em FT, 1T e 2T (24 campos) e, quando necessário, segundo fornecedor e evidências. Nada de zeros inventados.
4. **Validação:** 24/24, FT=1T+2T em 8 métricas-lado, SOT≤shots em 6 combinações, IDs únicos, confronto/data compatível, status de prorrogação/pênaltis, sha256 e origem. Conflitos permanecem explícitos.
5. **Lotes com checkpoint:** publicar por liga um manifesto de resultados e um CSV experimental de 55 colunas, com contagens totais de jogos calendário/IDs catalogados/completos/pendentes/novos, fontes e hashes; retomar exatamente no último ID. Nenhuma escrita nas 659 partidas pessoais, `main`, app/Android/Radar/LV4/Elite/Shadow V1. Nenhum merge/deploy.
6. **Homologação do banco:** só declarar liga atualizada quando #FINAL oficiais até o corte = #FINAL completos reconciliados, ou quando cada exceção estiver documentada e bloqueada. Não confundir amostra de auditoria com a temporada integral.

## 5. Próximo checkpoint exigido
A) buscar TODOS os jogos encerrados por liga até 22/11; B) publicar matriz `CALENDARIO_X_CATALOGO_X_5620` por IDs e fase; C) começar coleta onde pendências confirmadas; D) não fazer análise pré-jogo com registros recém-inseridos antes do corte do evento.

**Não realizado neste registro:** a navegação exaustiva em Flashscore e a coleta de todos os jogos de 11 temporadas. Os 68 são a fila *catalogada* verificável, que constitui somente o início do escopo. Nenhuma atualização física de banco, produção ou índice elegível.
