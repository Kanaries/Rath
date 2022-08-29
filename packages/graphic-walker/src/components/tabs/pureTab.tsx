import React, { useCallback, useEffect, useState } from "react";

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
    allowEdit?: boolean;
    onEditLabel?: (label: string, index: number) => void;
}
export default function PureTabs(props: PureTabsProps) {
    const { tabs, selectedKey, onSelected, allowEdit, onEditLabel } = props;
    const [editList, setEditList] = useState<boolean[]>([]);
    const clearEditStatus = useCallback(() => {
        setEditList(new Array(tabs.length).fill(false))
    }, [tabs.length])
    useEffect(() => {
        clearEditStatus
    }, [clearEditStatus])
    return (
        <div className="border-b border-gray-200 overflow-x-auto" onMouseLeave={clearEditStatus}>
            <nav className="-mb-px flex border-gray-300 border-l" aria-label="Tabs">
                {tabs.map((tab, tabIndex) => (
                    <span
                        dangerouslySetInnerHTML={{ __html: tab.label }}
                        onClick={() => {
                            onSelected(tab.key, tabIndex)
                        }}
                        onDoubleClick={() => {
                            setEditList(v => {
                                const nv = [...v];
                                nv[tabIndex] = true;
                                return nv
                            })
                        }}
                        contentEditable={editList[tabIndex]}
                        onInput={(e) => {
                            onEditLabel && onEditLabel(`${e.currentTarget.textContent}`, tabIndex)
                        }}
                        key={tab.key}
                        className={classNames(
                            tab.key === selectedKey
                                ? "border-transparent text-black bg-gray-100"
                                : "text-gray-500 hover:text-gray-700 hover:border-gray-300",
                            "whitespace-nowrap border-gray-300 py-1 px-2 border-t border-r botder-b text-sm cursor-pointer"
                        )}
                    />
                ))}
            </nav>
        </div>
    );
}
