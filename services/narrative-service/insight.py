import json
import pandas as pd
import numpy as np
from scipy.optimize import curve_fit
from scipy.stats import norm,ks_2samp
from scipy.cluster.vq import kmeans,whiten
from sklearn.cluster import DBSCAN
from scipy.stats import pearsonr,ttest_rel,linregress
from typing import List, Tuple, Dict
from pyscagnostics import scagnostics

import warnings
warnings.filterwarnings("ignore")

VectorStr = List[str]
VectorNum = List[float]
VectorObj = List[object]

def func_residuals(x:VectorNum, alpha:float, beta:float)->VectorNum:
    return alpha*(x**-beta)

def func_aggr(subDataSource:object,breakdown:VectorStr,aggrType:str)->object:
    aggr_mark = False
    if breakdown is not None:
        if len(breakdown) > 0:
            if aggrType=='sum':
                groupData = subDataSource.groupby(breakdown).sum()
            elif aggrType=='count':
                groupData = subDataSource.groupby(breakdown).count()
            elif aggrType=='mean':
                groupData = subDataSource.groupby(breakdown).mean()
            elif aggrType=='max':
                groupData = subDataSource.groupby(breakdown).max()
            elif aggrType=='min':
                groupData = subDataSource.groupby(breakdown).min()
            elif aggrType=='median':
                groupData = subDataSource.groupby(breakdown).median()
            aggr_mark = True
        else:
            groupData = subDataSource
    else:
        groupData = subDataSource
    return groupData,aggr_mark

