# connector

Use SQLAlchemy (and PyMongo for MongoDB) to connect databases from the Rath UI.

Install drivers listed in `requirements.txt`, then run the Flask service on port 5001.

## New connectors (SQLite, DuckDB, MongoDB, ClickZetta, MariaDB)

### SQLite and DuckDB (file databases)

When running via Docker Compose, database files must live where the **connector container** can read them:

1. Put `.sqlite` / `.duckdb` files in `./data/connector-databases/` on the host
2. That folder is mounted at `/data/databases` inside `connector-api`
3. Use URIs such as:
   - `sqlite:////data/databases/sample.sqlite`
   - `duckdb:////data/databases/sample.duckdb`

The connector image seeds `sample.sqlite` and `sample.duckdb` with a `sales` table at build time. Rebuild or run:

```bash
python3 scripts/seed_sample_databases.py ./data/connector-databases
```

**Out of the box:** select SQLite or DuckDB in Data Connections — the default URI points at the bundled sample.

### MongoDB

- URI: `mongodb://user:pass@host:27017/`
- Browse **database → collection**, preview, and import (collections appear as tables)
- Custom queries: select a collection in the browser first, then run the collection name or a JSON aggregation pipeline in the query editor

MongoDB must be reachable from the connector container (`host.docker.internal` on Docker Desktop, or a service name on Compose networks).

### MariaDB

- URI: `mysql+pymysql://user:pass@host:3306/database`
- Uses the same SQL path as MySQL via PyMySQL (included in `requirements.txt`)

### ClickZetta

- URI: `clickzetta://user:pass@instance.api.clickzetta.com/workspace?schema=YOUR_SCHEMA&vcluster=default`
- Requires `clickzetta-sqlalchemy` and outbound network access to your ClickZetta workspace
- Include `schema` (and `vcluster`) in the query string

## Supported databases

clickhouse, mysql, mariadb, sqlite, duckdb, mongodb, clickzetta, postgres, oracle, doris, athena, drill, impala, redshift, sparksql, sqlserver, snowflake, bigquery, druid, kylin

Driver reference (see also [Superset DB drivers](https://superset.apache.org/docs/databases/installing-database-drivers/)):

| Database   | Python package        |
|-----------|------------------------|
| sqlite    | built-in (SQLAlchemy)  |
| duckdb    | duckdb, duckdb-engine  |
| mongodb   | pymongo                |
| mariadb   | PyMySQL                |
| clickzetta| clickzetta-sqlalchemy  |
| mysql     | PyMySQL or mysqlclient |
| postgres  | psycopg2               |

## Tests

```bash
cd services/connector
pip install -r requirements.txt
python3 -m unittest test_new_connectors.py
```

Docker build runs these tests automatically.
