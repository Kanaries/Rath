# Connector database files

Place SQLite (`.sqlite`, `.db`) and DuckDB (`.duckdb`) files here when running Rath via Docker Compose.

The connector service mounts this directory at `/data/databases` inside the container.

## Example URIs (Docker)

- SQLite: `sqlite:////data/databases/sample.sqlite`
- DuckDB: `duckdb:////data/databases/sample.duckdb`

Use four slashes after the scheme for an absolute path inside the container.

## Sample files

After building the connector image, `sample.sqlite` and `sample.duckdb` are created automatically with a small `sales` table. You can replace them or add your own files to this folder.

## Local connector (no Docker)

Point the URI at a path on your machine instead, for example:

- `sqlite:////Users/you/project/data/connector-databases/my.db`
