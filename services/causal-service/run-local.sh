# expose 8002
port=8004

gunicorn main:app --workers 16 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:${port} --reload --timeout 1200