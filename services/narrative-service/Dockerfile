FROM --platform=linux/amd64 python:3

WORKDIR /usr/src/app

COPY requirements.txt requirements.txt
COPY pyscagnostics pyscagnostics

RUN ls /usr/src/app/pyscagnostics/ && \
        pip install --no-cache-dir /usr/src/app/pyscagnostics/ && \
        pip install --no-cache-dir -r /usr/src/app/requirements.txt

COPY . .

EXPOSE 8000

CMD [ "python", "insight_flask.py" ]

