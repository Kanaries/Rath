from sklearn import tree
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from xgboost import XGBClassifier


def classification (X_train, X_test, y_train, y_test, headers, algorithm):
    clf = None
    if algorithm == 'decisionTree':
        clf = tree.DecisionTreeClassifier()
    elif algorithm == 'gradientBoosting':
        clf = GradientBoostingClassifier(n_estimators=100, learning_rate=1.0, max_depth=3, random_state=0)
    elif algorithm == 'adaBoost':
        clf = AdaBoostClassifier(n_estimators=100)
    elif algorithm == 'XGBoost':
        clf = XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1)
    else:
        print('using random forest')
        clf = RandomForestClassifier(max_depth=3, random_state=0)

    clf = clf.fit(X_train, y_train)
    predict_res = clf.predict(X_test)
    score = accuracy_score(y_test, predict_res)
    diffs = []
    for i in range(len(y_test)):
        if y_test[i] != predict_res[i]:
            diffs.append(0)
        else:
            diffs.append(1)

    conf_matrix = confusion_matrix(y_test, predict_res)
    class_report = classification_report(y_test, predict_res)
    feature_importance = None
    if hasattr(clf, 'feature_importances_'):
        feature_importance = clf.feature_importances_

    return score, diffs, conf_matrix, class_report, feature_importance
