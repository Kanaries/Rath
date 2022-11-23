import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import json
from itertools import combinations
from insight import insight_check

def read_json(filepath):
    with open(filepath,'r') as load_f:
        load_dict = json.load(load_f)
        fields = pd.DataFrame(load_dict['fields'])
        dataSource = pd.DataFrame(load_dict['dataSource'])
        fields = fields.loc[[i in dataSource.columns for i in fields.fid],:]
        dataSource = dataSource.dropna()
    return dataSource,fields

def traverse_fields(dataSource,fields,check_list=None):
    traverse_return = []
    columns = []
    for i in range(2,min(len(fields['fid']),5)):
        for j in combinations(list(fields['fid']),i):
            columns.append(list(j))
    select_columns = [columns[i] for i in range(len(columns)) if i%(np.floor(len(columns)/100))==0]
    for col in select_columns:
        # print(col)
        insight_dict,insight_input = insight_check(fields,dataSource.loc[:,col],check_list)
        for d in insight_dict:
            if insight_dict[d]['score']>0:
                traverse_return.append({'type':d,'col':col,'insight_input':insight_input,'dict':insight_dict[d]})
        # display_insight_dict(insight_dict,dataSource)
    return traverse_return

def display_insight_dict(insight_dict,dataSource):
    
    # 展示2DClustering
    if '2DClustering' in insight_dict:
        print('2DClustering:',insight_dict['2DClustering']['score'])
        if insight_dict['2DClustering']['score']>0:
            labelSet = insight_dict['2DClustering']['para']['labelSet']
            label = insight_dict['2DClustering']['para']['label']
            x = insight_dict['2DClustering']['para']['x']
            y = insight_dict['2DClustering']['para']['y']
            for i in set(labelSet):
                plt.scatter(x[label==i],y[label==i])
            plt.show()
            
    # 展示CrossMeasureCorrelation
    if 'CrossMeasureCorrelation' in insight_dict:
        print('CrossMeasureCorrelation:',insight_dict['CrossMeasureCorrelation']['score'])
        if insight_dict['CrossMeasureCorrelation']['score']>0:
            x = insight_dict['CrossMeasureCorrelation']['para']['x']
            y = insight_dict['CrossMeasureCorrelation']['para']['y']
            plt.scatter(x,y)
            plt.show()
        
    # 展示Correlation
    if 'Correlation' in insight_dict:
        print('Correlation:',insight_dict['Correlation']['score'])
        if insight_dict['Correlation']['score']>0:
            x = insight_dict['Correlation']['para']['x']
            y = insight_dict['Correlation']['para']['y']
            plt.scatter(x,y)
            plt.show()
        
    # 展示Attribution
    if 'Attribution' in insight_dict:
        print('Attribution:',insight_dict['Attribution']['score'])
        if insight_dict['Attribution']['score']>0:
            persent = insight_dict['Attribution']['para']['persent']
            plt.pie(persent)
            plt.show()
            
    # 展示OutstandingNo1
    if 'OutstandingNo1' in insight_dict:
        print('OutstandingNo1:',insight_dict['OutstandingNo1']['score'])
        if insight_dict['OutstandingNo1']['score']>0:
            persent = insight_dict['OutstandingNo1']['para']['persent']
            plt.bar(range(len(persent)),persent)
            plt.show()
        
    # 展示OutstandingNo2
    if 'OutstandingNo2' in insight_dict:
        print('OutstandingNo2:',insight_dict['OutstandingNo2']['score'])
        if insight_dict['OutstandingNo2']['score']>0:
            persent = insight_dict['OutstandingNo2']['para']['persent']
            plt.bar(range(len(persent)),persent)
            plt.show()
        
    # 展示OutstandingLast
    if 'OutstandingLast' in insight_dict:
        print('OutstandingLast:',insight_dict['OutstandingLast']['score'])
        if insight_dict['OutstandingLast']['score']>0:
            persent = insight_dict['OutstandingLast']['para']['persent']
            plt.bar(range(len(persent)),persent)
            plt.show()
        
    # 展示Evenness
    if 'Evenness' in insight_dict:
        print('Evenness:',insight_dict['Evenness']['score'])
        if insight_dict['Evenness']['score']>0:
            persent = insight_dict['Evenness']['para']['persent']
            plt.bar(range(len(persent)),persent)
            plt.show()
             
    # 展示ChangePoint
    if 'ChangePoint' in insight_dict:
        print('ChangePoint:',insight_dict['ChangePoint']['score'])
        if insight_dict['ChangePoint']['score']>0:
            timelabel = insight_dict['ChangePoint']['para']['timelabel']
            timeseries = insight_dict['ChangePoint']['para']['timeseries']
            ChangePointMean = insight_dict['ChangePoint']['para']['ChangePointMean']
            ChangePointSlope = insight_dict['ChangePoint']['para']['ChangePointSlope']
            mean_index = [i for i in range(len(timeseries)) if timelabel[i] in ChangePointMean]
            mean_value = [timeseries[i] for i in range(len(timeseries)) if timelabel[i] in ChangePointMean]
            slope_index = [i for i in range(len(timeseries)) if timelabel[i] in ChangePointSlope]
            slope_value = [timeseries[i] for i in range(len(timeseries)) if timelabel[i] in ChangePointSlope]
            plt.plot(timeseries)
            plt.scatter(mean_index,mean_value,color='g',marker='o')
            plt.scatter(slope_index,slope_value,color='r',marker='x')
            plt.show()
    
    # 展示Outlier
    if 'Outlier' in insight_dict:
        print('Outlier:',insight_dict['Outlier']['score'])
        if insight_dict['Outlier']['score']>0:
            timelabel = insight_dict['Outlier']['para']['timelabel']
            timeseries = insight_dict['Outlier']['para']['timeseries']
            Outlier = insight_dict['Outlier']['para']['Outlier']

            plt.plot(range(len(timeseries)),timeseries)
            plt.scatter([i for i in range(len(timeseries)) if timelabel[i] in Outlier],\
                        [timeseries[i] for i in range(len(timeseries)) if timelabel[i] in Outlier],color='g')
            plt.show()
        
    # 展示Seasonality
    if 'Seasonality' in insight_dict:
        print('Seasonality:',insight_dict['Seasonality']['score'])
        if insight_dict['Seasonality']['score']>0:
            timelabel = insight_dict['Seasonality']['para']['timelabel']
            timeseries = insight_dict['Seasonality']['para']['timeseries']
            plt.plot(timeseries)
            plt.show()
        
    # 展示Trend
    if 'Trend' in insight_dict:
        print('Trend:',insight_dict['Trend']['score'])
        if insight_dict['Trend']['score']>0:
            timeseries = insight_dict['Trend']['para']['timeseries']
            slope = insight_dict['Trend']['para']['slope']
            intercept = insight_dict['Trend']['para']['intercept']
            x = np.array(range(len(timeseries)))
            y = x*slope+intercept
            plt.scatter(x,timeseries)
            plt.plot(x,y,color='r')
            plt.show()
    
    # 展示HeteroscedasticityV1
    if 'HeteroscedasticityV1' in insight_dict:
        print('HeteroscedasticityV1:',insight_dict['HeteroscedasticityV1']['score'])
        if insight_dict['HeteroscedasticityV1']['score']>0:
            timeseries = insight_dict['HeteroscedasticityV1']['para']['timeseries']
            slope = insight_dict['HeteroscedasticityV1']['para']['slope']
            intercept = insight_dict['HeteroscedasticityV1']['para']['intercept']
            x = np.array(range(len(timeseries)))
            y = x*slope+intercept
            plt.scatter(x,timeseries)
            plt.plot(x,y,color='r')
            plt.show()
        
    # 展示HeteroscedasticityV2
    if 'HeteroscedasticityV2' in insight_dict:
        print('HeteroscedasticityV2:',insight_dict['HeteroscedasticityV2']['score'])
        if insight_dict['HeteroscedasticityV2']['score']>0:
            timeseries = insight_dict['HeteroscedasticityV2']['para']['timeseries']
            slope = insight_dict['HeteroscedasticityV2']['para']['slope']
            intercept = insight_dict['HeteroscedasticityV2']['para']['intercept']
            x = np.array(range(len(timeseries)))
            y = x*slope+intercept
            plt.scatter(x,timeseries)
            plt.plot(x,y,color='r')
            plt.show()
            
    # 展示SimpsonParadoxV1
    if 'SimpsonParadoxV1' in insight_dict:
        print('SimpsonParadoxV1:',insight_dict['SimpsonParadoxV1']['score'])
        if insight_dict['SimpsonParadoxV1']['score']>0:
            labelSet = insight_dict['SimpsonParadoxV1']['para']['labelSet']
            label = insight_dict['SimpsonParadoxV1']['para']['label']
            x = insight_dict['SimpsonParadoxV1']['para']['x']
            y = insight_dict['SimpsonParadoxV1']['para']['y']
            slope = insight_dict['SimpsonParadoxV1']['para']['slope']
            intercept = insight_dict['SimpsonParadoxV1']['para']['intercept']
            for i in set(labelSet):
                plt.scatter(x[label==i],y[label==i])
            plt.plot(x,x*slope+intercept,color='r')
            plt.show()
            
    # 展示SimpsonParadoxV2
    if 'SimpsonParadoxV2' in insight_dict:
        print('SimpsonParadoxV2:',insight_dict['SimpsonParadoxV2']['score'])
        if insight_dict['SimpsonParadoxV2']['score']>0:
            labelSet = insight_dict['SimpsonParadoxV2']['para']['labelSet']
            label = insight_dict['SimpsonParadoxV2']['para']['label']
            x = insight_dict['SimpsonParadoxV2']['para']['x']
            y = insight_dict['SimpsonParadoxV2']['para']['y']
            slope = insight_dict['SimpsonParadoxV2']['para']['slope']
            intercept = insight_dict['SimpsonParadoxV2']['para']['intercept']
            for i in set(labelSet):
                plt.scatter(x[label==i],y[label==i])
            plt.plot(x,x*slope+intercept,color='r')
            plt.show()
    
    # 展示SimpsonParadoxV3
    if 'SimpsonParadoxV3' in insight_dict:
        print('SimpsonParadoxV3:',insight_dict['SimpsonParadoxV3']['score'])
        if insight_dict['SimpsonParadoxV3']['score']>0:
            labelSet = insight_dict['SimpsonParadoxV3']['para']['labelSet']
            label = insight_dict['SimpsonParadoxV3']['para']['label']
            x = insight_dict['SimpsonParadoxV3']['para']['x']
            y = insight_dict['SimpsonParadoxV3']['para']['y']
            for i in labelSet:
                plt.scatter(x[label==i],y[label==i])
            plt.show()
    
    # 展示NolinearrelationshipV1
    if 'NolinearrelationshipV1' in insight_dict:
        print('NolinearrelationshipV1:',insight_dict['NolinearrelationshipV1']['score'])
        if insight_dict['NolinearrelationshipV1']['score']>0:
            x = insight_dict['NolinearrelationshipV1']['para']['x']
            y = insight_dict['NolinearrelationshipV1']['para']['y']
            slope = insight_dict['NolinearrelationshipV1']['para']['slope']
            intercept = insight_dict['NolinearrelationshipV1']['para']['intercept']
            plt.scatter(x,y)
            plt.plot(x,x*slope+intercept,color='b')
            plt.show()