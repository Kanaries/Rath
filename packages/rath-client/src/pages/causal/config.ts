import { IDropdownOption } from "@fluentui/react";
import PC_PARAMS from './pc_params.json'
export interface IFormItem{
    title: string;
    key: string;
    description?: string;
    dataType: 'number' | 'string' | 'time' | 'boolean';
    renderType: 'dropdown' | 'slider' | 'text' | 'toggle' | 'radio' | 'checkbox';
    defaultValue?: any;
    range?: [number, number]; //slider
    step?: number; // slider
    options?: {text: string; key: any}[] // dropdown or radio or checkbox
}
export interface IForm {
    title: string;
    items: IFormItem[];
}
export enum UCRule {
    uc_supset = 0,
    maxP = 1,
    definiteMaxP = 2
}

export enum UCPriority {
    default = -1,
    overwrite = 0,
    biDirected = 1,
    existing = 2,
    stronger = 3,
    stronger_plus = 4
}

export enum ICausalAlgorithm {
    PC = 'PC',
    FCI = 'FCI',
    CONOD = 'CONOD'
}

export enum IndepenenceTest {
    chiSquare = 'chisq',
    fisherZ = 'fisherz',
    kci = 'kci',
    mvFisherz = 'mv_fisherz',
    gSquare = 'gsq',
}
// type UCPriority = -1 | 0 | 1 | 2 | 3 | 4;
// type UCRule = 0 | 1 | 2; 
export enum ICatEncodeType {
    none = 'none',
    oneHot = 'one_hot',
    binary = 'binary',
    lex = 'lex'
}
export enum IQuantEncodeType {
    none = 'none',
    bin = 'bin',
    id = 'id',
    order = 'order',
}

export const CAUSAL_ALGORITHM_OPTIONS: IDropdownOption[] = [
    { key: ICausalAlgorithm.PC, text: ICausalAlgorithm.PC },
    { key: ICausalAlgorithm.FCI, text: ICausalAlgorithm.FCI },
    { key: ICausalAlgorithm.CONOD, text: ICausalAlgorithm.CONOD },
];

export const PC_PARAMS_FORM: IForm = PC_PARAMS as IForm;

export const CAUSAL_ALGORITHM_FORM: { [key in ICausalAlgorithm ]: IForm } = {
    PC: PC_PARAMS_FORM,
    FCI: PC_PARAMS_FORM,
    CONOD: PC_PARAMS_FORM,
}

export function makeFormInitParams (form: IForm): {[key: string]: any} {
    const initParams: {[key: string]: any} = {};
    form.items.forEach(item => {
        initParams[item.key] = item.defaultValue;
    })
    return initParams;
}
