# F360 — CP03: desbloqueio parcial por fontes alternativas

**Execução parcial e verificável. Corte: 22/11/2026 23h59 BRT.**

A cópia de pesquisa passou de **5.671 para 5.675 IDs únicos**. Quatro registros receberam 24/24 valores por fontes alternativas, com cálculos explicitamente rotulados. **Zero partidas com 24 valores todos observados diretamente e zero novas leituras visuais no Flashscore.** Os 51 registros do CP02 não foram repetidos.

| ID Flashscore | Confronto | Data BRT | Cobertura |
|---|---|---|---|
| 6JIGDDFj | Grêmio × Bahia | 2026-11-18 | 24/24 documental derivada |
| 6ezUMHh4 | Corinthians × Botafogo | 2026-11-18 | 24/24 documental derivada |
| zySpJZiT | Cruzeiro × Palmeiras | 2026-11-18 | 24/24 documental derivada |
| ADcmpkS8 | Estrela da Amadora × Benfica | 2026-11-08 | 24/24 documental derivada |

## Método e limites das inclusões

Sports Data Vault expôs tabelas de FT, 1T e 2T com chutes no alvo, para fora, bloqueados e escanteios. Nos quatro jogos incluídos, todos esses componentes passam FT=1T+2T. A soma alvo+fora+bloqueadas coincide com as finalizações FT observadas no FotMob. Finalizações dos tempos foram **calculadas** dessa soma de componentes mutuamente exclusivos; não foram apresentadas como leitura direta de uma aba Flashscore. Gols dos tempos foram agregados dos eventos/placares, com gols contra preservados e 2T conferido com FT−1T.

Aditividade é teste de consistência, não garantia de independência entre fornecedores nem certificação estatística da temporada. Os registros entram somente na nova cópia experimental, com gate documental e fonte por campo. Não importados no app nem liberados automaticamente aos filtros LV4. Não houve alteração de fórmulas, motores ou previsões.

Grêmio×Bahia: finalizações FT 25–14, 1T14–5, 2T11–9. Corinthians×Botafogo: FT 16–5, 1T11–0, 2T5–5; quatro gols com três chutes no alvo são compatíveis com um gol contra documentado. Cruzeiro×Palmeiras: FT 16–8, 1T6–3, 2T10–5. Estrela×Benfica: FT 7–15, 1T2–6, 2T5–9.

## P0 — coleta efetiva e bloqueios

Oito confrontos brasileiros foram inspecionados nas alternativas: 161 dos 192 valores disponíveis,31 N/D. Três incluídos como documentais derivados; cinco permanecem separados.

- São Paulo×Corinthians 6NbvG9uK: finalizações FT variam entre fornecedores/versões; não há distribuição completa dos bloqueios nos tempos. N/D preservado.
- Botafogo×Atlético-MG ETBhh6mD: versões FT 12–12 e 13–13; bloqueios dos tempos zerados na fonte não somam os totais. Não completar finalizações por suposição.
- Cruzeiro×Bahia vVoR6526 e Mirassol×Atlético-MG v9YyLeNG: componentes dos tempos incompletos; zeros de bloqueios não foram usados para produzir finalizações falsas.
- Chapecoense×Vasco: ID **ARJ356Ua** confirmado no Flashscore e no relatório arquivado R34. Na alternativa, SOT visitante FT 6 difere de 1T 3 + 2T 1; escanteios visitante FT 4 diferem de3+0. Campos conflitantes N/D; não integrar.

## Continuidade pelas demais ligas

Portugal: calendário alternativo individualizou 98 confrontos, 97 presentes na nova cópia de pesquisa. Isso é cobertura 97/98 do recorte identificado, **não cobertura oficial integral da liga**. Rio Ave×Braga 8fKrMxtJ permanece bloqueado: SOT do Braga 3 no Vault versus 2 no SkySports; fora 7 versus 8. Estoril×Marítimo continua adiado para 2027 conforme CP02.

MLS: Orlando City×Cincinnati,19/11 BRT (20/11 UTC), foi localizado fora das filas 40/22. 24 valores documentais derivados recuperados, mas sem ID Flashscore comprovado. AHmOxWfB é um ID publicado em URL Soccerway e permanece em namespace separado; não se presumiu equivalência e o jogo não foi inserido.

Seis confrontos ingleses de 21/11 também foram identificados fora das filas anteriores: Manchester City×Fulham, Bournemouth×Nottingham, Aston Villa×Sunderland, Chelsea×Leeds, Coventry×Crystal Palace e Tottenham×Ipswich. São candidatos individualizados, não IDs principais inventados.

Houve consulta alternativa às 11 temporadas. Calendários ou detalhes de Bundesliga, Serie A italiana, Ligue 1 e MLS falharam na abertura; três detalhes noruegueses também não foram acessíveis. Calendários inglês/espanhol estavam limitados às primeiras linhas/resultados e com rótulos de temporada inconsistentes; Argentina e Saudi não forneceram recorte integral atual. Não foram repetidas tentativas indefinidamente e nenhum jogo iniciado após o corte foi incorporado.

## Estado consolidado

Restam 36 candidatos na fila catalogada, cinco confrontos brasileiros parciais (quatro catalogados mais Chapecoense×Vasco),21 candidatos externos do CP02 ainda sem ID principal e sete novos candidatos fora dessas filas. Essas quantidades não são o universo faltante. Calendários oficiais integrais e cobertura geral das 11 ligas continuam N/D; **nenhuma liga foi marcada ATUALIZADA**.

## Validação e retomada

Base 5.675: 45.400 aditividades, 34.050 relações alvo≤finalizações e 68.100 totais combinados conferidos. Zero IDs duplicados; primeiras 5.671 linhas preservadas por comparação independente. Hashes e arquivos originais preservados.

Próximo checkpoint: 6NbvG9uK (finalizações por tempo e conflito FT); 8fKrMxtJ (SOT visitante); validar identidade Flashscore do Orlando×Cincinnati antes de integrar. Retomar calendários integrais pelas fontes que exponham a lista completa; não repetir os quatro IDs deste incremento.

Drive: https://drive.google.com/drive/folders/1BgUOYV28pljvBQfbkbmMLJ2nEzDg4tr2
GitHub P0: commit 94622f6e3264133f71390757eef5537212f33102. Branch research/f360-hub-chats-2026-11-21, PR #104 DRAFT; sem merge.

Preservados: 659 pessoais, catálogo 6.123, índice 5.620, cópia 5.671, originais, backups, Radar V2/V3/V4, LV4/Elite, forecasts, Shadow V1, Android, main e produção. ROI não calculado.
