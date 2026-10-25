# FutStats IA — Etapa 45 · reconciliação documental de uma segunda fonte

**Data:** 25/10/2026. Ramo experimental filho do PR #44, sem merge, deploy, importação no histórico ou qualquer alteração da produção, 659 partidas, Radar V2/V3, Work e backups.

## Objetivo e fronteira de confiança
- O app já guarda a previsão congelada e um possível **resultado local com fonte CSV documentada**. Agora oferece um **modelo JSON vazio** para que uma fonte diferente seja descrita e os valores informados sejam confrontados indicador por indicador.
- **Não há busca na web dentro do app nesta etapa.** O arquivo fornecido não comprova que a página foi aberta nem que seu conteúdo corresponde ao declarado. Assim, mesmo quando a comparação mostra COINCIDE, ela continua sendo **DOCUMENTAÇÃO INFORMADA — NÃO VERIFICADA NA WEB**, com estado externo PENDENTE.
- Nenhum confronto prospectivo real foi pontuado por este trabalho. Os testes são sintéticos. Não existe qualquer medição de acerto real.

## Fluxo experimental proposto
1. Uma previsão de “As Boas do Dia” deve ter sido explicitamente salva antes do jogo, com origem oficial e indicadores V2/V3 congelados.
2. Depois do jogo e da margem conservadora de 120 minutos, um resultado local comprovadamente **registrado com metadados CSV** pode aparecer como `check_external`.
3. Na fila de conferência, o botão **Modelo vazio para comparar este jogo** exporta `futstats-segunda-fonte-modelo.json` com ID exato da previsão, competição, times, data/hora e IDs de indicadores com `actual:null`. Este arquivo é deliberadamente inválido até ser preenchido.
4. Somente após realmente consultar outra fonte, preencher a URL HTTPS, o horário UTC da consulta e os valores presentes. O upload local permite comparar **COINCIDE**, **DIVERGE** e **N/D** sem escrever nos registros originais.
5. A comparação existe **apenas em memória da tela**, não é salvação automática, verificação eletrônica do fornecedor ou taxa de sucesso dos modelos. Resultado informado incorreto não pode ser distinguido de informação verdadeira sem um navegador/humano conferindo a fonte.

## Regras técnicas
- Parser estrito: formato/versionamento, uma única previsão existente, campeonato/data/horário e mandante/visitante exatos (normalização de equipe sem alterar dados); somente 1–3 indicadores conhecidos, IDs únicos, valores inteiros não negativos.
- Rejeita campos inesperados, inclusive uma bandeira `verified:true`; jamais recebe confirmação via arquivo.
- Permite fontes secundárias HTTPS de domínio exato, com caminho, em `www.sofascore.com`, `www.espn.com.br`, `www.espn.com` ou `www.fotmob.com`; endereços parecidos e URLs com credenciais são recusados. Isso é filtro estrutural; **não é verificação de conteúdo, cobertura ou disponibilidade da fonte**.
- A fonte secundária deve usar domínio distinto da origem do CSV local (ex.: Flashscore); fonte do calendário oficial não basta para resultados.
- Checagem UTC deve vir depois do início +120min e não pode estar no futuro. Não aceitamos uma comparação para partida sem status local `scored`, com registro legado, excluído, ambíguo, sem resultado numérico ou não relacionado aos mercados da previsão.
- Divergência bloqueia qualquer conclusão positiva. Concordância documental **também não altera o estado PENDENTE da revisão externa**, pois pode se basear num arquivo preenchido incorretamente.
- Upload até 200 KB. Nenhuma gravação no localStorage, alteração do histórico, fonte consultada em background, reprocessamento de previsões ou restauração de dados.

## Testes
- Vitest: passagem de documento válido, igualdade/divergência/N/D, rejeição de futuro, prazo pós-partida, identidade, duplicatas, host impostor, valor negativo, campos injetados e tentativa de confundir fonte do mesmo provedor.
- Playwright desktop e viewport Android: grava previsão sintética, simula um resultado CSV de teste em navegador isolado, baixa o modelo, comprova que o modelo vazio é recusado, compara igualdade e divergência, e confirma que o registro de previsão original continua byte a byte inalterado.
- A execução dos testes e a criação deste módulo **não implicam obtenção de nenhum resultado externo real**.
