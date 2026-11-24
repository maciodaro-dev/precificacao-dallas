# Especificação consolidada: o que muda, unidades, esquema, fontes e stack

Preparado em 2026-11-24 para aprovação. **Nada foi alterado nos dados nem no código.** As mudanças abaixo só serão feitas depois da aprovação.

## 1. O que muda em relação ao que já está construído

### 1.1 Já está de acordo (não muda)

- Oito etapas, base única separada das telas, ID fixo por unidade, valor bruto com unidade, fonte, data e confiança.
- Motor único sem filtros: sim/não vale nota cheia ou zero, valor escolhido cai com a distância, pesos baixo/médio/alto, todas as unidades aparecem, "Não atende" por unidade.
- Modo simples (8 perguntas, uma por tela, regras em arquivo editável) e modo completo (painel, nº de casas livre, ao mesmo tempo / em sequência), com o mesmo destaque.
- Passagem entre modos: origem de cada valor, ajuste manual preservado com aviso de conflito, perfis salvos.
- Saídas: 5 melhores com explicação, comparação de 2 e de 4, mapa com camadas, resumo de uma página, exportação .xlsx e .csv.
- Dono nos dados privados, tabela de licenças, fonte e data em todo resultado, aviso de apoio à decisão, sinal de dado com mais de 6 meses, registro de premissas, lista de pendências, script por fonte.

### 1.2 Novo (a construir)

| Item | O que é | Onde mexe |
|---|---|---|
| Ponto de partida | Primeira tela "Você já tem o terreno?". **Não** leva a "Onde construir?". **Sim** pede endereço ou cidade, vincula à unidade, mostra só o retrato (sem ranking, posição ou sugestão de outras) e faz 3 perguntas sim / não / não sei | tela nova; `Projeto.ponto_partida` |
| Etapas "já realizadas" | Resposta "sim" não remove a etapa: marca como realizada, pede o valor gasto (ou usa estimativa marcada como premissa) e lança como realizado na pilha. A etapa 3 pode ficar parcialmente realizada (aprovações × projeto) | `Projeto.etapas`; `linha_custo` |
| Terreno já possuído | Preço pago, data da compra e valor de mercado atual; a etapa 8 mostra a margem sobre o preço pago e sobre o valor atual; o tempo já decorrido não entra no carregamento | `Terreno` |
| Due diligence do terreno | Lista da etapa 2: zona FEMA do lote, laudo de solo, easements, deed restrictions/HOA, acesso, distância da rede, direitos minerais, rollback tax, área mínima para fossa | `Terreno.due_diligence` (esquema; tela na etapa 2) |
| "Uso permitido" na etapa 3 | Entra na descrição e no esquema da etapa 3 | texto e esquema |
| Fonte, data e confiança no ranking | Hoje aparecem no detalhe da unidade e na exportação; passam a aparecer também no ranking (ao passar o mouse em cada valor) | tabela do ranking |
| MUD/PID com peso alto por padrão | Hoje entra com peso médio | regras |
| Textos das perguntas 1, 3, 5 e 8 | Ajuste de redação para os textos desta especificação | perguntas |

### 1.3 Volta ao que estava antes (desfazer)

| Item | Hoje | Passa a ser |
|---|---|---|
| Opções de imposto | até 1,7 / 1,9 / 2,0 / 2,2% | até 1,8 / 2,0 / 2,2 / 2,5% |
| Opções de alagamento | até 5 / 10 / 20 / 35% | até 5 / 10 / 15 / 25% |
| Opções de emprego | até 15 / 20 / 25 / 35 min | até 15 / 25 / 35 / 45 min |
| Opções de valorização | 5 / 10 / 15 / 20% ou mais | negativa ou zero / 5 / 10 / 20 / 30% ou mais |
| Opções de casas novas | 50 / 150 / 400 / 1.500 | 50 / 200 / 500 / 1.000 ou mais |
| Opções de renda | $75 / 85 / 110 / 130 mil | $75 / 100 / 125 / 150 mil ou mais |
| Opções de tamanho | até 0,25 / até 0,5 / 0,5–1 / 0,5–5 / 1–20 / 5 ou mais | até 0,25 / 0,25–0,5 / 0,5–1 / 1–5 / 5–20 / mais de 20 |
| Custo de lotear | até $25 / 50 / 75 / 100 mil | até $25 mil / $25–50 mil / $50–75 mil / mais de $75 mil |
| Lote pronto | Sim / Indiferente | Sim / Não |

Eu tinha recalibrado seis dessas listas pelos quartis sem a sua comparação. A especificação pede o contrário: números redondos agora e a comparação com os quartis para você decidir (seção 7 deste documento).

### 1.4 Sai

- Motor antigo de pesos por controle deslizante e as cinco estratégias prontas (`data/perfis.json`), já fora da tela.
- Campos antigos do Projeto que ninguém mais lê (`pesos`, `filtros`, `tamanho`, `respostas`, `caminho`).
- Botão "Ver terrenos no Homes.com" e a orientação de digitar o que foi visto lá, **se** você confirmar a decisão D3 abaixo.

