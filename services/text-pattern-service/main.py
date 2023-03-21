# Copyright (C) 2023 observedobserver
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from flask import Flask, request
from flask_cors import CORS
import json
import numpy as np
import random
import gensim.downloader as api

app = Flask(__name__)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
# cors = CORS(app, origins=["http://localhost:3000"])

word_vectors = api.load("glove-wiki-gigaword-50")


@app.route('/api/ping', methods=['GET'])
def ping():
    return {
        "success": True
    }

# sentence: str can have words, spaces, and punctuation, etc. extract pure words.
def extractWordsFromSentence (sentence: str):
    words = []
    word = ""
    for i in range(len(sentence)):
        if sentence[i].isalpha():
            word += sentence[i]
        else:
            if len(word) > 0:
                words.append(word)
                word = ""
    if len(word) > 0:
        words.append(word)
    return words

@app.route("/api/text_pattern_extraction", methods=['POST', 'OPTIONS'])
def extractTextPattern():
    try:
        data = json.loads(request.data)
        values = data['values']
        selections = data['selections']
        # threshold = data['threshold'] if 'threshold' in data else 0.5
        result = []
        selection_num = len(selections)
        for value in values:
            score = 0
            # best_match = ""
            # best_match_score = 0
            words = extractWordsFromSentence(value)
            print(words)
            # for selection in selections:
            #     best_match = ""
            #     best_match_score = 0
            best_match_score = 0
            best_match = ""
            for word in words:
                word_score = 0
                # check if the word is in the model
                word_lower = word.lower()

                if word_lower not in word_vectors:
                    continue
                for selection in selections:
                    selection_lower = selection.lower()
                    if selection_lower not in word_vectors:
                        continue
                    similarity = word_vectors.similarity(word_lower, selection_lower)
                    word_score += similarity
                word_score /= selection_num
                if word_score > best_match_score:
                    best_match_score = word_score
                    best_match = word
            result.append({
                "score": best_match_score,
                "best_match": best_match
            })
        return {
            "success": True,
            "data": {
                "extractions": result
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == '__main__':
    app.run(host= '0.0.0.0',port=5533,debug=True)
