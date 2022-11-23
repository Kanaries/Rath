#!/bin/sh
PORT=8001
PORT2=2281
git submodule init && git submodule update
docker build -t causal-server . && \
docker run -d -p $PORT:8000 -p $PORT2:8000 --name run-causal-server causal-server
# docker run -it --rm -v $(pwd):/app  -p $PORT:8000 -p $PORT2:8000 --name run-causal-server causal-server