### 1.5 Pontos em que a especificação se contradiz ou não fecha (preciso da sua decisão)

| # | Ponto | O que encontrei | Minha recomendação |
|---|---|---|---|
| D1 | Cidades da borda | A lista da seção 5 tem as 67 cidades originais. Hoje a base tem 72: você tinha incluído Grand Prairie, Ferris, Oak Leaf, Pecan Hill e Pilot Point, que somam 12 unidades | Manter as 72, porque foi decisão sua; se a lista nova vale, saem 12 unidades |
| D2 | Áreas não incorporadas | A seção 5 diz "por condado" (6 unidades). Hoje são 27, por condado × ISD, como você escolheu. No ponto de partida, o terreno é vinculado a "cidade + ISD", o que só funciona fora da cidade se a unidade tiver ISD | Manter condado × ISD |
| D3 | Dados de terra (1, 2, 3, 5) e "o usuário nunca preenche" | Não existe fonte pública para anúncios de terreno, e o Homes.com não pode ser coletado. Sem preenchimento manual, esses quatro dados ficam "sem dado" e a faixa de investimento não muda a nota | Manter o preenchimento manual como dado privado do dono, fora da base pública, até haver fonte licenciada |
| D4 | Valores da sua planilha | 70 unidades têm imposto vindo da sua planilha (aproximado), além de segurança, mobilidade e idade das casas em texto. Não são fonte pública | Tirar da base pública; o imposto fica "sem dado" até eu obter a alíquota oficial (decisão D8) |
| D5 | "Todo valor da base é editável" × "o usuário nunca preenche" | Leio assim: o usuário não é obrigado a preencher nada, mas pode corrigir um valor; a correção é privada e datada | Confirmar essa leitura |
| D6 | Regras do modo simples × opções fixas | As regras pedem tamanhos que não existem como opção (até 0,5; 0,5–5; 1–20; 5 ou mais) e renda = preço ÷ 3,5 (ex.: $114 mil) | Tamanho aceita marcar opções vizinhas (0,5–5 = "0,5–1" + "1–5"); renda arredonda para a opção mais próxima |
| D7 | Liquidez do terreno | A regra "uma de cada vez" pede peso alto em liquidez do terreno, que não está na lista de parâmetros da seção 7 | Incluir no grupo Terra: até 90 / 180 / 365 dias |
| D8 | Custo de lotear e casas novas "na faixa" | "Mais de $75 mil" como resposta desejada não faz sentido para nota (ninguém prefere pagar mais). Casas novas por faixa de preço não existem em dado público | Custo de lotear como teto (até 25 / 50 / 75 / sem teto); casas novas pelo total da cidade, com aviso |
| D9 | Rede para coleta | Para imposto oficial, moratórias, crime, taxas e zoneamento preciso de acesso a dezenas de sites (appraisal districts, prefeituras, FBI). Hoje o ambiente só libera 25 | Você libera a rede do ambiente nas configurações, ou eu peço os sites em lotes |
| D10 | As 5 cidades da validação | A especificação diz "que vou indicar". Já validei Frisco, Celina, Plano, Wylie e Parker | Manter as mesmas, refazendo a validação depois das mudanças |

### 1.6 Mudanças em dados que só faço com a sua aprovação

1. Unidades: nenhuma, se D1 e D2 ficarem como recomendo. Caso contrário, saem 12 unidades (D1) e 27 viram 6 (D2).
2. Retirar da base pública os valores da sua planilha (D4).
3. Apagar `data/perfis.json` e atualizar nomes em `data/criterios.json` (13 = peso do terreno no preço; 24 = imposto total com MUD/PID).
4. Atualizar o registro de premissas (opções de volta aos números redondos; novas regras).
5. Coletas novas, cada uma com script próprio: moratória de todas as cidades, imposto oficial, crime, taxas por casa, zoneamento, água e esgoto, seguro. Dependem da D9.

## 2. Lista final de unidades

Fonte: Census TIGER/Line 2025. Hoje: **171 unidades** = 144 cidade × ISD (em 72 cidades) + 27 áreas não incorporadas (condado × ISD). Regra: a fatia cidade × ISD entra com ≥ 5% da área de terra da cidade ou ≥ 1.000 acres. As 12 unidades marcadas ‡ pertencem às 5 cidades da borda (decisão D1). Hunt County aparece em Royse City e Josephine e precisa entrar na lista de appraisal districts.

