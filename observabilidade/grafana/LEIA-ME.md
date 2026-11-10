# Grafana — monitoramento do banco de dados

Painel que mostra se o **PostgreSQL do CodeQuest (Amazon RDS, São Paulo)** está
no ar, e como o jogo está sendo usado.

| Linha | Painéis |
|---|---|
| **Saúde do banco** | Banco de dados (No ar ✅ / erro), há quanto tempo está no ar, conexões ativas, tamanho, versão do PostgreSQL |
| **Uso do jogo** | Jogadores com conta, ativos em 7 dias, fases concluídas, média de estrelas, conclusões por dia, por fase, estrelas, conclusões recentes |

O painel **"Banco de dados"** roda `SELECT 1` no banco a cada 30 s. Se o banco
cair ou ficar inacessível, os painéis passam a mostrar erro em vez de dados.

## Segurança e privacidade

- O Grafana entra com o usuário **`grafana_leitor`**, criado por
  `scripts/setup-grafana-db.mjs`:
  - só leitura (transações *read-only*, não altera nem apaga nada);
  - limite de 5 s por consulta e 5 conexões;
  - **sem acesso a nome e e-mail** dos jogadores (público de 6 a 11 anos):
    na tabela `jogador` ele só enxerga `id`, `criado_em` e `atualizado_em`.
- A senha fica em `.env.local` (variável `GRAFANA_DB_PASSWORD`), que **não vai
  para o git**.

## Rodar localmente (Docker)

Na pasta `observabilidade/grafana`:

```powershell
docker compose up -d
```

Abra **http://localhost:3000** e entre com `admin` / `admin` (no primeiro acesso
o Grafana oferece trocar a senha). O painel **CodeQuest — Banco de dados e uso**
já abre como página inicial.

Para desligar: `docker compose down`.

## Publicar na web (Grafana Cloud — plano gratuito)

1. Crie uma conta em **https://grafana.com** → *Create free account*. Na criação
   do *stack*, escolha a região mais próxima (por exemplo, São Paulo, se houver).
2. No seu Grafana Cloud: **Connections → Add new connection → PostgreSQL →
   Add new data source**, e preencha:

   | Campo | Valor |
   |---|---|
   | Name | `CodeQuest · PostgreSQL (RDS)` |
   | Host URL | `codequest-db.cvcqy260styi.sa-east-1.rds.amazonaws.com:5432` |
   | Database name | `codequest` |
   | Username | `grafana_leitor` |
   | Password | valor de `GRAFANA_DB_PASSWORD` no `.env.local` |
   | TLS/SSL Mode | `require` |
   | Version | `15+` |

   Clique em **Save & test**. Deve aparecer *Database Connection OK*.
3. **Dashboards → New → Import → Upload dashboard JSON file** → escolha
   `observabilidade/grafana/dashboards/codequest.json` → **Import**. O seletor
   **Banco**, no topo do painel, pega a conexão criada no passo 2.
4. Para o professor ver **sem precisar de login**: no painel, **Share → Share
   externally** (ou *Public dashboard*) → ative e copie o link.

O banco aceita conexões de fora da AWS (security group `codequest-db-sg`), por
isso o Grafana Cloud consegue alcançá-lo.

## Alterar o painel

O painel é o arquivo `dashboards/codequest.json`. No Grafana local, as
alterações feitas pela interface não são salvas (o painel é provisionado). Para
mudar, edite pela interface, use **Export → Export as JSON** e substitua o
arquivo. O Grafana local recarrega sozinho em até 10 s.
