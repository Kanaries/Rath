FROM python:3

RUN apt-get update -y \
    && apt-get install -y r-base

WORKDIR /app
COPY requirements.txt requirements.txt
#RUN pip install -vvv -i https://mirrors.aliyun.com/pypi/simple --no-cache-dir -r /app/requirements.txt
RUN pip install -vvv -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir -r /app/requirements.txt

COPY requirements.r .
COPY SELF .
RUN Rscript requirements.r
COPY causal-learn causal-learn
#RUN pip install -vvv -i https://mirrors.aliyun.com/pypi/simple --no-cache-dir /app/causal-learn
RUN pip install -vvv -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir /app/causal-learn
COPY . .

EXPOSE 8000
CMD gunicorn main:app --workers 16 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --reload
