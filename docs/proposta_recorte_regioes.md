# Proposta de recorte das regiões dentro das cidades — exemplo em Frisco e Mansfield (2026-11-24)

Estudo exploratório, para aprovação do usuário. Nada foi aplicado à base. Scripts em `scripts/estudos/`. Mapa: `docs/recorte_regioes_exemplo.png`.

## Dados usados
Lotes com código de vago residencial (C1) dos cadastros de Collin (dados de 2026-10-23), Denton (rol em andamento de 2027) e Tarrant (2026 certificado).
Mansfield tem uma parte no condado de Johnson, que não entrou neste exemplo.

## Limpeza (passos a, b e c aprovados; o passo d ainda não foi definido)

| Passo | Frisco | Mansfield |
|---|--:|--:|
| Lotes C1 no cadastro | 2.879 | 1.270 |
| a) dono: HOA, prefeitura, condado, estado, escola, distrito de água, concessionária, igreja | −1.005 | −302 |
| b) isenção total de imposto | −111 | 0 (o serviço de Tarrant não traz o campo de isenção) |
| c) descrição: área comum, espaço aberto, drenagem, servidão, parque etc. | −14 | −195 |
| Restam | 1.749 | 773 |

Pontos a conferir antes de aplicar em tudo:
- Em Mansfield o passo c) pegou 122 lotes por "open space" e 31 por "park". "Park" e "row" podem aparecer no nome do loteamento ou em "less ROW" (lote que perdeu uma faixa para a rua): há falsos positivos.
- Em Frisco, entre os isentos do passo b) há lotes em nome de construtoras e loteadoras (ex.: 16 da LBIG Park West Land, 14 da CalAtlantic Homes).
- Em Frisco, 796 dos lotes restantes vêm sem tamanho no cadastro (dá para calcular pela área do desenho do lote) e 807 têm menos de 2.000 sqft: é o que o passo d) precisa tratar.

Distribuição por tamanho depois da limpeza (só lotes com tamanho):
- Frisco: até 0,25 acre 629; 0,25–0,5: 160; 0,5–1: 114; 1–5: 43; 5–20: 3; mais de 20: 4.
- Mansfield: até 0,25 acre 165; 0,25–0,5: 123; 0,5–1: 134; 1–5: 254; 5–20: 81; mais de 20: 16.

## Os três critérios

| Critério | Frisco | Mansfield | Observação |
|---|---|---|---|
| Setor censitário | 23 regiões; mediana de 16 lotes; 10 com menos de 10 lotes | 17 regiões; mediana de 28; 4 com menos de 10 | Todo lote cai em uma região. Limite oficial e estável; é a mesma escala da renda já calculada |
| ZIP | 5 regiões; 241 lotes sem ZIP no cadastro | o cadastro de Tarrant não traz ZIP do lote | Grande demais para separar bairros; exigiria outra fonte para o contorno |
| Proximidade (lotes a até 400 m, mínimo de 10) | 20 regiões; mediana de 35; 52 lotes isolados sem região | 13 regiões; mediana de 22; 137 lotes isolados sem região | Acompanha os loteamentos de verdade, mas a região muda a cada atualização e os lotes isolados ficam de fora |

## Recomendação
Usar o **setor censitário** como região dentro da cidade:
- todo terreno vago pertence a uma região, inclusive os isolados (que interessam a quem quer um lote só);
- o limite é oficial e não muda entre uma atualização do cadastro e a outra, então dá para comparar no tempo;
- renda e domicílios já existem nessa escala, e o distrito escolar pode ser cruzado com o setor;
- setor com menos de 10 terrenos vagos na faixa de tamanho fica "sem dado" no custo de referência, como já definido.

Dentro de cada setor, a ficha da região pode listar os loteamentos com mais terrenos vagos (informação que o agrupamento por proximidade mostra bem), sem que isso vire a unidade do ranking.
