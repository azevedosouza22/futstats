# FutStats IA — Etapa 70 · primeiro caso real conferido em duas páginas públicas

**Consulta pontual realizada em 26/10/2026.** Esta etapa não significa que o usuário fez uma previsão para este jogo e não autentica automaticamente conteúdo web dentro do PWA.

## Partida conferida: Barcelona 1 × 2 Real Madrid
- **25/10/2026 — La Liga espanhola 2026/27**, rodada 10; FC Barcelona mandante e Real Madrid visitante.
- **1º tempo:** 0 × 1. **Final:** 1 × 2.
- **2º tempo:** 1 × 1, obtido apenas por **subtração aritmética** das duas pontuações verificadas; não é um novo dado extraído da página.
- **Finalizações, chutes no alvo, escanteios (total/1º/2º): N/D.** Não foram comprovados individualmente nas consultas realizadas; não se deve usar gols como substitutos.
- **Referência 1 (organizadora da competição):** https://www.laliga.com/en-GB/partidazos/el-clasico — placar final 1×2 e texto de encerramento do primeiro tempo 0×1.
- **Referência 2 (clube mandante):** https://www.fcbarcelona.com/en/matches/138374/fc-barcelona-real-madrid-la-liga-2026-2027 — placar final 1×2, HT 0:1.
- Os dois endereços foram abertos e lidos pontualmente em 26/10/2026. Trata-se de **duas páginas de entidades distintas**, não de prova técnica de que os respectivos bancos de estatísticas sejam inteiramente independentes, nem de atualização contínua.

## Entrega funcional
Em **Radar → Ver previsões já registradas → Validação prospectiva**, a área recolhível **“Exemplo real de conferência · Barcelona × Real Madrid (25/10)”** mostra placar, intervalo, segundo tempo derivado, lacunas N/D e links reais.

`src/publicResultPilot.ts` guarda exclusivamente as duas observações datadas; `src/publicResultCrosscheck.ts` compara identidades, os dois placares, datas, domínios HTTPS estritos e coerência do primeiro tempo. A função é somente leitura e **NÃO abre páginas, não prova tecnicamente sua consulta, não importa jogo CSV e não altera registros originais**. Uma discordância entre duas páginas retorna `DIVERGENTE`, com pontuações N/D — jamais decide arbitrariamente qual está certa. Sem intervalo coincidente, 2º tempo N/D.

O piloto aparece somente a partir da data de conferência, nunca no relógio simulado pré-jogo do teste. Testes garantem fonte impostora recusada, dados inválidos bloqueados e nenhuma gravação local ao consultar o exemplo.

## O que NÃO está concluído
- **Nenhuma previsão original do usuário, congelada pré-jogo, foi localizada/acessada para esta partida.** O GitHub não contém o `localStorage` privado do Android.
- Portanto, **zero previsões desta partida são avaliadas**, não há acerto/erro de IA, e as coortes prospectivas externas continuam **0/30 por liga**, taxa N/D, mesmo que o placar real tenha sido conferido.
- Não houve consulta pontual de finalizações, chutes no alvo e escanteios, nem validação de outro campeonato.
- Não houve teste em Android físico, exportação real de backup para outro dispositivo, autorização para merge ou deploy.

## Critério para progredir de 96% rumo a 100%
Os três pontos restantes de qualidade preditiva dependem de previsões **efetivamente registradas antes dos jogos** e de resultados confrontados posteriormente nas fontes, sem dados retrospectivos inventados. O último ponto de entrega depende de QA Android físico, recuperação de backup fora do navegador de teste e integração autorizada.

**Segurança:** PR DRAFT empilhado sobre #69, nenhum merge/deploy, acesso a GitHub apenas para os arquivos experimentais, sem importação de CSV nem alteração dos 659 históricos reais, Radar V2/V3, Work e backups.

A consulta manual e o exemplo real permitem exercitar o fluxo de conferência de fontes; **não podem ser convertidos em estatística prospectiva**, mesmo que sua concordância seja perfeita.
