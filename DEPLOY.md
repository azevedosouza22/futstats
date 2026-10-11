# Publicar o FutStats com HTTPS

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
