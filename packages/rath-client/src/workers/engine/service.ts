import { ICubeStorageManageMode, IFieldSummary, IInsightSpace, Cube, ViewSpace, StatFuncName } from "visual-insights";

import { IFieldMeta, IRow, ISyncEngine, PreferencePanelConfig } from "../../interfaces";
import { IRathStorage } from "../../utils/storage";
import { RathCHEngine } from "./clickhouse";
// import { isSetEqual } from "../../utils/index";
import { RathEngine } from "./core";


const EngineRef: { current: RathEngine | null, mode: 'webworker' } | { current: RathCHEngine | null, mode: 'clickhouse' } = {
    mode: 'webworker',
    current: null
}

export interface MessageProps {
    task: 'init' | 'destroy' | 'start' | 'specification' | 'associate' | 'detail' | 'cube' | 'download' | 'upload' | 'sync' | 'subinsight' | 'infermeta';
    props?: any
}

function initEngine (engineMode: string) {
    if (engineMode === 'webworker') {
        EngineRef.current = new RathEngine();
        EngineRef.mode = engineMode;
    } else if (engineMode === 'clickhouse') {
        EngineRef.current = new RathCHEngine();
        EngineRef.current.utils.setCHConfig({
            protocol: 'https',
            host: 'localhost',
            port: 2333,
            path: '/api/ch/general'
        })
        EngineRef.mode = engineMode;
    }
}

function destroyEngine () {
    EngineRef.current = null;
}

type StartPipeLineProps = ({
    mode: 'webworker';
    cubeStorageManageMode: ICubeStorageManageMode;
    dataSource: IRow[];
    fieldMetas: IFieldMeta[];
} | {
    mode: 'clickhouse';
    viewName: string;
}) & {
    limit: PreferencePanelConfig['viewSizeLimit']
}

async function startPipeLine (props: StartPipeLineProps) {
    const times: number[] = [];
    const prints: IRow[] = [];
    let insightSpaces: IInsightSpace[] = [];
    let viewSampleData: IRow[] = [];
    let viewFields: IFieldSummary[] = [];
    times.push(performance.now())
    if (EngineRef.mode === 'webworker' && props.mode === 'webworker') {
        const { dataSource, fieldMetas, limit } = props;
        const fieldsProps = fieldMetas.map(f => ({ key: f.fid, semanticType: f.semanticType, analyticType: f.analyticType, dataType: '?' as '?' }));
        const engine = EngineRef.current;
        if (engine === null) throw new Error('Engine is not created.');
        engine.params.limit = limit
        engine.setData(dataSource)
            .setFields(fieldsProps)
        engine.univarSelection();
        times.push(performance.now())
        prints.push({ task: 'init&univar', value: times[times.length - 1] - times[times.length - 2] })
        engine.buildGraph();
        engine.dataGraph.DIMENSION_CORRELATION_THRESHOLD = 0.5
        times.push(performance.now())
        prints.push({ task: 'co-graph', value: times[times.length - 1] - times[times.length - 2] })
        engine.clusterFields();
        times.push(performance.now())
        prints.push({ task: 'clusters', value: times[times.length - 1] - times[times.length - 2] })
        const cube = new Cube({
            dimensions: engine.dimensions,
            measures: engine.measures,
            cubeStorageManageMode: props.cubeStorageManageMode,
            dataSource: engine.dataSource
        })
        await engine.buildCube(cube);
        times.push(performance.now())
        prints.push({ task: 'cube', value: times[times.length - 1] - times[times.length - 2] })
        engine.buildSubspaces();
        times.push(performance.now())
        prints.push({ task: 'subspaces', value: times[times.length - 1] - times[times.length - 2] });
        await engine.createInsightSpaces();
        times.push(performance.now())
        prints.push({ task: 'insights', value: times[times.length - 1] - times[times.length - 2] })
        // engine.setInsightScores();
        // times.push(performance.now())
        // prints.push({ task: 'scores', value: times[times.length - 1] - times[times.length - 2] })
        engine.insightSpaces = engine.insightSpaces.filter(s => typeof s.score === 'number' && !isNaN(s.score));
        // engine.insightSpaces.sort((a, b) => Number(a.score) - Number(b.score));
        engine.insightSpaces.sort((a, b) => Number(b.impurity) - Number(a.impurity));
        viewFields = engine.fields;
        insightSpaces = engine.insightSpaces;
        viewSampleData = engine.dataSource;
    } else if (EngineRef.mode === 'clickhouse' && props.mode === 'clickhouse') {
        const engine = EngineRef.current;
        if (engine === null) throw new Error('Engine is not created.');
        const { viewName } = props;
        // engine.setRawFields(fieldsProps);
        await engine.uvsView(viewName);
        await engine.buildDataGraph();
        engine.clusterFields();
        engine.buildSubspaces();
        insightSpaces = await engine.fastInsightRecommand();
        viewFields = engine.fields;
        viewSampleData = await engine.loadData(viewName);
    } else {
        throw new Error(`Engine mode is not support: ${props.mode}`)
    }
    return {
        insightSpaces: insightSpaces.slice(0, 10000),
        fields: viewFields,
        dataSource: viewSampleData,
        performance: prints
    };
}

