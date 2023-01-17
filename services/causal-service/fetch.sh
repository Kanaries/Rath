orig_dir=`pwd`
cur_dir=`dirname $0`
#causallearn=git@github.com:Asm-Def/causal-learn
causallearn=https://github.com/HeJinYang123/causal-learn.git
SELF=https://github.com/HeJinYang123/SELF.git
cd $cur_dir
if [ ! -d SELF ]; then
  echo "SELF not found. Cloning SELF..."
  git clone ${SELF}
else
  echo "SELF already exists."
fi
echo "updating causal-learn"
if [ ! -d causal-learn/.git ]; then
	echo "causal-learn not found. Cloning causal-learn from ${causallearn}..."
  git clone $causallearn
	cd causal-learn
else
	echo "Fetching causal-learn from ${causallearn}..."
    cd causal-learn && git fetch $causallearn server && git switch server
fi && \
    git submodule update --init --single-branch --recursive
exitcode=$?
cd $orig_dir
[ $exitcode ]