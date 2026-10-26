# FutStats IA — Etapa 54: autoteste de recuperação V4 sem risco para os dados

**25/10/2026, horário de Brasília. Implementado apenas em PR experimental filho da Etapa 53.** A funcionalidade não está publicada em produção.

## Mudança concreta
Em **Segurança V4 · Conferência e cópia integral**, novo botão **“Testar recuperação V4 sem alterar dados”**.

O botão executa, **apenas quando a pessoa o aciona**:
1. Leitura consistente dos **nove grupos** do armazenamento V4 (Histórico, Radar original, dados e previsões Work, preferências e agenda CSV).
2. Criação e inspeção do arquivo V4 em memória. Se houver JSON inválido, grupo inconsistente, histórico corrompido ou mudança detectável durante a leitura, interrompe e exibe erro; não simula sucesso.
3. Simulação da rotina **real** `restoreSafetyArchiveEmpty` num **Map interno vazio**, nunca no `localStorage` real. O recuperador escreve e verifica cada campo somente no Map.
4. Comparação byte a byte de todas as chaves originais, inclusive as explicitamente ausentes (`null`) e previsão congelada sem recalcular modelos. Confere que o armazenamento real continua igual após o teste.
5. Exibe **“Autoteste PASSOU — apenas memória isolada”** com grupos recuperados e contagens do Histórico, Radar, Work e agenda, ou erro específico se as condições não permitirem demonstrar a integridade.

Este ensaio **NÃO baixa nem produz um arquivo persistente**, não restaura o navegador, não comprova confiabilidade de armazenamento físico, nem substitui o **backup real em arquivo privado**. Ele testa o código lógico de exportação, parser e restauração antes de um usuário tentar restaurar uma cópia num outro perfil vazio. Se não houver dados em nenhum dos nove grupos, não é possível alegar recuperação exitosa: mostra erro.

## Segurança e preservação
- O parâmetro de origem de `dryRunV4Restore` aceita somente `getItem`; não há `setItem` ou `removeItem` disponível para o armazenamento real.
- A simulação utiliza a mesma função de restauração que já exige perfil V4 vazio, com reversão transacional e verificação de bytes em todos os grupos.
- Não executa consultas de sites, importa jogos, apaga dados, modifica backups externos, faz merge nem deploy.
- A quantidade **659** nos testes é amostra **sintética**. Não é uma leitura automática da base pessoal do usuário. Contagens reais só aparecem quando o próprio usuário executa a função no aparelho.
- Preserva produção, 659 históricos originais do usuário, Radar V2/V3, Work e backups. Nada de captura do armazenamento para GitHub/Vercel.

## Testes automáticos
- **Unitários:** 659 jogos sintéticos + previsão Radar e conteúdo exato, nove grupos com alguns ausentes, agenda local, arquivo sem nenhum registro, Radar corrompido, mudança durante a captura, nenhum `setItem` ou `removeItem` no armazenamento original e ausência preservada como ausência.
- **Playwright desktop + viewport Android:** cria no navegador de testes um histórico sintético, grava uma previsão por “As Boas”, abre a tela Segurança, executa o autoteste, confere contagens e todos os valores de localStorage intactos; reinicia a interface e recupera a previsão; introduz **somente no navegador de testes** um JSON inválido e exige que o ensaio recuse dados inconsistentes **sem apagar nem corrigir artificialmente nada**.
- **Aceite obrigatório:** Vitest, TypeScript/Vite e todas as rotas Playwright no CI verdes no mesmo HEAD, antes de elevar o controle de 80% para 81%. QA em Android físico permanece pendente.

## Próxima execução
Depois da validação automatizada, preparar a verificação integrada no Android real quando a integração dos PRs for autorizada, sem substituir a versão atual, e trabalhar nas lacunas de dados e evidências prospectivas realmente comprováveis em separado.
