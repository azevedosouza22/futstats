# F360 — auditoria geral e atualização experimental, CP02

**Estado: PARCIAL. A missão integral não foi concluída.** Corte 22/11/2026 23h59 BRT; execução23/11.

A cópia experimental contém **5.671 IDs únicos**: 5.620 originais +41 pós-jogos já coletados +10 versões previamente reconciliadas. Nenhuma nova partida completa foi coletada visualmente nesta execução. Os 51 representam reaproveitamento, não cobertura integral das temporadas. Catálogo6123 e índice5620 tiveram SHA256 conferidos.

## Painel por temporada corrente

| Liga | Antes | Reaproveitados/reconciliados | Total estrutural | Candidatos residuais do catálogo | Faltantes reais / cobertura |
|---|---:|---:|---:|---:|---|
| Argentina | 494 | 3 | 497 | 1 | N/D / N/D |
| Brasileirão | 336 | 12 | 348 | 7 | N/D / N/D |
| Bundesliga | 81 | 2 | 83 | 0 | N/D / N/D |
| Eliteserien | 208 | 1 | 209 | 7 | N/D / N/D |
| La Liga | 117 | 6 | 123 | 0 | N/D / N/D |
| Liga Portugal | 96 | 0 | 96 | 2 | N/D / N/D |
| Ligue 1 | 89 | 7 | 96 | 0 | N/D / N/D |
| MLS | 511 | 6 | 517 | 0 | N/D / N/D |
| Premier League | 100 | 1 | 101 | 0 | N/D / N/D |
| Saudi Pro League | 104 | 1 | 105 | 18 | N/D / N/D |
| Serie A italiana | 109 | 3 | 112 | 0 | N/D / N/D |

Os candidatos residuais não são jogos faltantes confirmados. Zero na coluna não significa temporada atualizada. Nenhuma liga foi homologada como ATUALIZADA. A matriz é um cruzamento parcial por ID de todo o catálogo, base e resultados recuperados, não um calendário externo exaustivo.

## Trabalho adicional após CP01

- Registro de consultas das11 temporadas; aberturas textuais do Flashscore não carregaram os calendários dinâmicos. Algumas aberturas retornaram temporadas/versões antigas, divergindo das buscas. Navegador visual do Work indisponível nesta sessão.
- Localizados22 confrontos adicionais sem vínculo de ID comprovado, além dos41 pós-jogos já coletados. Mais sete confrontos brasileiros da fila têm placar textual. Ao todo29 registros parciais,58 valores FT documentais,638 valores N/D no recorte parcial. Não foram integrados à base completa nem confundidos com leitura visual.
- Chapecoense × Vasco,14/11,0-2: resultado confirmado na página de lances da FFERJ; a página raiz retornou versão antiga AGENDADO. ID Flashscore ainda N/D. Jogo fora do catálogo arquivado por confronto mandante/visitante; não atribuir ID aproximado.
- Estoril × Marítimo reagendado para04/01/2027: removido da fila de possível FINAL até22/11. Evidência jornalística identificada; rodada divergente mantida pendente.
- Calendário oficial saudita revisado:18 datas vencidas não comprovam18 jogos faltantes. A retomada em20/11 Al Ahli × Al Nassr já consta do lote reaproveitado. Cada um dos18 IDs arquivados ainda exige reconciliação individual de calendário.

## Qualidade e rastreabilidade

5.671×24=136.104 valores na cópia completa; zero N/D estatísticos estruturais. Foram conferidas45.368 igualdades de aditividade e34.026 relações alvo≤finalizações. Valores FT de Vélez × Belgrano são calculados de1T+2T para excluir120 minutos; não são leitura independente da aba FT. O novo CSV mantém o contrato de55 colunas. Metadados ausentes continuam vazios/N/D, sem inventar horário ou fase.

Os10 conflitos de La Liga foram reaproveitados a partir da reconciliação de15/11, sem refazer a auditoria:52 campos comprovados, versões antigas preservadas. La Liga2025/26 passa de371 para380 registros estruturais; isso não é nova certificação externa do calendário.

Nomes originais preservados; aliases em coluna auxiliar. MLS All-Stars d0OLOOJ5 marcado separadamente. Playoffs novos de MLS/Argentina segregados no manifesto; fases não comprovadas nos demais registros são N/D. Não unir partidas de fase regular e playoffs por equipes apenas.

592 alertas de data herdados da base permanecem bloqueios condicionais de uso; nenhuma data original foi corrigida silenciosamente. Mais registros estruturais aumentam a disponibilidade potencial de histórico, mas não dispensam filtros nativos de data, temporada, identidade, recência e amostra. Nenhuma previsão antiga foi recalculada.

## Pendências e retomada exata

Fila inicial68:23 reaproveitados/reconciliados; quatro agendas brasileiras posteriores ao corte; um adiamento português;40 candidatos ainda sem homologação. Os22 candidatos externos são adicionais para investigação, semID comprovado; não somar62 como total definitivo de faltantes.

P0 próximo:6NbvG9uK São Paulo×Corinthians; ETBhh6mD Botafogo×Atlético-MG; vVoR6526 Cruzeiro×Bahia;6JIGDDFj Grêmio×Bahia;6ezUMHh4 Corinthians×Botafogo;v9YyLeNG Mirassol×Atlético-MG;zySpJZiT Cruzeiro×Palmeiras; Chapecoense×Vasco14/11, ID pendente.

Correção CP01: o texto mencionava22 recuperados e42 restantes; o cruzamento por ID comprova23 recuperados (incluindo Molde×Bodø/Glimt) e41 restantes antes de excluir Estoril. O CP02 corrige a narrativa para40 pendentes, preservando CP01 e seus CSVs originais. P1: calendários integrais de todas as11 temporadas; sete candidatos Eliteserien, dois portugueses,18 sauditas, um argentino, e partidas não catalogadas. P2: Nantes×Toulouse z9FNO7c2 (14/24); Toronto×Columbus23cRvyme (20/24); conferir temporadas antigas por calendário sem recoletar as já completas. Amistosos e Copa do Brasil ficam separados.

Ranking real de defasagem e percentuais reais de cobertura são N/D por falta do denominador externo completo. O CSV do painel mostra candidatos catalogados, sem disfarçá-los como faltas confirmadas.

## Publicação e proteções

Drive: https://drive.google.com/drive/folders/1qJX81oYkfxuThM_gluvuUEEK6_Sq3LRd
CP01: https://github.com/azevedosouza22/futstats/commit/6cdac37ad9fd378d8be42435a809eb28b8fbcc6e

Base5620,659 pessoais,backups,modelos LV4/Elite,Radar V2/V3/V4,snapshots,Shadow V1,Android,main e produção preservados. Sem merge ou deploy. Esta cópia é pesquisa experimental, sem liberação automática ao app.
