# FutStats · roteiro de pesquisa pontual por competição (Work)

Este procedimento destina-se a consultas **pontuais, pessoais e revisáveis**, sem extração contínua ou contorno de bloqueios.

## Cobertura desejada para verificação
- Brasil: Brasileirão Série A
- Alemanha: Bundesliga
- Itália: Serie A
- França: Ligue 1
- Espanha: La Liga

A presença de um campeonato neste roteiro **não significa** que o Flashscore disponibilize todas as estatísticas ou que seu navegador consiga acessar todas as páginas. Registre a disponibilidade real, partida a partida, incluindo as limitações de acesso.

## Prompt para o Work

> Pesquise de maneira pontual uma partida concluída da competição que eu indicar no Flashscore, além dos cinco jogos anteriores de cada equipe, distinguindo resultados por campeonato e por mando de campo. Registre mandante, visitante, competição, data mostrada no corpo da página, data do título se diferente, gols, finalizações, chutes no gol e escanteios (partida completa e cada tempo somente quando observáveis) e link individual da fonte.
>
> Exclua o confronto pesquisado e partidas posteriores das médias pré-jogo. Não confunda a data de publicação, a data do título e a data exibida no corpo. Se houver discordância, preserve ambos os valores e destaque a divergência.
>
> Gere um CSV UTF-8 com as mesmas colunas do arquivo FutStats já validado (55 colunas). A primeira coluna deve ser `id_fonte` e os campos `fonte`, `url_fonte`, `data`, `data_titulo_fonte`, `mandante`, `visitante`, `competicao` devem seguir o padrão anterior. Valores indisponíveis devem ser `N/D`; não estime dados por período. Mantenha `fonte=Flashscore` e o parâmetro `mid` da URL compatível com `id_fonte`.
>
> Preserve nomes de campeonato consistentes no arquivo (exatamente a mesma grafia entre partidas da mesma competição). Não invente links, jogos nem estatísticas e não misture competições ao calcular médias restritas à liga. Não execute monitoramento ou coleta em massa; interrompa se o site bloquear o acesso.
>
> Ao final, forneça o CSV e uma pequena tabela sobre quantas partidas e quantos períodos foram efetivamente consultados.

## Importação e leitura

1. Abra **Importar → Importar pesquisa CSV · Experimental** no Preview.
2. Verifique prévia, datas divergentes e partidas duplicadas antes de confirmar.
3. Confira **Histórico**.
4. No **Pré-jogo**, selecione a competição: **Todas** inclui copas e demais ligas; uma liga específica restringe a amostra.
5. Escolha **Geral** ou **Equipe 1 em casa × Equipe 2 fora**. As médias apresentam quantas partidas foram usadas por estatística; `N/D` nunca significa zero.

**Importante:** O FutStats armazena esses registros no navegador do próprio usuário; o Work não possui automaticamente acesso a eles. Proteja seus backups. O CSV é um registro revisável, não uma fonte automática de atualizações. O protótipo não deve ser usado para coletar dados continuamente, nem contornar restrições das plataformas.

## Diferenças ainda pendentes

- Verificar a disponibilidade por competição com partidas reais e links auditáveis.
- Comparar fontes apenas quando ambas estiverem acessíveis.
- Avaliar licenças e alternativas de API se for desejada cobertura ampla ou atualização automática.
