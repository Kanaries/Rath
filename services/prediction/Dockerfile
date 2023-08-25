FROM python:3.10.7

WORKDIR /prediction

COPY . /prediction

RUN pip3 install --trusted-host pypi.python.org -r requirements.txt

CMD python3 -u /prediction/main.py
