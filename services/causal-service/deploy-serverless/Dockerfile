FROM public.ecr.aws/lambda/python:3.9

WORKDIR ${LAMBDA_TASK_ROOT}
COPY causal-learn ${LAMBDA_TASK_ROOT}/causal-learn
RUN pip install -vvv -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir ${LAMBDA_TASK_ROOT}/causal-learn \
 --target "${LAMBDA_TASK_ROOT}"
COPY deploy-serverless/requirements.txt requirements.txt
RUN pip install -vvv -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt \
 --target "${LAMBDA_TASK_ROOT}"
COPY . ${LAMBDA_TASK_ROOT}/app
COPY deploy-serverless/main_serverless.py ${LAMBDA_TASK_ROOT}/app/main_serverless.py
EXPOSE 8000
CMD [ "app.main_serverless.handler" ]
# CMD gunicorn main:app --workers 16 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --reload
