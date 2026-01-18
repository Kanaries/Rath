FROM python:3.10.7

WORKDIR /text-pattern-service

COPY . /text-pattern-service

RUN pip3 install --trusted-host pypi.python.org -r requirements.txt

EXPOSE 5533

CMD python3 -u /text-pattern-service/main.py
