# FutStats IA — LV4: disponibilidade de mercados e restrição regulatória
**Registro em 01/11/2026.** Documento operacional para pesquisa experimental. Não substitui aconselhamento jurídico. Não muda código, previsões congeladas, produção, base de 659 partidas ou Radar V2/V3.

## Separação fundamental
O LV4 **sempre analisa** quatro indicadores no jogo completo, no 1º tempo e no 2º tempo:
1. Gols — a plataforma consultada ocasionalmente mostra cotações.
2. Escanteios — a plataforma consultada ocasionalmente mostra cotações.
3. Finalizações — sem cotação disponível na plataforma informada.
4. Chutes no gol — sem cotação disponível na plataforma informada.

Ausência de cotação ≠ erro da previsão. Os dados estatísticos devem continuar sendo coletados dos resultados esportivos sem dependência de odds. Previsões originais e resultados de todos os mercados permanecem congelados/auditados. Para cotação ausente: `odd=N/D`, `preco_justo=N/D`, `ROI=N/D` por sinal (não confundir com ROI de bilhete efetivamente liquidado).

Se cotações forem encontradas futuramente, apenas registrar data/hora, casa, campeonato, partida, período, mercado e linha *exata*; nunca inferir odds de mercado correlato, não equiparar linhas diferentes. Evidência de odd sem timestamp pré-jogo não é cotação pré-jogo comprovada.

## Vigência regulatória e restrição de operações
A Medida Provisória nº **1.394/2026**, de **25/09/2026**, proibiu em território brasileiro a exploração, oferta, intermediação e publicidade de apostas de quota fixa — **não apenas finalizações/chutes no gol, mas apostas esportivas e on-line de quota fixa em geral**. Referências oficiais consultadas:
- https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/medida-provisoria-ndeg-1-394-2026-entenda-as-novas-regras-para-as-apostas-de-quota-fixa
- https://www.congressonacional.leg.br/materias/medidas-provisorias/-/mpv/175871

**Regra operacional enquanto vigente:** desenvolver/apurar LV4 em **modo de pesquisa e simulação**, sem iniciar, orientar ou automatizar apostas reais, novos depósitos, progressão de banca ou maneiras de contornar a proibição. Havendo alteração legal, validar novamente a situação oficial antes de qualquer mudança no protocolo.

## Relatórios de pré-jogo
- **Painel estatístico (sempre):** gols, finalizações, chutes no gol, escanteios; histórico n/N, período, linha, status da validação.
- **Painel de cotações (quando existente):** apenas odds verificadas, com origem, horário e linha correspondente; não converter frequência histórica 8/10 em p=80% prospectiva.
- **Panel de resultado:** comparativo entre previsão e fatos, independentemente de existirem odds ou bilhetes. O ROI financeiro deve refletir somente bilhetes liquidados, e nunca sinais que não se tornaram apostas.
