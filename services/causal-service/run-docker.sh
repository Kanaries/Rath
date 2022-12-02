#!/bin/sh
PORT=8001
PORT2=2281
cur_dir=`dirname $0`
cd $cur_dir
. $cur_dir/fetch.sh && \
docker build -t causal-server .
docker ps -f name=run-causal-server | grep run-causal-server
if [ $? -eq 0 ] ; then
docker stop run-causal-server
docker rm run-causal-server
fi
docker run -d -p $PORT:8000 -p $PORT2:8000 --env mode=$mode --name run-causal-server causal-server

# docker wait run-causal-server && \
# 	docker rm run-causal-server && \
# 	docker run -d -p $PORT:8000 -p $PORT2:8000 --name run-causal-server causal-server
# docker run -it --rm -v $(pwd):/app  -p $PORT:8000 -p $PORT2:8000 --name run-causal-server causal-server
