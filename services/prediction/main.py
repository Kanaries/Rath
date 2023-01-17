from flask import Flask, request
from flask_cors import CORS
import json
import numpy as np
import random
from classification.classification import classification
from regression.regression import regression
from transform import makeTrainingData

app = Flask(__name__)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

def controlSplitTrainTest (X, y, split_states: 'list[int]'):
    train_indices = []
    test_indices = []
    for i in range(len(split_states)):
        if split_states[i] == 1:
            train_indices.append(i)
        if split_states[i] == 0:
            test_indices.append(i)
    train_indices = np.array(train_indices)
    test_indices = np.array(test_indices)
    X_train = X.take(train_indices, axis=0)
    X_test = X.take(test_indices, axis=0)
    y_train = y.take(train_indices, axis=0)
    y_test = y.take(test_indices, axis=0)
    return X_train, X_test, y_train, y_test

def mockSplitIndices (size: int, ratio: float):
    indices = []
    for i in range(size):
        if random.random() > ratio:
            indices.append(1)
        else:
            indices.append(0)
    return indices

@app.route('/api/ping', methods=['GET'])
def ping():
    return {
        "success": True
    }

@app.route("/api/train_test", methods=['POST'])
def runClassificationModel():
    try:
        dataset = json.loads(request.data)
        data = dataset['dataSource']
        fields = dataset['fields']
        model = json.loads(request.data)['model']
        features = model['features']
        targets = model['targets']
        algorithm = model['algorithm']
        mode = dataset['mode']
        trainTestSplitIndices = []
        if 'trainTestSplitIndices' in dataset:
            trainTestSplitIndices = dataset['trainTestSplitIndices']
        else:
            trainTestSplitIndices = mockSplitIndices(len(data), 0.2)
        testset_indices = []
        for i in range(len(trainTestSplitIndices)):
            if trainTestSplitIndices[i] == 0:
                testset_indices.append(i)
        X, y, headers = makeTrainingData(data=data, fields=fields, features=features, target=targets[0])
        X_train, X_test, y_train, y_test = controlSplitTrainTest(X, y, trainTestSplitIndices)
        score = 0
        diffs = []
        if mode == 'classification':
            score, diffs = classification(X_train, X_test, y_train, y_test, headers, algorithm)
        elif mode == 'regression':
            score, diffs = regression(X_train, X_test, y_train, y_test, headers, algorithm)
        if len(diffs) != len(testset_indices):
            print('[warning] diffs and testset_indices have different lengths')
        result = []
        for i in range(len(diffs)):
            result.append([testset_indices[i], diffs[i]])
        return {
            "success": True,
            "data": {
                "accuracy": score,
                "result": result
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == '__main__':
    app.run(host= '0.0.0.0',port=5533,debug=True)
