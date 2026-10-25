# FutStats IA — Etapa 49 · Bundesliga 2026/27, rodada 8 e filtro de agenda oficial

**Data real de consulta pontual:** 25/10/2026, horário de Brasília. **PR experimental, sem merge/deploy.** Nada importado na base principal ou Work.

## Fonte oficial realmente aberta em 25/10/2026
- [Bundesliga oficial — 8ª rodada 2026/27](https://www.bundesliga.com/en/bundesliga/matchday/2026-2027/8): link de programação da rodada completa, com os nove jogos e horários exibidos no site da Bundesliga.
- [Bundesliga Media — grade de transmissão com CET e UTC](https://products.bundesliga.com/fixtures): tabela da 8ª rodada com **mandantes, visitantes, datas e dupla indicação CET/UTC**, usada para checagem dos horários exatos.
- [DFB Data Center — rodada 8](https://datencenter.dfb.de/en/competitions/bundesliga/seasons/2026-2027/matchday/8) também surgiu nos resultados públicos, mas sua abertura direta falhou neste ambiente. **Os horários de implementação foram conferidos nas duas páginas oficiais Bundesliga listadas acima, não em conteúdo cuja leitura falhou.**
- O link que o usuário abre é o **calendário agregado da rodada**, não uma página individual de cada confronto. Domínio exact-match `www.bundesliga.com`, somente HTTPS e sem credenciais, incluído no allowlist seguro.

## Nove confrontos com datas de 30/10 a 01/11/2026

| Mandante | Visitante | Dia na Alemanha | Hora CET | UTC confirmado | Brasília (UTC−03) |
|---|---|---|---|---|---|
| SV Elversberg | 1. FSV Mainz 05 | 30/10 | 20:30 | 19:30 | 16:30 |
| Bayer 04 Leverkusen | VfB Stuttgart | 31/10 | 15:30 | 14:30 | 11:30 |
| FC Augsburg | Sport-Club Freiburg | 31/10 | 15:30 | 14:30 | 11:30 |
| Borussia Mönchengladbach | SC Paderborn 07 | 31/10 | 15:30 | 14:30 | 11:30 |
| SV Werder Bremen | TSG Hoffenheim | 31/10 | 15:30 | 14:30 | 11:30 |
| FC Schalke 04 | RB Leipzig | 31/10 | 15:30 | 14:30 | 11:30 |
| FC Bayern München | Borussia Dortmund | 31/10 | 18:30 | 17:30 | 14:30 |
| 1. FC Union Berlin | 1. FC Köln | 01/11 | 15:30 | 14:30 | 11:30 |
| Eintracht Frankfurt | Hamburger SV | 01/11 | 17:30 | 16:30 | 13:30 |

**Atenção:** a Alemanha já passou do horário de verão para CET na data desses jogos. Cada entrada da agenda guarda `timezone=Europe/Berlin`, data e hora local, e `utcKickoff` exato, validados pela rotina já existente com `Intl.DateTimeFormat`. `verifiedAt=2026-10-25` é um **registro verdadeiro da consulta pontual feita nesta etapa**, não uma data de verificação que se autorrenova.

## Integração ao FutStats experimental
1. `src/officialCalendar.ts`: adicionados nove `OfficialCalendarRecord` para `Bundesliga 2026/27`. A rotina existente rejeita UTC/local incompatível, hora/data inválidas, partidas já iniciadas e links fora do domínio exato.
2. `src/officialSourceTrust.ts`: liberado somente `www.bundesliga.com` via HTTPS. Sem novos provedores de estatísticas, API paga ou scraping.
3. `src/radarTeamAliases.ts`: aliases limitados à **Bundesliga 2026/27** para nomes da DFL e nomes simplificados conhecidos (por exemplo FC Bayern München ↔ Bayern Munich; Bayer 04 Leverkusen ↔ Bayer Leverkusen). Nenhum ID, nome original, competição ou partida histórica é reescrito; não aplicar fuzzy nem equivalências de outras temporadas.
4. `src/CalendarAgenda.tsx`: seletor **Filtrar campeonato na agenda oficial**. Resolve uma limitação prática da listagem, que só exibia os primeiros 20 confrontos quando diversas ligas estavam cadastradas; o usuário pode selecionar **Bundesliga 2026/27 (9)** e encontrar os nove jogos sem importar CSV ou acessar outra aba.
5. `src/dailyGoodNextWeek.ts` e “As Boas” da Etapa 48 recebem automaticamente as referências no período futuro, mas **não produzem indicações sem histórico suficiente no campeonato atual e sem a conferência recente da data/horário no dia do jogo**.

## Prazo de confiabilidade e riscos
- A data `verifiedAt=2026-10-25` vale exclusivamente até 27/10/2026 pela política de 2 dias já consolidada. **A partir de 28/10, mesmo que o início dos jogos ainda seja futuro, o app deve ocultar todos esses horários (`N/D`), exibir reconferência pendente e não permitir usar uma previsão como “Boa do Dia” a partir dessas referências envelhecidas.**
- Nenhum refresh oculto, nenhuma coleta contínua, nenhuma afirmação de agenda ao vivo. Abrir o link da rodada não estende o prazo e não altera `verifiedAt`.
- Os jogos aparecem como programação oficial datada, **não como estatísticas históricas, resultados, recomendações de aposta ou verificações de resultado final**.
- Ainda não foi testado em aparelho Android físico. Nenhuma previsão real ou taxa de acerto obtida pelo procedimento; a disponibilidade de histórico `Bundesliga 2026/27` depende da base real carregada em cada aparelho.

## Testes de aceite
- Vitest: nove jogos exatos, horários CET/UTC/Brasília, liga correta e identidade única, fonte HTTPS exata, rechecagem vencida com N/D, exclusão após início, aliases restritos à competição.
- Playwright desktop e viewport Android: na janela **7 dias**, selecionar Bundesliga e ver os nove cartões; confirmar um horário do clássico e do jogo de sexta-feira; avançar a data de teste para 29/10 e verificar que **todos os nove cartões passam a horário N/D**, sem escrever previsão ou alterar Radar.
- 659 jogos históricos, Radar V2/V3, pesquisas Work, arquivos CSV e backups inteiramente intocados. Sem merge ou deploy; mudança exclusivamente em draft PR empilhado.
