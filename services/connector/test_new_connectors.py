import os
import sqlite3
import tempfile
import unittest

from bp.basefunc import basefunc


class ConnectorSmokeTest(unittest.TestCase):
    def test_sqlite_table_browse_and_query(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'sample.db')
            conn = sqlite3.connect(db_path)
            conn.execute('CREATE TABLE people (id INTEGER, name TEXT)')
            conn.execute("INSERT INTO people VALUES (1, 'Ada'), (2, 'Grace')")
            conn.commit()
            conn.close()

            uri = f'sqlite:///{db_path}'
            tables = basefunc.sqlite_gettable(uri=uri, database=None, schema=None)
            self.assertEqual([table['name'] for table in tables], ['people'])

            detail = basefunc.sqlite_getdetail(
                uri=uri,
                database=None,
                table='people',
                schema=None,
                rows_num='10',
            )
            meta, columns, rows = detail
            self.assertEqual(columns, ['id', 'name'])
            self.assertEqual(len(rows), 2)

            result = basefunc.sqlite_getresult(uri=uri, sql='SELECT name FROM people ORDER BY id')
            self.assertEqual(result[0], ['name'])
            self.assertEqual(result[1], [['Ada'], ['Grace']])

    def test_duckdb_table_browse_and_query(self):
        duckdb = __import__('duckdb')
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, 'sample.duckdb')
            conn = duckdb.connect(db_path)
            conn.execute('CREATE TABLE sales (region VARCHAR, amount DOUBLE)')
            conn.executemany(
                'INSERT INTO sales VALUES (?, ?)',
                [('East', 120.5), ('West', 98.0)],
            )
            conn.close()

            uri = f'duckdb:///{db_path}'
            schemas = basefunc.duckdb_getschema(uri=uri, db=None)
            self.assertIn('main', schemas)

            tables = basefunc.duckdb_gettable(uri=uri, database=None, schema='main')
            self.assertEqual([table['name'] for table in tables], ['sales'])

            detail = basefunc.duckdb_getdetail(
                uri=uri,
                database=None,
                table='sales',
                schema='main',
                rows_num='10',
            )
            meta, columns, rows = detail
            self.assertEqual(len(columns), 2)
            self.assertEqual(len(rows), 2)


if __name__ == '__main__':
    unittest.main()
