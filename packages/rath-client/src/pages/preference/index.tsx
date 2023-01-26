import intl from 'react-intl-universal';
import { Pivot, PivotItem } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import styled from 'styled-components';
import { useEffect, useRef, useState } from "react";
import JSONEditor from './JSONEditor';
import UIEditor from './UIEditor';
import { savePreferences, usePreferencesSchema } from './utils';


const Container = styled.div`
    padding: 0 2em;
`;

const PreferencePage = observer(function PreferencePage () {
    const [mode, setMode] = useState<'UI' | 'JSON'>('UI');

    const schema = usePreferencesSchema();

    const schemaRef = useRef(schema);
    schemaRef.current = schema;

    useEffect(() => {
        return () => {
            savePreferences(schemaRef.current);
        };
    }, []);

    return (
        <Container>
            <div className="card">
                <Pivot selectedKey={mode} onLinkClick={item => item?.props.itemKey && setMode(item?.props.itemKey as typeof mode)}>
                    <PivotItem itemKey="UI" headerText={intl.get('preference.ui')}>
                        <UIEditor schema={schema} />
                    </PivotItem>
                    <PivotItem itemKey="JSON" headerText={intl.get('preference.json')}>
                        <JSONEditor schema={schema} />
                    </PivotItem>
                </Pivot>
            </div>
        </Container>
    );
});


export default PreferencePage;
