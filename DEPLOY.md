# Publicar o FutStats com HTTPS

## PoC API-Football — revisão sem implantação

A branch `feature/api-football-poc` desativa implantação Git automática. Não faça merge ou publique esta PoC sem autorização. As variáveis de servidor, a futura configuração de Preview e a validação real pendente estão em [API_FOOTBALL.md](API_FOOTBALL.md). Hospedar somente `dist/` não executa os endpoints; é necessário o runtime serverless da Vercel.

## Prévia do PR nº 3 — sem merge ou alteração da produção

Para testar o FutStats 3.0, **não siga a instrução de merge abaixo**. Use a branch
`feature/futstats-3-image-ocr`, que agora permite deploy Git na Vercel.
O bloqueio da branch 2.0 e da Netlify permanece.

1. Entre em https://vercel.com/dashboard e abra o projeto FutStats existente.
2. Em **Settings → Git**, confirme a conexão com `azevedosouza22/futstats`.
   Caso não exista, conecte o repositório e autorize o aplicativo Vercel no GitHub.
3. Em **Settings → Environments → Production → Branch Tracking**, confirme que
   a branch de produção continua `main`. Nunca escolha a branch do PR para produção.
4. Confira os ajustes de build: raiz do repositório, Vite, Node.js 22.x,
   instalação `npm ci`, build `npm run build`, saída `dist`.
5. Em **Deployments → Create Deployment**, informe
   `feature/futstats-3-image-ocr`. A implantação deve ser **Preview**.
   Não use **Promote to Production**, não associe o domínio de produção à prévia.
6. Aguarde **Ready**, abra **Visit** e copie a URL HTTPS realmente gerada.
   Um check/comentário Vercel também pode disponibilizar essa URL no PR.
   A ausência da mensagem de deployment no GitHub, sozinha, não comprova falha de build.

Se não houver projeto Vercel, use **Add New → Project**, autorize o repositório
e importe-o com a branch de produção `main`; esse primeiro fluxo pode implantar
`main`. Para evitar qualquer implantação de produção, prefira a alternativa CLI
abaixo, criando um projeto separado `futstats-preview` e sem domínio de produção.
Faça isso no seu computador autenticado, na branch do PR:

```sh
git clone --branch feature/futstats-3-image-ocr https://github.com/azevedosouza22/futstats.git futstats-preview
cd futstats-preview
npx vercel login
npx vercel
```

No assistente escolha sua conta, um **novo** projeto `futstats-preview` e a raiz
`./`; confirme Vite/comandos acima. `vercel` sem `--prod` gera Preview.
Não execute `vercel --prod`. Não copie credenciais para o chat ou para arquivos Git.

Se a Vercel indicar falta de acesso do autor do commit, conecte o GitHub
`azevedosouza22` à sua conta Vercel em **Account Settings → Login Connections**,
confira o acesso do aplicativo ao repositório e tente novamente. Consulte o erro
real em **Deployments → Build Logs** antes de mudar configurações.

No computador e no Chrome Android abra a mesma URL HTTPS. Se a proteção da prévia
pedir autenticação, entre com a conta Vercel autorizada também no Android.
Em **Importar → Importar por imagem**, escolha seus prints, reconheça, confira
os períodos e todos os valores, e só então confirme o salvamento. A primeira
leitura precisa de conexão para baixar os arquivos OCR da própria prévia.

A prévia tem armazenamento local separado do domínio de produção e de cada
dispositivo. Não migra nem modifica os dados existentes do FutStats 2.0.
Não importe backups para produção durante o teste; backups 3.0 não devem ser
restaurados no 2.0. Não houve teste com prints reais do Flashscore neste ambiente.

Referências oficiais: https://vercel.com/docs/git e
https://vercel.com/docs/cli/deploy. Uma URL só deve ser tratada como funcionando
depois de abrir o aplicativo nela; habilitar a branch não comprova implantação.

