# FutStats IA — Preparação de expansão histórica (Etapa 86)

**Ambiente:** branch experimental descendente do PR #80; não tocar em `main`, Android,
659 partidas, Radar, snapshots ou backups.

## Diagnóstico real
- Catálogo consolidado: 951 JSON + 68 compactadas, **1.019** partidas e
  **48 divergências de data**, excluídas das médias.
- Tamanho de origem no GitHub: **843.890 + 12.549 = 856.439 bytes**.
- Até aqui, o código exigia contagens fixas e o filtro de temporadas
  mostrava somente as duas mais recentes.
- O site só consulta essas pesquisas em modo leitura; nenhuma alteração em
  dados privados do navegador. Não somar 659 e 1.019 por sobreposição.

## Novo contrato por temporada
- Arquivo de índice `public/research/packs/manifest-v1.json`.
- Cada entrada futura tem nome seguro `file`, `competition` com temporada e
  `count` verificado (limite de 1.200 registros por arquivo).
- Cada arquivo `public/research/packs/<nome>.json` será
  `{format:"futstats-research-season-v1",version:1,competition,data:{teams,matches}}`.
- O leitor valida identidade, duplicações por ID, origem e confronto,
  referência das equipes e integridade do esquema, antes de expor dados.
  Em falha, o conjunto expandido é recusado; não há escrita no dispositivo.
- O **índice começa vazio**: esta etapa prepara recepção, **não declara
  partidas novas baixadas e importadas**.
- Arquivos são solicitados sequencialmente, não de forma paralela.
- A opção `Atual + anterior` mantém as **duas temporadas mais recentes**;
  arquivos antigos ficam selecionáveis individualmente, sem misturar safras.

## Antes de cada lote de coleta
1. Conferir termos de uso e procedência dos dados (evitar scraping automatizado
   onde vedado). Não usar CSV de terceiros como equivalente a evidência
   Flashscore sem conferência e transformação do esquema de origem.
2. Priorizar temporadas anteriores de ligas já presentes; testar uma
   nova liga com um lote pequeno isolado.
3. Não converter campos ausentes em zero: se uma fonte trouxer só estatísticas
   do jogo inteiro, as frequências por tempo devem permanecer **N/D**.
4. Conferir duplicatas, equipe/temporada, placar, finalizações,
   chutes no gol, escanteios, primeiro/segundo tempo, datas divergentes.
5. Rodar os testes, conferir a prévia Android e só depois adicionar
   uma entrada validada ao índice em novo PR experimental.

## Escalabilidade futura
- 10 mil partidas é meta de teste inicial, não capacidade comprovada.
- 50 mil+ exigirá medição de memória/carregamento e possivelmente
  busca por liga sob demanda, cache IndexedDB ou backend paginado.
- Manter bases em arquivo remoto, não duplicar em `localStorage`
  (cota pequena por origem).
