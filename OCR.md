# FutStats 3.0 — importação por imagem

## Fluxo

Em **Importar → Importar por imagem**, selecione de uma a cinco capturas JPG/JPEG, PNG ou WebP da mesma partida (até 15 MB por arquivo). As prévias podem ser substituídas ou removidas. Clique em **Reconhecer imagens**, acompanhe o progresso e cancele quando necessário. Repetir a leitura substitui as correções somente após confirmação.

Na revisão, confira mandante, visitante, data, competição opcional, o período de cada imagem e a ordem das colunas. Abra os detalhes de uma imagem para corrigir sua leitura; os campos consolidados também são editáveis. Campos vazios representam **N/D**, nunca zero. O OCR mostra sua confiança estimada, que não é garantia de acerto.

A importação exige revisão e confirmação explícita de que as imagens pertencem à mesma partida, de que as definições são comparáveis e de que a partida terminou. Equipes inexistentes são cadastradas ao salvar. Possíveis duplicatas (equipes/data, inclusive ordem invertida) são bloqueadas sem sobrescrever. Depois de salvar, as imagens e suas URLs temporárias são descartadas.

## Informações e períodos

São tentados gols, finalizações, no alvo, escanteios, cartões amarelos/vermelhos, posse de bola, xG e chances claras. O interpretador aceita rótulos frequentes em português e alguns em inglês. Nomes, competição e data só são sugeridos em formatos reconhecíveis: por exemplo, nomes com rótulos ou ao redor de um placar, data com ano completo e linha de competição. Cabeçalhos complexos podem exigir preenchimento manual.

As palavras do OCR são agrupadas pela posição vertical e ordenadas da esquerda para a direita. Isso ajuda a reconstruir linhas com colunas separadas, mas **não garante atribuição correta** em todo layout. Confira sempre qual equipe é mandante e a qual lado pertence cada número.

As imagens não são classificadas pela ordem de envio. Texto inequívoco identifica JOGO, 1º TEMPO ou 2º TEMPO. Se todas as abas estiverem visíveis, o OCR não consegue saber apenas pelo texto qual aba está selecionada: o período fica indefinido e o usuário precisa selecioná-lo. Não inferimos seleção por cor, posição ou aparência.

Placar de cabeçalho nunca é copiado para gols do primeiro/segundo tempo. Pode ser sugerido para o jogo completo quando houver indicação explícita de encerramento; nos demais casos, use a opção de confirmar o placar final. Dados ausentes de gols por tempo permanecem N/D.

## Somas e diferenças

- Gols, finalizações, no alvo, escanteios, cartões e chances claras são tratados como aditivos, desde que a mesma definição da fonte seja confirmada. A validação compara as partes com o total somente quando os três valores estão disponíveis.
- Divergências e totais menores que o primeiro tempo bloqueiam o salvamento. Valores não são corrigidos automaticamente. Corrija o número, a classificação do período ou remova como N/D um dado que não seja comparável.
- **Calcular 2º tempo por diferença** e **Calcular totais dos dois tempos** são ações opcionais, com confirmação da definição e ausência de prorrogação. Preenchem exclusivamente campos N/D; jamais sobrescrevem valores existentes ou geram diferenças negativas.
- Posse, percentuais e xG não são somados nem subtraídos. xG pode sofrer arredondamentos e não é usado nesta primeira implementação como métrica de diferença.
- Cada valor conserva sua origem: reconhecido/revisado, corrigido pelo usuário ou calculado. Os detalhes do histórico exibem essa indicação, inclusive no segundo tempo.

Uma partida com somente jogo completo alimenta as médias completas, mas não as de primeiro tempo. Somente os dois tempos, sem total confirmado/calculado, mantém o total N/D até o usuário aplicar o cálculo. Os filtros atuais do Pré-jogo continuam valendo: por precisão apenas de dia, o dia do confronto, hoje e datas posteriores são excluídos.

## OCR local, dependências e offline

Usa Tesseract.js 6.0.1, mecanismo WASM LSTM e modelo português `por` da dependência `@tesseract.js-data/por`. Não requer API paga, chave, conta ou servidor de reconhecimento. Não há upload, scraping, captura automatizada, coleta no Flashscore ou acesso a endpoints privados.

