import { ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useState } from "react";

interface SizeSettingProps {
    onWidthChange: (val: number) => void;
    onHeightChange: (val: number) => void;
    width: number;
    height: number;
}
const SizeSetting: React.FC<SizeSettingProps> = props => {
    const { onWidthChange, onHeightChange, width, height } = props
    const [show, setShow] = useState<boolean>(false);

    return <div className="leading-none cursor-pointer"> 
        <ArrowsPointingOutIcon
            onClick={() => {
                setShow(v => !v)
            }}
            className="w-4 h-4 inline-block mr-0.5 text-gray-900"
        />
        {
            show && <div className="absolute z-auto bg-white p-4 border border-gray-200 shadow">
                <div>
                    <XMarkIcon
                    className="text-gray-900 absolute right-2 top-2 w-4 cursor-pointer hover:bg-red-100"
                    onClick={(e) => {
                        setShow(false);
                        e.stopPropagation();
                    }}
                />
                </div>
                
                <div className="mt-4">
                    <input className="w-full h-2 bg-blue-100 appearance-none"
                        type="range"
                        name="width"
                        value={Math.sqrt(width / 1000)}
                        min="0" max="1" step="0.01"
                        onChange={(e) => {
                            onWidthChange(Math.round(Number(e.target.value) ** 2 * 1000))
                        }}
                    />
                    <label className="text-sm ml-1" htmlFor="width">宽度{width}</label>
                </div>
                <div className=" mt-2">
                    <input className="w-full h-2 bg-blue-100 appearance-none"
                        type="range"
                        name="height"
                        value={Math.sqrt(height / 1000)}
                        min="0" max="1" step="0.01"
                        onChange={(e) => {
                            onHeightChange(Math.round(Number(e.target.value) ** 2 * 1000))
                        }}
                    />
                    <label className="text-sm ml-1" htmlFor="height">高度{height}</label>
                </div>
                
            </div>
        }
    </div>
}

export default SizeSetting;