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
    },
};

export default locales;
