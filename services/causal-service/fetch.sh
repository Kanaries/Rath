orig_dir=`pwd`
cur_dir=`dirname $0`
causallearn=git@github.com:Asm-Def/causal-learn
cd $cur_dir
echo "updating causal-learn"
if [ ! -d causal-learn/.git ]; then
	echo "causal-learn not found. Cloning causal-learn from ${causallearn}..."
    git clone $causallearn -b server --single-branch && \
	cd causal-learn
else
	echo "Fetching causal-learn from ${causallearn}..."
    cd causal-learn && git fetch $causallearn server && git switch server
fi && \
    git submodule update --init --single-branch --recursive
exitcode=$?
cd $orig_dir
[ $exitcode ]