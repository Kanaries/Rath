cur_dir=`dirname $0`
cd $cur_dir
. fetch.sh && \
	pip install -r requirements.txt && pip install -e causal-learn/ && \
	sh -c "cd causal-learn; python setup.py clean --all" && \
	if [ -d causal-learn/*.egg-info ]; then rm -r causal-learn/*.egg-info; fi && \
	# uvicorn main:app --reload --host 0.0.0.0
	gunicorn main:app --workers 16 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --reload --threads 2 --timeout 120
