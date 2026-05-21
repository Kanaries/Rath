FROM python:3.10.7

WORKDIR /app

# Install git to clone submodules
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements.txt
RUN pip install -vvv -i https://mirrors.aliyun.com/pypi/simple --no-cache-dir -r /app/requirements.txt

# Copy everything except causal-learn first (if it exists in build context, it will be copied)
COPY . .

# Clone causal-learn submodule if it doesn't exist after COPY
RUN if [ ! -d causal-learn ] || [ ! -f causal-learn/setup.py ]; then \
        rm -rf causal-learn && \
        git clone https://github.com/Asm-Def/causal-learn.git -b server --single-branch causal-learn && \
        cd causal-learn && \
        git submodule update --init --single-branch --recursive; \
    fi

RUN pip install -vvv -i https://mirrors.aliyun.com/pypi/simple --no-cache-dir /app/causal-learn

EXPOSE 8000
CMD gunicorn main:app --workers 16 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 300 --graceful-timeout 30
