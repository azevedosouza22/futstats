# FutStats IA — Etapa 64 · Conferência de ID da mesma fonte no Histórico e Work

**26/10/2026. Apenas PR experimental filho do #63, sem merge/deploy.**

## Motivação e resultado
O Histórico original e os registros Work continuam em armazenamento **separado**. Uma mesma partida, identificada pelo **mesmo sourceId Flashscore**, pode estar cadastrada nas duas bases. Isso **não constitui duas fontes independentes**, mesmo quando seus números coincidem.

Dentro de Agenda → Diagnóstico de cobertura → **“Conferir partidas compartilhadas entre Histórico e Work”**, o usuário pode ver os jogos que têm **ID da fonte igual** entre bases, sem abrir arquivos, unir planilhas ou mexer em registros. Um painel recolhido mostra total de IDs compartilhados, coincidências **apenas locais**, diferenças numéricas e fontes/identidades que precisam ser revistas.

## Política de comparação
- Comparar somente entrada main com `research.provider='work-csv'`, `source='Flashscore'` e ID exato que também aparece no Work. Ignorar jogos de hoje/futuros.
- Se o mesmo ID ocorre em vários Work, mostrar revisão, sem escolher um arbitrariamente.
- Antes de confrontar números, exigir a mesma liga/temporada, data, mandante e visitante, com aliases explícitos do FutStats, e ausência de divergências de data conhecidas.
- Permitir apenas URL Flashscore HTTPS estruturalmente confiável, host exato e `mid=sourceId`; uma URL válida **não demonstra conteúdo acessado**. Impostores não geram link clicável.
- Comparar os **24 valores** (4 indicadores × 3 períodos × 2 lados). `null`/N/D permanece indisponível, nunca zero. Se dados faltam, marcar `incomplete_values`; se números divergem, `different_values`; se todos batem, `same_values` **somente no navegador**.
- Todo item recebe `verificacao_externa=PENDENTE`. A contagem de resultados independentes e acertos permanece zero, sem adicionar partidas ao Histórico, atualizar coortes V2/V3 ou presumir que os dados são genuínos.
- CSV sob demanda `futstats-main-work-conferencia-origens.csv`: uma linha por ID compartilhado, contagem de divergências, N/D, identidade, origem permitida ou N/D e PENDENTE; formato UTF-8 BOM, aspas e proteção contra fórmulas.
- Painel e cálculos só são ativados ao abrir os diagnósticos da agenda; nenhum scraping, atualização periódica, importação ou escrita.

## Testes
Vitest: correspondência exata sem alegar confirmação, mudança de um dos 24 campos, N/D, IDs repetidos, fonte HTTPS impostora, jogo de liga/temporada/data/equipes diferentes, cronologia, preservação byte a byte e CSV sem fórmulas perigosas.

Playwright desktop e viewport Android, somente dados sintéticos: introduzir a mesma partida no Histórico e no Work, abrir diagnóstico, conferir fonte compartilhada e exportar CSV `PENDENTE`; alterar **apenas Work** para gerar uma divergência, recarregar e verificar que o Histórico original segue intocado. Não foi usada nem alterada a base pessoal do usuário.

## Escopo e próximos pontos
Incremento de **cobertura e rastreabilidade local** (área 09), não ganho de precisão da IA. Amostras prospectivas verificadas realmente com segunda fonte continuam 0/30 por campeonato. Android físico, backup externo independente e integração/merge/deploy permanecem pendentes e exigem evidência/autorização. Preservar produção, 659 históricos, Radar V2/V3, Work e backups.