| ID | Unidade | Condados | Acres de terra | % da cidade |
|---|---|---|---:|---:|
| `U-4801240-4816230` | Addison × Dallas ISD | Dallas 100% | 2.649 | 95.0 |
| `U-4801924-4807890` | Allen × Allen ISD | Collin 100% | 15.383 | 90.8 |
| `U-4801924-4835100` | Allen × Plano ISD | Collin 100% | 852 | 5.0 |
| `U-4804600-4808910` | Aubrey × Aubrey ISD | Denton 100% | 2.134 | 77.4 |
| `U-4804600-4816740` | Aubrey × Denton ISD | Denton 100% | 585 | 21.2 |
| `U-4805372-4816230` | Balch Springs × Dallas ISD | Dallas 100% | 2.325 | 39.9 |
| `U-4805372-4830390` | Balch Springs × Mesquite ISD | Dallas 100% | 3.496 | 60.1 |
| `U-4813024-4813050` | Carrollton × Carrollton-Farmers Branch ISD | Dallas 72%; Denton 28% | 13.940 | 59.2 |
| `U-4813024-4816230` | Carrollton × Dallas ISD | Dallas 100% | 1.533 | 6.5 |
| `U-4813024-4827300` | Carrollton × Lewisville ISD | Denton 100% | 7.467 | 31.7 |
| `U-4813684-4813290` | Celina × Celina ISD | Collin 95%; Denton 5% | 25.001 | 79.2 |
| `U-4813684-4836000` | Celina × Prosper ISD | Collin 56%; Denton 44% | 6.256 | 19.8 |
| `U-4815796-4816230` | Cockrell Hill × Dallas ISD | Dallas 100% | 372 | 100.0 |
| `U-4816612-4813050` | Coppell × Carrollton-Farmers Branch ISD | Dallas 100% | 1.060 | 11.4 |
| `U-4816612-4815210` | Coppell × Coppell ISD | Dallas 100% | 7.904 | 85.0 |
| `U-4816696-4816740` | Corinth × Denton ISD | Denton 100% | 2.564 | 51.4 |
| `U-4816696-4826430` | Corinth × Lake Dallas ISD | Denton 100% | 2.420 | 48.6 |
| `U-4817504-4815510` | Crandall × Crandall ISD | Kaufman 100% | 4.503 | 100.0 |
| `U-4817852-4808910` | Cross Roads × Aubrey ISD | Denton 100% | 1.453 | 33.3 |
| `U-4817852-4816740` | Cross Roads × Denton ISD | Denton 100% | 2.909 | 66.7 |
| `U-4819000-4813050` | Dallas × Carrollton-Farmers Branch ISD | Denton 74%; Dallas 26% | 2.078 | 1.0 |
| `U-4819000-4815210` | Dallas × Coppell ISD | Dallas 100% | 1.398 | 0.6 |
| `U-4819000-4816230` | Dallas × Dallas ISD | Dallas 100% | 170.602 | 78.2 |
| `U-4819000-4817640` | Dallas × Duncanville ISD | Dallas 100% | 10.015 | 4.6 |
| `U-4819000-4819560` | Dallas × Forney ISD | Kaufman 100% | 1.121 | 0.5 |
| `U-4819000-4821420` | Dallas × Grand Prairie ISD | Dallas 100% | 3.946 | 1.8 |
| `U-4819000-4824420` | Dallas × Irving ISD | Dallas 100% | 1.669 | 0.8 |
| `U-4819000-4830390` | Dallas × Mesquite ISD | Dallas 100% | 1.231 | 0.6 |
| `U-4819000-4835100` | Dallas × Plano ISD | Collin 100% | 5.124 | 2.3 |
| `U-4819000-4837020` | Dallas × Richardson ISD | Dallas 100% | 16.213 | 7.4 |
| `U-4820092-4816230` | DeSoto × Dallas ISD | Dallas 100% | 2.116 | 15.3 |
| `U-4820092-4816860` | DeSoto × DeSoto ISD | Dallas 100% | 10.560 | 76.2 |
| `U-4820092-4817640` | DeSoto × Duncanville ISD | Dallas 100% | 1.188 | 8.6 |
| `U-4821628-4817640` | Duncanville × Duncanville ISD | Dallas 100% | 7.043 | 98.2 |
| `U-4824768-4821660` | Euless × Grapevine-Colleyville ISD | Tarrant 100% | 4.207 | 40.8 |
| `U-4824768-4824060` | Euless × Hurst-Euless-Bedford ISD | Tarrant 100% | 6.108 | 59.2 |
| `U-4825224-4828380` | Fairview × Lovejoy ISD | Collin 100% | 3.493 | 61.3 |
| `U-4825224-4829850` | Fairview × McKinney ISD | Collin 100% | 2.206 | 38.7 |
| `U-4825452-4813050` | Farmers Branch × Carrollton-Farmers Branch ISD | Dallas 100% | 5.704 | 74.7 |
| `U-4825452-4816230` | Farmers Branch × Dallas ISD | Dallas 100% | 1.932 | 25.3 |
| `U-4825572-4837650` | Fate × Rockwall ISD | Rockwall 100% | 4.411 | 56.4 |
| `U-4825572-4838220` | Fate × Royse City ISD | Rockwall 100% | 3.416 | 43.6 |
| `U-4825752-4819170` | Ferris × Ferris ISD ‡ | Ellis 85%; Dallas 15% | 3.023 | 100.0 |
| `U-4826604-4819560` | Forney × Forney ISD | Kaufman 100% | 10.267 | 100.0 |
| `U-4827684-4820010` | Frisco × Frisco ISD | Collin 64%; Denton 36% | 36.832 | 83.4 |
| `U-4827684-4827300` | Frisco × Lewisville ISD | Denton 100% | 1.902 | 4.3 |
| `U-4827684-4827720` | Frisco × Little Elm ISD | Denton 100% | 1.083 | 2.5 |
| `U-4827684-4836000` | Frisco × Prosper ISD | Collin 99% | 4.336 | 9.8 |
| `U-4829000-4820340` | Garland × Garland ISD | Dallas 100% | 34.020 | 93.4 |
| `U-4829000-4837020` | Garland × Richardson ISD | Dallas 100% | 1.423 | 3.9 |
| `U-4829840-4816860` | Glenn Heights × DeSoto ISD | Dallas 100% | 3.121 | 67.0 |
| `U-4829840-4836660` | Glenn Heights × Red Oak ISD | Ellis 100% | 1.534 | 33.0 |
| `U-4830464-4808700` | Grand Prairie × Arlington ISD ‡ | Tarrant 100% | 8.590 | 17.5 |
| `U-4830464-4813230` | Grand Prairie × Cedar Hill ISD ‡ | Dallas 100% | 2.988 | 6.1 |
| `U-4830464-4821420` | Grand Prairie × Grand Prairie ISD ‡ | Dallas 100% | 25.757 | 52.5 |
| `U-4830464-4824420` | Grand Prairie × Irving ISD ‡ | Dallas 100% | 1.632 | 3.3 |
| `U-4830464-4828920` | Grand Prairie × Mansfield ISD ‡ | Tarrant 100% | 5.225 | 10.6 |
| `U-4830464-4830600` | Grand Prairie × Midlothian ISD ‡ | Ellis 100% | 4.868 | 9.9 |
| `U-4831715-4827720` | Hackberry × Little Elm ISD | Denton 100% | 435 | 100.0 |
| `U-4832984-4837650` | Heath × Rockwall ISD | Rockwall 99%; Kaufman 1% | 8.010 | 100.0 |
| `U-4833476-4826430` | Hickory Creek × Lake Dallas ISD | Denton 100% | 2.901 | 92.1 |
| `U-4833476-4827300` | Hickory Creek × Lewisville ISD | Denton 100% | 250 | 7.9 |
| `U-4833824-4816230` | Highland Park × Dallas ISD | Dallas 100% | 108 | 7.5 |
| `U-4833824-4823250` | Highland Park × Highland Park ISD | Dallas 100% | 1.327 | 92.5 |
| `U-4833848-4827300` | Highland Village × Lewisville ISD | Denton 100% | 3.548 | 100.0 |
| `U-4835612-4816230` | Hutchins × Dallas ISD | Dallas 100% | 5.397 | 92.2 |
| `U-4835612-4826670` | Hutchins × Lancaster ISD | Dallas 100% | 455 | 7.8 |
| `U-4837000-4813050` | Irving × Carrollton-Farmers Branch ISD | Dallas 100% | 7.514 | 17.5 |
| `U-4837000-4815210` | Irving × Coppell ISD | Dallas 100% | 4.817 | 11.2 |
| `U-4837000-4824420` | Irving × Irving ISD | Dallas 100% | 29.081 | 67.6 |
| `U-4838068-4814850` | Josephine × Community ISD | Collin 97%; Hunt 3% | 1.372 | 100.0 |
| `U-4839916-4808910` | Krugerville × Aubrey ISD | Denton 100% | 1.019 | 100.0 |
| `U-4840516-4826430` | Lake Dallas × Lake Dallas ISD | Denton 100% | 1.554 | 100.0 |
| `U-4841050-4827720` | Lakewood Village × Little Elm ISD | Denton 100% | 520 | 100.0 |
| `U-4841212-4816230` | Lancaster × Dallas ISD | Dallas 100% | 1.701 | 8.0 |
| `U-4841212-4826670` | Lancaster × Lancaster ISD | Dallas 100% | 19.368 | 91.4 |
| `U-4841800-4814850` | Lavon × Community ISD | Collin 100% | 2.749 | 99.8 |
| `U-4842508-4827300` | Lewisville × Lewisville ISD | Denton 100% | 25.823 | 99.1 |
| `U-4843012-4816740` | Little Elm × Denton ISD | Denton 100% | 4.033 | 33.9 |
| `U-4843012-4820010` | Little Elm × Frisco ISD | Denton 100% | 1.699 | 14.3 |
| `U-4843012-4827720` | Little Elm × Little Elm ISD | Denton 100% | 6.086 | 51.2 |
| `U-4844308-4829850` | Lowry Crossing × McKinney ISD | Collin 100% | 883 | 53.0 |
| `U-4844308-4835850` | Lowry Crossing × Princeton ISD | Collin 100% | 782 | 47.0 |
| `U-4845012-4807890` | Lucas × Allen ISD | Collin 100% | 619 | 6.2 |
| `U-4845012-4828380` | Lucas × Lovejoy ISD | Collin 100% | 5.817 | 58.2 |
| `U-4845012-4829850` | Lucas × McKinney ISD | Collin 100% | 1.905 | 19.1 |
| `U-4845012-4835100` | Lucas × Plano ISD | Collin 100% | 905 | 9.1 |
| `U-4845012-4846530` | Lucas × Wylie ISD | Collin 100% | 543 | 5.4 |
| `U-4845744-4807890` | McKinney × Allen ISD | Collin 100% | 1.277 | 2.9 |
| `U-4845744-4820010` | McKinney × Frisco ISD | Collin 100% | 4.505 | 10.2 |
| `U-4845744-4829850` | McKinney × McKinney ISD | Collin 100% | 32.152 | 72.9 |
| `U-4845744-4836000` | McKinney × Prosper ISD | Collin 100% | 5.273 | 12.0 |
| `U-4845804-4837650` | McLendon-Chisholm × Rockwall ISD | Rockwall 100% | 7.978 | 98.4 |
| `U-4847496-4830120` | Melissa × Melissa ISD | Collin 100% | 7.323 | 99.5 |
| `U-4847892-4819560` | Mesquite × Forney ISD | Kaufman 100% | 3.159 | 10.0 |
| `U-4847892-4830390` | Mesquite × Mesquite ISD | Dallas 100% | 27.486 | 87.2 |
| `U-4850100-4835100` | Murphy × Plano ISD | Collin 100% | 2.506 | 68.7 |
| `U-4850100-4846530` | Murphy × Wylie ISD | Collin 100% | 1.142 | 31.3 |
| `U-4850760-4814850` | Nevada × Community ISD | Collin 100% | 1.535 | 100.0 |
| `U-4853115-4836660` | Oak Leaf × Red Oak ISD ‡ | Ellis 100% | 1.788 | 98.5 |
| `U-4853130-4816740` | Oak Point × Denton ISD | Denton 100% | 1.247 | 33.1 |
| `U-4853130-4827720` | Oak Point × Little Elm ISD | Denton 100% | 2.515 | 66.9 |
| `U-4854444-4816860` | Ovilla × DeSoto ISD | Dallas 100% | 411 | 11.1 |
| `U-4854444-4830600` | Ovilla × Midlothian ISD | Ellis 100% | 795 | 21.4 |
| `U-4854444-4836660` | Ovilla × Red Oak ISD | Ellis 100% | 2.351 | 63.5 |
| `U-4855152-4807890` | Parker × Allen ISD | Collin 100% | 1.009 | 18.5 |
| `U-4855152-4835100` | Parker × Plano ISD | Collin 100% | 4.428 | 81.1 |
| `U-4856485-4836660` | Pecan Hill × Red Oak ISD ‡ | Ellis 100% | 1.267 | 92.9 |
| `U-4856485-4844730` | Pecan Hill × Waxahachie ISD ‡ | Ellis 100% | 97 | 7.1 |
| `U-4857476-4813290` | Pilot Point × Celina ISD ‡ | Denton 100% | 796 | 15.7 |
| `U-4857476-4834920` | Pilot Point × Pilot Point ISD ‡ | Denton 96%; Cooke 2%; Grayson 2% | 4.280 | 84.3 |
| `U-4858016-4820010` | Plano × Frisco ISD | Collin 100% | 4.184 | 9.1 |
| `U-4858016-4827300` | Plano × Lewisville ISD | Denton 100% | 1.651 | 3.6 |
| `U-4858016-4835100` | Plano × Plano ISD | Collin 100% | 39.969 | 86.8 |
| `U-4859576-4829850` | Princeton × McKinney ISD | Collin 100% | 1.181 | 12.8 |
| `U-4859576-4835850` | Princeton × Princeton ISD | Collin 100% | 8.059 | 87.2 |
| `U-4859696-4816740` | Prosper × Denton ISD | Denton 100% | 1.280 | 7.9 |
| `U-4859696-4836000` | Prosper × Prosper ISD | Collin 78%; Denton 22% | 14.921 | 92.1 |
| `U-4859748-4808910` | Providence Village × Aubrey ISD | Denton 100% | 1.369 | 76.1 |
| `U-4859748-4816740` | Providence Village × Denton ISD | Denton 100% | 429 | 23.9 |
| `U-4861196-4819170` | Red Oak × Ferris ISD | Ellis 100% | 2.724 | 26.2 |
| `U-4861196-4836660` | Red Oak × Red Oak ISD | Ellis 100% | 7.412 | 71.3 |
| `U-4861796-4835100` | Richardson × Plano ISD | Collin 100% | 6.596 | 36.0 |
| `U-4861796-4837020` | Richardson × Richardson ISD | Dallas 100% | 11.693 | 63.9 |
| `U-4862828-4837650` | Rockwall × Rockwall ISD | Rockwall 100% | 18.955 | 99.6 |
| `U-4863572-4820340` | Rowlett × Garland ISD | Dallas 100% | 12.233 | 92.1 |
| `U-4863572-4837650` | Rowlett × Rockwall ISD | Rockwall 100% | 1.050 | 7.9 |
| `U-4863668-4838220` | Royse City × Royse City ISD | Rockwall 48%; Collin 27%; Hunt 24% | 13.548 | 99.1 |
| `U-4864064-4820340` | Sachse × Garland ISD | Dallas 100% | 4.738 | 76.0 |
| `U-4864064-4846530` | Sachse × Wylie ISD | Collin 100% | 1.493 | 24.0 |
| `U-4866428-4815510` | Seagoville × Crandall ISD | Kaufman 100% | 1.651 | 13.6 |
| `U-4866428-4816230` | Seagoville × Dallas ISD | Dallas 100% | 9.173 | 75.6 |
| `U-4866428-4830390` | Seagoville × Mesquite ISD | Dallas 100% | 1.314 | 10.8 |
| `U-4867100-4816740` | Shady Shores × Denton ISD | Denton 100% | 1.799 | 86.6 |
| `U-4867100-4826430` | Shady Shores × Lake Dallas ISD | Denton 100% | 279 | 13.4 |
| `U-4864220-4846530` | St. Paul × Wylie ISD | Collin 100% | 920 | 100.0 |
| `U-4871156-4841880` | Sunnyvale × Sunnyvale ISD | Dallas 100% | 10.624 | 99.5 |
| `U-4871756-4819560` | Talty × Forney ISD | Kaufman 100% | 2.169 | 100.0 |
| `U-4872530-4827300` | The Colony × Lewisville ISD | Denton 100% | 6.468 | 72.1 |
| `U-4872530-4827720` | The Colony × Little Elm ISD | Denton 100% | 2.417 | 26.9 |
| `U-4874492-4823250` | University Park × Highland Park ISD | Dallas 100% | 2.350 | 99.4 |
| `U-4879576-4816230` | Wilmer × Dallas ISD | Dallas 100% | 7.395 | 94.0 |
| `U-4880356-4814850` | Wylie × Community ISD | Collin 100% | 1.421 | 10.4 |
| `U-4880356-4846530` | Wylie × Wylie ISD | Collin 100% | 11.282 | 82.9 |
| `U-ETJ-48085-4813290` | Não incorporado – Collin × Celina ISD | Collin 100% | 30.237 | — |
| `U-ETJ-48085-4814850` | Não incorporado – Collin × Community ISD | Collin 100% | 32.686 | — |
| `U-ETJ-48085-4829850` | Não incorporado – Collin × McKinney ISD | Collin 100% | 27.362 | — |
| `U-ETJ-48085-4830120` | Não incorporado – Collin × Melissa ISD | Collin 100% | 12.283 | — |
| `U-ETJ-48085-4835850` | Não incorporado – Collin × Princeton ISD | Collin 100% | 21.271 | — |
| `U-ETJ-48085-4836000` | Não incorporado – Collin × Prosper ISD | Collin 100% | 4.903 | — |
| `U-ETJ-48085-4838220` | Não incorporado – Collin × Royse City ISD | Collin 100% | 2.300 | — |
| `U-ETJ-48085-4846530` | Não incorporado – Collin × Wylie ISD | Collin 100% | 5.876 | — |
| `U-ETJ-48113-4816230` | Não incorporado – Dallas × Dallas ISD | Dallas 100% | 31.794 | — |
| `U-ETJ-48113-4819170` | Não incorporado – Dallas × Ferris ISD | Dallas 100% | 1.410 | — |
| `U-ETJ-48113-4820340` | Não incorporado – Dallas × Garland ISD | Dallas 100% | 1.774 | — |
| `U-ETJ-48113-4826670` | Não incorporado – Dallas × Lancaster ISD | Dallas 100% | 3.107 | — |
| `U-ETJ-48113-4830390` | Não incorporado – Dallas × Mesquite ISD | Dallas 100% | 1.167 | — |
| `U-ETJ-48121-4808910` | Não incorporado – Denton × Aubrey ISD | Denton 100% | 22.127 | — |
| `U-ETJ-48121-4813290` | Não incorporado – Denton × Celina ISD | Denton 100% | 3.544 | — |
| `U-ETJ-48121-4816740` | Não incorporado – Denton × Denton ISD | Denton 100% | 29.487 | — |
| `U-ETJ-48121-4827720` | Não incorporado – Denton × Little Elm ISD | Denton 100% | 3.639 | — |
| `U-ETJ-48121-4834920` | Não incorporado – Denton × Pilot Point ISD | Denton 100% | 41.426 | — |
| `U-ETJ-48121-4836000` | Não incorporado – Denton × Prosper ISD | Denton 100% | 1.780 | — |
| `U-ETJ-48139-4819170` | Não incorporado – Ellis × Ferris ISD | Ellis 100% | 43.399 | — |
| `U-ETJ-48139-4830600` | Não incorporado – Ellis × Midlothian ISD | Ellis 100% | 22.924 | — |
| `U-ETJ-48139-4836660` | Não incorporado – Ellis × Red Oak ISD | Ellis 100% | 9.154 | — |
| `U-ETJ-48139-4844730` | Não incorporado – Ellis × Waxahachie ISD | Ellis 100% | 87.302 | — |
| `U-ETJ-48257-4815510` | Não incorporado – Kaufman × Crandall ISD | Kaufman 100% | 43.493 | — |
| `U-ETJ-48257-4819560` | Não incorporado – Kaufman × Forney ISD | Kaufman 100% | 34.799 | — |
| `U-ETJ-48397-4837650` | Não incorporado – Rockwall × Rockwall ISD | Rockwall 100% | 13.450 | — |
| `U-ETJ-48397-4838220` | Não incorporado – Rockwall × Royse City ISD | Rockwall 100% | 17.504 | — |

