# API-Football: prova de conceito privada

A área **Partidas automáticas** consulta a API-Football no servidor e exibe partidas e estatísticas sem importar, migrar ou substituir registros locais. Cadastro manual, OCR, histórico, médias, backups e PWA permanecem disponíveis. A integração requer internet; não oferece acompanhamento em tempo real nem atualização automática. O código de acesso fica somente na memória da página.

## Configuração de servidor na Vercel

Para a implantação de **Preview** autorizada desta branch, configure em Settings → Environment Variables, no ambiente **Preview**:

| Variável | Conteúdo |
| --- | --- |
| `API_SPORTS_KEY` | Chave fornecida pela API-Sports; segredo exclusivo do servidor |
| `API_SPORTS_POC_TOKEN` | Código privado aleatório, com pelo menos 16 caracteres, diferente da chave da API |
| `API_SPORTS_ALLOWED_DATES` | Datas autorizadas separadas por vírgula; padrão `2026-10-13`, máximo 7 |
| `API_SPORTS_ALLOWED_FIXTURES` | IDs autorizados separados por vírgula; padrão `1492402`, máximo 20 |

Não use prefixo `VITE_`, não coloque segredos no Git ou no navegador e não forneça a chave da API no campo de acesso. Compartilhe apenas o código privado com quem fará o teste. Após alterar variáveis, uma nova implantação será necessária. Nesta branch, a implantação Git de Preview foi habilitada na Vercel a pedido do usuário; a Netlify permanece bloqueada. A branch de produção deve continuar `main`; não faça merge nem promova a prévia para produção.

## Prévia do PR nº 7

O bloqueio original era `git.deploymentEnabled["feature/api-football-poc"] = false` em `vercel.json`. A configuração agora é `true` somente para essa branch. O novo push pode criar automaticamente uma prévia se a integração Git do projeto estiver ativa. Não havia status nem comentário de implantação no GitHub antes da correção. O painel da Vercel e as variáveis cadastradas nele não são acessíveis a partir deste ambiente.

1. Na Vercel, abra o projeto FutStats → Settings → Git e confirme o repositório `azevedosouza22/futstats`, com permissão do aplicativo Vercel para esse repositório. Em Production/Branch Tracking, mantenha `main` como branch de produção.
2. Confirme as duas variáveis de servidor no ambiente Preview. Se houver restrição por branch, inclua `feature/api-football-poc`. O código privado precisa ter pelo menos 16 caracteres e ser diferente da chave. Não envie os valores por chat ou comentários do PR.
3. Em Deployments, procure a implantação do commit mais recente de `feature/api-football-poc`. Se não houver, use Create Deployment com essa branch e ambiente **Preview**. Se aparecer Skipped/Canceled, confira o Ignored Build Step: ele não deve bloquear essa branch nem executar `scripts/ignore-review-deploy.cjs` (esse script é exclusivo da Netlify e continua bloqueando a branch lá).
4. Confira Vite, raiz do projeto na raiz do repositório, Node 22.x, instalação `npm ci`, build `npm run build`, saída `dist`. Se houver pedido de aprovação do autor/integração Git, um administrador deve aprovar no painel. Falhas de build precisam ser verificadas nos logs da implantação, sem compartilhar segredos.
5. Aguarde **Ready** e use **Visit**. Essa é a URL HTTPS a compartilhar no computador e no Chrome Android. Não use Promote to Production ou o domínio da produção. Se Deployment Protection estiver ativa, autorize o acesso do testador na Vercel; isso é independente do código privado da PoC.

Nenhuma URL é considerada funcionando até que seja aberta e verificada. A build não consulta a API. Abrir a página e clicar Acessar consultas chama apenas `kind=config`, sem cota upstream. Para o teste mínimo, escolha `2026-10-13`, consulte partidas (uma chamada), selecione o ID `1492402` (uma chamada) e, só se necessário, consulte dados por tempo (uma chamada adicional). As listas padrão já restringem essa data e ID; não amplie as permissões para esse teste. Cache de uma hora evita repetir consultas na mesma instância; cold starts e outras instâncias podem consumir novamente. Não abra repetidamente várias prévias/abas para o mesmo teste.

