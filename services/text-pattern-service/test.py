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

# import nltk
# from nltk.corpus import wordnet
# nltk.download('wordnet')

# def calculate_similarity(word1, word2, sentence1, sentence2):
#     # Find synonyms for the two words
#     word1_synonyms = wordnet.synsets(word1)
#     word2_synonyms = wordnet.synsets(word2)
#     print(word1_synonyms, word2_synonyms)
#     # Calculate similarity between synonyms
#     similarity = []
#     for syn1 in word1_synonyms:
#         for syn2 in word2_synonyms:
#             sim = syn1.wup_similarity(syn2)
#             similarity.append(sim)
    
#     # Return the maximum similarity
#     return max(similarity)

import spacy
import nltk
from nltk.metrics import jaccard_distance

nlp = spacy.load("en_core_web_lg")

def similarity_of_meaning_and_role(sentence1, sentence2, word1, word2):
    doc1 = nlp(sentence1)
    doc2 = nlp(sentence2)

    entities1 = [ent.text for ent in doc1.ents]
    entities2 = [ent.text for ent in doc2.ents]
    print(entities1)
    print(entities2)

    if word1 in entities1 and word2 in entities2:
        set1 = set(entities1)
        set2 = set(entities2)
        sim = 1 - jaccard_distance(set1, set2)
        return sim
    else:
        return 0

# Example usage
sentence1 = "FB is a tech company like Google, they buy a lot of apple and banana juice."
sentence2 = "I have an apple to eat, its better than banana."
word1 = "banana"
word2 = "apple"
similarity = similarity_of_meaning_and_role(sentence1, sentence2, word1, word2)
print("Similarity:", similarity)


