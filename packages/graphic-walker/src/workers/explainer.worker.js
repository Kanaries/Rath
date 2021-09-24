/* eslint no-restricted-globals: 0 */
/* eslint-disable */ 
// import { Record, Filters } from '../interfaces';
import { getPredicatesFromVegaSignals } from '../utils';
import { DataExplainer } from '../insights';
const state = {
    de: null
};

function preAnalysis (props) {
    const { fields, dataSource } = props; // as ReqData;
    const de = new DataExplainer(dataSource);
    de.setFields(fields);
    de.preAnalysis();
    state.de = de;
    return true
}

function getFieldsSummary (props) {
    const de = state.de;
    if (de !== null) {
        return de.engine.fields;
    }
    throw new Error('data explainer is not init.')
}
function getExplaination(props) {

    const { filters = {}, currentSpace } = props; // as ReqData;
    const predicates = getPredicatesFromVegaSignals(filters, currentSpace.dimensions, []);
    const de = state.de;
    const ansSpaces = de.explain(predicates, currentSpace.dimensions, currentSpace.measures);
    const visSpaces = de.getVisSpec(ansSpaces);
    const valueExp = de.explainValue(predicates, currentSpace.dimensions, currentSpace.measures);
    const measureStats = [];
    for (let i = 0; i < valueExp.length; i++) {
        if (valueExp[i] !== 0) {
            measureStats.push({
                ...currentSpace.measures[i],
                score: valueExp[i]
            })
        }
    }
    const fields = de.engine.fields;
    return {
        explainations: ansSpaces,
        visSpaces,
        valueExp: measureStats,
        fieldsWithSemanticType: fields.map(f => ({
            key: f.key,
            type: f.semanticType
        }))
    };
}

function main (e) {
    const { type, data } = e.data;
    console.log(type, data)
    let res = false;
    try {
        switch (type) {
            case 'getExplaination':
                res = getExplaination(data);
                break;
            case 'preAnalysis':
                res = preAnalysis(data);
                break;
            default:
                throw new Error(`type ${type} is not supported.`);
        }
        self.postMessage(res);
    } catch (error) {
        // discuss
        console.log(error)
        self.postMessage(false)
    }
}

self.addEventListener('message', main, false);