Vercel executa `api/api-football.js` como função; um hospedador apenas de arquivos `dist/` não executará os endpoints. `npm run dev` inclui o mesmo handler para desenvolvimento, com variáveis em `.env.local` (ignorado pelo Git). `npm run preview` serve somente o build estático. Para iniciar: `npm ci` e `npm run dev`.

## Consultas e proteção de cota

Endpoint privado GET `/api/api-football`, com `Authorization: Bearer <código privado>`:

- `?kind=config`: lista datas e IDs autorizados, sem consumir cota do provedor.
- `?kind=fixtures&date=2026-10-13`: chama exatamente `/fixtures?date=2026-10-13`, sem acrescentar fuso; a seleção de data usa o padrão do provedor. Horários na tela são convertidos para o fuso do dispositivo.
- `?kind=statistics&fixture=1492402&half=false`: chama `/fixtures/statistics`.
- `?kind=statistics&fixture=1492402&half=true`: consulta adicional, explicitamente solicitada pelo usuário.

A chave é enviada exclusivamente ao host fixo `https://v3.football.api-sports.io`, via `x-apisports-key`. Datas/IDs fora da lista, parâmetros extras, repetidos e métodos não permitidos são rejeitados. Mensagens do provedor são sanitizadas; a resposta não expõe chave nem cabeçalhos do provedor.

Por instância: cache em memória de uma hora, deduplicação de chamadas simultâneas, cache de falhas de um minuto, até 8 tentativas por minuto e orçamento de 80 tentativas por janela de 24 horas. Timeout de 10 segundos, sem retentativas automáticas. HTTP 429 sem indicação de saldo diário é identificado como limite de consultas não especificado e mantém bloqueio conservador de 24 horas; erros de cota diária ou saldo diário zero também bloqueiam por 24 horas. Campo explícito rateLimit sem evidência de cota diária bloqueia por um minuto. Respostas bem-sucedidas em cache continuam acessíveis. HTTP 429 não é tratado como autenticação nem prova, sozinho, de cota diária esgotada. O cache deixa placar e estatísticas defasados; o horário da consulta aparece na tela.

**Esses controles não são globais:** cold starts e múltiplas instâncias da Vercel têm memórias separadas. O código privado e as listas limitam o uso desta PoC; antes de abrir acesso público, implementar cache compartilhado e contador atômico persistente de cota. Não há garantia de limite global de 100 chamadas nesta implementação. A listagem é limitada a 500 partidas por resposta; apenas IDs autorizados têm consulta de estatísticas habilitada.

O plano gratuito anunciado pelo provedor possui 100 requisições diárias e restrições de temporadas. Confirmar cobertura da temporada 2026 na conta utilizada. Não foram adicionados serviços pagos ou pagamentos. A licença para uso comercial precisa ser confirmada antes de comercializar.

## Precisão e dados por tempo

Estatísticas são associadas às equipes pelos IDs, independentemente da ordem da resposta. Zero explícito é preservado; nulo, ausente, inválido, duplicado ou ambíguo permanece N/D. Contagens devem ser inteiras; posse deve estar entre 0 e 100. Decimais com ponto ou vírgula são aceitos. Não se inferem gols de períodos nem se calculam diferenças, posse ou xG nesta PoC.

A documentação descreve `half` como booleano: `true` solicita dados adicionais por tempo, com disponibilidade a partir da temporada 2024. **Não é um seletor `half=1`/`half=2`.** O adaptador provisório aceita apenas contêineres explicitamente separados `statistics_1h` e `statistics_2h`, além de `statistics`. Esse formato foi testado com fixtures simuladas; não foi confirmado numa resposta real. Se o esquema real for diferente, a tela exibirá N/D até o adaptador ser ajustado e validado. O acumulado nunca é copiado para um tempo. O placar de partidas em andamento é identificado pelo status, não tratado como final.

## Verificação real pendente — 13/10/2026

Não havia `API_SPORTS_KEY` neste ambiente. Nenhuma chamada autenticada real foi executada. O exemplo RB Bragantino × Cruzeiro, ID `1492402`, foi informado pelo usuário; esta implementação não confirmou seus resultados.

| Consulta | Resultado real |
| --- | --- |
| `/fixtures?date=2026-10-13` | Não verificado |
| `/fixtures/statistics?fixture=1492402&half=false` | Não verificado |
| `/fixtures/statistics?fixture=1492402&half=true` | Não verificado: conteúdo, estrutura e disponibilidade dos tempos pendentes |

