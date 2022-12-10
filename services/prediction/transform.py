from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder
import numpy as np
import pandas as pd
def makeTrainingData(data, fields, features, target):
    headers = []
    featureFields = list(filter(lambda x: x['fid'] in features, fields))
    targetField = list(filter(lambda x: x['fid'] == target, fields))[0]
    X = np.zeros(shape=(len(data), 1))
    y = np.zeros(shape=(len(data), 1))
    target_encoder = OrdinalEncoder()
    target_values = np.array([row[targetField['fid']] for row in data])
    y = target_encoder.fit_transform(target_values.reshape(-1, 1))
    for field in featureFields:
        if field['semanticType'] == 'nominal':
            values = np.array([row[field['fid']] for row in data])
            values = values.reshape(-1, 1)
            if field['features']['unique'] > 2:
                encoder = OneHotEncoder()
                res = encoder.fit_transform(values)
                X = np.concatenate((X, res.toarray()), axis=1)
                for v in encoder.categories_[0]:
                    headers.append(field['name'] + '_' + v)
                continue
            else:
                encoder = OrdinalEncoder()
                res = encoder.fit_transform(values)
                X = np.concatenate((X, res), axis=1)
        elif field['semanticType'] == 'ordinal':
            values = np.array([row[field['fid']] for row in data])
            values = values.reshape(-1, 1)
            encoder = OrdinalEncoder()
            res = encoder.fit_transform(values)
            X = np.concatenate((X, res), axis=1)
        elif field['semanticType'] == 'quantitative':
            values = np.array([row[field['fid']] for row in data])
            values = values.reshape(-1, 1)
            X = np.concatenate((X, values), axis=1)
        elif field['semanticType'] == 'temporal':
            timestamps = []
            for row in data:
                ts = pd.Timestamp(row[field['fid']]).timestamp()
                timestamps.append(ts)
            values = np.array(timestamps)
            values = values.reshape(-1, 1)
            X = np.concatenate((X, values), axis=1)
        headers.append(field['name'])
    return X[:,1:], y, headers