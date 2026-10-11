# FutStats

Versão 2.0 de um aplicativo de estatísticas de futebol em React 19, TypeScript e Vite. Interface responsiva em português brasileiro, armazenamento local e instalação como PWA no Android.

## Iniciar

Requer Node.js 20.19+ ou 22.12+ e npm.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente http://localhost:5173). Para testar em um celular na mesma rede, abra o endereço de rede exibido. O modo de desenvolvimento não habilita a PWA.

## Testes e produção

```bash
npm test
npm run build
npm run preview
```

O build executa a verificação de tipos e gera `dist/`, com manifest e service worker. Hospede essa pasta em um servidor HTTPS. Não abra `index.html` diretamente pelo sistema de arquivos. O preview normalmente usa http://localhost:4173.

Os testes Vitest cobrem soma por período, médias para mandante e visitante, amostras vazias, validação de partidas e integridade dos backups.

## Instalar no Android

1. Hospede o build em HTTPS e abra o endereço no Chrome para Android.
2. No menu do navegador, selecione **Instalar aplicativo** ou **Adicionar à tela inicial**.
3. Após a primeira visita e conclusão do cache, a interface funciona offline. A instalação depende do navegador; localhost é permitido para testes no próprio computador, mas um IP HTTP na rede não habilita o service worker no celular.

## Usar

- Em **Equipes**, cadastre pelo menos duas equipes. Escolha nome e cor.
- Use **Nova partida** para selecionar mandante, visitante, data e competição opcional.
- Informe gols, finalizações, finalizações no alvo, escanteios, cartões amarelos e vermelhos separadamente para o primeiro e segundo tempos. Inclua acréscimos no tempo correspondente. Prorrogação e disputa de pênaltis não são contempladas nesta versão.
- Os totais da partida são a soma dos dois tempos. Registre os gols também nas finalizações no alvo; gols contra precisam ser tratados conforme essa convenção simplificada.
- **Visão geral** apresenta médias por partida das duas equipes somadas e ranking de gols por equipe. As médias por equipe consideram apenas jogos dessa equipe, tanto como mandante quanto como visitante. O seletor de período altera a visão geral, comparação e placares do histórico.
- **Comparação** apresenta as médias das equipes e o tamanho de cada amostra. As barras mostram a proporção entre as duas médias, não probabilidades de resultados.
- No **Histórico**, busque partidas e clique para consultar, editar ou excluir.
- Uma equipe vinculada a partidas não pode ser excluída até que essas partidas sejam removidas.
- A base começa vazia. Na visão geral, é possível carregar uma base opcional de demonstração com dados fictícios.

## Armazenamento e backup

Os dados ficam em `localStorage`, chave `futstats:v1`, neste navegador e nesta origem. Não há servidor, conta, sincronização entre dispositivos ou coleta de estatísticas externas. Limpar os dados do navegador pode apagar a base. Em navegação privada os dados podem desaparecer ao fechar a sessão.

Use **Exportar backup** para baixar um JSON e **Importar backup** para restaurá-lo. A importação valida os registros e pede confirmação antes de substituir a base. Arquivos até 5 MB são aceitos. Falhas de armazenamento são exibidas e não confirmam o salvamento.

## Estrutura

- `src/App.tsx`: navegação, formulários, dashboard, comparação e histórico.
- `src/model.ts`: modelos, cálculo de estatísticas, validação e chave de armazenamento.
- `src/model.test.ts`: testes de regras de negócio.
- `src/style.css`: interface e layouts responsivos.
- `vite.config.ts`: Vite, React e geração da PWA com cache offline.
- `public/`: ícones locais, incluindo PNG de 192 e 512 pixels.

As análises são descritivas, baseadas exclusivamente nos dados cadastrados, sem garantia de resultados. Não há apostas automáticas.

## Validação desta entrega

Dependências instaladas; `npm test` passou com 4 testes; `npm run build` passou, incluindo TypeScript e geração da PWA. O servidor de produção respondeu ao HTML e manifest via HTTP. Não houve verificação visual em navegador, instalação em Android real ou teste offline em dispositivo. A publicação não foi realizada porque os helpers de Sites não estavam disponíveis no ambiente.

## FutStats 2.0 — TheSportsDB V1 experimental

