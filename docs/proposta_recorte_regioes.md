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

## Lotes isentos em nome de construtora ou loteadora (Collin e Denton)

Tipo de isenção no cadastro: `EX-XV`, que no Texas é a isenção total genérica ("other exemptions", Código Tributário, seção 11.11 e seguintes: em geral propriedade pública ou destinada a uso público). Em nome de empresa, costuma ser lote já destinado a área comum, drenagem ou rua que ainda não foi transferido para a associação ou para a prefeitura. São 1215 lotes nos dois condados ({'Denton': 1200, 'Collin': 15}).

Amostra de 20:

| Condado | Conta | Dono | Descrição | Isenção | Valor da terra (US$) | Área (sqft) |
|---|---|---|---|---|--:|--:|
| Denton | 272430 | ASHTON DALLAS RESIDENTIAL LLC | LEXINGTON PARK PH 2 BLK F LOT 48X(OPEN SPACE) | EX-XV | 50 | 9.252 |
| Denton | 280883 | OPELA PARTNERS. LP | BELLE CREEK VILLAGE BLK D LOT 11X (COMMON AREA | EX-XV | 50 | 5.650 |
| Denton | 330815 | CPI VILLAGE LAKES LP | VILLAGE LAKES PH 2B BLK H LOT 33(OPEN SPACE) | EX-XV | 50 | 13.068 |
| Denton | 750762 | 23 PROPERTIES LLC | THE HILLS OF KINGSWOOD PH 1 BLK C LOT C-2 (COM | EX-XV | 50 | 4.661 |
| Denton | 684521 | D R HORTON -- TEXAS LTD | TEASLEY TRAILS PHASE I BLK D LOT 25 | EX-XV | 50 | 2.396 |
| Denton | 331010 | CHATEAU GROUP II LTD | CHATEAU DU LAC PH II BLK C LOT 7X (COMMON AREA | EX-XV | 50 | 31.363 |
| Denton | 161610 | IGLESIA JESUCRISTO REY DE REYES IN | T & P BLK 34 LOT 2 | EX-XV | 17.250 | 2.875 |
| Denton | 983272 | LINDEN HILLS RESIDENTIAL COMMUNITY | LINDEN HILLS PHASE 1 BLK B LOT 1X(OPEN SPACE) | EX-XV | 50 | 1.525 |
| Denton | 499871 | ROBSON DENTON DEV LP | ROBSON RANCH 7 PH 1 BLK A LOT 1-A-X PT OF STRE | EX-XV | 50 | 73.616 |
| Denton | 536563 | HIGH TROPHY DEVELOPMENT LLC | THE HIGHLANDS AT TROPHY CLUB NEIGHBORHOOD 6 PH | EX-XV | 50 | 1.712 |
| Denton | 292281 | ROBSON DENTON DEV LP | ROBSON RANCH 9 PH 1 BLK D LOT 1X (PRIVATE STRE | EX-XV | 50 | 158.558 |
| Denton | 164855 | WATER ASN OF NORTH LAKE SUB INC | NORTH LAKE COMPANY ADDN LOT RESERVED AREA(S PT | EX-XV | 50 | 10.302 |
| Denton | 269378 | ROBSON DENTON DEV LP | ROBSON RANCH 16 BLK A LOT 41(PRIVATE RD) | EX-XV | 50 | 212.007 |
| Denton | 330814 | CPI VILLAGE LAKES LP | VILLAGE LAKES PH 2B BLK A LOT 15(OPEN SPACE) | EX-XV | 50 | 6.534 |
| Denton | 675284 | LAER TRAMS - THE RIVERWALK FLOWER  | THE PINNACLE AT RIVER WALK BLK D LOT 10X | EX-XV | 50 | 7.971 |
| Denton | 766401 | BELMONT 407 LLC | A1063A PATRICK ROCK. TR 76E(3). 0.07 ACRES | EX-XV | 50 | 3.049 |
| Denton | 287850 | WENTWORTH VILLAS LP | WENTWORTH VILLAS BLK A LOT 21X (OPEN SPACE) | EX-XV | 50 | 4.657 |
| Denton | 730825 | ROBSON DENTON DEV LP | ROBSON RANCH UNIT 17-3 BLK B LOT 2X | EX-XV | 50 | 14.867 |
| Denton | 525896 | SUNSET POINTE I. LTD | SUNSET POINTE PH EIGHTEEN BLK 59 LOT 30X (COMM | EX-XV | 50 | 418 |
| Denton | 988232 | LENNON CREEK RESIDENTIAL COMMUNITY | LENNON CREEK ADDITION BLK C LOT 1X | EX-XV | 50 | 12.632 |

# Versão 2 do recorte (2026-11-24): setor censitário cortado por cidade e ISD

Atende às quatro condições do usuário. Exploratório; nada aplicado. Script: `scripts/estudos/lotes_vagos_recorte_v2.py`. Mapa: `docs/recorte_regioes_exemplo_v2.png`.

Regras usadas no exemplo (todas são propostas, a confirmar):
1. Região = setor censitário ∩ cidade ∩ ISD.
2. Pedaço com menos de 80 acres, ou com menos de 10% da parte do setor que fica na cidade, é unido ao vizinho da mesma cidade e do mesmo ISD com quem tem a maior divisa.
3. Franja: região com mais de 2.500 acres é cortada em células de 1,5 milha de lado.
4. Nome: cidade + loteamento mais frequente entre os terrenos vagos da região (com 5 ou mais lotes); sem isso, cidade + posição (norte, sudeste, centro…).
5. Renda por setor: fica com confiança baixa quando a margem de erro do Census passar de 20% do valor, e média nos demais (a implementar com a tabela de margens de erro).

Limitações vistas:
- O nome pelo loteamento dos terrenos vagos repete (ex.: "Lexington Parks (2)") e às vezes pega nome ruim ("Mansfield City Of"). Melhor usar o loteamento mais frequente entre TODOS os lotes da região, ou a via principal; exige baixar o cadastro completo da cidade.
- A grade de 1,5 milha corta loteamentos ao meio. Alternativa: cortar pelas vias principais.
- A parte de Mansfield no condado de Johnson continua sem lotes neste exemplo.

### Frisco

- Setor × cidade × ISD: 65 pedaços. Unidos ao vizinho por serem pequenos: 18. Regiões depois da união: 47. Dessas. 4 tinham mais de 2.500 acres e foram cortadas em células de 1.5 milha.
- **Regiões finais: 73** (mediana de 492 acres; 22 com 10 ou mais terrenos vagos; 34 sem nenhum).

| Região | ISD | Acres | Terrenos vagos | Franja subdividida |
|---|---|--:|--:|:-:|
| Frisco · Brookside North | Frisco ISD | 950 | 361 | sim |
| Frisco · Grove Frisco | Frisco ISD | 828 | 323 | sim |
| Frisco · Hazelwood | Frisco ISD | 1.378 | 183 | sim |
| Frisco · Lexington Parks (3) | Frisco ISD | 446 | 111 | sim |
| Frisco · Villages Of Creekwood | Little Elm ISD | 340 | 88 |  |
| Frisco · East Village | Frisco ISD | 2.098 | 75 |  |
| Frisco · Prestwick Grove | Prosper ISD | 1.020 | 74 | sim |
| Frisco · Lexington Parks | Frisco ISD | 392 | 68 | sim |
| Frisco · sudoeste | Lewisville ISD | 511 | 64 |  |
| Frisco · Brookside | Frisco ISD | 661 | 56 | sim |
| Frisco · Tapestry | Frisco ISD | 593 | 50 | sim |
| Frisco · Lexington Parks (2) | Frisco ISD | 1.009 | 34 | sim |

### Mansfield

- Setor × cidade × ISD: 26 pedaços. Unidos ao vizinho por serem pequenos: 8. Regiões depois da união: 18. Dessas. 3 tinham mais de 2.500 acres e foram cortadas em células de 1.5 milha.
- **Regiões finais: 34** (mediana de 637 acres; 18 com 10 ou mais terrenos vagos; 8 sem nenhum).

| Região | ISD | Acres | Terrenos vagos | Franja subdividida |
|---|---|--:|--:|:-:|
| Mansfield · Hamman Terrace | Mansfield ISD | 758 | 113 | sim |
| Mansfield · Rolling Acres | Mansfield ISD | 1.797 | 84 |  |
| Mansfield · Hillcrest | Mansfield ISD | 1.033 | 80 |  |
| Mansfield · Arbors Of Creekwood | Mansfield ISD | 2.359 | 69 |  |
| Mansfield · Hamman Terrace (2) | Mansfield ISD | 1.244 | 58 | sim |
| Mansfield · Mansfield City Of (2) | Mansfield ISD | 424 | 42 | sim |
| Mansfield · Mansfield Retail Center | Mansfield ISD | 1.148 | 39 | sim |
| Mansfield · Garden Heights | Mansfield ISD | 1.263 | 39 |  |
| Mansfield · Golden Acres | Mansfield ISD | 849 | 37 |  |
| Mansfield · Mansfield City Of | Mansfield ISD | 690 | 35 |  |
| Mansfield · Ridge Trace Mansfield | Mansfield ISD | 1.098 | 28 |  |
| Mansfield · noroeste | Mansfield ISD | 809 | 28 |  |
# Glebas acima de 5 acres, por código (contagem, sem limpeza)

| Condado | Código | O que é | 5 a 20 acres | Mais de 20 |
|---|---|---|--:|--:|
| Dallas | C11 | vago residencial | 500 | 125 |
| Dallas | C14 | rural vago | 36 | 5 |
| Dallas | D10 | terra agrícola qualificada | 776 | 599 |
| Dallas | C12 | vago comercial (não entra) | 2.357 | 931 |
| Collin | C1 | vago (residencial) | 512 | 143 |
| Collin | D1 | terra agrícola qualificada | 2.407 | 1.829 |
| Collin | D2 | benfeitorias em terra agrícola | 458 | 351 |
| Collin | E | rural não qualificada (inclui terra com casa) | 3.050 | 975 |
| Tarrant | C1 | vago residencial | 2.570 | 845 |
| Tarrant | D1 | terra agrícola qualificada | 1.103 | 773 |
| Tarrant | E / EC | rural não agrícola | 387 | 198 |
| Denton | C1 | vago residencial | 588 | 94 |
| Denton | D1 | terra agrícola qualificada | 1.970 | 1.779 |
| Denton | E4 | rural não qualificada, vaga | 926 | 521 |

Faltam Johnson, Kaufman, Rockwall, Hunt (rol em arquivo) e Ellis, Parker, Wise (sem código confiável).

# Glebas: conferências (2026-11-24, segunda rodada)

## Tarrant — por que há tantos "vagos residenciais" de 5 a 20 acres (2.570)
Amostra de 400 (os primeiros do cadastro, não ao acaso):
- 384 são glebas sem loteamento (descrição por "survey/abstract"), só 16 estão em loteamento.
- 176 estão na área de mercado "Community Facility General" (terra de uso comunitário ou público, como igrejas, escolas e órgãos); 30 em "Vacant Unplatted"; 23 na área do aeroporto DFW.
- Só 2 têm benfeitoria; exigir benfeitoria zero reduz de 2.570 para 2.555.
- Valor mediano da terra: cerca de US$ 23.500 por acre, com casos de mais de US$ 100 mil por acre (terra urbana).
Leitura: em Tarrant o código C1 recebe toda terra vaga não comercial e não agrícola, inclusive pública e institucional. A limpeza por dono e isenção deve cortar boa parte; o número real só sai depois dela.

## Collin — efeito de exigir benfeitoria zero (valores de 2026)

| Código | Faixa | Todos | Com benfeitoria zero |
|---|---|--:|--:|
| C1 (vago residencial) | 5 a 20 acres | 512 | 507 |
| C1 | mais de 20 | 143 | 143 |
| D1 (agrícola qualificada) | 5 a 20 | 2.407 | 2.405 |
| D1 | mais de 20 | 1.829 | 1.828 |
| D2 (benfeitorias em terra agrícola) | 5 a 20 | 458 | 3 |
| D2 | mais de 20 | 351 | 3 |
| E (rural não qualificada) | 5 a 20 | 3.050 | 335 |
| E | mais de 20 | 975 | 110 |

A regra resolve a mistura: o "rural" de Collin cai de 4.025 para 445, e o D2 praticamente desaparece (é, por definição, terra com benfeitoria).
