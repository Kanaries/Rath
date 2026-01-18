FROM python:3.10.7

WORKDIR /usr/src/app

# Install git to clone submodules
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements.txt

# Copy everything except pyscagnostics first (if it exists in build context, it will be copied)
COPY . .

# Clone pyscagnostics submodule if it doesn't exist after COPY
RUN if [ ! -d pyscagnostics ] || [ ! "$(ls -A pyscagnostics)" ]; then \
        rm -rf pyscagnostics && \
        git clone https://github.com/haishiro/pyscagnostics.git pyscagnostics; \
    fi

RUN ls /usr/src/app/pyscagnostics/ && \
        pip install --no-cache-dir /usr/src/app/pyscagnostics/ && \
        pip install --no-cache-dir -r /usr/src/app/requirements.txt

EXPOSE 8001

CMD [ "python", "insight_flask.py" ]

