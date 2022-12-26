#!/bin/sh
PORT=8001
PORT2=2281
cur_dir=`dirname $0`
dname=run-causal-server
cd $cur_dir
# . $cur_dir/fetch.sh && \
docker build -t causalserver .
docker container ls -a -f name=${dname} | grep ${dname}
if [ $? -eq 0 ] ; then
docker stop ${dname}
docker rm ${dname}
fi
docker run -d -p $PORT:8000 -p $PORT2:8000 -v /tmp/showwhy_log:/tmp --env mode=$mode --name ${dname} causal-server

# docker wait run-causal-server && \
# 	docker rm run-causal-server && \
# 	docker run -d -p $PORT:8000 -p $PORT2:8000 --name run-causal-server causal-server
# docker run -it --rm -v $(pwd):/app  -p $PORT:8000 -p $PORT2:8000 --name run-causal-server causal-server
