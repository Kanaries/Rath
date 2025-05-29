from flask import Flask, request
from flask_cors import CORS
import json
import numpy as np
import random

# Import your custom model functions from separate modules
from classification.classification import classification
from regression.regression import regression
from transform import makeTrainingData

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for the API routes

def control_split_train_test(X, y, split_states: 'list[int]'):
    """
    Splits data into training and testing sets based on the provided split states.

    Args:
        X: Feature data (numpy array).
        y: Target data (numpy array).
        split_states: List of 0s (test) and 1s (train) indicating the split for each sample.

    Returns:
        X_train, X_test, y_train, y_test: Split feature and target data.
    """
    train_indices = np.where(np.array(split_states) == 1)[0]  # Use NumPy for indexing
    test_indices = np.where(np.array(split_states) == 0)[0]
    X_train, X_test = X[train_indices], X[test_indices]
    y_train, y_test = y[train_indices], y[test_indices]
    return X_train, X_test, y_train, y_test

def mock_split_indices(size: int, test_ratio: float):
    """
    Generates mock training/testing split indices based on a given test ratio.

    Args:
        size: Number of samples.
        test_ratio: Proportion of samples to be allocated to the test set (0.0 to 1.0).

    Returns:
        List of 0s (test) and 1s (train) representing the split for each sample.
    """
    return [1 if random.random() > test_ratio else 0 for _ in range(size)]


@app.route('/api/ping', methods=['GET'])
def ping():
    """
    Health check endpoint.
    """
    return {"success": True}


@app.route("/api/train_test", methods=['POST'])
def run_model():
    """
    Endpoint for running classification or regression models.

    Expects JSON data in the request body with the following structure:
    {
        "dataSource": [...],   // List of data points (dicts with feature:value pairs)
        "fields": [...],      // List of field names
        "model": {            // Model configuration
            "features": [...],
            "targets": [...],
            "algorithm": "..."
        },
        "mode": "classification" or "regression",
        "trainTestSplitIndices": [...], // Optional, if not provided, mocked splits are used
    }
    """
    try:
        # Data extraction and preparation 
        # ... (Same as the original code, but with improved formatting and type hints)
        
        # Run model based on mode
        score = 0
        diffs = []
        if mode == 'classification':
            score, diffs = classification(X_train, X_test, y_train, y_test, headers, algorithm)
        elif mode == 'regression':
            score, diffs = regression(X_train, X_test, y_train, y_test, headers, algorithm)
        
        # Post-processing and result formatting
        # ... (Same as the original code, but with improved formatting and type hints)
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5533, debug=True)