## 3. Esquema de dados das 8 etapas

O esquema atual está em `docs/esquema_de_dados.md` e em `app/src/tipos.ts`. O que entra com esta especificação:

| Entidade | Chave | Campos novos | Quem grava | Quem lê |
|---|---|---|---|---|
| `Projeto.ponto_partida` | dentro do Projeto | tem_terreno (sim/não); endereço ou cidade; unidade vinculada; aprovações (sim/não/não sei); projeto da casa (sim/não/não sei); terreno pronto (sim/não/não sei); data de cada resposta | ponto de partida | todas as etapas |
| `Projeto.etapas` | nº da etapa | situação (a fazer / parcialmente realizada / já realizada); partes realizadas (etapa 3: aprovações, projeto); valor gasto ou "não sei" (estimativa como premissa) | ponto de partida; cada etapa | 6 e 8 |
| `Terreno` | `terreno_id` | já possuído (sim/não); preço pago; data da compra; valor de mercado atual e se é informado ou estimado | ponto de partida; etapa 2 | 6 (só prazo restante) e 8 (duas margens) |
| `Terreno.due_diligence` | item | zona FEMA do lote; laudo de solo; easements; deed restrictions/HOA; acesso; distância da rede; direitos minerais; rollback tax; área mínima para fossa. Cada item: situação, valor, data, fonte | etapa 2 | 3, 4 e 8 |
| `Projeto.parametros` | id do parâmetro | alvo, peso, origem, ajustado manualmente (já existe) | modos simples e completo | motor da etapa 1 |
| `Projeto.n_casas`, `construcao`, `preco_venda` | — | já existem | etapa 1 | 3, 5, 6 e 8 |
| `linha_custo` | `linha_id` | já existe: previsto (mín/provável/máx), realizado, data, fonte. Novo: origem "ponto de partida" para valores de etapas já realizadas | 2 a 7; ponto de partida | 8 |

