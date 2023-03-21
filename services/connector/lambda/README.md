# connector-lambda
Deploy using lambda in aws. each folder is a separate database connection, in order to effectively separate its dependencies.

Install the dependencies of each database connector in the corresponding folder, When finished, all of them are packaged into a zip file and uploaded to aws lambda.
```
pip install --target .\{folder}\ {module} 
```
For details, see the following documents:
https://docs.aws.amazon.com/zh_cn/lambda/latest/dg/python-package.html


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
