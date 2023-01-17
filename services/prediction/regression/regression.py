from sklearn import linear_model
from sklearn.metrics import mean_squared_error, r2_score
from sklearn import tree, ensemble
import numpy as np
from xgboost import XGBRegressor


def regression (X_train, X_test, y_train, y_test, headers, algorithm):
    regr = None
    if algorithm == 'linearRegression':
        regr = linear_model.LinearRegression()
    elif algorithm == 'lasso':
        regr = linear_model.Lasso(alpha=0.1)
    elif algorithm == 'ridge':
        regr = linear_model.Ridge(alpha=0.5)
    elif algorithm == 'decisionTree':
        regr = tree.DecisionTreeRegressor()
    elif algorithm == 'randomForest':
        regr = ensemble.RandomForestRegressor(max_depth=3, random_state=50, oob_score=True)
    elif algorithm == 'XGBoost':
        regr = XGBRegressor(n_estimators=100, max_depth=3, learning_rate=0.1)
    else:
        regr = linear_model.ElasticNet(alpha=0.1, l1_ratio=0.7)

    regr.fit(X_train, y_train)
    predict_res = regr.predict(X_test)
    score = regr.score(X_test, y_test)
    # score = r2_score(y_test, predict_res)
    diffs = []
    std = np.std(y_test)
    for i in range(len(y_test)):
        z_score = (y_test[i] - predict_res[i]) / std
        if z_score > 2 or z_score < -2:
            diffs.append(0)
        else:
            diffs.append(1)
    return score, diffs

    