O que cada etapa lê e grava não muda em relação a `docs/esquema_de_dados.md`, com dois acréscimos: a etapa 6 usa só o prazo restante e, em "em sequência", calcula a terra parada; a etapa 8 mostra a margem sobre o preço pago e sobre o valor atual quando o terreno já é seu.

## 4. Fonte e licença planejadas por dado

Detalhe por fonte em `docs/fontes_e_licencas.md`. Não é parecer jurídico.

| # | Dado | Fonte planejada | Situação hoje | Uso comercial |
|---|---|---|---|---|
| 1 | Preço da terra | Sem fonte pública de anúncios; alternativa: valor de terra dos appraisal districts | sem dado | anúncios: não; appraisal: público |
| 2 | Tamanho típico dos terrenos à venda | idem | sem dado | idem |
| 3 | Oferta por faixa de investimento | idem | sem dado | idem |
| 4 | Oferta de lotes prontos | Cadastro dos appraisal districts (lotes residenciais vagos) | sem dado | público |
| 5 | Liquidez do terreno | Sem fonte pública | sem dado | não |
| 6 | Zoneamento e lote mínimo | Códigos de zoneamento das prefeituras; SB 15 | só a cobertura pela SB 15 | fatos: sim |
| 7 | Taxas por casa | Tabelas de taxas e estudos de impact fee das prefeituras | sem dado | fatos: sim |
| 8 | Prazo de aprovação e moratórias | Relatórios e atas das prefeituras; HB 2559 | moratória só de Princeton | fatos: sim |
| 9 | Água e esgoto | TCEQ; PUC do Texas; prefeituras | sem dado | a confirmar |
| 10 | Custo de lotear | Sem fonte pública: premissa | sem dado | — |
| 11 | Terra fora dos limites (ETJ) | Mapas de ETJ das prefeituras; NCTCOG | sem dado | a confirmar |
| 12 | Margem potencial | Calculada | sem dado | — |
| 13 | Peso do terreno no preço | Calculado | exibido | — |
| 14 | Dias para vender e meses de estoque | Redfin Data Center | bloqueado | a confirmar |
| 15 | Casas novas por ano | Census Building Permits Survey | 144 de 171 | sim |
| 16 | Faixa de preço que mais vende | Zillow ZHVI; preço por sqft depende da Redfin | 133 de 171 | com restrição |
| 17 | Concorrência de grandes builders | Bases abertas de permits das prefeituras | sem dado | fatos: sim |
| 18 | Valorização em 5 anos | Zillow ZHVI; alternativa FHFA | 131 de 171 | Zillow com restrição; FHFA sim |
| 19 | Tempo até polos de emprego | OSRM / OpenStreetMap | 171 de 171 | com restrição |
| 20 | Obras previstas | TxDOT, NCTCOG, planos das prefeituras | sem dado | a confirmar |
| 21 | Nota do ISD | TEA | 171 de 171 | a confirmar |
| 22 | Crimes por mil habitantes | FBI / Texas DPS | sem dado | sim |
| 23 | Renda mediana | Census ACS | 144 de 171 | sim |
| 24 | Imposto total e MUD/PID | Appraisal districts (8 condados, com Hunt); Comptroller; TCEQ | só a sua planilha | público |
| 25 | Área em zona de alagamento | FEMA NFHL | 171 de 171 | sim |
| 26 | Seguro residencial | Texas Department of Insurance | sem dado | a confirmar |