async function specify (space: IInsightSpace) {
    const engine = EngineRef.current;
    if (engine === null) throw new Error('Engine is not created.');
    return engine.specification(space)
}

async function associate (props: { dimensions: string[]; measures: string[] }) {
    const engine = EngineRef.current;
    if (engine === null) throw new Error('Engine is not created.');
    engine.associate(props);
    if (EngineRef.mode === 'webworker' && EngineRef.mode === 'webworker') {
        return engine.associate(props);
    } else if (EngineRef.mode === 'clickhouse' && EngineRef.mode === 'clickhouse') {
        return engine.associate(props);
    }
}

async function aggregate (props: { dimensions: string[]; measures: string[]; aggregators: StatFuncName[] }): Promise<IRow[]> {
    if (EngineRef.mode === 'webworker' && EngineRef.mode === 'webworker') {
        const engine = EngineRef.current;
        if (engine === null) throw new Error('Engine is not created.');
        const { dimensions, measures, aggregators } = props;
        const cube = engine.cube;
        if (cube === null) throw new Error('Cube is not init.')
        const cuboid = await cube.getCuboid(dimensions);
        const aggData = await cuboid.getAggregatedRows(measures, aggregators);
        return aggData;
    } else if (EngineRef.mode === 'clickhouse' && EngineRef.mode === 'clickhouse') {
        const engine = EngineRef.current;
        if (engine === null) throw new Error('Engine is not created.');
        // engine.loadD
        // return engine.associate(spaceIndex);
        return []
    }
    return []
}

function exportResult (): Pick<IRathStorage, 'dataStorage' | 'engineStorage'> {
    if (EngineRef.mode === 'webworker') {
        const engine = EngineRef.current
        if (engine === null) throw new Error('Engine is not created.');
        const ser = engine.serialize();
        return {
            dataStorage: JSON.stringify(ser.dataStorage),
            engineStorage: JSON.stringify(ser.storage)
        }
    } else {
        throw new Error('Not supported current data engine type.')
    }
}

function importFromUploads(props: Pick<IRathStorage, 'dataStorage' | 'engineStorage'>) {
    if (EngineRef.mode === 'webworker') {
        const engine = EngineRef.current
        if (engine === null) throw new Error('Engine is not created.');
        const { dataStorage, engineStorage } = props;
        engine.deSerialize(JSON.parse(engineStorage), JSON.parse(dataStorage))
    } else {
        throw new Error('Not supported current data engine type.')
    }
}

function syncEngine (): ISyncEngine {
    if (EngineRef.mode === 'webworker') {
        const engine = EngineRef.current
        if (engine === null) throw new Error('Engine is not created.');
        return {
            fields: engine.fields,
            dataSource: engine.dataSource,
            insightSpaces: engine.insightSpaces
        }
    } else {
        throw new Error('Not supported current data engine type.')
    }
}

async function subInsight (props: ViewSpace) {
    if (EngineRef.mode === 'webworker') {
        const engine = EngineRef.current
        if (engine === null) throw new Error('Engine is not created.');
        const res = await engine.searchPointInterests(props)
        return res
    } else {
        throw new Error('Not supported current data engine type.')
    }
}

export async function router (e: { data: MessageProps }, onSuccess: (res?: any) => void, onFailed: (res: string) => void) {
    const req = e.data;
    try {
        switch (req.task) {
            case 'cube': {
                const aggData = await aggregate(req.props);
                onSuccess(aggData);
                break;
            }
            case 'init':
                initEngine(req.props);
                onSuccess()
                break;
            case 'destroy':
                destroyEngine();
                onSuccess()
                break;
            case 'start': {
                const res_start = await startPipeLine(req.props);
                onSuccess(res_start);
                break;
            }
            case 'specification': {
                const res_spec = await specify(req.props);
                onSuccess(res_spec)
                break;
            }
            case 'associate': {
                const res_asso = await associate(req.props);
                onSuccess(res_asso)
                break;
            }
            case 'download': {
                const res_result = exportResult();
                onSuccess(res_result)
                break;
            }
            case 'sync': {
                const res_sync = syncEngine();
                onSuccess(res_sync);
                break;
            }
            case 'subinsight': {
                const res_subinsight = await subInsight(req.props);
                onSuccess(res_subinsight);
                break;
            }
            case 'upload': {
                const res_upload = importFromUploads(req.props);
                onSuccess(res_upload)
                break;
            }
            default:
                throw new Error(`Unknow task: "${req.task}".`)
        }
    } catch (error: any) {
        onFailed(`[${req.task}]${error}\n${error.stack}`)
    }
}