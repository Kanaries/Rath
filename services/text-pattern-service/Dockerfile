FROM python:3.11-slim

WORKDIR /text-pattern-service

COPY . /text-pattern-service

RUN pip3 install -r requirements.txt

EXPOSE 5533

CMD python3 -u /text-pattern-service/main.py
