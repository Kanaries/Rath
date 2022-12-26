# expose 8002
port=8003

gunicorn main:app --workers 16 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:${port} --reload