## 5. Definição das duas métricas (pedido da seção 6)

**Casas novas por ano.** Mede quantas casas unifamiliares a cidade licenciou no último ano fechado: número de unidades em prédios de 1 unidade no Census Building Permits Survey, arquivo anual por jurisdição emissora. Unidade: casas por ano. Direção: mais é melhor para quem quer vender, porque mostra mercado de casa nova ativo. Limites: é licença, não venda; vale para a cidade inteira e é repetido em todas as fatias de ISD; áreas não incorporadas não têm o dado; não separa por faixa de preço.

**Concorrência de grandes builders.** Mede quanto do mercado de casa nova da cidade está nas mãos das maiores construtoras: percentual das licenças de casa unifamiliar dos últimos 12 meses emitidas para as 10 construtoras com mais licenças na cidade. Fonte: base aberta de permits da prefeitura, com o nome do contratante. Unidade: %. Direção: menos é melhor para um construtor pequeno. Limites: só existe nas cidades que publicam os permits com nome (a confirmar uma a uma); nomes da mesma construtora escritos de formas diferentes precisam ser unificados; nas demais fica "sem dado".

## 6. Stack

Não muda: site estático em React + TypeScript + Vite; mapa com Leaflet; exportação com SheetJS; dados em arquivos versionados (`data/`); coleta em Python, um script por fonte; projetos e dados privados no navegador, com dono, e arquivo para salvar e abrir; testes com Vitest; publicação no GitHub Pages. Sem login, cobrança ou servidor.

