import React, { useState, useEffect } from 'react';
import { SearchBox } from '@fluentui/react/lib/SearchBox';


const NLQ: React.FC = () => {
    const [augmentedEngineConnected, setAugmentedEngineConnected] = useState(false);
    const [searchContent, setSearchContent] = useState('');
    useEffect(() => {
        fetch('http://localhost:2023/api/ping').then(res => res.json()).then(res => {
            if (res.success) {
                setAugmentedEngineConnected(true);
            }
        })
    }, [])
    return <div>
        server: {augmentedEngineConnected ? 'connected' : 'disconnected'}
        <SearchBox onSearch={(newValue) => {
            setSearchContent(newValue);

        }} />
    </div>;
};

export default NLQ;