A aba **Importar** busca equipes e partidas de futebol. As consultas só ocorrem ao clicar em Buscar; resultados não são uma agenda completa. A [documentação oficial](https://www.thesportsdb.com/documentation) informa chave pública `123`, limite gratuito de 30 pedidos/minuto, busca de equipes restrita ao Arsenal e resultados reduzidos para eventos. Exemplos: equipe `Arsenal`, partida `Arsenal_vs_Chelsea`. Não se promete cobertura de equipes brasileiras ou métricas avançadas neste plano.

A aplicação usa um proxy de servidor em `/api/thesportsdb`; a chave opcional `THESPORTSDB_API_KEY` nunca deve usar prefixo `VITE_`, aparecer no código cliente, em backups ou no Git. No desenvolvimento, copie `.env.example` para `.env` e configure a chave se necessário; a chave pública gratuita é o padrão. Vercel utiliza `api/thesportsdb.js`; Netlify utiliza `netlify/functions/thesportsdb.mjs` e o redirect já configurado. Cadastre a variável somente no ambiente de servidor da hospedagem. Não é necessário adquirir chave paga para testar a integração limitada.

O build estático e a PWA continuam funcionando para cadastros locais, mas busca online requer a função de servidor. `npm run dev` inclui o proxy; `npm run preview` e hospedagens que recebem somente `dist/` não incluem essa função. Não há publicação automática nesta alteração.

### Dados, períodos e integridade

- Importações registram IDs externos, origem, data de importação e status do evento; equipes guardam o ID externo. Equipes de mesmo nome exato já cadastradas são vinculadas, preservando seu ID, nome e cor. Isso não resolve nomes alternativos automaticamente.
- Gols só são aceitos para status explícitos `FT` ou `Match Finished` sem campos de placar extra. Outros status, dados ao vivo, prorrogação e pênaltis ficam sem gols elegíveis para as médias. O placar final nunca é repartido entre os tempos.
- Primeiro tempo, segundo tempo, finalizações, escanteios e cartões não disponíveis nesta busca são armazenados como `null` e exibidos como **N/D (Não disponível)**. Zero só representa um valor explicitamente recebido ou registrado manualmente. Datas, equipes e estatísticas inválidas não são importadas.
- Médias excluem valores ausentes por métrica e período. A comparação mostra as duas amostras; ranking e cartões de equipes mostram cobertura. O dashboard usa apenas jogos com dados de ambas as equipes para cada média por partida. Não há média quando a amostra é vazia.
- Importar o mesmo ID de evento novamente é bloqueado. Também se bloqueia um jogo com o mesmo mandante, visitante e data, inclusive manual, para revisão do usuário. Essa regra conservadora pode bloquear jogos legítimos repetidos no mesmo dia.
- Jogos importados são somente leitura para preservar origem e períodos. A exclusão permanece disponível. O cadastro e a edição manuais continuam funcionando; não há conversão automática de importação em registro manual.
- Backups antigos permanecem válidos na mesma chave `futstats:v1`. Backups novos incluem os dados importados e valores nulos; não devem ser restaurados na versão 1.0 antiga. A importação não substitui registros existentes nem altera o armazenamento antes de validar todos os dados.

### Limites e falhas

O proxy aceita apenas rotas upstream fixas, valida consultas de 3 a 80 caracteres, filtra futebol e retorna no máximo 30 resultados. Usa cache em memória de cinco minutos para buscas e 30 segundos para consultas pontuais (até 100 consultas), deduplica pedidos simultâneos iguais, limita a 15 consultas upstream por minuto por instância, aplica timeout de oito segundos e pausa pedidos por um minuto após HTTP 429. Não há retries automáticos. O cliente também espaça cliques de busca em quatro segundos e impede buscas concorrentes.

Cache e limitador são por instância: não garantem um limite compartilhado entre múltiplas funções serverless ou outros usuários da chave pública. Antes de ampliar o experimento, configure cache/limitador distribuído e monitore quotas do provedor. Não faça polling, importação em massa ou aumente concorrência para contornar limites. Erros HTTP, resposta inválida, timeout e falta de internet são apresentados sem expor a chave.

### Testes

Os testes originais foram mantidos. Novos testes cobrem parsing de placar, ausências por período, status de jogo, duplicatas, integridade de backups, amostras das médias, cache, limite, HTTP 429, erros, respostas inválidas e deduplicação de consultas. Nenhum teste usa a API externa real. Execute `npm test` e `npm run build`.


## Pré-jogo e Ao vivo

### Pré-jogo

Selecione uma ou duas equipes, a data do confronto e o período (primeiro tempo ou jogo completo). As janelas de **5 e 10 jogos** aparecem simultaneamente, com a amostra disponível para cada métrica. Os jogos são ordenados por data decrescente e incluem mandante e visitante. Ausências são excluídas da média sem buscar partidas mais antigas fora da janela para preencher estatísticas.

A análise é exclusivamente da base local; não busca automaticamente dez jogos na API. Importações precisam ter status FT ou Match Finished; registros manuais são tratados como concluídos. Excluem-se o dia do confronto e datas posteriores, e também hoje e datas futuras, porque os registros locais só têm precisão de dia e não permitem determinar a ordem dos jogos do mesmo dia. A base pode estar incompleta. N/D não é zero. Cada cartão oferece a lista de jogos utilizados e suas fontes. Demonstrações já cadastradas são explicitamente identificadas como fictícias; não são apresentadas como dados de provedor.

### Ao vivo

A área oferece **consulta pontual sob demanda**, pelo ID de um evento real ou por uma partida já importada. O botão Atualizar agora consulta placar/status e estatísticas de evento separadamente. Não existe polling, relógio que estima minuto, fallback com dados inventados nem scraping do Flashscore.

A TheSportsDB V1 gratuita não é um feed ao vivo garantido. O adaptador declara essas limitações em suas capacidades: minuto indisponível, estatísticas parciais e nenhuma divisão por tempo. Jogos encerrados e agendados também podem ser consultados; seu status vem da fonte. O minuto permanece N/D. Estatísticas não retornadas aparecem como N/D, inclusive quando um evento existe mas não possui métricas. Agregados da fonte não são atribuídos ao primeiro/segundo tempo, nem tratados como exclusivamente 90 minutos, pois podem incluir prorrogação.

Um resultado contém a fonte, ID, horário de consulta do placar, horário da consulta das estatísticas e horário de atualização declarado pelo provedor (N/D nesta integração). Horário de consulta não significa horário em que o provedor atualizou seus dados. As consultas têm cache de 30 segundos. O cliente espaça atualizações em dez segundos e bloqueia concorrência; cada atualização pode consumir dois pedidos upstream, ambos sujeitos ao limitador compartilhado da instância de 15 pedidos/minuto. Não há retentativa automática.

Se as estatísticas falharem, o placar novo pode ser mostrado com aviso e métricas N/D, sem reutilizar estatísticas antigas. Se a consulta do evento falhar, a última resposta bem-sucedida da mesma partida permanece com aviso explícito de possível desatualização; trocar o ID remove o resultado anterior. Partida não encontrada é um erro identificado, não um placar 0–0.

Snapshots ao vivo ficam apenas na memória da tela e **não alteram o histórico, as médias ou os backups**. Cadastros manuais e importações persistidas conservam seu comportamento.

### Arquitetura para provedores autorizados

- `src/providers.ts`: contrato DataProvider, capacidades, registro explícito de adaptadores e normalização de LiveSnapshot. Valores ausentes são null; dados de fontes diferentes ou períodos desconhecidos nunca são misturados.
- `server/thesportsdb.js`: rotas JSON upstream fixas para busca, lookupevent e lookupeventstats. Não aceita URL arbitrária. Credenciais ficam no servidor. Vercel e Netlify reutilizam o mesmo serviço, com os handlers já existentes.
- `src/pregame.ts`: seleção das janelas e cálculo independente da interface.
- `src/PreGame.tsx` e `src/Live.tsx`: interfaces responsivas para análise e consulta manual.

Adicionar um provedor exige implementar e registrar um adaptador revisado, com endpoint de servidor dedicado, credenciais exclusivas de servidor e autorização/licença de acesso apropriada. O adaptador deve declarar capacidades reais, mapear períodos explicitamente e preservar ausências, identidade e timestamps. Não há adaptadores fictícios cadastrados nem integração com Flashscore.

Os testes automatizados usam fixtures controladas apenas nos testes, identificadas como QA, para validar falhas e cálculos. Elas nunca são carregadas pela aplicação como dados reais. Uma validação em navegador com fixtures não certifica frescor da API, instalação em Android real ou cobertura de estatísticas por liga. As restrições de publicação da branch de revisão permanecem; esta entrega não publica nem faz merge.