`npm ci` baixa as dependências no computador/ambiente de build. `predev` e `prebuild` executam `scripts/copy-ocr-assets.mjs` para copiar worker, mecanismo e idioma para `public/ocr/v6/`, incluídos no build. Os arquivos gerados não são versionados; todos são servidos pela **mesma origem do aplicativo**, sem CDN externo em tempo de execução.

Na primeira leitura, o navegador precisa baixar o worker, a variante do mecanismo compatível com o dispositivo e o modelo português — aproximadamente 5–9 MB, conforme os arquivos efetivamente carregados. Isso não envia imagens. A leitura acontece em workers dedicados, sequencialmente, reutilizando um mecanismo para as imagens do lote.

Em produção HTTPS (ou localhost para testes), a PWA faz precache da interface e cache sob demanda dos arquivos OCR. O idioma também é armazenado pelo Tesseract no IndexedDB. Depois de uma leitura bem-sucedida com cache completo no mesmo dispositivo, o OCR pode funcionar offline. A primeira leitura sem cache exige internet; modo privado, remoção/evicção de cache, mudança de origem ou armazenamento indisponível podem impedir o offline. Na atualização das dependências OCR, atualize também a versão do diretório/cache para não reutilizar um mecanismo antigo. O modo `npm run dev` não habilita o service worker; para validar offline use build + preview ou a hospedagem HTTPS.

As imagens são verificadas por tipo/extensão, assinatura e decodificação. A preparação limita a saída a 4 megapixels, largura de 1600 e altura de 3200 pixels; screenshots pequenas podem ser ampliadas até 2×. Bitmaps e canvases são liberados, workers são terminados após o lote/cancelamento e URLs de prévia são revogadas ao remover, substituir, salvar ou sair da tela. Há limite de 40 megapixels na imagem decodificada e timeout de dois minutos por imagem. Arquivos muito grandes ainda podem exigir memória considerável para decodificação; recorte somente a região relevante.

## Limitações e privacidade

Não houve validação com prints reais do Flashscore: nenhum estava no repositório. Tema escuro, baixo contraste, texto pequeno, cortes, compressão, nomes em colunas separadas, fontes diferentes, abas simultâneas e capturas longas podem provocar omissões, inversão de colunas ou números incorretos. Recorte/amplie o trecho relevante e corrija manualmente. Não há promessa de precisão automática nem de compatibilidade com todos os layouts.

A aplicação não armazena originais, thumbnails, nomes dos arquivos ou texto bruto do OCR na base/backups. Conserva somente equipes, estatísticas revisadas e metadados de proveniência. A prévia e o conteúdo necessário à leitura ficam temporariamente na memória da página. Imagens podem conter dados pessoais; o fluxo não faz qualquer envio de imagem a um serviço externo.

## Compatibilidade

Mantém `localStorage` na chave `futstats:v1`; não cria outra base de partidas. O modelo adiciona `image` e três métricas opcionais, preservando a leitura de backups antigos sem esses campos. Backups 3.0 não devem ser restaurados por versões antigas do aplicativo. Os caches técnicos de OCR não são outra base de partidas.

Cadastro e edição manuais, histórico, comparação, Pré-jogo, Ao vivo, TheSportsDB e backups permanecem disponíveis. Métricas novas ausentes em registros antigos são N/D. A posse/xG do jogo completo não é inferida de duas metades no cadastro manual. Importações por imagem são somente leitura depois de confirmadas, preservando proveniência; podem ser excluídas e reimportadas após nova revisão. Os botões de backup também ficam acessíveis no cabeçalho móvel.

## Testes e execução

Requer Node 22 e npm:

```bash
npm ci
npm run dev
npm test
npm run build
```

Testes de navegador:

```bash
npx playwright install chromium
npm run test:e2e
```

