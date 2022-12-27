import sys, os
from mangum import Mangum
sys.path.append(os.path.dirname(os.path.realpath(__file__)))
from main import app
handler = Mangum(app)