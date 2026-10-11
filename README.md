# FutStats

Primeira versão de um aplicativo de estatísticas de futebol em React 19, TypeScript e Vite. Interface responsiva em português brasileiro, armazenamento local e instalação como PWA no Android.

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