Em um ambiente que já disponha de Chromium, pode-se selecionar o executável com `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Os testes usam o servidor de preview local somente para QA, não como endereço público.

- Casos A/B fornecidos pelo usuário são **referências textuais de validação**, não resultados de OCR de prints reais. O caso B não recebe uma data inventada.
- Os testes unitários cobrem períodos/abas ambíguas, valores por coluna, ausências, rótulos/decimais, divergências, correção, cálculo explícito, duplicatas, proveniência, médias, filtros e round-trip de backup.
- Playwright executa Tesseract real em PNGs **sintéticos** gerados durante o teste. Cobre seleção/substituição, revisão obrigatória, divergência, salvamento, histórico, persistência, exportação, duplicata, cancelamento, formatos inválidos e offline após cache aquecido, em desktop e viewport Android 390×844.
- Essas imagens não entram automaticamente na base do usuário e não comprovam precisão em capturas reais. Os testes não foram executados em um aparelho Android físico.

Fontes técnicas: [Tesseract.js](https://github.com/naptha/tesseract.js), [instalação local](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md), [modelo português](https://www.npmjs.com/package/@tesseract.js-data/por).
# Ajustes de precisão após relatos de testes reais

Os relatos indicaram finalizações ausentes, decimais sem separador e períodos
ambíguos. O código anterior só redimensionava a imagem, aceitava `171` em xG
e exigia rótulos inteiros em uma linha. Esta melhoria não modifica modelo,
armazenamento, histórico, médias, pré-jogo ou formato de backups.

- A imagem limitada a 4 MP recebe escala de cinza, expansão de contraste e
  inversão quando o fundo é predominantemente escuro. Tons intermediários são
  preservados: não há limiar binário ou erosão que apague vírgulas/pontos.
  O buffer é reutilizado; processamento continua local e uma imagem por vez.
- Rótulos conhecidos quebrados em duas linhas e variações como “Chutes a gol”
  e “Finalizações certas” são reconhecidos. Coluna explicitamente ilegível
  (`O`, `?`, `N/D`) não vira zero nem desloca o valor da outra equipe.
- `1,71`, `1.71`, `1 , 71` e `1 . 71` são interpretados como 1.71. Sem
  separador visível, não se presume centésimos. Leituras de xG >= 10 ficam N/D
  com o número bruto no aviso para correção manual. Esse limite é uma heurística
  de suspeita, não um limite esportivo: valores legítimos podem ser preenchidos
  manualmente e confirmados na revisão obrigatória.
- Gols por período só são extraídos de linha “Gols” ou de placar explicitamente
  vinculado ao período (“Placar do 1º tempo: 1 - 0”). O cabeçalho final nunca
  define gols dos tempos. “Resultado final”/“Terminado” ajudam identificar o
  placar do jogo completo. Abas simultâneas continuam exigindo escolha manual;
  não há detecção confiável de aba ativa baseada somente no texto.
- Posse cuja soma difere de 100% por mais de 1 ponto, alvo superior ao total,
  xG suspeito e baixa confiança OCR têm destaque para conferência. Avisos da
  leitura original permanecem como referência após correções; os destaques do
  resultado acompanham os valores editados. A soma de posse é apenas aviso,
  respeitando possíveis definições diferentes da fonte.

Testes de texto verificam os erros relatados, sem reproduzir resultados de OCR
de prints reais. O navegador usa imagens PNG geradas (claras e escuras), com
Tesseract real, em desktop e viewport móvel. Não foram fornecidos novos prints
reais para esta entrega; precisão no Flashscore e Android físico ainda exigem
validação. Tema misto, texto cortado/pequeno, barra sobreposta e perda de
pontuação continuam sujeitos a correção. Mudar para segmentação esparsa/automática
causou regressão nos testes existentes; foi mantido o bloco único validado.

Esta melhoria usa branch `feature/ocr-precision`, com deploy Git Vercel e Netlify
bloqueados. Não libera ou altera a prévia existente do PR nº 3 automaticamente.

## Regressão Hull × Everton e evidência visual

A referência Hull 2×2 Everton (11/10/2026) está exclusivamente nos testes, nunca
na aplicação ou na base inicial. As sete métricas fornecidas são verificadas
por período em textos e imagens PNG equivalentes geradas pelo Playwright.
Não havia prints originais no repositório: não se afirma validação em capturas
reais do Flashscore ou Android físico.

O preparo captura pequenos segmentos horizontais vermelhos antes da escala de
cinza. Eles são comparados às caixas das palavras OCR: pelo menos duas abas
reconhecidas na mesma linha, confiança mínima de 70, tamanho/alinhamento e
proximidade compatíveis, uma única marca ativa. Há tolerância pequena quando o
OCR inclui o sublinhado na caixa da palavra. A sugestão de período aparece na
revisão e continua editável. Ausência de sublinhado, duas marcas, baixa confiança,
outro estilo/cor, abas em linhas separadas ou indicador distante exigem escolha
manual. Este detector não conhece o layout de qualquer versão do Flashscore.

Linhas com rótulo conhecido e valores ausentes podem ser relidas com recorte
horizontal e segmentação de linha única: até quatro releituras por imagem,
sequenciais, usando o mesmo worker. Exige confiança mínima de 60, dois valores
válidos e concordância com qualquer coluna já reconhecida; divergências geram
aviso. Não transforma letras em números, não consulta serviços externos e não
faz uma segunda leitura global. O limite de tempo/cancelamento continua ativo.
A posição horizontal determina mandante/visitante, sem ordenar por valor.

No PNG sintético, o zero da linha de gols foi lido como “o” e permaneceu N/D mesmo
após releitura. O teste usa a ação explícita de cálculo para obter 0×0 no primeiro
tempo, a partir de 2×2 reconhecido no segundo e no completo, com proveniência
“calculado”. As demais métricas são reconhecidas. Isso documenta a limitação,
sem confundir cálculo com acerto do OCR. Placar do período pode ser reconhecido
quando explicitamente rotulado (por exemplo “1º TEMPO: (0 - 0)”). Cabeçalho final
não determina gols dos tempos; ao reclassificar uma imagem para um tempo,
gols reconhecidos apenas desse cabeçalho são descartados. Correções manuais
continuam sob responsabilidade da conferência do usuário.

Agora há três ações: completo − segundo → primeiro; completo − primeiro →
segundo; primeiro + segundo → completo. Preenchem somente métricas aditivas N/D
(gols, finalizações, no alvo, escanteios, cartões, chances claras), sem substituir
extrações/correções, gerar negativos ou agir sem dois operandos conhecidos.
É obrigatória a confirmação de definições comparáveis e ausência de prorrogação.
Posse e xG continuam fora do cálculo: percentuais não são subtraídos e xG depende
de definição/arredondamento da fonte. Todos os valores calculados precisam da
confirmação final e são identificados no histórico e no backup.

Sem migração de dados, segunda base ou mudança no formato do backup. A validação
agora também aceita primeiro tempo com proveniência calculada se a fórmula for
correta; backups anteriores continuam aceitos. Backup novo com esse cálculo
precisa desta versão ou posterior para restauração; leitores antigos podem
rejeitá-lo. Dados locais e telas existentes não são modificados automaticamente.

A branch feature/ocr-hull-regression bloqueia autodeploy Vercel e Netlify.
Nenhuma atualização da prévia ou produção é feita nesta entrega.

## Importação assistida por cabeçalho e SUMÁRIO

O fluxo aceita cinco arquivos, por exemplo três períodos e dois recortes do
SUMÁRIO. Campos reconhecidos com evidência são preenchidos e a visualização
padrão mostra dúvidas (N/D, baixa confiança ou inconsistências). Use **Mostrar
todos os campos** para conferir/corrigir qualquer valor. Períodos identificados
não exigem nova seleção; uma única confirmação final continua obrigatória.

O cabeçalho reconhece rótulos, nomes junto ao placar e, quando há uma linha
pareada legível antes da navegação, nomes à esquerda/direita do placar central.
Normaliza espaços e Unicode, sem catálogo de equipes, tradução, expansão de abreviações ou
suposição de adversários. Cabeçalhos de país são validados localmente com Intl/nomes conhecidos ou rótulo País; não traduzimos o valor lido. Competição/rodada usam texto explícito; data exige
ano. País e rodada são campos opcionais no registro, histórico e backup; nenhum
registro anterior é migrado ou substituído. Dados conflitantes, nomes em várias
linhas, ausência de estado de encerramento e layouts diferentes exigem correção.

SUMÁRIO pode ser sugerido pelo indicador visual ou texto/eventos inequívocos e
é selecionável manualmente. Um placar final com marcador de encerramento e um
intervalo legível preenchem automaticamente gols completos/primeiro tempo e
calculam somente os gols ausentes do segundo (final − intervalo). Valores
extraídos ou corrigidos não são substituídos; corrigir um operando atualiza os
gols derivados. Indícios de prorrogação/disputa de pênaltis bloqueiam esse cálculo.

Eventos exigem minuto legível e equipe explícita (Mandante/Visitante, rótulo
`Equipe:` ou `[Equipe]`). Placar visível de um evento pode identificar o gol
quando há incremento unitário inequívoco em relação ao placar anterior/intervalo;
sem baseline suficiente, não se atribui a equipe. Acréscimos de 45 pertencem ao
primeiro tempo; de 90, ao segundo. Gol contra explícito usa o adversário, salvo
se o próprio incremento do placar já identifica a equipe creditada. Eventos
anulados, substituições e perdas de pênalti não são gols; banco/comissão,
segundo amarelo e minutos fora dos 90 são tratados como dúvidas.

Detecção de ícones de cartões é experimental: retângulos amarelos/vermelhos de
forma compatível, próximos a um único minuto OCR confiável, com lado claro.
Texto ambíguo, ícone central, outra cor, orientação/tamanho diferente ou legenda
não permitem identificação segura. Cores sozinhas não geram totais. Esta
heurística não foi validada em prints reais e pode exigir correção.

**Recortes não comprovam ausência de eventos.** A lista permanece parcial até
marcar **As imagens mostram todos os eventos** para cada tempo, juntando os
recortes e verificando equipes/definições. Essa confirmação permite contar gols
/cartões, inclusive zero em uma lista completa. Eventos sem identidade,
releituras conflitantes ou potenciais duplicatas impedem uso automático das
contagens; corrija os campos do resultado ou selecione recortes mais claros.
Repetições exatas são deduplicadas; eventos semelhantes no mesmo minuto/lado
precisam de conferência. Dados que não forem comprovados permanecem N/D.

Contagens de lista completa são identificadas como OCR (eventos); diferença de
gols e soma de cartões dos dois tempos são **Cálculo**; edição é **Corrigido pelo
usuário**. Somente metadados e estatísticas revisados entram na base. Eventos,
nomes de jogadores, texto OCR e imagens não são armazenados no backup. Posse e
xG continuam sem soma/subtração; xG vem diretamente da leitura/correção.

Regressões: Hull 2×2 (11/10/2026), Torino 2×1 (12/10/2026) e Levante 3×3
(12/10/2026). Os gols e cartões Levante seguem a referência do usuário. Minutos,
nomes genéricos dos eventos e competição/rodada de teste são fixtures sintéticas,
não detalhes verificados dessas partidas. Torino não tem intervalo fornecido:
os testes exigem que permaneça N/D. Não havia capturas originais, só ícones PWA.

No teste de navegador com cinco PNGs sintéticos, o intervalo Arial `0 - 1` foi
lido como `O - 1` mesmo após releitura; permaneceu N/D. Cabeçalho/equipes/data foram
preenchidos e os eventos legíveis produziram os gols e cartões após confirmação
de cobertura, sem digitação estatística. Esse caso mostra a recuperação segura,
não um acerto inventado do zero. Android físico e prints reais ainda precisam
ser validados. Recomenda-se fornecer cabeçalho e eventos completos em boa resolução.

Limites existentes (15 MB/arquivo, preparo a 4 MP, OCR serial, cancelamento,
timeout e cache offline) continuam. Prévias usam decodificação assíncrona e
carregamento sob demanda; arquivos grandes ainda podem consumir memória no
Android. Branch feature/ocr-summary-assistant tem autodeploy Vercel/Netlify bloqueado.