Em máquina autorizada com Node 22 e `.env.local` configurado, execute `node --env-file=.env.local scripts/validate-api-football.mjs`. O script faz até três consultas, interrompe em limite de cota e relata respostas sanitizadas e estrutura de campos, sem chave ou cabeçalhos. Não informe a chave na linha de comando. Confira no relatório equipes/ID, estatísticas acumuladas e estrutura efetiva de `half=true`; só depois ajuste o adaptador e registre o resultado real no PR. Sem essa confirmação, dados por tempo permanecem experimentais.

## Validação automatizada

- `npm test`: 104 testes unitários, incluindo respostas simuladas com nulos, zero, decimais, equipes fora de ordem, ausência de tempos, erros, timeout, limite diário, autenticação, allowlist, cache e deduplicação. Regressão da URL exata por data, 293 partidas simuladas, classificação segura de erros, totais por período e tradução de indicadores.
- `npm run test:e2e`: 18 testes Playwright em desktop e viewport móvel 390 × 844. API simulada, fluxo privado, N/D, erro de cota sem repetição, armazenamento local preservado e regressões de OCR/backups/offline. Inclui lista longa, detalhes imediatos, foco de teclado, volta à lista e troca de períodos sem novas consultas. Não equivale a testar um aparelho Android físico.
- `npm run build`: TypeScript, Vite e geração de service worker/manifest da PWA aprovados. As respostas privadas da API não são incluídas no precache.

