import requests, logging, json

from . import session, common as c, interface as I
from .interface import BaseModel, Literal, List, Optional, Union, Tuple

url = 'https://causica.gateway.kanaries.cn:3433'
url = 'https://causica2.gateway.kanaries.cn:3433'
url = 'http://161.189.221.110:8081'
# url = 'http://52.82.70.212:8081'

class DeciModelOptions(BaseModel):
    base_distribution_type: Literal["gaussian", "spline"] = "gaussian"
    spline_bins: int = 16
    imputation: bool = False
    lambda_dag: float = 100.0
    lambda_sparse: float = 5.0
    tau_gumbel: float = 1.0
    var_dist_A_mode: Literal["simple", "enco", "true", "three"] = "three"
    imputer_layer_sizes: Optional[List[int]] = None
    mode_adjacency: Literal["upper", "lower", "learn"] = "learn"
    # TODO: Once pytorch implements opset 17 we can use nn.LayerNorm
    norm_layers: bool = False
    res_connection: bool = True
    encoder_layer_sizes: Optional[List[int]] = [32, 32]
    decoder_layer_sizes: Optional[List[int]] = [32, 32]
    cate_rff_n_features: int = 3000
    cate_rff_lengthscale: Union[int, float, List[float], Tuple[float, float]] = 1
    
class DeciTrainingOptions(BaseModel):
    learning_rate: float = 1e-3
    batch_size: int = 256
    standardize_data_mean: bool = False
    standardize_data_std: bool = False
    rho: float = 1.0
    safety_rho: float = 1e13
    alpha: float = 0.0
    safety_alpha: float = 1e13
    tol_dag: float = 1e-3
    progress_rate: float = 0.25
    max_steps_auglag: int = 20
    max_auglag_inner_epochs: int = 1000
    max_p_train_dropout: float = 0.25
    reconstruction_loss_factor: float = 1.0
    anneal_entropy: Literal["linear", "noanneal"] = "noanneal"
    
class DeciAteOptions(BaseModel):
    Ngraphs: Optional[int] = 1
    Nsamples_per_graph: Optional[int] = 5000
    most_likely_graph: Optional[int] = True


def inferDataNature(data, fields: c.IFieldMeta):
    import pandas as pd
    import math
    causal_variables = []
    for f in fields:
        nature = None
        fid = f['fid']
        s = f['semanticType']
        unique_cnt = data[fid].unique().size
        tot_cnt = len(data)
        if s == 'nominal':
            if unique_cnt == 2:
                data = data.assign(**{fid: pd.factorize(data[fid])[0]})
                nature = 'Binary'
            else: nature = 'Categorical Nominal'
        elif s == 'quantitative':
            if unique_cnt <= max(math.log1p(tot_cnt), 16):
                # nature = 'Descrete'
                nature = 'Continuous' # 'Categorical Oridinal'
            else:
                nature = 'Continuous'
        elif s == 'temporal':
            logging.debug(pd.to_datetime(data[fid]).astype('int64'))
            data = data.assign(**{fid: pd.to_datetime(data[fid]).astype('int64')})
            logging.debug(f"temporal Series: {f}, {data[fid]}")
            nature = 'Continuous'
        elif s == 'ordinal':
            if data[fid].unique().size == 2: nature = 'Binary'
            else: nature = 'Categorical Ordinal'
        causal_variables.append({'name': fid, 'nature': nature})
    return data, causal_variables

def runDiscover(sessionId: str, req: I.DiscoverReq):
    dataset = None
    
    algoName, tableId, fields, focusedFields, bgKnowledgesPag, funcDeps, params = \
        req.algoName, req.tableId, req.fields, req.focusedFields, req.bgKnowledgesPag, req.funcDeps, req.params
    
    data, meta = session.readTable(sessionId, tableId)
    
    d = {f['fid']: f for f in fields}
    fields = [d[ff] for ff in focusedFields]
    
    data, causal_variables = inferDataNature(data, fields)
        
    causes, effects, forbiddenRelationships, forcedRelationhships = [], [], [], []
    for bg in bgKnowledgesPag:
        src, tar, src_type, tar_type = bg.src, bg.tar, bg.src_type, bg.tar_type
        if src_type == 0:
            forbiddenRelationships.append([src, tar])
        if tar_type == 0:
            forbiddenRelationships.append([tar, src])
        if src_type == -1:
            forbiddenRelationships.append([tar, src])
            if tar_type == 1:
                forcedRelationhships.append([src, tar])
        if tar_type == -1:
            forbiddenRelationships.append([src, tar])
            if src_type == 1:
                forcedRelationhships.append([tar, src])
    
    dataset = {
        'data': data.loc[:, focusedFields].to_dict('list'),
        'schema': {
            'fields': [{'name': f} for f in focusedFields]
        }
    }
    model_options = DeciModelOptions.parse_obj(params.dict())
    training_options = DeciTrainingOptions.parse_obj(params.dict())
    ate_options = DeciAteOptions.parse_obj(params.dict())
    data = {
        'causal_variables': causal_variables,
        'constraints': {
            'causes': causes,
            'effects': effects,
            'forbiddenRelationships': forbiddenRelationships,
            'forcedRelationships': forcedRelationhships,
            'defaultLink': params.default_link if algoName else 'nan',
        },
        'model_options': model_options.dict(),
        'training_options': training_options.dict(),
        'ate_options': ate_options.dict(),
    }
    logging.debug(f"{url}/api/discover/deci\n{data}")
    data['dataset'] = dataset
    resp = requests.post(f"{url}/api/discover/deci", json=data)
    logging.debug(f"{resp}")
    
    if resp.status_code != 200:
        del data['dataset']
        logging.debug(f"data = {json.dumps(data)}")
        logging.warning(resp.json())
        raise Exception(resp.json())
    taskId = resp.json()['id']
    return taskId

def killTask(sessionId: str, taskId: str):
    resp = requests.delete(f"{url}/api/discover/{taskId}")
    return {}
    return resp.json()

def getTaskStatus(sessionId: str, taskId: str):
    resp = requests.get(f"{url}/api/discover/{taskId}")
    logging.debug(f"{url}/api/discover/{taskId}\nResponse={resp}")
    if resp.status_code != 200:
        session.setValue(sessionId, f"task-{taskId}/failed-response", json.dumps(res))
        raise f'getTaskStatus: {resp}'
    res = resp.json()
    res['progress'] = res.get('progress', 100) / 100.0
    return res

def runIntervention(sessionId, modelId, do, confidence_threshold=0.11, weight_threshold=0.0, **kwargs):
    data = {
        'intervention_model_id': modelId,
        'interventions': do,
        'confidence_threshold': confidence_threshold,
        'weight_threshold': weight_threshold
    }
    resp = requests.post(f"{url}/api/discover/deci/intervention", json=data)
    if resp.status_code != 200:
        logging.warning(f'resp = {resp.content}')
    res = resp.json()
    return res