# connector
use sqlalchemy to connect database.

You need to first add the four packages in requirements.txt to the deployed environment, Then refer to the website below to add the package that you need to connect to the database

Since this is a python program, it is recommended that you configure these packages in a virtual environment

It uses a method similar to Superset, and you can refer to its reference documentation.
https://superset.apache.org/docs/databases/installing-database-drivers/

Currently supported databases are: clickhouse, mysql, doris, athena, drill, impala, redshift, sparksql, sqlserver

The deployment mode of aws lambda is provided. Modify env.json in the lambda folder, package it into a zip file, and upload it to aws lambda. 
(You need a database that you can connect with sqlalchemy, and a table with id, uri, and source_type.)