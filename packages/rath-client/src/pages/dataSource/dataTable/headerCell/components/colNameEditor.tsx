// Copyright (C) 2023 observedobserver
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React, { useEffect, useId, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { Button } from '../../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';

const Container = styled.div`
    padding: 1em;
    > h1 {
        font-size: 1.2em;
    }
`;

const FormStyle = {
    marginBlock: '1em',
};
const BtnGroupStyle = {
    marginTop: '2em',
};

interface ColNameEditorProps {
    showNameEditor: boolean;
    setShowNameEditor: React.Dispatch<React.SetStateAction<boolean>>;
    defaultName: string;
    onNameUpdate: (newName: string) => void;
    defaultComment: string;
    onCommentUpdate: (newComment: string) => void;
}
const ColNameEditor: React.FC<ColNameEditorProps> = (props) => {
    const { showNameEditor, setShowNameEditor, defaultName, onNameUpdate, defaultComment, onCommentUpdate } = props;
    const nameEditorTitleId = `name-editor-title-${useId().replace(/:/g, '')}`;
    const [headerName, setHeaderName] = useState<string>(defaultName);
    useEffect(() => {
        setHeaderName(defaultName);
    }, [defaultName]);
    const [comment, setComment] = useState(defaultComment);
    useEffect(() => {
        setComment(defaultComment);
    }, [defaultComment]);
    return (
        <Dialog open={showNameEditor} onOpenChange={setShowNameEditor}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle id={nameEditorTitleId}>{intl.get('dataSource.table.edit')}</DialogTitle>
                </DialogHeader>
                <Container>
                    <div style={FormStyle} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${nameEditorTitleId}-field-name`}>{intl.get('dataSource.table.fieldName')}</Label>
                            <Input
                                id={`${nameEditorTitleId}-field-name`}
                                aria-label={intl.get('dataSource.table.fieldName')}
                                value={headerName}
                                placeholder={defaultName}
                                onChange={(e) => {
                                    setHeaderName(e.target.value);
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`${nameEditorTitleId}-comment`}>{intl.get('storage.desc', { mode: intl.get('common.field') })}</Label>
                            <Input
                                id={`${nameEditorTitleId}-comment`}
                                aria-label={intl.get('storage.desc', { mode: intl.get('common.field') })}
                                value={comment}
                                placeholder={defaultComment}
                                onChange={(e) => {
                                    setComment(e.target.value);
                                }}
                            />
                        </div>
                        <div style={BtnGroupStyle} className="flex gap-3">
                            <Button
                                type="button"
                                onClick={() => {
                                    onNameUpdate && onNameUpdate(headerName);
                                    onCommentUpdate && onCommentUpdate(comment);
                                    setShowNameEditor(false);
                                }}
                            >
                                {intl.get('function.confirm')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    unstable_batchedUpdates(() => {
                                        setShowNameEditor(false);
                                        setHeaderName(defaultName);
                                        setComment(defaultComment);
                                    });
                                }}
                            >
                                {intl.get('function.cancel')}
                            </Button>
                        </div>
                    </div>
                </Container>
            </DialogContent>
        </Dialog>
    );
};

export default ColNameEditor;
