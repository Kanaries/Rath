FROM python:3

WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install -vvv -i https://mirrors.aliyun.com/pypi/simple --no-cache-dir -r /app/requirements.txt
COPY causal-learn causal-learn
RUN pip install -vvv -i https://mirrors.aliyun.com/pypi/simple --no-cache-dir /app/causal-learn
COPY . .
EXPOSE 8000
CMD gunicorn main:app --workers 16 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --reload
