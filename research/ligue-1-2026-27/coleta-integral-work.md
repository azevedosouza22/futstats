# FutStats V4 — Ligue 1 francesa 2026/27 — coleta integral pelo Work

**Data do planejamento:** 23/10/2026. **Escopo:** somente Ligue 1 francesa 2026/27, uma temporada por execução, sem pedidos sucessivos para pequenos lotes.

## Ponto de partida confirmado no celular
O usuário enviou imagem do FutStats V4 com os indicadores:
- **159 jogos completos via Work** já armazenados em pesquisa separada: **70 da Serie A italiana + 89 da La Liga espanhola**.
- **155 jogos com placar e intervalo na fonte gratuita**, **155 salvos na pesquisa local**, **3/3 campeonatos acessíveis**.
- O histórico pessoal (659 jogos) e Radar V2/V3 permanecem em áreas separadas e **não devem ser modificados**.

A fonte aberta de calendário da Ligue 1 https://github.com/openfootball/football.json/blob/master/2026-27/fr.1.json registra **306 jogos no calendário**, com **41 resultados FT+HT publicados** e última data com resultado 20/09/2026 no momento da consulta, provavelmente atrasada. São **18 equipes**. Ela serve somente como referência de identidade/placar quando disponível; NÃO define quantos jogos já terminaram em outubro nem fornece finalizações/escanteios por tempo.

## Tarefa única para o ChatGPT Work

Execute **toda a pesquisa dos jogos da Ligue 1 francesa 2026/27 já encerrados até a data efetiva de execução**. Use o **procedimento que já funcionou** na Serie A italiana (70 jogos) e na La Liga espanhola (89 jogos). Por jogo, equipe mandante/visitante, pesquisar, identificar e conferir nos **três períodos** (jogo completo, 1º tempo, 2º tempo) os **quatro indicadores**:
1. gols;
2. finalizações totais;
3. chutes no gol / finalizações no alvo;
4. escanteios.

**Não** gerar arquivo com apenas placares, chutes FT, escanteios FT ou indicadores N/D e chamá-lo de temporada estatisticamente completa. Usar as fontes confiáveis efetivamente acessíveis, inclusive páginas individuais do Flashscore quando a consulta for autorizada; evitar scraping em massa não autorizado, violar restrições de acesso ou assumir direitos de redistribuição comercial.

**Sem micro-lotes solicitados ao usuário.** O Work deve usar checkpoints internos persistentes (identificador e URL da partida, dia, rodada, métricas conferidas, estado concluído/parcial); caso haja limite temporário, salvar avanço recuperável e retomar sem refazer partidas. Apenas na **entrega final** produzir:
- **Um CSV único UTF-8 com BOM no padrão original de 55 colunas FutStats**, incluindo ID e URL verdadeira, competição uniforme `Ligue 1 francesa 2026/27`, mandante/visitante e quatro indicadores nos três períodos.
- **Um relatório MD de validação curto**, informando total de partidas encontradas/encerradas/validadas, rodadas, datas, eventuais jogos adiados/abandonados, duplicatas, conflitos de fonte e lacunas específicas.
- Validar **1º tempo + 2º tempo = partida** para cada equipe/estatística, totais **mandante + visitante**, alvos ≤ finalizações por período/equipe e placares FT/HT quando comparáveis à fonte aberta. Diferenças reais de data, status ou placar devem ser registradas e revistas; não inventar zeros para N/D.

### Proteções

**Não** reprocessar nem importar as 159 partidas já completas de outros campeonatos. **Não** atualizar GitHub com CSVs do Flashscore, não publicar os dados, não alterar o app, Vercel, branch `main`, o histórico `futstats:v1` de 659 jogos, a pesquisa aberta `futstats:europe-research-cc0:v1` de 155 registros, a pesquisa Work `futstats:europe-work-stats:v1` de 159 registros ou o Radar.

Os arquivos serão enviados pelo usuário ao chat FutStats para **auditoria independente, confirmação de compatibilidade e uma única importação privada no Android**. Não anunciar coleta concluída até existirem CSV final e relatório conferidos.

**Critério de conclusão:** todos os jogos com status realmente encerrado até a data pesquisada, tantos quanto a fonte autorizar consultar, em **um único CSV consolidado** e sem perder checkpoints. A temporada 2026/27 ainda está em curso em outubro de 2026: não pesquisar resultados futuros.
