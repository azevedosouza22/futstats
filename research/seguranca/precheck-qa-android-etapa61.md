# FutStats IA — Etapa 61 · Pré-check de QA Android, sem liberação

**26/10/2026 · branch experimental filha da Etapa 60. Não aplicar em main/Vercel.**

## O que a pessoa pode fazer

Na área **Segurança V4**, botão **“Preparar testes Android e verificar bloqueios de liberação”**. Por ação explícita e sem upload/rede/importação, o aplicativo:
1. Inspeciona a integridade dos nove grupos do navegador.
2. Executa um ensaio de restauração somente num `Map` isolado, validando número de grupos e contagens.
3. Mede a largura da tela/rolagem horizontal e disponibilidade de UUID/SHA-256.
4. Mostra **4 checagens locais** e os motivos de revisão, além de quatro **pendências sempre abertas**: teste em Android físico, backup fora do aparelho, evidência prospectiva externa real e integração/deploy autorizados.
5. Permite baixar **`futstats-checklist-qa-android.csv`**: apenas rótulos, estados e explicações; não inclui dados, IDs, URL, previsão, nome de clubes ou conteúdo do storage.

A tela pode sinalizar **“Apto a iniciar o teste físico”** quando os controles locais estão 4/4. Mesmo assim o veredicto é **“NÃO LIBERADO PARA PRODUÇÃO”**. O uso desta interface **não** atesta Android físico, durabilidade do backup, resultado esportivo independente ou precisão do Radar. A checagem é pontual: se os dados locais mudarem, o diagnóstico precisa ser repetido.

## Segurança / critérios
- Implementação pura em `src/androidReleaseQaGate.ts`: comparações de integridade, estados e mensagens; não importa conteúdo, não grava arquivos nem conclui QA físico. Veredicto de liberação é deliberadamente bloqueado até processo humano controlado, com autorização explícita.
- `src/SafetyArchivePanel.tsx`: apenas chama `inspectSafetyStorage` e `dryRunV4Restore`, cuja restauração de fato se dá num `Map`, nunca no `localStorage` do usuário; captura erros sem corrigir dados por conta própria.
- Se não houver nenhum grupo V4, ou se estiver corrompido/indisponível, o diagnóstico não assume recuperabilidade. Um ensaio inconsistente com as contagens atuais também é REVISAR.
- Nunca armazena a declaração de resultado, nunca chama GitHub/Vercel, jamais promove PR experimental a produção. Checklist CSV não fornece controle de liberação.
- Não altera as 659 partidas reais, Radar V2/V3, Work, backups ou versão PWA instalada.

## Testes
- Vitest: 4/4 local → ainda 4 pendências externas e produção bloqueada; ausência, corrupção, contagens divergentes, tela menor que 320px, SHA-256 indisponível, CSV livre de dados pessoais e fórmulas de planilha, entrada imutável.
- Playwright desktop + viewport Android com **dados sintéticos isolados**: salvar previsão, conferir pré-check 4/4, baixar CSV de 10 linhas e comparar `localStorage` completo byte a byte; perfil sem dados e grupo Radar artificialmente corrompido continuam bloqueados.
- Compilação TypeScript/Vite e CI verde obrigatórios antes de acrescentar um ponto no Controle Mestre.
- QA físico Android e confirmação de arquivo guardado fora do aparelho **não podem ser provados pelo GitHub Actions**; permanecem pendências reais. A coorte externa 0/30 continua inalterada.

## Próximos passos
O ponto seguinte depende de teste efetivo com aparelho Android e de autorização específica de integração; não presumir essa autorização. Revalidar fontes/resultados reais sem inventar qualquer dado. Apenas após cumprir os critérios pendentes é seguro reavaliar a liberação.
