FROM python:3.10.7

WORKDIR /connector

COPY requirements.txt requirements.txt
RUN pip3 install --trusted-host pypi.python.org -r requirements.txt

COPY . /connector

RUN mkdir -p /data/databases \
    && python3 scripts/seed_sample_databases.py /data/databases \
    && python3 -m unittest test_new_connectors.py

EXPOSE 5001

CMD python3 -u /connector/app.py