def cal_2DClustering(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-2 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    whitened = whiten(groupData[measures[0:2]])
    if np.std(whitened[:,0])==0 or np.std(whitened[:,1])==0:
        score = 0
        para = {}
    else:
        pccs,p_value = pearsonr(whitened[:,0], whitened[:,1])
        # score = np.abs(pccs)
        x = whitened[:,0]
        y = whitened[:,1]
        whitened[:,0] = (whitened[:,0]-whitened[:,0].min())/(whitened[:,0].max()-whitened[:,0].min())
        whitened[:,1] = (whitened[:,1]-whitened[:,1].min())/(whitened[:,1].max()-whitened[:,1].min())
        clustering = DBSCAN(eps=whitened.max()/20, min_samples=1).fit(whitened)
        label = clustering.labels_
        labelSet = list(set(clustering.labels_))
        labelNum = np.array([np.sum(np.array(label)==i) for i in labelSet])
        score = np.mean(labelNum)/np.max(labelNum)
        explain = explain_2DClustering(langType,measures[0],measures[1],aggr_mark,aggrType,breakdown)
        # explain = 'There is a good clustering between '+measures[0]+' and '+measures[1]
        # if aggr_mark:
        #     explain = explain+' after '+aggrType+' with '+breakdown[0]
        para = {
            'explain':explain,
            'labelSet':labelSet,
            'label':label,
            'x':x,
            'y':y
        }
    return score,para

def cal_CrossMeasureCorrelation(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-2 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    whitened = whiten(groupData[measures[0:2]])
    if np.std(whitened[:,0])==0 or np.std(whitened[:,1])==0:
        score = 0
        para = {}
    else:
        x = whitened[:,0]
        y = whitened[:,1]
        pccs,p_value = pearsonr(x,y)
        score = np.abs(pccs)
        explain = explain_CrossMeasureCorrelation(langType,measures[0],measures[1],aggr_mark,aggrType,breakdown)
        # explain = 'There is correlation between '+measures[0]+' and '+measures[1]
        # if aggr_mark:
        #     explain = explain+' after '+aggrType+' with '+breakdown[0]
        para = {
            'explain':explain,
            'x':x,
            'y':y
        }
    return score,para

def cal_Correlation(subspaces:VectorObj,subspaces_name:VectorStr,breakdown:VectorStr,\
                    measures:VectorStr,aggrType:str,langType:str)->Tuple[float,dict]:
    # subspaces-2 spaces,measures-1 measures
    groupAggr = [func_aggr(i,breakdown,aggrType) for i in subspaces]
    groupData = [i[0] for i in groupAggr]
    group_index = [i for i in groupData[0].index if i in groupData[1].index]
    groupData_com = [i.loc[group_index] for i in groupData]
    para = {}
    x = groupData_com[0][measures[0]].values
    y = groupData_com[1][measures[0]].values
    para['x'] = x
    para['y'] = y
    if np.std(x)==0 or np.std(y)==0:
        score = 0
    else:
        pccs,p_value = pearsonr(x,y)
        if pccs==1:
            score = 0
        else:
            score = np.abs(pccs)
            if len(subspaces_name)>1:
                explain = explain_Correlation(langType,subspaces_name[0],subspaces_name[1],aggrType,breakdown[0])
                # explain = 'There is correlation between '+subspaces_name[0]+' and '+subspaces_name[1]+' after '+aggrType+' with '+breakdown[0]
                para['explain'] = explain
            if pccs<0:
                para['sign'] = -1
            else:
                para['sign'] = 1
    return score,para

def cal_Attribution(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    persent_list = groupData[measures[0]].values
    arg_index = np.argsort(-persent_list)
    first_persent = persent_list[arg_index[0]]/np.sum(persent_list)
    para = {}
    para['persent'] = persent_list
    if first_persent==np.nan:
        score = max(first_persent-0.5,0)/0.5
        if score!=0:
            explain = explain_Attribution(langType,measures[0],aggrType,str(groupData.index[arg_index[0]]),breakdown[0])
            # explain = 'The '+measures[0]+' '+aggrType+' of '+groupData.index[arg_index[0]]+' is dominant in '+breakdown[0]
            para['explain'] = explain
            para['group'] = breakdown
            para['key'] = groupData.index[arg_index[0]]
    else:
        score = 0
    return score,para

def cal_OutstandingNo1(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    persent_list = groupData[measures[0]].values
    arg_index = np.argsort(-np.squeeze(persent_list),axis=0)
    arg_list = np.squeeze(persent_list[arg_index])
    ydata = arg_list
    ydata = ydata[ydata>0]
    xdata = np.array(list(range(len(ydata))))+1
    para = {}
    para['persent'] = ydata
    if len(ydata)<=2:
        score = 0
    else:
        score = min(np.abs(ydata[0]/ydata[1]-1),1)
        explain = explain_OutstandingNo1(langType,measures[0],aggrType,str(groupData.index[arg_index[0]]),breakdown[0])
        # explain = 'The '+measures[0]+' '+aggrType+' of '+groupData.index[arg_index[0]]+' is dominant in '+breakdown[0]
        para['explain'] = explain
        para['group'] = breakdown
        para['key'] = groupData.index[arg_index[0]]
    return score,para

def cal_OutstandingNo2(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    persent_list = groupData[measures[0]].values
    arg_index = np.argsort(-np.squeeze(persent_list),axis=0)
    arg_list = np.squeeze(persent_list[arg_index])
    ydata = arg_list
    ydata = ydata[ydata>0]
    xdata = np.array(list(range(len(ydata))))+1
    para = {}
    para['persent'] = ydata
    if len(ydata)<=3:
        score = 0
    else:
        score = min(np.abs(ydata[1]/ydata[2]-1),1)
        explain = explain_OutstandingNo2(langType,measures[0],aggrType,str(groupData.index[arg_index[0]]),str(groupData.index[arg_index[1]]),breakdown[0])
        # explain = 'The '+measures[0]+' '+aggrType+' of '+groupData.index[arg_index[0]]+' and '+groupData.index[arg_index[1]]+' is dominant in '+breakdown[0]
        para['explain'] = explain
        para['group'] = breakdown
        para['key'] = groupData.index[arg_index[0]]
    return score,para

def cal_OutstandingLast(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    persent_list = groupData[measures[0]].values
    arg_index = np.argsort(np.squeeze(persent_list),axis=0)
    arg_list = np.squeeze(persent_list[arg_index])
    ydata = arg_list
    ydata = -ydata[ydata<0]
    xdata = np.array(list(range(len(ydata))))+1
    para = {}
    para['persent'] = -ydata
    if len(ydata)<=2:
        score = 0
    else:
        score = min(np.abs(ydata[0]/ydata[1]-1),1)
        explain = explain_OutstandingLast(langType,measures[0],aggrType,str(groupData.index[arg_index[0]]),breakdown[0])
        # explain = 'The '+measures[0]+' '+aggrType+' of '+groupData.index[arg_index[0]]+' is dominant in '+breakdown[0]
        para['explain'] = explain
        para['group'] = breakdown
        para['key'] = groupData.index[arg_index[0]]
    return score,para

def cal_Evenness(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    persent_list = groupData[measures[0]].values
    std = np.std(persent_list)
    para = {}
    para['persent'] = persent_list
    if std==0:
        score = 1
    else:
        alpha = abs(np.mean(persent_list))/(std+abs(np.mean(persent_list)))
        score = max(alpha-0.85,0)/0.15
        explain = explain_Evenness(langType,measures[0],aggrType,breakdown[0])
        # explain = 'There is a relatively steady percent of '+measures[0]+' after '+aggrType+' with '+breakdown[0]
        para['explain'] = explain
    return score,para

def cal_ChangePoint(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,rangeN:int,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    timelabel = groupData.index
    timeseries = np.squeeze(groupData[measures[0]].values)
    para = {}
    para['timelabel']=timelabel
    para['timeseries']=timeseries
    if len(timeseries)>rangeN*2:
        Y_left = np.array([np.sum(timeseries[i-rangeN:i])/rangeN for i in range(rangeN,len(timeseries)-rangeN+1)])
        Y_right = np.array([np.sum(timeseries[i:i+rangeN])/rangeN for i in range(rangeN,len(timeseries)-rangeN+1)])
        delta_Y = np.sqrt(abs(np.sum(timeseries**2)/2/rangeN-(np.sum(timeseries)/2/rangeN)**2))/np.sqrt(rangeN)
        p_list_mean = norm.cdf(Y_left-Y_right,np.mean(delta_Y),np.std(delta_Y))
        score_mean = max(0.05-p_list_mean.min(),0)/0.05
        score_mean = np.where(np.isnan(score_mean),0,score_mean)
        timeseries_slope = np.array([0]+[timeseries[i]-timeseries[i-1] for i in range(len(timeseries)-1)])
        Y_slope_left = np.array([np.sum(timeseries_slope[i-rangeN:i])/rangeN for i in range(rangeN,len(timeseries_slope)-rangeN+1)])
        Y_slope_right = np.array([np.sum(timeseries_slope[i:i+rangeN])/rangeN for i in range(rangeN,len(timeseries_slope)-rangeN+1)])
        delta_Y_slope = np.sqrt(abs(np.sum(timeseries_slope**2)/2/rangeN-(np.sum(timeseries_slope)/2/rangeN)**2))/np.sqrt(rangeN)
        p_list_slope = norm.cdf(Y_slope_left-Y_slope_right,np.mean(delta_Y_slope),np.std(delta_Y_slope))
        score_slope = max(0.05-p_list_slope.min(),0)/0.05
        score_slope = np.where(np.isnan(score_slope),0,score_slope)
        score = max(score_mean,score_slope)
        para['ChangePointMean'] = timelabel[rangeN:len(timeseries)-rangeN+1][p_list_mean<0.05]
        para['ChangePointSlope'] = timelabel[rangeN:len(timeseries_slope)-rangeN+1][p_list_slope<0.05]
        explain = explain_ChangePoint(langType,para['ChangePointMean'],para['ChangePointSlope'])
        # if len(para['ChangePointMean'])>0:
        #     explain = 'There is change point of mean in '+','.join((str(x) for x in para['ChangePointMean']))
        #     if len(para['ChangePointSlope'])>0:
        #         explain = para['explain']+' and change point of slope in '+','.join((str(x) for x in para['ChangePointSlope']))
        # else:
        #     if len(para['ChangePointSlope'])>0:
        #         explain = 'There is change point of slope in '+','.join((str(x) for x in para['ChangePointSlope']))
        para['explain'] = explain
    else:
        score = 0
    return score,para

def cal_Outlier(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    timelabel = groupData.index
    timeseries = np.squeeze(groupData[measures[0]].values)
    para = {}
    para['timelabel'] = timelabel
    para['timeseries'] = timeseries
    if np.std(timeseries)>0:
        p_list = norm.cdf(timeseries,np.mean(timeseries),np.std(timeseries)**2)
        score = max(0.05-p_list.min(),0)/0.05
        para['Outlier'] = timelabel[p_list<0.05]
    else:
        score = 0
    if score>0:
        para['Outlier'] = timelabel[p_list<0.05]
        explain = explain_Outlier(langType,measures[0],aggrType,breakdown[0])
        # explain = measures[0]+' has outliers after '+aggrType+' with '+breakdown[0]
        para['explain'] = explain
    return score,para

def cal_Seasonality(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    timelabel = groupData.index
    timeseries = np.squeeze(groupData[measures[0]].values)
    time = pd.to_datetime(timelabel)
    winter = np.array([timeseries[i] for i in range(len(time)) if time[i].month in set([12,1,2])])
    spring = np.array([timeseries[i] for i in range(len(time)) if time[i].month in set([3,4,5])])
    summer = np.array([timeseries[i] for i in range(len(time)) if time[i].month in set([6,7,8])])
    autumn = np.array([timeseries[i] for i in range(len(time)) if time[i].month in set([9,10,11])])
    para = {}
    para['timelabel'] = timelabel
    para['timeseries'] = timeseries
    if len(winter)!=0 or len(spring)!=0 or len(summer)!=0 or len(summer)!=0:
        season = np.array([i for i in winter-np.mean(winter)]+[i for i in spring-np.mean(spring)]+\
                          [i for i in summer-np.mean(summer)]+[i for i in autumn-np.mean(autumn)])
        ttest,pval = ttest_rel(season,timeseries-np.mean(timeseries))
        score = 1-pval
        score = np.where(np.isnan(score),0,score)
        if score>0:
            explain = explain_Seasonality(langType,measures[0],aggrType,breakdown[0])
            # explain = measures[0]+' shows seasonality after '+aggrType+' with '+breakdown[0]
            para['explain'] = explain
    else:
        score = 0
    return score,para

def cal_Trend(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    timeseries = np.squeeze(groupData[measures[0]].values)
    slope, intercept, r, p, se = linregress(range(len(timeseries)), timeseries)
    para = {'slope':slope,'intercept':intercept,'timeseries':timeseries}
    timeseries_avg = timeseries - np.array(range(len(timeseries)))*slope+intercept
    std = np.std(timeseries_avg)
    if std==0:
        score = 1
    else:
        alpha = abs(np.mean(timeseries_avg))/(std+abs(np.mean(timeseries_avg)))
        score = max(alpha-0.85,0)/0.15
    explain = explain_Trend(langType,slope,measures[0])
    # if slope>0:
    #     explain = measures[0]+'is trending upwards'
    # elif slope<0:
    #     explain = measures[0]+'is trending downwards'
    para['explain'] = explain
    return score,para

def cal_HeteroscedasticityV1(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    timeseries = np.squeeze(groupData[measures[0]].values)
    slope, intercept, r, p, se = linregress(range(len(timeseries)), timeseries)
    para = {'slope':slope,'intercept':intercept,'timeseries':timeseries}
    timeseries_line = np.array(range(len(timeseries)))*slope+intercept
    residuals = np.abs(timeseries-timeseries_line)
    was_dis = np.sqrt(np.sum(np.abs(np.argsort(residuals)-np.array(range(len(residuals))))))/len(residuals)
    score = 1-min(was_dis/0.618,1)
    if score>0:
        explain = explain_HeteroscedasticityV1(langType,measures[0],aggrType,breakdown[0])
        # explain = measures[0]+' shows heteroscedasticity after '+aggrType+' with '+breakdown[0]
        para['explain'] = explain
    return score,para

def cal_HeteroscedasticityV2(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-1 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    timeseries = np.squeeze(groupData[measures[0]].values)
    slope, intercept, r, p, se = linregress(range(len(timeseries)), timeseries)
    para = {'slope':slope,'intercept':intercept,'timeseries':timeseries}
    timeseries_line = np.array(range(len(timeseries)))*slope+intercept
    residuals = np.flip(np.abs(timeseries-timeseries_line))
    was_dis = np.sqrt(np.sum(np.abs(np.argsort(residuals)-np.array(range(len(residuals))))))/len(residuals)
    score = 1-min(was_dis/0.618,1)
    if score>0:
        explain = explain_HeteroscedasticityV2(langType,measures[0],aggrType,breakdown[0])
        # explain = measures[0]+' shows heteroscedasticity after '+aggrType+' with '+breakdown[0]
        para['explain'] = explain
    return score,para

def cal_SimpsonParadoxV1(measures:VectorStr,subDataSource:object,langType:str)->Tuple[float,dict]:
    # measures-2 measures
    whitened = whiten(subDataSource[measures[0:2]])
    if np.std(whitened[:,0])==0 or np.std(whitened[:,1])==0:
        score = 0
        para = {}
    else:
        x = whitened[:,0]
        y = whitened[:,1]
        whitened[:,0] = (whitened[:,0]-whitened[:,0].min())/(whitened[:,0].max()-whitened[:,0].min())
        whitened[:,1] = (whitened[:,1]-whitened[:,1].min())/(whitened[:,1].max()-whitened[:,1].min())
        clustering = DBSCAN(eps=whitened.max()/20, min_samples=1).fit(whitened)
        label = clustering.labels_
        label_list = [[j for j in range(len(label)) if label[j]==i] for i in list(set(label))]
        para = {
            'labelSet':list(set(clustering.labels_)),
            'label':label,
            'x':x,
            'y':y
        }
        if np.sum([len(i)>=3 for i in label_list])>=3 and np.std(x)>0:
            label_list_used = [i for i in label_list if len(i)>=3]
            slope, intercept, r, p, se = linregress(x, y)
            para['slope'] = slope
            para['intercept'] = intercept
            slope_list = []
            intercept_list = []
            for i in label_list:
                if len(i)>=3 and np.std(x[i])>0:
                    k, b, r, p, se = linregress(x[i], y[i])
                    slope_list.append(k)
                    intercept_list.append(b)
            score = (1 - min(1,np.std(slope_list)/0.1))*min(1,np.abs(np.mean(slope_list)-slope)/0.15)
        else:
            score = 0
        if score>0:
            explain = explain_SimpsonParadoxV1(langType,measures[1],measures[0])
            # explain = measures[1]+' for '+measures[0]+' shows simpson paradox'
            para['explain'] = explain
    return score,para

def cal_SimpsonParadoxV2(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-2 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    whitened = whiten(np.squeeze(groupData[measures[0:2]].values))
    if len(groupData)<2:
        score = 0
        para = {}
    else:
        if np.std(whitened[:,0])==0 or np.std(whitened[:,1])==0:
            score = 0
            para = {}
        else:
            x = whitened[:,0]
            y = whitened[:,1]
            whitened[:,0] = (whitened[:,0]-whitened[:,0].min())/(whitened[:,0].max()-whitened[:,0].min())
            whitened[:,1] = (whitened[:,1]-whitened[:,1].min())/(whitened[:,1].max()-whitened[:,1].min())
            clustering = DBSCAN(eps=whitened.max()/20, min_samples=1).fit(whitened)
            label = clustering.labels_
            label_list = [[j for j in range(len(label)) if label[j]==i] for i in list(set(label))]
            para = {
                'labelSet':list(set(clustering.labels_)),
                'label':label,
                'x':x,
                'y':y
            }
            if np.sum([len(i)>=3 for i in label_list])>=3 and np.std(x)>0:
                label_list_used = [i for i in label_list if len(i)>=3]
                slope, intercept, r, p, se = linregress(x, y)
                para['slope'] = slope
                para['intercept'] = intercept
                slope_list = []
                intercept_list = []
                for i in label_list:
                    if len(i)>=3 and np.std(x[i])>0:
                        k, b, r, p, se = linregress(x[i], y[i])
                        slope_list.append(k)
                        intercept_list.append(b)
                score = (1 - min(1,np.std(slope_list)/0.1))*min(1,np.abs(np.mean(slope_list)-slope)/0.15)
            else:
                score = 0
            if score>0:
                explain = explain_SimpsonParadoxV2(langType,measures[1],measures[0],aggrType,breakdown[0])
                # explain = measures[1]+' for '+measures[0]+' shows simpson paradox after '+aggrType+' with '+breakdown[0]
                para['explain'] = explain
    return score,para

def cal_SimpsonParadoxV3(dimensions:VectorStr,breakdown:VectorStr,measures:VectorStr,\
                         subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-2 measures
    whitened = whiten(subDataSource[measures[0:2]])
    if np.std(whitened[:,0])==0 or np.std(whitened[:,1])==0:
        score = 0
        para = {}
    else:
        x = whitened[:,0]
        y = whitened[:,1]
        score = 0
        label = []
        labelSet = []
        for d in dimensions:
            d_list = list(set(subDataSource[d]))
            p_list = []
            for k in d_list:
                s,p = ks_2samp(x[subDataSource[d]==k],x)
                p_list.append(p)
            if 1-np.max(p_list)>score:
                score = 1 - np.max(p_list)
                label = subDataSource[d]
                labelSet = d_list
                keyDimension = d
        para = {
            'label':label,
            'labelSet':labelSet,
            'x':x,
            'y':y
        }
        if score>0:
            explain = explain_SimpsonParadoxV3(langType,measures[1],measures[0])
            # explain = measures[1]+' for '+measures[0]+' shows simpson paradox'
            para['explain'] = explain
    return score,para

def cal_NolinearrelationshipV1(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str,langType:str)->Tuple[float,dict]:
    # measures-2 measures
    groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
    timeseries = np.squeeze(groupData[measures[0:2]].values)
    x = timeseries[:,0]
    y = timeseries[:,1]
    if np.std(x)>0:
        slope, intercept, r, p, se = linregress(x, y)
        para = {'slope':slope,'intercept':intercept,'x':x,'y':y}
    if np.std(x)==0 or np.std(y)==0:
        score = 0
    else:
        # alph = 0.2
        # dx = alph*(x.max()-x.min())/2
        # dy = alph*(y.max()-y.min())/2
        # in_num = 0
        # out_num = 0
        # for i in range(len(x)):
        #     yi = y[np.logical_and(x>=x[i]-dx,x<=x[i]+dx)]
        #     in_num = in_num + np.sum(np.logical_and(yi>=y[i]-dy,yi<=y[i]+dy))
        #     out_num = out_num + np.sum(np.logical_or(yi<y[i]-dy,yi>y[i]+dy))
        # if in_num+out_num==0:
        #     score = 0
        # else:
        #     print(min(1,(in_num+out_num)/len(x)),in_num/(in_num+out_num))
        #     score = min(1,(in_num+out_num)/len(x))*in_num/(in_num+out_num)
        score = 1 - np.max(np.abs(y[1:]-y[:-1]))/(y.max()-y.min())
        if score>0:
            explain = explain_NolinearrelationshipV1(langType,measures[1],measures[0],aggrType,breakdown[0])
            # explain = 'There is a functional relationship between '+measures[1]+\
            # ' and '+measures[0]+' after '+aggrType+' with '+breakdown[0]
            para['explain'] = explain
    return score,para

# def cal_Unimodality(breakdown:VectorStr,measures:VectorStr,subDataSource:object,aggrType:str)->Tuple[float,dict]:
#     # measures-2 measures
#     groupData,aggr_mark = func_aggr(subDataSource,breakdown,aggrType)
#     timeseries = np.squeeze(groupData[measures[0:2]].values)
#     x = timeseries[:,0]
#     y = timeseries[:,1]
#     para = {'x':x,'y':y}
#     if np.std(x)==0 or np.std(y)==0:
#         score = 0
#     else:
#         if np.max(y)>y[0] and np.max(y)>y[-1]:
#             max_index = np.argmax(y)
# #             if all(yi<yj for yi, yj in zip(y[0:max_index], y[1:max_index])) \
# #             and all(yi>yj for yi, yj in zip(y[max_index:], y[max_index+1:])):
                
                
#     return score,para

def cal_scagnostics(measures,subDataSource,langType):
    x = subDataSource[measures[0]].values
    y = subDataSource[measures[1]].values
    para,out = scagnostics(x,y)
    score_list = [para[i] for i in list(para)]
    explain_list = explain_scagnostics(langType,measures[0],measures[1])
    return score_list,explain_list

# explain for en/cn
def explain_2DClustering(langType,measure0,measure1,aggr_mark,aggrType,breakdown):
    if langType=='en':
        explain = 'There is a good clustering between '+measure0+' and '+measure1
        if aggr_mark:
            explain+' after '+aggrType+' with '+breakdown[0]
    if langType=='cn':
        explain = ''
        if aggr_mark:
            explain = '以'+breakdown[0]+'求'+aggrType+'的聚合后，'
        explain = explain+measure0+'与'+measure1+'之间存在较好的聚类'
    return explain

def explain_CrossMeasureCorrelation(langType,measure0,measure1,aggr_mark,aggrType,breakdown):
    if langType=='en':
        explain = 'There is correlation between '+measure0+' and '+measure1
        if aggr_mark:
            explain = explain+' after '+aggrType+' with '+breakdown[0]
    if langType=='cn':
        explain = ''
        if aggr_mark:
            explain = '以'+breakdown[0]+'求'+aggrType+'的聚合后，'
        explain = explain+measure0+'与'+measure1+'之间存在相关性'
    return explain

def explain_Correlation(langType,subspaces_name0,subspaces_name1,aggrType,breakdown):
    if langType=='en':
        explain = 'There is correlation between '+subspaces_name0+' and '+subspaces_name1+' after '+aggrType+' with '+breakdown
    if langType=='cn':
        explain = '以'+breakdown+'求'+aggrType+'的聚合后，'+subspaces_name0+' and '+subspaces_name1+'之间存在相关性'
    return explain

def explain_Attribution(langType,measure0,aggrType,groupDataindex,breakdown):
    if langType=='en':
        explain = 'The '+measure0+' '+aggrType+' of '+groupDataindex+' is dominant in '+breakdown
    if langType=='cn':
        explain = groupDataindex+'对应的'+measure0+'的'+aggrType+'，在'+breakdown+'中占据了主要地位'
    return explain

def explain_OutstandingNo1(langType,measure0,aggrType,groupDataindex,breakdown):
    if langType=='en':
        explain = 'The '+measure0+' '+aggrType+' of '+groupDataindex+' is dominant in '+breakdown
    if langType=='cn':
        explain = groupDataindex+'对应的'+measure0+'的'+aggrType+'，在'+breakdown+'中占据了主要地位'
    return explain

def explain_OutstandingNo2(langType,measure0,aggrType,groupDataindex0,groupDataindex1,breakdown):
    if langType=='en':
        explain = 'The '+measure0+' '+aggrType+' of '+groupDataindex0+' and '+groupDataindex1+' is dominant in '+breakdown
    if langType=='cn':
        explain = groupDataindex0+'和'+groupDataindex1+'对应的'+measure0+'的'+aggrType+'，在'+breakdown+'中占据了主要地位'
    return explain

def explain_OutstandingLast(langType,measure0,aggrType,groupDataindex,breakdown):
    if langType=='en':
        explain = 'The '+measure0+' '+aggrType+' of '+groupDataindex+' is dominant in '+breakdown
    if langType=='cn':
        explain = groupDataindex+'对应的'+measure0+'的'+aggrType+'，在'+breakdown+'中占据了主要地位'
    return explain

def explain_Evenness(langType,measure0,aggrType,breakdown):
    if langType=='en':
        explain = 'There is a relatively steady percent of '+measure0+' after '+aggrType+' with '+breakdown
    if langType=='cn':
        explain = '在'+measure0+'的'+aggrType+'聚合下，不同'+breakdown+'的占比几乎相同'
    return explain

def explain_ChangePoint(langType,ChangePointMean,ChangePointSlope):
    explain = ''
    if langType=='en':
        if len(ChangePointMean)>0:
            explain = 'There is change point of mean in '+','.join((str(x) for x in ChangePointMean))
            if len(ChangePointSlope)>0:
                explain = explain+' and change point of slope in '+','.join((str(x) for x in ChangePointSlope))
        else:
            if len(ChangePointSlope)>0:
                explain = 'There is change point of slope in '+','.join((str(x) for x in ChangePointSlope))
    if langType=='cn':
        if len(ChangePointMean)>0:
            explain = '数据在'+','.join((str(x) for x in ChangePointMean))+'有突变'
            if len(ChangePointSlope)>0:
                explain = explain+'且其斜率在'+','.join((str(x) for x in ChangePointSlope))+'有突变'
        else:
            if len(ChangePointSlope)>0:
                explain = '数据的斜率在'+','.join((str(x) for x in ChangePointSlope))+'有突变'
    return explain

def explain_Outlier(langType,measure0,aggrType,breakdown):
    if langType=='en':
        explain = measure0+' has outliers after '+aggrType+' with '+breakdown
    if langType=='cn':
        explain = '在'+measure0+'的'+aggrType+'聚合下，'+breakdown+'拥有异常值'
    return explain

def explain_Seasonality(langType,measure0,aggrType,breakdown):
    if langType=='en':
        explain = measure0+' shows seasonality after '+aggrType+' with '+breakdown
    if langType=='cn':
        explain = measure0+'的'+aggrType+'聚合，在'+breakdown+'上具有季节性质'
    return explain

def explain_Trend(langType,slope,measure0):
    if langType=='en':
        if slope>0:
            explain = measure0+'is trending upwards'
        elif slope<0:
            explain = measure0+'is trending downwards'
    if langType=='cn':
        if slope>0:
            explain = measure0+'的趋势是逐渐增大'
        elif slope<0:
            explain = measure0+'的趋势是逐渐减小'
    return explain

def explain_HeteroscedasticityV1(langType,measure0,aggrType,breakdown):
    if langType=='en':
        explain = measure0+' shows heteroscedasticity after '+aggrType+' with '+breakdown
    if langType=='cn':
        explain = '在'+measure0+'的'+aggrType+'聚合下，数据展示出异方差性'
    return explain

def explain_HeteroscedasticityV2(langType,measure0,aggrType,breakdown):
    if langType=='en':
        explain = measure0+' shows heteroscedasticity after '+aggrType+' with '+breakdown
    if langType=='cn':
        explain = '在'+measure0+'的'+aggrType+'聚合下，数据展示出异方差性'
    return explain

def explain_SimpsonParadoxV1(langType,measure0,measure1):
    if langType=='en':
        explain = measure0+' for '+measure1+' shows simpson paradox'
    if langType=='cn':
        explain = measure1+'在'+measure0+'下可能具有辛普森悖论'
    return explain

def explain_SimpsonParadoxV2(langType,measure0,measure1,aggrType,breakdown):
    if langType=='en':
        explain = measure0+' for '+measure1+' shows simpson paradox after '+aggrType+' with '+breakdown
    if langType=='cn':
        explain = '分别以'+breakdown+'进行'+aggrType+'聚合后,'+measure1+'在'+measure0+'下可能具有辛普森悖论'
    return explain

def explain_SimpsonParadoxV3(langType,measure0,measure1):
    if langType=='en':
        explain = measure0+' for '+measure1+' shows simpson paradox'
    if langType=='cn':
        explain = measure1+'在'+measure0+'下可能具有辛普森悖论'
    return explain

def explain_NolinearrelationshipV1(langType,measure0,measure1,aggrType,breakdown):
    if langType=='en':
        explain = 'There is a functional relationship between '+measure0+' and '+measure1+' after '+aggrType+' with '+breakdown
    if langType=='cn':
        explain = '分别以'+breakdown+'进行'+aggrType+'聚合后,'+measure1+'之间'+measure0+'可能存在函数关系'
    return explain

def explain_scagnostics(langType,measure0,measure1):
    explain_list = []
    if langType=='en':
        explain_list.append('The scatterplot between '+measure0+' and '+measure1+' is Outlying')
        explain_list.append('The scatterplot between '+measure0+' and '+measure1+' is Skewed')
        explain_list.append('The scatterplot between '+measure0+' and '+measure1+' is Sparse')
        explain_list.append('The scatterplot between '+measure0+' and '+measure1+' is Clumpy')
        explain_list.append('The scatterplot between '+measure0+' and '+measure1+' is Striated')
        explain_list.append('The scatterplot between '+measure0+' and '+measure1+' is Convex')
        explain_list.append('The scatterplot between '+measure0+' and '+measure1+' is Skinny')
        explain_list.append('The scatterplot between '+measure0+' and '+measure1+' is Stringy')
        explain_list.append('The scatterplot between '+measure0+' and '+measure1+' is Monotonic')
    if langType=='cn':
        explain_list.append(measure0+'和'+measure1+'的散点图是离散的')
        explain_list.append(measure0+'和'+measure1+'的散点图中距离的分布是倾斜的')
        explain_list.append(measure0+'和'+measure1+'的散点图是稀疏的')
        explain_list.append(measure0+'和'+measure1+'的散点图是结块的')
        explain_list.append(measure0+'和'+measure1+'的散点图是条纹的')
        explain_list.append(measure0+'和'+measure1+'的散点图是凹的')
        explain_list.append(measure0+'和'+measure1+'的散点图是瘦的')
        explain_list.append(measure0+'和'+measure1+'的散点图的主干是狭长的')
        explain_list.append(measure0+'和'+measure1+'的散点图是单调的')
    return explain_list

def insight_check(fields:object,dataSource:object,check_list:VectorStr=None,breakdown:VectorStr=None,\
                  aggrType:str='sum',subspaces:VectorObj=None,rangeN:int=5,langType:str='en')->dict:
    if check_list is None:
        check_list = ['2DClustering','CrossMeasureCorrelation','Correlation','Attribution',\
                      'OutstandingNo1','OutstandingNo2','OutstandingLast','Evenness',\
                      'ChangePoint','Outlier','Seasonality','Trend','HeteroscedasticityV1',\
                      'HeteroscedasticityV2','SimpsonParadoxV1','SimpsonParadoxV2','SimpsonParadoxV3',\
                      'NolinearrelationshipV1','scagnostics']
    insight_dict = {}
    for i in check_list:
        insight_dict[i] = {'score':0,'para':{}}
    dataSource = dataSource.loc[:,list(fields['fid'])]
    if 'name' in fields.columns:
        dataSource.columns = list([fields.loc[fields['fid']==i,'name'].values[0] for i in dataSource.columns])
        dimensions = [i for i in dataSource.columns if fields[fields['name']==i]['analyticType'].values=='dimension']
        measures = [i for i in dataSource.columns if fields[fields['name']==i]['analyticType'].values=='measure']
    else:
        dimensions = [i for i in dataSource.columns if fields[fields['fid']==i]['analyticType'].values=='dimension']
        measures = [i for i in dataSource.columns if fields[fields['fid']==i]['analyticType'].values=='measure']
    if breakdown is None and len(dimensions)>0:
        breakdown = [dimensions[0]]
        breakdown_num = len(set(dataSource[dimensions[0]]))
        for i in dimensions:
            if len(set(dataSource[i]))>breakdown_num:
                breakdown = [i]
                breakdown_num = len(set(dataSource[i]))
    if breakdown is not None:
        for i in breakdown:
            dimensions.remove(i)
    subspaces_name = []
    if subspaces is None and len(dimensions)>0:
        subspaces = [dataSource,dataSource.loc[dataSource[dimensions[0]]==dataSource[dimensions[0]].value_counts().index[0]]]
        subspaces_name = [dimensions[0],dimensions[0]+' '+str(dataSource[dimensions[0]].value_counts().index[0])]
    # print('dimensions:',dimensions)
    # print('measures:',measures)
    # print('breakdown:',breakdown)
    if '2DClustering' in check_list:
        if len(measures)>=2:
            subDataSource = dataSource
            score,para = cal_2DClustering(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['2DClustering'] = {'score':score,'para':para}
    if 'CrossMeasureCorrelation' in check_list:
        if len(measures)>=2:
            subDataSource = dataSource
            score,para = cal_CrossMeasureCorrelation(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['CrossMeasureCorrelation'] = {'score':score,'para':para}
    if 'Correlation' in check_list:
        if subspaces is not None and len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_Correlation(subspaces,subspaces_name,breakdown,measures,aggrType,langType)
            insight_dict['Correlation'] = {'score':score,'para':para}
    if 'Attribution' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_Attribution(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['Attribution'] = {'score':score,'para':para}
    if 'OutstandingNo1' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_OutstandingNo1(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['OutstandingNo1'] = {'score':score,'para':para}
    if 'OutstandingNo2' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_OutstandingNo2(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['OutstandingNo2'] = {'score':score,'para':para}
    if 'OutstandingLast' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_OutstandingLast(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['OutstandingLast'] = {'score':score,'para':para}
    if 'Evenness' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_Evenness(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['Evenness'] = {'score':score,'para':para}
    if 'ChangePoint' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_ChangePoint(breakdown,measures,subDataSource,aggrType,rangeN,langType)
            insight_dict['ChangePoint'] = {'score':score,'para':para}
    if 'Outlier' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_Outlier(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['Outlier'] = {'score':score,'para':para}
    if 'Seasonality' in check_list and breakdown is not None:
        if len(measures)>=1 and pd.to_datetime(dataSource.groupby(breakdown).count().index,\
                                               errors = 'ignore').dtype=='datetime64[ns]':
            subDataSource = dataSource
            score,para = cal_Seasonality(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['Seasonality'] = {'score':score,'para':para}
    if 'Trend' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_Trend(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['Trend'] = {'score':score,'para':para}
    if 'HeteroscedasticityV1' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_HeteroscedasticityV1(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['HeteroscedasticityV1'] = {'score':score,'para':para}
    if 'HeteroscedasticityV2' in check_list:
        if len(measures)>=1 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_HeteroscedasticityV2(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['HeteroscedasticityV2'] = {'score':score,'para':para}
    if 'SimpsonParadoxV1' in check_list:
        if len(measures)>=2:
            subDataSource = dataSource
            score,para = cal_SimpsonParadoxV1(measures,subDataSource,langType)
            insight_dict['SimpsonParadoxV1'] = {'score':score,'para':para}
    if 'SimpsonParadoxV2' in check_list:
        if len(measures)>=2 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_SimpsonParadoxV2(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['SimpsonParadoxV2'] = {'score':score,'para':para}
    if 'SimpsonParadoxV3' in check_list:
        if len(measures)>=2 and len(dimensions)>=1:
            subDataSource = dataSource
            score,para = cal_SimpsonParadoxV3(dimensions,breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['SimpsonParadoxV3'] = {'score':score,'para':para}
    if 'NolinearrelationshipV1' in check_list:
        if len(measures)>=2 and breakdown is not None:
            subDataSource = dataSource
            score,para = cal_NolinearrelationshipV1(breakdown,measures,subDataSource,aggrType,langType)
            insight_dict['NolinearrelationshipV1'] = {'score':score,'para':para}
    if 'scagnostics' in check_list:
        if len(measures)>=2:
            subDataSource = dataSource
            score_list,explain_list = cal_scagnostics(measures,subDataSource,langType)
            insight_dict['Outlying'] = {'score':score_list[0],'para':{'explain':explain_list[0]}}
            insight_dict['Skewed'] = {'score':score_list[1],'para':{'explain':explain_list[1]}}
            insight_dict['Sparse'] = {'score':score_list[2],'para':{'explain':explain_list[2]}}
            insight_dict['Clumpy'] = {'score':score_list[3],'para':{'explain':explain_list[3]}}
            insight_dict['Striated'] = {'score':score_list[4],'para':{'explain':explain_list[4]}}
            insight_dict['Convex'] = {'score':score_list[5],'para':{'explain':explain_list[5]}}
            insight_dict['Skinny'] = {'score':score_list[6],'para':{'explain':explain_list[6]}}
            insight_dict['Stringy'] = {'score':score_list[7],'para':{'explain':explain_list[7]}}
            insight_dict['Monotonic'] = {'score':score_list[8],'para':{'explain':explain_list[8]}}
            
    return insight_dict,{'dimensions':dimensions,'measures':measures,'breakdown':breakdown}