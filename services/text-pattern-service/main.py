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
import gensim
from transformers import BertTokenizerFast, BertModel
import torch

app = Flask(__name__)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
# cors = CORS(app, origins=["http://localhost:3000"])

print("start loading glove model")
word_vectors = api.load("glove-wiki-gigaword-50")
print("loading bert model")
tokenizer = BertTokenizerFast.from_pretrained("sentence-transformers/bert-base-nli-mean-tokens")
bert = BertModel.from_pretrained("sentence-transformers/bert-base-nli-mean-tokens")

MODE = 'glove'


def prepare_input(in_sen):
    replace_list = ['-', '.', ',', '!', '?', ':', ';', '(', ')', '[', ']', '{', '}', '/', '\\', '\'', '\"']
    for char in in_sen:
        if char in replace_list:
            in_sen = in_sen.replace(char, ' ')
    return in_sen.lower()


def get_word_vectors(input_sentence, mode='glove'):
    assert mode in ['glove', 'bert']
    input_sentence = prepare_input(input_sentence)
    if mode == 'glove':
        # return word_vec or None
        words = input_sentence.split()
        word_dicts = {word: word_vectors[word] if word in word_vectors else None for word in words}
        return word_dicts
    elif mode == 'bert':
        tokenized = tokenizer.encode_plus(input_sentence, return_offsets_mapping=True)
        input_ids = torch.tensor(tokenized['input_ids']).unsqueeze(0)
        offsets_map = tokenized['offset_mapping']

        with torch.no_grad():
            outputs = bert(input_ids)
            last_hidden_states = outputs[0]

        word_vec_dict = {}
        next_start = 0
        for word in input_sentence.split():
            word_index_s, word_index_e = input_sentence.index(word), input_sentence.index(word) + len(word)
            word_indexs = []
            for i in range(next_start, len(offsets_map)):
                # word 分词后的一个或多个token
                if offsets_map[i][0] == offsets_map[i][1]:
                    continue
                if offsets_map[i][0] >= word_index_s and offsets_map[i][1] <= word_index_e:
                    word_indexs.append(i)
                if offsets_map[i][1] == word_index_e:
                    next_start = i
                    break
            word_vec_dict[word] = torch.mean(last_hidden_states[0][word_indexs], dim=0)
        return word_vec_dict


def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


@app.route('/api/ping', methods=['GET'])
def ping():
    return {
        "success": True
    }

# sentence: str can have words, spaces, and punctuation, etc. extract pure words.
def extractWordsFromSentence(sentence: str):
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
        dictionary = {}
        data = json.loads(request.data)
        values = data['values']
        selections = data['selections']
        # threshold = data['threshold'] if 'threshold' in data else 0.5
        result = []
        selection_num = len(selections)
        selects = ""
        for i in range(selection_num):
            selects += selections[i] + " "
        select_dict = get_word_vectors(selects, mode=MODE)
        # select_dict['university'] = get_word_vectors("Alabama A & M University", mode=MODE)['university']
        for index, value in enumerate(values):
            if index > 20:
                result.append({
                    "score": 0.1,
                    "best_match": value.split()[0]
                })
                continue
            word_dict = get_word_vectors(prepare_input(value), mode=MODE)

            best_match_score = 0
            best_match = ""
            for word, vec in word_dict.items():
                word_score = []
                for selection in selections:
                    selection_lower = selection.lower()
                    if vec is not None and select_dict[selection_lower] is not None:
                        similarity = cosine_similarity(vec, select_dict[selection_lower])
                        word_score.append(similarity)
                word_score = float(np.mean(word_score))
                if word_score > best_match_score:
                    best_match_score = word_score
                    best_match = word
            result.append({
                "score": best_match_score,
                "best_match": best_match
            })
            # print(f"[{index}] value: {value}, best match: {best_match}, score: {best_match_score}")
            if best_match_score > 0.5:
                dictionary[best_match] = best_match_score
        print(dictionary)
        return {
            "success": True,
            "data": {
                "extractions": result
            }
        }
    except Exception as e:
        print(f"error: {e}")
        return {
            "success": False,
            "message": str(e)
        }


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5533, debug=True)
