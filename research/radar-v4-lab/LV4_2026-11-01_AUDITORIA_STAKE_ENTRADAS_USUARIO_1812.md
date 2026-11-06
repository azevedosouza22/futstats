# FutStats IA — LV4: auditoria inicial dos bilhetes reais na Stake
**Data das capturas:** 2026-11-01, aproximadamente 18h11–18h12 BRT (horário exibido no Android). **Fonte:** 5 imagens apresentadas pelo usuário nesta conversa. **Status:** PARCIAL, não presumir liquidação de apostas que continuam como "Ao Vivo".
**Modelo de referência congelado:** [previsões LV4 01/11, commit 9e50531](https://github.com/azevedosouza22/futstats/blob/9e50531db0c18f7603df601e007ee20022de4c19/research/radar-v4-lab/PREVISOES_PROSPECTIVAS_2026-11-01.json). Histórico de 10 jogos **não é probabilidade calibrada nem odd justa**.

## Seis entradas distintas, com evidência por screenshot

| Jogo | Mercado no bilhete | Odd | Stake | Retorno mostrado | Situação no print | LV4 original (mesmo período/mercado) | Corresponde? |
|---|---|---:|---:|---:|---|---|---|
| Athletic Bilbao × Real Sociedad | FT Over 2,5 gols | 1,74 | R$1 | R$1,74 | Vitória, seção "Definido", placar 2–1 aos 46' 2T | FT gols Over 2,5, 7/10 | SIM |
| Académico Viseu × Rio Ave | FT Over 2,5 gols | 1,86 | R$1 | R$1,86 | Vitória, seção "Definido", placar 2–1 | FT gols Over 2,5, 7/10 | SIM |
| Marítimo × Santa Clara | FT Over 2,5 gols | 2,41 | R$1 | R$0 | Derrota, seção "Definido", placar 0–2 | FT gols Over 2,5, 7/10 | SIM |
| Marítimo × Santa Clara | FT Over 7,5 escanteios | N/D | N/D | N/D | Derrota, seção "Definido", placar 0–2 | FT corners Over 7,5, 7/10 | SIM; odd/stake falta |
| Marseille × Toulouse | FT Over 2,5 gols | 1,47 | R$1 | R$1,47 potencial | Ao vivo, 67' 2T, placar 2–1 (três gols já cumpriram a linha); bilhete não mostrado na área "Definido" | FT gols Over 2,5, 7/10 | SIM |
| Juventus × Napoli | Aposta combinada no mesmo jogo: FT Over 1,5 gols **e** FT Over 8,5 escanteios | 2,04 (conjunto) | R$1 | R$2,04 potencial | Ao vivo 68' 2T 0–0, escanteios com marca verde, gols sem marca de acerto | FT gols Over 1,5, 8/10; FT corners **Over 9,5, 7/10** | PARCIAL — linha de cantos diferente |

**Importante:** "Ao vivo" pode indicar o jogo em andamento quando visto; NÃO prova horário de colocação da aposta. Capturas não incluem timestamp original dos bilhetes; não classificar odds como pré-jogo, e não usar odds ao vivo como se fossem pré-jogo.

## Situação financeira comprovada no print
- **Quatro bilhetes definidos:** 2 vitórias e 2 derrotas.
- **Dois bilhetes mostrados como ao vivo:** Marseille × Toulouse (critério de gols já alcançado em campo, liquidação financeira não comprovada), Juventus × Napoli (um dos dois critérios ainda não alcançado no momento da captura).
- Retorno de bilhetes definidos **com valor visível**: R$1,74 + R$1,86 + R$0 = R$3,60. Participação dos três com stake visível: R$3,00. O valor apostado no bilhete perdido dos escanteios do Marítimo não está visível; portanto **P&L fechado exato N/D**.
- **Se** stake de escanteios do Marítimo também foi R$1, então 4 definidos = 4×R$1 apostados; retorno = R$3,60 e resultado realizado hipotético = **−R$0,40** (ROI −10%), antes dos bilhetes ao vivo. Não promover essa hipótese a número confirmado.
- Saldo da interface R$22,60 (fotografado); não equivale isoladamente a lucro/prejuízo, porque há apostas em aberto e potencialmente outras movimentações.
- Odds, quantia e retorno da múltipla Juventus são do **bilhete inteiro**, não alocar odd 2,04 individualmente a cada perna.

## Probabilidades implícitas de ponto de equilíbrio (não previsão do LV4)
| Odd decimal | Probabilidade implícita 1/odd |
|---:|---:|
| 1,74 | 57,47% |
| 1,86 | 53,76% |
| 2,41 | 41,49% |
| 1,47 | 68,03% |
| 2,04 (combinada) | 49,02% |
Cuidado: o preço incorpora margem da operadora; odds de duas linhas combinadas podem refletir dependência entre os mercados. Histórico LV4 de 7/10 ou 8/10 não é p prospectiva; nenhum "valor" comprovado ainda.

## Conclusões e continuidade
1. Quatro eventos disponíveis mostram duas vitórias e duas derrotas; uma aposta vencedora em gols e uma aposta perdedora em escanteios ocorreram em mercados diferentes, sem contagem dupla de bilhetes.
2. Aplicar chave precisa competição × data × adversários × indicador × período × direção × linha, registrar data/hora da cotação antes de começo se houver.
3. Pedir apenas a informação faltante para fechar auditoria monetária: odd e stake do bilhete "Marítimo × Santa Clara — Over 7,5 escanteios", se disponíveis; demais informações do print já são suficientes para a apuração parcial.
4. Após definição dos dois ao vivo, conferir comprovantes de liquidação e possíveis cashouts antes de finalizar P&L real.
5. Nenhuma modificação no algoritmo, previsões congeladas, produção, Radar V2/V3, 659 partidas pessoais ou backups. Sem aposta automatizada, martingale, progressão ou sugestão de aumentar stake.
