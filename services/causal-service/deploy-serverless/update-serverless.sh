#!/bin/sh
orig_dir=`pwd`
cur_dir=`dirname $0`
#region=cn-north-1
region=ap-east-1
#profile=default
profile=g
# ecr=107358989393.dkr.ecr.cn-north-1.amazonaws.com.cn
ecr=395189247077.dkr.ecr.ap-east-1.amazonaws.com
cd $cur_dir
docker build --platform linux/amd64 -t causal-server:serverless -f ./Dockerfile ../
aws --profile $profile ecr get-login-password --region $region | docker login --username AWS --password-stdin $ecr
docker tag causal-server:serverless $ecr/causal-service:serverless
docker push $ecr/causal-service:serverless # && \
# docker save causal-server:serverless | gzip | ssh -J StationViaTunnel T14-01 docker load

exitcode=$?
cd $orig_dir
[ $exitcode ]

# cd "$(dirname $0)"
# zip -r9 function.zip $CONDA_PREFIX/lib/python3.9/site-packages
# zip -g function.zip -r ../ -x deploy-serverless/
