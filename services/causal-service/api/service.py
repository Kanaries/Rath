import requests

from . import interface as I

url = 'https://showwhy.gateway.kanarkes.cn:3433'


def runDiscover(sessionId: str, req: I.DiscoverReq):
    dataset = None
    constraints = None
    causal_variables = []
    model_options = {}
    training_options = {}
    ate_options = {}
    resp = requests.post(f"{url}/api/discover/deci", data={
        dataset: None
    })