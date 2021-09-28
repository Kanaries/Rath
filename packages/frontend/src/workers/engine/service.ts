import { IFieldMeta, IRow } from "../../interfaces";
import { IVizSpace } from "../../store/exploreStore";
// import { isSetEqual } from "../../utils/index";
import { RathEngine } from "./core";

const EngineRef: { current: RathEngine | null } = {
    current: null
}

export interface MessageProps {
    task: 'init' | 'destroy' | 'start' | 'specification' | 'associate' | 'detail';
    props?: any
}

function initEngine () {
    EngineRef.current = new RathEngine();
    console.log('rath engine is created.')
}

function destroyEngine () {
    EngineRef.current = null;
}

interface StartPipeLineProps {
    dataSource: IRow[];
    fieldMetas: IFieldMeta[];
}
function startPipeLine (props: StartPipeLineProps) {
    const { dataSource, fieldMetas } = props;
    const engine = EngineRef.current;
    if (engine === null) throw new Error('Engine is not created.');
    const times: number[] = [];
    const prints: IRow[] = [];
    times.push(performance.now())
    const fieldsProps = fieldMetas.map(f => ({ key: f.fid, semanticType: f.semanticType, analyticType: f.analyticType, dataType: '?' as '?' }));

    engine.setData(dataSource)
        .setFields(fieldsProps)
    engine.univarSelection();
    times.push(performance.now())
    prints.push({ task: 'init&univar', value: times[times.length - 1] - times[times.length - 2] })
    engine.buildGraph();
    times.push(performance.now())
    prints.push({ task: 'co-graph', value: times[times.length - 1] - times[times.length - 2] })
    engine.clusterFields();
    times.push(performance.now())
    prints.push({ task: 'clusters', value: times[times.length - 1] - times[times.length - 2] })
    engine.buildCube();
    times.push(performance.now())
    prints.push({ task: 'cube', value: times[times.length - 1] - times[times.length - 2] })
    engine.buildSubspaces();
    times.push(performance.now())
    prints.push({ task: 'subspaces', value: times[times.length - 1] - times[times.length - 2] });
    engine.createInsightSpaces();
    times.push(performance.now())
    prints.push({ task: 'insights', value: times[times.length - 1] - times[times.length - 2] })
    engine.setInsightScores();
    times.push(performance.now())
    prints.push({ task: 'scores', value: times[times.length - 1] - times[times.length - 2] })
    engine.insightSpaces = engine.insightSpaces.filter(s => typeof s.score === 'number' && !isNaN(s.score));
    engine.insightSpaces.sort((a, b) => Number(a.score) - Number(b.score));
    return {
        insightSpaces: engine.insightSpaces,
        fields: engine.fields,
        dataSource: engine.dataSource,
        performance: prints
    };
}

function specify (spaceIndex: number) {
    const engine = EngineRef.current;
    if (engine === null) throw new Error('Engine is not created.');
    if (engine.insightSpaces && spaceIndex < engine.insightSpaces.length) {
        return engine.specification(engine.insightSpaces[spaceIndex])
    }
}

function scanDetails (spaceIndex: number) {
    const engine = EngineRef.current;
    if (engine === null) throw new Error('Engine is not created.');
    const space = engine.insightSpaces[spaceIndex];
    if (space) {
        return engine.scanDetail(space)
    } else {
        throw new Error(`insightSpaces(${spaceIndex}/${engine.insightSpaces.length}) not exist.`)
    }
}

function intersect (A: string[], B: string[]) {
    const bset = new Set(B);
    for (let a of A) {
        if (bset.has(a)) return true
    }
    return false;
}

function associate (spaceIndex: number) {
    const engine = EngineRef.current;
    if (engine === null) throw new Error('Engine is not created.');
    const { insightSpaces } = engine;
    const space = insightSpaces[spaceIndex];
    const { dimensions, measures, dataGraph } = engine;
    // type1: meas cor assSpacesT1
    // type2: dims cor assSpacesT2
    // this.vie.dataGraph.DG
    const dimIndices = space.dimensions.map(f => dimensions.findIndex(d => f === d));
    const meaIndices = space.measures.map(f => measures.findIndex(m => f === m));
    const assSpacesT1: IVizSpace[] = [];
    const assSpacesT2: IVizSpace[] = [];
    for (let i = 0; i < insightSpaces.length; i++) {
        if (i === spaceIndex) continue;
        if (!intersect(insightSpaces[i].dimensions, space.dimensions)) continue;
        let t1_score = 0;
        const iteMeaIndices = insightSpaces[i].measures.map(f => measures.findIndex(m => f === m));
        for (let j = 0; j < meaIndices.length; j++) {
            for (let k = 0; k < iteMeaIndices.length; k++) {
                t1_score += dataGraph.MG[j][k]
            }
        }
        t1_score /= (meaIndices.length * iteMeaIndices.length)
        if (t1_score > 0.7) {
            const spec = specify(i);
            if (spec) {
                assSpacesT1.push({
                    ...insightSpaces[i],
                    score: t1_score,
                    ...spec
                })
            }
        }
    }
    for (let i = 0; i < insightSpaces.length; i++) {
        if (i === spaceIndex) continue;
        if (!intersect(insightSpaces[i].measures, space.measures)) continue;
        // if (!isSetEqual(insightSpaces[i].measures, space.measures)) continue;
        let t1_score = 0;
        const iteDimIndices = insightSpaces[i].dimensions.map(f => dimensions.findIndex(m => f === m));
        for (let j = 0; j < dimIndices.length; j++) {
            for (let k = 0; k < iteDimIndices.length; k++) {
                t1_score += dataGraph.DG[j][k]
            }
        }
        t1_score /= (dimIndices.length * iteDimIndices.length)
        if (t1_score > 0.65) { // (1 + 0.3) / 2
            const spec = specify(i);
            if (spec) {
                assSpacesT2.push({
                    ...insightSpaces[i],
                    score: t1_score,
                    ...spec
                })
            }
        }
    }
    assSpacesT1.sort((a, b) => (b.score || 0) - (a.score || 0))
    assSpacesT2.sort((a, b) => (b.score || 0) - (a.score || 0))
    return {
        assSpacesT1,
        assSpacesT2
    }
}


export function router (e: { data: MessageProps }, onSuccess: (res?: any) => void, onFailed: (res: string) => void) {
    const req = e.data;
    try {
        switch (req.task) {
            case 'init':
                initEngine();
                onSuccess()
                break;
            case 'destroy':
                destroyEngine();
                onSuccess()
                break;
            case 'start':
                const res_start = startPipeLine(req.props);
                onSuccess(res_start);
                break;
            case 'specification':
                const res_spec = specify(req.props);
                onSuccess(res_spec)
                break;
            case 'associate':
                const res_asso = associate(req.props);
                onSuccess(res_asso)
                break;
            case 'detail':
                const res_details = scanDetails(req.props);
                onSuccess(res_details)
                break;
            default:
                throw new Error(`Unknow task: "${req.task}".`)
        }
    } catch (error) {
        onFailed(`[${req.task}]${error}`)
    }
}