From python:3.10.7

WORKDIR /connector

COPY . /connector

RUN pip3 install --trusted-host pypi.python.org -r requirements.txt

EXPOSE 5000

CMD python3 -u /connector/app.py
