# Formação de preço de casas — região de Dallas, TX

Ferramenta web para formar o preço de uma casa construída para vender, do terreno à entrega das chaves, em 8 etapas encadeadas.
**Situação: etapa 1 (Território) construída, aguardando validação. Etapas 2 a 8 têm esquema de dados e telas vazias.**

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `data/` | Base de dados versionada, separada do código: `unidades.csv/.geojson`, `indicadores/<fonte>.csv` (valor bruto + unidade + fonte + datas + confiança), `criterios.json`, `faixas.json`, `perfis.json`, `fontes.json`, `premissas.csv`, `pendencias.csv`, `manual/` |
| `scripts/fontes/` | Um script de coleta por fonte; cada um grava só o seu arquivo em `data/indicadores/` |
| `scripts/atualizar.py` | Roda uma ou todas as fontes e consolida |
| `scripts/consolidar.py` | Gera `app/public/base.json` e `data/pendencias.csv` |
| `scripts/validar.py` | Teste de validação: relê os arquivos brutos e compara com a base |
| `app/` | Aplicação (React + TypeScript + Vite). Lê a base; não guarda cópia de dado |
| `docs/` | Esquema de dados e relatório de validação |

## Uso

```bash
pip install geopandas openpyxl
python scripts/atualizar.py            # todas as fontes
python scripts/atualizar.py zillow tea # só algumas
cd scripts && python validar.py Frisco Celina Plano Wylie Parker
cd app && npm install && npm run dev   # ou: npm run build
```

## Unidades

171 unidades com ID fixo: 144 cidade × ISD (72 cidades; fatia com ≥ 5% da área de terra da cidade ou ≥ 1.000 acres) e 27 áreas não
incorporadas por condado × ISD. Fonte: Census TIGER/Line 2025. ID: `U-<GEOID do lugar>-<GEOID do ISD>` ou `U-ETJ-<FIPS do condado>-<GEOID do ISD>`.

## Cobertura de dados da etapa 1 (2026-11-23)

Com dado: absorção (permits, c15), valor típico da casa (c16), valorização 5 anos (c18), acesso a emprego (c19), nota do ISD (c21),
renda (c23), alagamento FEMA (c25), além da cobertura pela SB 15 e da população. Os outros 19 critérios estão em `data/pendencias.csv`
com o motivo: anúncios de terrenos adiados, fontes que recusam acesso automático (Redfin, Comptroller), fontes que pedem chave ou
formulário (FBI, TCEQ, TDI) e documentos municipais de leitura manual.

Regras: nada é estimado sem marcação; valor ausente fica vazio com confiança "sem dado"; premissas ficam em `data/premissas.csv`;
dado com mais de 6 meses é sinalizado; nenhum critério de composição étnica, racial ou de origem.
