import React from "react";

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export interface ITabOption {
    label: string;
    key: string;
}
interface PureTabsProps {
    tabs: ITabOption[];
    selectedKey: string;
    onSelected: (selectedKey: string, index: number) => void;
}
export default function PureTabs(props: PureTabsProps) {
    const { tabs, selectedKey, onSelected } = props;
    return (
        <div>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex border-gray-300 border-l" aria-label="Tabs">
                    {tabs.map((tab, tabIndex) => (
                        <span
                            onClick={() => {
                                onSelected(tab.key, tabIndex)
                            }}
                            key={tab.key}
                            className={classNames(
                                tab.key === selectedKey
                                    ? "border-transparent text-blue-700 bg-gray-100"
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300",
                                "whitespace-nowrap border-gray-300 py-1 px-2 border-t border-r botder-b font-medium text-xs cursor-pointer"
                            )}
                        >
                            {tab.label}
                        </span>
                    ))}
                </nav>
            </div>
        </div>
    );
}