## Vercel (recomendado)

1. Garanta que o código desta entrega esteja na branch `main` de `azevedosouza22/futstats`. Se houver um pull request de preparação, revise e use **Merge pull request**.
2. Entre em https://vercel.com com sua conta GitHub e selecione **Add New → Project**.
3. Em **Import Git Repository**, autorize o acesso ao repositório `azevedosouza22/futstats` e clique em **Import**.
4. Use a branch de produção `main`, **Root Directory** na raiz do repositório, **Framework Preset: Vite**, **Build Command: npm run build**, **Output Directory: dist**, **Install Command: npm ci** e **Node.js 22.x**. A chave pública gratuita funciona por padrão; a chave opcional THESPORTSDB_API_KEY deve existir apenas no servidor.
5. Escolha o plano Hobby se você for elegível para seus termos e limites. Clique em **Deploy**.
6. Espere o estado **Ready**. Abra a URL HTTPS real exibida no painel. O domínio é atribuído pela Vercel; não presuma que um nome específico esteja disponível.
7. Confirme que as quatro telas abrem, cadastre duas equipes e uma partida e recarregue para confirmar a persistência.

`vercel.json` já declara framework, comandos e diretório de publicação. Os próximos pushes para a branch de produção gerarão novas versões automaticamente.

## Netlify (alternativa)

1. Entre em https://app.netlify.com com GitHub.
2. Selecione **Add new project → Import an existing project → GitHub** (o texto pode variar).
3. Autorize e selecione `azevedosouza22/futstats`, branch `main`.
4. Deixe **Base directory** na raiz; configure **Build command: npm run build** e **Publish directory: dist**. `netlify.toml` configura Node 22 e esses valores.
5. Escolha o plano gratuito se disponível para a sua conta e dentro dos limites atuais. Publique e aguarde o deploy concluir. Abra a URL HTTPS atribuída no painel.

Sem GitHub: execute `npm ci` e `npm run build` em seu computador; envie a pasta `dist` em https://app.netlify.com/drop. Esta opção não configura deploy automático por Git.

## Computador e Android

Abra a URL HTTPS confirmada no provedor. No Android, use Chrome → menu → **Instalar aplicativo** ou **Adicionar à tela inicial**. Visite o app online uma vez e aguarde o cache; depois teste sem conexão. A PWA é gerada somente no build de produção.

Dados locais pertencem ao navegador e à origem. O endereço de produção começa com uma base própria; exporte e importe backups para migrar entre endereços e dispositivos. Não existe sincronização automática.

## Estado desta preparação

Nenhuma URL pública deve ser considerada publicada até que o provedor conclua o deploy e o endereço seja aberto e verificado. A versão 2.0 exige funções de servidor para buscas; cadastros locais não exigem banco de dados ou domínio personalizado; o provedor pode impor requisitos próprios. Ainda é necessário vincular a conta GitHub à hospedagem e executar o primeiro deploy.

O endpoint `sw.js` recebe `Cache-Control: no-cache` para permitir atualizações da PWA. Publique o aplicativo na raiz de um domínio, sem prefixo de subdiretório.

## Integração experimental da versão 2.0

Não publique automaticamente esta branch de revisão. Vercel e Netlify precisam publicar também as funções de servidor incluídas no repositório; enviar somente `dist/` via upload manual não habilita as buscas. A chave opcional `THESPORTSDB_API_KEY` pertence exclusivamente ao ambiente de servidor; não configure variáveis `VITE_` para credenciais. Veja README para limites e proteção dos dados ausentes. A integração continua limitada pelo plano gratuito.

Esta branch tem deploy automático bloqueado nas configurações Git da Vercel e no comando ignore da Netlify. A regra é específica para `feature/futstats-2-thesportsdb`, preservando o comportamento de produção após uma futura revisão/merge autorizada. Não foi executado nenhum comando de publicação.