## 7. Calibragem: números redondos × distribuição real

Só para os parâmetros que já têm dado. Quartis = valores que separam as unidades em quatro grupos iguais.

| Parâmetro | Opções redondas | Mínimo | 1º quartil | Mediana | 3º quartil | Máximo | Leitura |
|---|---|---:|---:|---:|---:|---:|---|
| Imposto total (70 unidades, da sua planilha) | 1,8 / 2,0 / 2,2 / 2,5% | 1,5 | 1,7 | 1,9 | 2,0 | 2,15 | 2,2 e 2,5 não separam ninguém: todas as unidades atendem |
| Área em zona de alagamento (171) | 5 / 10 / 15 / 25% | 0 | 6,3 | 11,3 | 19,0 | 99,7 | Bem distribuído; um quarto das unidades passa de 19% |
| Tempo até polo de emprego (171) | 15 / 25 / 35 / 45 min | 5,2 | 18,0 | 25,2 | 32,1 | 51,0 | Bem distribuído; 45 min quase não separa |
| Valorização em 5 anos (131) | ≤ 0 / 5 / 10 / 20 / 30% | −8,5 | 8,8 | 11,7 | 15,2 | 65,1 | 9 unidades com valor negativo ou zero; 20% e 30% atingem poucas |
| Casas novas por ano (144) | 50 / 200 / 500 / 1.000 | 0 | 40 | 138 | 396 | 2.489 | Coerente com os quartis |
| Renda das famílias (144) | $75 / 100 / 125 / 150 mil | 47.829 | 81.830 | 112.081 | 131.808 | 250.001 | Coerente com os quartis |
| Preço de venda (valor típico, 133) | $300 / 500 / 750 mil / 1 milhão | 205.677 | 311.237 | 373.848 | 484.787 | 3.024.788 | Três quartos das unidades ficam abaixo de $500 mil |

Custo de lotear: não há dado para conferir a escala; continua premissa. Os demais parâmetros não têm dado ainda.