Fontes oficiais: [documentação V3](https://api-sports.io/documentation/football/v3), [planos](https://www.api-football.com/pricing/), [orientação sobre cota](https://www.api-football.com/news/post/how-to-optimize-api-sports-calls-and-quota-usage).

## Correção da consulta por data após teste do Preview

O usuário confirmou no painel oficial 293 partidas sem erros para `GET /fixtures?date=2026-10-13`. A versão inicial enviava também `timezone=America/Sao_Paulo`, portanto não reproduzia a mesma consulta. Esse parâmetro adicional foi removido; não foi demonstrado que um fuso válido seja rejeitado pelo provedor.

A mensagem anterior sobre plano/temporada era gerada para qualquer `errors` não vazio, exceto cota. Esse tratamento apagava a diferença entre erros de parâmetros, autenticação e outras causas; não comprovava limitação de plano. Agora erros com campos conhecidos retornam `PROVIDER_PARAMETER` (nome de parâmetro autorizado, sem conteúdo do provedor), `PROVIDER_ACCESS` ou `DAILY_LIMIT`. Erros desconhecidos continuam sanitizados como `PROVIDER_ERROR`, sem diagnóstico de plano. A URL fixa, o cabeçalho `x-apisports-key` no servidor, o código privado separado e a restrição de datas permanecem.

A correção foi testada com respostas simuladas, não com a chave real do Preview. Para validar, após Ready do novo commit, consulte a data uma vez. Se falhar, registre somente o código e a mensagem sanitizada retornados por `/api/api-football` (sem cabeçalhos, tokens, screenshots ou HAR com credenciais). Não realizar retentativas automáticas nem ampliar consultas; falhas têm cache de um minuto. A causa exata da resposta original do provedor permanece não confirmada sem evidência adicional do Preview.

## FutStats Intelligence: evolução visual experimental

Tema escuro aplicado somente a Partidas automáticas e à navegação enquanto essa área estiver aberta. Verde destaca ações/mandante, azul identifica fonte/visitante, roxo identifica o caráter experimental e amarelo sinaliza alertas com texto. Não foi adicionada IA, previsão ou recomendação de apostas. As outras páginas preservam seu tema anterior.

Ao escolher uma partida, a lista dá lugar aos detalhes, com foco no título, placar/status da fonte e botão Voltar às partidas que restaura a lista e o foco. Estatísticas aparecem em cartões com números e nomes de equipes. Barras decorativas representam a proporção relativa ao maior valor de cada métrica, sem transformar números em probabilidades; dados ausentes continuam N/D, sem barras de comparação. Valores zero são exibidos como zero.

O acumulado é consultado como antes; dados por tempo requerem o botão manual existente. Depois da consulta, mudar entre primeiro tempo, segundo tempo e acumulado apenas troca a visualização em memória. A lista não é consultada novamente ao voltar. Carregamento tem indicação textual, erros usam alertas e tempos ausentes têm mensagem explícita. Navegação por teclado, foco visível, botões para toque e redução de animação conforme preferência do sistema. Os testes de interface usam exclusivamente dados identificados como simulados; a tela real não contém exemplos inseridos.

## Painel Inteligente V1

Resumo do período com quatro cartões: gols, finalizações, chutes no alvo e escanteios. Cada cartão mostra mandante, visitante e total, calculado somente quando existem os dois valores válidos. Zero explícito permanece zero; uma equipe sem dado torna o total N/D. Gols do acumulado vêm do placar da listagem (ou de estatísticas explícitas do mesmo período se o placar estiver ausente). Gols dos tempos exigem o indicador explícito `Goals` no respectivo contêiner de período; não se usa o placar geral nem se calculam diferenças. O cabeçalho permanece identificado como Placar geral para evitar confusão ao selecionar um tempo.

Todos os demais indicadores ficam em **Mais estatísticas**, fechado inicialmente e acessível por toque/teclado. Os indicadores conhecidos têm rótulos em português: impedimentos, finalizações bloqueadas/para fora/dentro ou fora da área, faltas, tiros livres, defesas do goleiro, passes totais, passes certos, precisão dos passes e outros. Tipos novos não são descartados: aparecem identificados como Indicador da fonte com o nome original, sem tradução especulativa. Percentuais mantêm unidade e não recebem total. As barras seguem sendo comparações de valores, sem interpretação de probabilidades.

Montar/expandir o resumo e alternar períodos usa somente dados em memória. Nenhuma alteração em endpoints, cache, autenticação, limites, histórico, armazenamento local ou backups. Testes adicionais verificam totais parciais, zero, ausência de gols por tempo, separação de períodos e preservação/tradução dos indicadores. Testes de navegador verificam expansão, resumo por período e contagem de chamadas inalterada. Capturas locais desktop e móvel inspecionadas; não houve validação em Android físico ou novas consultas reais à API.

## Diagnóstico da consulta por tempo

Acumulado e half=true usam a mesma função, código privado e chave de servidor. O sucesso do acumulado não valida por si só a autorização atual de half=true (o acumulado pode vir do cache). O erro ACCESS/HTTP 401 local identifica recusa do código privado; PROVIDER_UNAUTHORIZED identifica HTTP 401 upstream; PROVIDER_FORBIDDEN identifica HTTP 403 upstream; PROVIDER_AUTH_RESPONSE identifica um campo de erro de acesso num HTTP 200. Um campo token em errors não comprova sozinho que a chave seja inválida.

Limites são classificados separadamente: DAILY_LIMIT com evidência diária, RATE_LIMIT para campo de frequência e PROVIDER_LIMIT para HTTP 429 sem tipo confirmado. Mensagens explícitas de falta de acesso/disponibilidade de half/halves em HTTP 200/403 são tratadas como PERIOD_UNAVAILABLE: resposta com itens vazios, aviso e tempos N/D. Isso não cria estatísticas. HTTP 401, erros de parâmetros ou falhas desconhecidas continuam erros; não são transformados em ausência de dados. Nunca há retentativa automática ou cálculo por subtração. O acumulado permanece acessível após a falha.

Os logs privados da Vercel não são acessíveis neste ambiente, e a resposta original desta ocorrência não foi confirmada. Foi corrigida a classificação ambígua no código, não demonstrada uma falha específica de credencial ou plano. Para o próximo teste, após Ready do novo commit, solicite half uma vez. Se houver erro, copie apenas o código e HTTP exibidos na mensagem. No painel Vercel, Runtime/Function Logs podem ser filtrados por api-football-result. O novo registro contém apenas event, code, status, upstreamStatus e halfRequested; não contém URL, headers, mensagens do provedor, chaves, tokens ou variáveis. Nenhum log privado histórico foi lido.

Regressões simuladas cobrem token local inválido sem upstream, HTTP 401/403, erro de acesso em HTTP 200, indisponibilidade explícita dos tempos, resposta vazia, cota, cache e preservação do acumulado. Interface testada em desktop e viewport Android: diagnóstico visível, tempos N/D quando indisponíveis, seleção sem consultas extras e dados locais intactos.
