FROM python:3.11-slim

WORKDIR /text-pattern-service

COPY requirements.txt requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . /text-pattern-service

EXPOSE 5533

CMD python3 -u /text-pattern-service/main.py
