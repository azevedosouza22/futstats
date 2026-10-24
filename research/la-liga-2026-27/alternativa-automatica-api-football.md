# FutStats — alternativa automatizada à coleta no Work (22/10/2026)

## Problema real
Imagem enviada pelo usuário: o ChatGPT Work exibiu **limite temporário de uso** com redefinição informada às **22h33**, não erro nos 63 jogos existentes. Não contratar Pro do ChatGPT por causa desse aviso sem antes avaliar alternativas. O último CSV da La Liga recebido possui **63 jogos completos em 55 colunas**, com **27 confrontos ausentes do calendário de datas até 22/10/2026** (apenas jogos efetivamente encerrados entram na coleta). Roteiro de retomada: `research/la-liga-2026-27/retomada-apos-63-jogos.md`.

## Descoberta técnica
A base de código do projeto **já possui** `src/AutomaticMatches.tsx`, `src/apiFootball.ts` e `server/api-football.js`: o painel de API-Football oferece consulta separada `/fixtures/statistics?fixture=<ID>` e `...&half=true`, e reconhece `Total Shots`, `Shots on Goal`, `Corner Kicks`. O backend atual é **apenas uma prova de conceito privada (PoC)**, protegida por token, datas e IDs permitidos via variáveis de ambiente, limite de 8 requisições/minuto e orçamento de 80 requisições por instância; **não tentar contornar/remover essas proteções** nem tratá-lo como serviço público de coleta automática.

Fontes oficiais verificadas:
- Documentação API-Sports: https://api-sports.io/documentation/football/v3 — `GET /fixtures/statistics?fixture=ID&half=true`, estatísticas completas e por 1º e 2º tempo desde a temporada de 2024 (cobertura específica da liga/temporada pode variar).
- Preços https://www.api-football.com/pricing/ : plano Free US$0, **100 chamadas/dia** (temporadas limitadas); Pro US$19/mês, **7.500 chamadas/dia**.
- Direitos https://www.api-football.com/terms : permissão de API não equivale automaticamente a licença para redistribuição/publicação de conteúdo estatístico de ligas nem para revenda de dados; validar antes de monetizar.

## Plano de teste seguro (sem pedir prints ou comandos técnicos ao usuário)
1. Usar a PoC privada **apenas no conjunto de IDs/datas que o proprietário já autorizou** para confirmar resposta, tipo de estatísticas e semântica dos campos `statistics`, `statistics_1h`, `statistics_2h`; NÃO tentar usar IDs não autorizados.
2. Confirmar com o provedor se a cota gratuita cobre realmente **La Liga 2026/27** e se **os quatro indicadores por período** existem para um jogo concluído. **Um único jogo primeiro**. Não presumir cobertura com base apenas na documentação geral.
3. Se positivo, construir na **branch experimental PR #13** um **coletor sob credenciais privadas do proprietário** que leia catálogo de jogos encerrados e consulta uma vez por partida, com rate limiting, checkpoint persistente e sem duplicatas. Reconciliar FT/HT/2T, nomes, datas e IDs; `N/D` não é zero. Não armazenar/repassar chaves de API no frontend nem GitHub; sem logs sensíveis.
4. Emitir resultados em **CSV local 55 colunas + relatório** ou guardar em área de pesquisa pessoal separada, preservando **659 históricos, 155 resultados CC0, 70 jogos completos da Serie A e Radar**. O usuário deverá revisar antes de qualquer integração mais ampla.
5. Se não houver cobertura dos tempos no gratuito, não comprar plano às cegas. Verificar permissão/planos e comparar custo real; enquanto isso, retomar **os jogos faltantes** pelo Work depois da redefinição da cota, a partir dos 63 existentes, sem refazer todo o campeonato.

## Ponto de decisão
**Ainda NÃO houve coleta de dados La Liga pela API-Football nesta etapa**, apenas verificação da documentação e do código da integração existente. Não prometer 27 jogos completos de forma automática até passar em um teste de cobertura com conta/credenciais autorizadas. Não modificar produção nem chamar um fluxo que exija repetidas capturas de tela do usuário.
