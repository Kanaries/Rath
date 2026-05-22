#!/usr/bin/env python3
"""Create sample SQLite and DuckDB files for local/Docker connector demos."""
import os
import sqlite3
import sys


def seed_sqlite(path: str) -> None:
    if os.path.exists(path):
        return
    conn = sqlite3.connect(path)
    conn.execute('CREATE TABLE sales (region TEXT, amount REAL)')
    conn.executemany(
        'INSERT INTO sales (region, amount) VALUES (?, ?)',
        [('East', 120.5), ('West', 98.0), ('North', 143.2), ('South', 87.4)],
    )
    conn.commit()
    conn.close()


def seed_duckdb(path: str) -> None:
    if os.path.exists(path):
        return
    import duckdb

    conn = duckdb.connect(path)
    conn.execute('CREATE TABLE sales (region VARCHAR, amount DOUBLE)')
    conn.executemany(
        'INSERT INTO sales VALUES (?, ?)',
        [('East', 120.5), ('West', 98.0), ('North', 143.2), ('South', 87.4)],
    )
    conn.close()


def main() -> int:
    target_dir = sys.argv[1] if len(sys.argv) > 1 else '/data/databases'
    os.makedirs(target_dir, exist_ok=True)
    seed_sqlite(os.path.join(target_dir, 'sample.sqlite'))
    seed_duckdb(os.path.join(target_dir, 'sample.duckdb'))
    print(f'Seeded sample databases in {target_dir}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
