import React from 'react';
import Table from '../table';
import { DemoDataAssets, PUBLIC_DATA_LIST } from '../config'
import { useGlobalStore } from '../../store';
import { observer } from 'mobx-react-lite';
interface IPublicDataProps {

}

const PublicData: React.FC<IPublicDataProps> = props => {
    const { commonStore } = useGlobalStore();
    const { tmpDataSource } = commonStore;
    return <div>
        <div className="h-48 overflow-auto mb-1">
            {
                PUBLIC_DATA_LIST.map(data => <div key={data.key}
                    onClick={() => {
                        fetch(DemoDataAssets[data.key]).then(res => res.json())
                        .then(res => {
                            commonStore.updateTempSTDDS({
                                dataSource: res.dataSource,
                                rawFields: res.fields.map(f => ({
                                    fid: f.fid,
                                    name: f.name,
                                    analyticType: f.analyticType,
                                    semanticType: f.semanticType,
                                    dataType: f.dataType || '?'
                                })),
                                name: data.title
                            })
                        })
                    }}
                    className="border rounded border-gray-400 p-2 m-2 cursor-pointer hover:bg-gray-50"
                    >
                <div>{data.title}</div>
                {/* <p>{data.title}</p> */}
            </div>)
            }
        </div>
        <hr className="m-1" />
        <button className="inline-block min-w-96 text-xs mr-2 pt-1 pb-1 pl-6 pr-6 bg-yellow-600 rounded-sm hover:bg-yellow-500 text-white font-bold disabled:bg-gray-300"
            disabled={tmpDataSource.length === 0}
            onClick={() => { commonStore.commitTempDS() }}
        >确认使用</button>
        <hr className="m-1" />
        <Table />
    </div>
}

export default observer(PublicData);
