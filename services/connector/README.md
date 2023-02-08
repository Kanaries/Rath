# connector
use sqlalchemy to connect database.

You need to first add the four packages in requirements.txt to the deployed environment, Then refer to the website below to add the package that you need to connect to the database

Since this is a python program, it is recommended that you configure these packages in a virtual environment

It uses a method similar to Superset, and you can refer to its reference documentation.
https://superset.apache.org/docs/databases/installing-database-drivers/

Currently supported databases are: clickhouse, mysql, doris, athena, drill, impala, redshift, sparksql, sqlserver

## The reference library is as follows:
    athena:           pyathena/pyathenajdbc
    big query:        sqlalchemy-bigquery
    clickhouse:       clickhouse-sqlalchemy
    doris:            mysqlclient
    drill:            sqlalchemy-drill
    druid:            pydruid
    impala:           impyla
    kylin:            kylinpy
    mysql:            mysqlclient
    oracle:           cx_Oracle
    postgres:         psycopg2
    redshift:         sqlalchemy-redshift
    snowflake:        snowflake-sqlalchemy
    sparksql:         pyhive
    sql server:       pymssql
After the installation with pip, the corresponding database can be used.
