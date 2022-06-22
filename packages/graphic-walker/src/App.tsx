import React, { useState, useEffect } from 'react';
import { Record, IMutField } from './interfaces';
import VisualSettings from './visualSettings';
import { Container, NestContainer } from './components/container';
import ClickMenu from './components/clickMenu';
import InsightBoard from './InsightBoard/index';
import PosFields from './Fields/posFields';
import AestheticFields from './Fields/AestheticFields';
import DatasetFields from './Fields/datasetFields/index';
import ReactiveRenderer from './renderer/index';
import DataSourceSegment from './dataSource/index';
import { useGlobalStore } from './store';
import { preAnalysis, destroyWorker } from './services'
import { observer } from 'mobx-react-lite';
import { LightBulbIcon } from '@heroicons/react/outline'
import { toJS } from 'mobx';
import "tailwindcss/tailwind.css"
import './index.css'
import { Specification } from 'visual-insights';

export interface EditorProps {
	dataSource?: Record[];
	rawFields?: IMutField[];
	spec?: Specification
}

const App: React.FC<EditorProps> = props => {
	const { dataSource = [], rawFields = [], spec } = props;
	const { commonStore, vizStore } = useGlobalStore();
	const [insightReady, setInsightReady] = useState<boolean>(true);

	const { currentDataset, datasets, vizEmbededMenu } = commonStore;

	// use as an embeding module, use outside datasource from props.
	useEffect(() => {
		if (dataSource.length > 0) {
			commonStore.addAndUseDS({
				name: 'context dataset',
				dataSource: dataSource,
				rawFields
			})
		}
	}, [dataSource, rawFields])

	useEffect(() => {
		if (spec) {
			vizStore.renderSpec(spec);
		}
	}, [spec])

	// do preparation analysis work when using a new dataset
	useEffect(() => {
		const ds = currentDataset;
		if (ds && ds.dataSource.length > 0 && ds.rawFields.length > 0) {
			setInsightReady(false)
			preAnalysis({
				dataSource: ds.dataSource,
				fields: toJS(ds.rawFields)
			}).then(() => {
				setInsightReady(true);
			})
		}
		return () => {
			destroyWorker();
		}
	}, [currentDataset]);

	return (
		<div className="App">
			<DataSourceSegment preWorkDone={insightReady} />
			<VisualSettings />
			<Container>
				<div className="grid grid-cols-12 xl:grid-cols-6">
					<div className="col-span-3 xl:col-span-1">
						<DatasetFields />
					</div>
					<div className="col-span-2 xl:col-span-1">
						<AestheticFields />
					</div>
					<div className="col-span-7 xl:col-span-4">
						<div>
							<PosFields />
						</div>
						<NestContainer style={{ minHeight: '600px', overflow: 'auto' }} onMouseLeave={() => {
							vizEmbededMenu.show && commonStore.closeEmbededMenu();
						}}>
							{datasets.length > 0 && <ReactiveRenderer />}
							<InsightBoard />
							{vizEmbededMenu.show && (
								<ClickMenu x={vizEmbededMenu.position[0]} y={vizEmbededMenu.position[1]}>
									<div className="flex items-center"
										onClick={() => {
											commonStore.closeEmbededMenu();
											commonStore.setShowInsightBoard(true)
										}}
									>
										数据解读<LightBulbIcon className="ml-1 w-3 inline-block" />
									</div>
								</ClickMenu>
							)}
						</NestContainer>
					</div>
				</div>
			</Container>
		</div>
	)
}

export default observer(App);
