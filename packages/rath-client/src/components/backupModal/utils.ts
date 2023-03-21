import { BlobWriter, ZipWriter, TextReader } from "@zip.js/zip.js";
import { KanariesDatasetFilenameCloud, KanariesDatasetPackCloudExtension } from "../../constants";
import { IDatasetData, IDatasetFieldMeta } from "../../interfaces";
import { getGlobalStore } from "../../store";
import { IKRFComponents, IParseMapItem, KRF_VERSION } from "../../utils/download";


export const writeNotebookFile = async (parseMapItems: IParseMapItem[], filename: string): Promise<File> => {
    const { dataSourceStore, collectionStore, causalStore, dashboardStore } = getGlobalStore();
    const zipFileWriter = new BlobWriter();
    const zipWriter = new ZipWriter(zipFileWriter);
    const pm = new TextReader(JSON.stringify({
        items: parseMapItems,
        version: KRF_VERSION
    }));
    zipWriter.add("parse_map.json", pm);
    for await (const item of parseMapItems) {
        switch (item.key) {
            case IKRFComponents.data: {
                const data = await dataSourceStore.backupDataStore()
                const content = new TextReader(JSON.stringify(data));
                await zipWriter.add(item.name, content);
                break;
            }
            case IKRFComponents.meta: {
                const data = await dataSourceStore.backupMetaStore()
                const content = new TextReader(JSON.stringify(data));
                await zipWriter.add(item.name, content);
                break;
            }
            case IKRFComponents.collection: {
                const data = await collectionStore.backupCollectionStore()
                const content = new TextReader(JSON.stringify(data));
                await zipWriter.add(item.name, content);
                break;
            }
            case IKRFComponents.causal: {
                const save = await causalStore.save();
                if (save) {
                    const content = new TextReader(JSON.stringify(save));
                    await zipWriter.add(item.name, content);
                }
                break;
            }
            case IKRFComponents.dashboard: {
                const save = dashboardStore.save();
                const content = new TextReader(JSON.stringify(save));
                await zipWriter.add(item.name, content);
                break;
            }
            default: {
                break;
            }
        }
    }
    const blob = await zipWriter.close();
    const fileName = `${filename}.krf`;
    return new File([blob], fileName);
};

export const writeDatasetFile = async (filename: string): Promise<[File, number, IDatasetFieldMeta[]]> => {
    const { dataSourceStore } = getGlobalStore();
    const data: IDatasetData = {
        meta: await dataSourceStore.backupMetaStore(),
        data: await dataSourceStore.backupDataStore(),
    };
    const zipFileWriter = new BlobWriter();
    const zipWriter = new ZipWriter(zipFileWriter);
    const tr = new TextReader(JSON.stringify(data));
    await zipWriter.add(KanariesDatasetFilenameCloud, tr);
    const allFields = data.meta.mutFields.concat(data.meta.extFields).map<IDatasetFieldMeta>(f => {
        const meta = dataSourceStore.fieldMetas.find(which => which.fid === f.fid);
        return {
            ...f,
            name: f.name ?? f.fid,
            features: meta?.features ?? {
                entropy: 0,
                maxEntropy: 0,
                unique: 0,
                max: null,
                min: null,
                sum: null,
                mean: null,
                count: null,
                stdev: null,
                qt_25: null,
                qt_50: null,
                qt_75: null,
            },
        };
    });
    const blob = await zipWriter.close();
    const fileName = `${filename}.${KanariesDatasetPackCloudExtension}`;
    return [new File([blob], fileName), data.data.rawData.length, allFields];
};
