import { MATRIX_MARK_TYPE } from "../matrixPanel";
import { VIEW_TYPE, MATRIX_TYPE } from "../step/causalModal";
import { ExplorationKey, LayoutMethod } from "../../../store/causalStore/viewStore";
import { EdgeAssert, NodeAssert } from "../../../store/causalStore/modelStore";
import { CausalLinkDirection } from "../../../utils/resolve-causal";
import type { Locales } from ".";

const locales: Locales = {
    title: '因果分析',
    no_connection: {
        before: '服务器没有响应连接，因果分析中部分功能将无法使用。这个模块仍处于实验阶段，如需要帮助，请联系',
        text: '我们',
        after: '获取相关支持。',
        subject: '[Causal] 有关实验模块因果分析技术支持的咨询',
    },
    step: {
        dataset_config: {
            title: '数据集配置',
            description: '从数据中有针对性地选出合适的数据子集以及分析目标关注的因素集合。',
        },
        fd_config: {
            title: '编辑函数依赖',
            description: '基于特定领域或背景知识定义绝对的函数依赖，帮助算法回避不合理的探索空间，更好进行决策。',
        },
        causal_model: {
            title: '因果模型',
            description: '运行因果发现，完善因果图。在已确认的因果图上结合可视化探索进行结论验证和进一步分析。',
        },
    },
    step_control: {
        prev: '上一步',
        next: '继续',
        bypass: '跳过',
    },
    dataset_config: {
        calc: '数据增强',
        filter: '筛选器',
        filter_output: '原始大小：{origin} 行，筛选后子集大小：{filtered} 行',
        filter_disabled_output: '原始大小：{origin} 行（无筛选项）',
        sample: '采样',
        sample_output: '样本量：{size} 行',
        fields: '需要分析的因素',
        field_info: {
            field: '因素（{selected} / {total}）',
            unique: '唯一值数量',
            sType: '类型',
            mean: '均值',
            std: '标准差',
            median: '中位数',
        },
    },
    fd_config: {
        batch: {
            title: '快捷操作',
            delete_all: '全部删除',
            from_ext: '使用扩展字段计算图',
            from_detection: '自动识别',
            preview: '预览',
            cancel: '取消',
        },
        batch_mode: {
            overwrite_only: '更新并替换',
            fill_only: '补充不替换',
            fully_replace: '全部覆盖',
        },
        edit: '编辑视图',
    },
    computing: '计算中',
    chart: {
        re_layout: '重新布局',
        layout: {
            [LayoutMethod.FORCE]: '力引导布局',
            [LayoutMethod.CIRCULAR]: '环形布局',
            [LayoutMethod.RADIAL]: '辐射布局',
            [LayoutMethod.GRID]: '网格布局',
        },
        assertion: {
            edge: '连接两个节点',
            node: '双击一个节点',
            [EdgeAssert.TO_EFFECT]: '一定影响',
            [EdgeAssert.TO_NOT_EFFECT]: '一定不影响',
            [EdgeAssert.TO_BE_RELEVANT]: '一定关联',
            [EdgeAssert.TO_BE_NOT_RELEVANT]: '一定不关联',
            [NodeAssert.FORBID_AS_CAUSE]: '不可作为原因',
            [NodeAssert.FORBID_AS_EFFECT]: '不可作为结果',
            click_edge: '单击一条连接',
            forbid: '取反',
            delete: '删除',
        },
        tools: {
            edit: {
                settings: '交互行为',
                clear: '清空所有',
            },
            resize: '画布缩放',
            write: '编辑因果关系',
            filter_by_confidence: '按置信度筛选',
            filter_by_weight: '按贡献度筛选',
        },
    },
    viewType: {
        label: '视图',
        [VIEW_TYPE.matrix]: '矩阵',
        [VIEW_TYPE.diagram]: '因果图',
    },
    matrix: {
        [MATRIX_TYPE.mutualInfo]: {
            name: '关联信息',
            action: '计算',
        },
        [MATRIX_TYPE.conditionalMutualInfo]: {
            name: '条件关联信息',
            action: '计算',
        },
        [MATRIX_TYPE.causal]: {
            name: '因果模型',
            action: '因果发现',
        },
        markType: {
            label: '标记',
            [MATRIX_MARK_TYPE.circle]: '圆',
            [MATRIX_MARK_TYPE.square]: '矩形',
        },
        causal_direction: {
            label: '连接类型',
            [CausalLinkDirection.none]: '无关',
            [CausalLinkDirection.directed]: '导向',
            [CausalLinkDirection.reversed]: '被导向',
            [CausalLinkDirection.weakDirected]: '导向（弱关系）',
            [CausalLinkDirection.weakReversed]: '被导向（弱关系）',
            [CausalLinkDirection.undirected]: '无向相关',
            [CausalLinkDirection.weakUndirected]: '无向相关（弱关系）',
            [CausalLinkDirection.bidirected]: '双向相关',
        },
        causal_direction_desc: {
            [CausalLinkDirection.none]: 'A 与 B 不相关。',
            [CausalLinkDirection.directed]: 'A 对 B 有影响。',
            [CausalLinkDirection.reversed]: 'A 被 B 影响。',
            [CausalLinkDirection.weakDirected]: '在部分子集合中，A 对 B 有影响。',
            [CausalLinkDirection.weakReversed]: '在部分子集合中，A 被 B 影响。',
            [CausalLinkDirection.undirected]: 'A 与 B 相关，但影响方向不确定。',
            [CausalLinkDirection.weakUndirected]: '在不同的部分子集合中，A 与 B 有不同方向的影响关系。',
            [CausalLinkDirection.bidirected]: 'A 与 B 相互作用。',
        },
    },
    storage: {
        save: '保存因果模型',
        load: '导入因果模型',
        title: '已保存的模型',
        list: '模型列表',
        apply: '导入',
    },
    form: {
        trigger: '参数',
        title: '设置',
        first_level: '算法',
        first_level_desc: '选择运行因果发现的算法实现。',
        run: '运行',
    },
    task: {
        reload: '重新加载',
    },
    extra: {
        clear_focused: '清除选中字段',
    },
    submodule: {
        [ExplorationKey.AUTO_VIS]: {
            title: '变量概览',
            chart: '可视化分析',
            meta_info: '统计信息',
            meta: {
                dist: '分布',
                unique: '唯一值数量',
                mean: '均值',
                min: '最小值',
                qt_25: '25% 分位数',
                qt_50: '50% 分位数',
                qt_75: '75% 分位数',
                max: '最大值',
                stdev: '标准差',
            },
            relation: '关联因素',
            rel: {
                cause: '因',
                value: '相关系数',
                effect: '果',
            },
        },
        [ExplorationKey.WHAT_IF]: {
            title: '输出预测',
            algorithm: '预测算法',
        },
        [ExplorationKey.HYPOTHESIS_TEST]: {
            title: '因果假设',
            population: '样本空间 (Population)',
            outcome: '衡量指标 (Outcome)',
            confounders: '联合影响因素 (Confounders)',
            delete: '删除',
            add: '新增',
            effect_modifiers: '外部影响因素（Effect Modifiers）',
            predicates: '目标群体 (Predicates)',
            history: {
                title: '运行历史',
                clear: '清空',
                hypothesis: '命题',
                score: '分数',
                params: '运行参数',
                full_set: '全集',
                template: '验证目标群体 ({Pdc}) 是否导致了 {O} 在样本空间 ({Pop}) 的变化。'
            },
        },
        [ExplorationKey.CROSS_FILTER]: {
            title: '因果验证',
        },
        [ExplorationKey.CAUSAL_INSIGHT]: {
            title: '字段透视',
            header: '探索目标',
            engine: '运行环境',
            diff_mode: '对照选择',
            diff: {
                other: '数据补集',
                full: '数据全集',
                'two-group': '自选两个集合',
            },
            index_key: '基准因素',
            empty: '无',
            aggregate: '聚合类型',
            aggregate_op: {
                false: '无（明细）',
                sum: '总和',
                mean: '均值',
                count: '计数',
            },
            two_group: {
                text: '筛选{key}',
                foreground: '实验组',
                background: '对照组',
            },
            run: '发现',
            why_query: '线索洞察',
            insight: {
                explanation: {
                    unvisualized_dimension: {
                        label: '潜在因素',
                        description: '视图中未展现的因素 field({ dimension }) 在选定区间有不同的分布模式，可能对 field.noEvents({ mainField }) 的分布有影响关系。评分：score({ responsibility })。',
                    },
                },
            },
        },
        [ExplorationKey.GRAPHIC_WALKER]: {
            title: '可视化自助分析',
        },
        [ExplorationKey.PREDICT]: {
            title: '预测实验',
            mission: {
                classification: '分类预测',
                regression: '回归预测',
            },
            config: '模型设置',
            result: '预测结果',
            select_model: '模型选择',
            scope: '分析空间',
            feature: '特征',
            target: '目标',
            field: '因素',
            comparison: '对比',
            index: '运行次数',
            algo: '预测模型',
            accuracy: '准确率',
            clear: '清空记录',
        },
    },
};

export default locales;
