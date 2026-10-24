# FutStats V4 — Pesquisa integral La Liga espanhola 2026/27 — ChatGPT Work

## Estado de partida (22/10/2026)
- Usuário confirmou no Android: **Serie A italiana 2026/27 — 70 partidas com estatísticas completas via Work**, via versão experimental do PR #13.
- **659 jogos históricos** e previsões Radar V2/V3 seguem protegidos, fora da coleta experimental.
- **155 placares da pesquisa europeia CC0**, incluindo **64 jogos da La Liga espanhola 2026/27** com FT/HT no OpenFootball; 50 Serie A italiana, 41 Ligue 1 francesa. A fonte La Liga ainda só possui resultados publicados até setembro de 2026 e pode estar desatualizada.
- O piloto Premier League e outros conjuntos já coletados não devem ser alterados.

## Objetivo único e prioritário
Concluir **todos os jogos já encerrados da La Liga espanhola 2026/27 até a data efetiva da pesquisa**. Não solicitar comandos por rodada nem entregar apenas micro-lotes. **Uma liga por execução Work.**

Para cada partida, coletar e conferir **mandante e visitante**, **jogo completo + primeiro tempo + segundo tempo**:
- gols;
- finalizações;
- chutes no gol/no alvo;
- escanteios.

Utilizar o **procedimento de consulta pontual Flashscore por três períodos que já deu certo nos 70 jogos da Serie A e nos testes anteriores**, respeitando os termos de acesso e os direitos de uso. Não fazer coleta massiva via scraping não autorizado, não contornar proteções. Consultar fonte alternativa confiável se a informação estiver ausente, com proveniência clara e sem inventar valores.

### Robustez da operação
- Identificar as rodadas e jogos encerrados diretamente a partir da fonte consultada; não confundir com futuras partidas.
- Confrontar data, equipes, resultado FT/HT e IDs com o catálogo aberto quando possível: https://github.com/openfootball/football.json/blob/master/2026-27/es.1.json (380 jogos agendados, mas fonte de resultados pode estar defasada).
- Reutilizar o método e a estrutura de **55 colunas** do CSV validado da Serie A italiana 2026/27.
- **Salvar checkpoints persistentes internamente** por IDs/rodadas enquanto consulta; se travar, retomar sem reprocessar jogos já completos. Checkpoint interno **não** significa pedir para o usuário abrir nova tarefa por rodada.
- Garantir somas 1º+2º=FT em 8 conjuntos por partida, mandante+visitante=total em 12 conjuntos, alvos<=finalizações, ausência=N/D, IDs e links de origem autênticos, zero duplicatas.
- Data/horário exibidos sem presumir fuso não informado, anotando divergências de fontes.
- A temporada **está em curso**, de modo que "completa" significa todos os jogos já encerrados até a data da consulta, não 380 jogos futuros.

## Entrega (somente quando consolidado)
1. **Um CSV UTF-8 com BOM, 55 colunas exatamente no padrão FutStats**, com todos os jogos encerrados pesquisados, do mais antigo ao mais recente, IDs/links válidos, 4 indicadores nos 3 períodos, mandante e visitante.
2. **Um relatório MD resumido**: intervalo de datas, rodadas, número de jogos encontrados/concluídos e parciais, amostras por período, validações e quaisquer N/D, discrepâncias, limites de fonte.
3. Caso apareçam jogos com estatísticas não disponíveis, discriminar individualmente no relatório; não afirmar falsamente que a temporada tem cobertura estatística completa.
4. Não inserir dados no app, não alterar GitHub, Vercel, Radar ou produção, **não publicar dados Flashscore em repositório público**. Os arquivos serão conferidos no chat FutStats e só depois associados privadamente à pesquisa europeia no Android.
5. Não repetir pesquisa da Serie A italiana; ela já está concluída até a rodada 7, com 70 partidas.

**Após a entrega ao usuário, a próxima ação será enviar aqui o CSV e o relatório para revisão, sem novo lote manual.**
